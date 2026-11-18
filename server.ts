import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {
  buildAllLots,
  buildCsvOut,
  buildViewModel,
  executeCommand,
  parsePlayersCsv,
  TEAMS,
} from './src/auction/engine.ts';
import {
  createEmptyTokenStore,
  generateAllTeamTokens,
  generateHostSessionToken,
  generateSubOpPins,
  generateSubOpSessionToken,
  generateTeamAccessCode,
  normalizePin,
  resolveSubOpByPin,
  resolveTeamIdByToken,
  type PublicTeamTokenInfo,
  type SubOperatorRole,
  type TokenStoreData,
} from './src/auction/tokens.ts';
import type { AuctionEvent, CommandBody, Player, Preset } from './src/auction/types.ts';

function readCliArg(flag: string): string | undefined {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === flag && i + 1 < argv.length) {
      return argv[i + 1];
    }
    if (arg.startsWith(`${flag}=`)) {
      return arg.slice(flag.length + 1);
    }
  }
  return undefined;
}

function resolveListenPort(): number {
  const cliPort = Number(readCliArg('--port'));
  if (Number.isInteger(cliPort) && cliPort > 0) return cliPort;

  const envPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT);
  const defaultAppPort = Number(process.env.DEFAULT_APP_PORT);

  // Inside Cloud Run / nginx containers, PORT=8080 belongs to nginx while the app runs on DEFAULT_APP_PORT (3000)
  if (Number.isInteger(envPort) && envPort > 0 && envPort !== nginxPort) {
    return envPort;
  }
  if (Number.isInteger(defaultAppPort) && defaultAppPort > 0) {
    return defaultAppPort;
  }
  return 3000;
}

const PORT = resolveListenPort();
const HOST = readCliArg('--host') || process.env.HOST || '0.0.0.0';
const PIN = process.env.PIN || '';
const IS_VERCEL = process.env.VERCEL === '1';
const DATA_DIR =
  process.env.DATA_DIR ||
  (IS_VERCEL ? '/tmp/ipl-auction-data' : path.resolve(process.cwd(), 'data'));
const CSV_PATH =
  process.env.PLAYERS_CSV || path.resolve(process.cwd(), 'seed', 'players.csv');
const PUB_DIR = path.resolve(process.cwd(), 'public');
const LOGOS_DIR = path.join(PUB_DIR, 'logos');
const DC_LOGO_FILENAME = 'delhi_captails.png';
const DC_LOGO_PATH = path.join(LOGOS_DIR, DC_LOGO_FILENAME);
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

const csvPlayers = parsePlayersCsv(fs.readFileSync(CSV_PATH, 'utf8'));
const players = buildAllLots(csvPlayers);
const pidMap = new Map<string, Player>(players.map((p) => [p.id, p]));

for (const p of players) {
  const rel = String(p.photo || '').replace(/^[/\\]+/, '');
  p.hasPhoto = rel !== '' && fs.existsSync(path.join(PUB_DIR, rel));
}

interface SavedFile {
  preset: Preset | null;
  events: AuctionEvent[];
}

let saved: SavedFile = { preset: null, events: [] };
try {
  const raw = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
  saved = Array.isArray(raw) ? { preset: null, events: raw } : raw;
} catch {
  // Fresh auction
}

let tokenStore: TokenStoreData = createEmptyTokenStore();
try {
  const rawTokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8')) as Partial<TokenStoreData>;
  const rawSessions: Record<string, SubOperatorRole> = {};
  if (rawTokens.subOpSessions && typeof rawTokens.subOpSessions === 'object') {
    for (const [tok, role] of Object.entries(rawTokens.subOpSessions)) {
      if (role === 'display' || role === 'bids') {
        rawSessions[tok] = role;
      }
    }
  }
  tokenStore = {
    hostSessionToken: typeof rawTokens.hostSessionToken === 'string' ? rawTokens.hostSessionToken : null,
    hostEmail: typeof rawTokens.hostEmail === 'string' ? rawTokens.hostEmail : null,
    hostName: typeof rawTokens.hostName === 'string' ? rawTokens.hostName : null,
    hostLoggedInAt: typeof rawTokens.hostLoggedInAt === 'number' ? rawTokens.hostLoggedInAt : null,
    teamTokens:
      rawTokens.teamTokens && typeof rawTokens.teamTokens === 'object'
        ? rawTokens.teamTokens
        : {},
    displayPin: typeof rawTokens.displayPin === 'string' ? rawTokens.displayPin : null,
    bidsPin: typeof rawTokens.bidsPin === 'string' ? rawTokens.bidsPin : null,
    subOpSessions: rawSessions,
  };
} catch {
  // Fresh token store
}

function saveTokenStore(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${TOKENS_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(tokenStore, null, 2));
  fs.renameSync(tmp, TOKENS_FILE);
}

function ensureTeamTokens(): void {
  const missing = TEAMS.filter((t) => !tokenStore.teamTokens[t.id]);
  if (!missing.length) return;
  const used = new Set(Object.values(tokenStore.teamTokens).filter(Boolean));
  for (const t of missing) {
    let code = generateTeamAccessCode(t.short);
    while (used.has(code)) {
      code = generateTeamAccessCode(t.short);
    }
    used.add(code);
    tokenStore.teamTokens[t.id] = code;
  }
  saveTokenStore();
}

if (tokenStore.hostSessionToken || Object.keys(tokenStore.teamTokens).length > 0) {
  ensureTeamTokens();
}

function ensureSubOpPins(): void {
  if (!tokenStore.displayPin || !tokenStore.bidsPin || tokenStore.displayPin === tokenStore.bidsPin) {
    const generated = generateSubOpPins({
      displayPin: tokenStore.displayPin || undefined,
      bidsPin: tokenStore.bidsPin || undefined,
    });
    tokenStore.displayPin = generated.displayPin;
    tokenStore.bidsPin = generated.bidsPin;
    saveTokenStore();
  }
}

function buildPublicTeamTokens(vm = currentView()): PublicTeamTokenInfo[] {
  return TEAMS.map((t) => {
    const viewTeam = vm.teams.find((x) => x.id === t.id);
    return {
      teamId: t.id,
      slotLabel: viewTeam ? `${t.slotLabel} (${viewTeam.short})` : t.slotLabel,
      paddle: t.paddle,
      token: tokenStore.teamTokens[t.id] || '',
    };
  });
}

const envPreset = process.env.PRESET?.toUpperCase();
const PRESET: Preset = (
  envPreset === 'MINI' || envPreset === 'MEGA' ? envPreset : saved.preset || 'MEGA'
) as Preset;

if (saved.events.length && saved.preset && saved.preset !== PRESET) {
  throw new Error(
    `data/events.json belongs to a ${saved.preset} auction. Move it aside to start a ${PRESET} auction.`
  );
}

let events: AuctionEvent[] = saved.events;

const unknownEvent = events.find((e) => 'pid' in e && e.pid && !pidMap.has(e.pid));
if (unknownEvent && 'pid' in unknownEvent) {
  throw new Error(
    `data/events.json references ${unknownEvent.pid}, which is not in players.csv.`
  );
}

function saveEvents(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${EVENTS_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ preset: PRESET, events }));
  fs.renameSync(tmp, EVENTS_FILE);
}

function backupEvents(): void {
  if (!events.length || !fs.existsSync(EVENTS_FILE)) return;
  const dir = path.join(DATA_DIR, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(EVENTS_FILE, path.join(dir, `events-${stamp}.json`));
  const files = fs.readdirSync(dir).sort();
  if (files.length > 30) {
    for (const f of files.slice(0, -30)) {
      fs.unlinkSync(path.join(dir, f));
    }
  }
}

const clients = new Set<express.Response>();

function currentView(now = Date.now()) {
  return buildViewModel(events, players, pidMap, PRESET, now);
}

function broadcast(now = Date.now()): void {
  const payload = `data: ${JSON.stringify(currentView(now))}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

function isHostAuthorized(req: express.Request): boolean {
  const hostHeader = typeof req.headers['x-host-token'] === 'string' ? req.headers['x-host-token'] : '';
  const pinHeader = typeof req.headers['x-pin'] === 'string' ? req.headers['x-pin'] : '';
  if (tokenStore.hostSessionToken && hostHeader === tokenStore.hostSessionToken) {
    return true;
  }
  if (PIN && pinHeader === PIN) {
    return true;
  }
  return false;
}

function getSubOpRole(req: express.Request): SubOperatorRole | null {
  const subOpHeader =
    typeof req.headers['x-subop-token'] === 'string' ? req.headers['x-subop-token'].trim() : '';
  if (!subOpHeader) return null;
  return tokenStore.subOpSessions[subOpHeader] ?? null;
}

export async function createApp(httpServer?: http.Server): Promise<{
  app: express.Express;
  closeVite?: () => Promise<void>;
}> {
  const app = express();
  app.use(express.json({ limit: '3mb' }));

  app.use('/logos', express.static(LOGOS_DIR));

  app.get('/api/stream', (req, res) => {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    res.flushHeaders?.();
    res.write(`retry: 1000\ndata: ${JSON.stringify(currentView())}\n\n`);
    clients.add(res);
    req.on('close', () => {
      clients.delete(res);
    });
  });

  app.get('/api/state', (_req, res) => {
    res.json(currentView());
  });

  app.get('/api/players', (_req, res) => {
    res.json(players);
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      players: players.length,
      events: events.length,
      clients: clients.size,
      preset: PRESET,
      pinRequired: Boolean(PIN),
      hostLoggedIn: Boolean(tokenStore.hostSessionToken),
      subOpConfigured: Boolean(tokenStore.displayPin && tokenStore.bidsPin),
      runtime: IS_VERCEL ? 'vercel' : 'node',
    });
  });

  // =========================================================================
  // HOST-ONLY AUTHENTICATION, SUB-OPERATOR PINS & PER-TEAM TOKEN MANAGEMENT
  // =========================================================================
  app.get('/api/host/status', (_req, res) => {
    res.json({
      hostLoggedIn: Boolean(tokenStore.hostSessionToken),
      hostEmail: tokenStore.hostEmail,
      hostName: tokenStore.hostName,
      hostLoggedInAt: tokenStore.hostLoggedInAt,
      tokensGenerated: TEAMS.every((t) => Boolean(tokenStore.teamTokens[t.id])),
      subOpConfigured: Boolean(tokenStore.displayPin && tokenStore.bidsPin),
      pinRequired: Boolean(PIN),
    });
  });

  app.post('/api/host/login', (req, res) => {
    const body = (req.body || {}) as {
      mode?: 'firebase' | 'host_chair';
      email?: string;
      displayName?: string;
      uid?: string;
      pin?: string;
    };
    const mode = body.mode === 'firebase' ? 'firebase' : 'host_chair';

    if (mode === 'host_chair') {
      if (PIN && body.pin !== PIN) {
        res.status(401).json({ error: 'Invalid Host Operator PIN' });
        return;
      }
    } else if (!body.uid || !body.email) {
      res.status(400).json({ error: 'Valid Google Host credentials required' });
      return;
    }

    if (!tokenStore.hostSessionToken) {
      tokenStore.hostSessionToken = generateHostSessionToken();
    }
    tokenStore.hostEmail = body.email ? String(body.email).slice(0, 140) : 'host@club-auction.local';
    tokenStore.hostName = body.displayName
      ? String(body.displayName).slice(0, 120)
      : 'Auction Host Chair';
    tokenStore.hostLoggedInAt = Date.now();
    ensureTeamTokens();
    ensureSubOpPins();
    saveTokenStore();

    res.json({
      ok: true,
      hostToken: tokenStore.hostSessionToken,
      hostName: tokenStore.hostName,
      hostEmail: tokenStore.hostEmail,
      tokens: buildPublicTeamTokens(),
      subOpPins: {
        displayPin: tokenStore.displayPin || '',
        bidsPin: tokenStore.bidsPin || '',
      },
    });
  });

  app.get('/api/host/tokens', (req, res) => {
    if (!isHostAuthorized(req)) {
      res.status(401).json({ error: 'Host login required to view generated team tokens' });
      return;
    }
    ensureTeamTokens();
    ensureSubOpPins();
    res.json({
      ok: true,
      hostName: tokenStore.hostName,
      hostEmail: tokenStore.hostEmail,
      tokens: buildPublicTeamTokens(),
      subOpPins: {
        displayPin: tokenStore.displayPin || '',
        bidsPin: tokenStore.bidsPin || '',
      },
    });
  });

  app.post('/api/host/tokens/regenerate', (req, res) => {
    if (!isHostAuthorized(req)) {
      res.status(401).json({ error: 'Host login required to regenerate team tokens' });
      return;
    }
    tokenStore.teamTokens = generateAllTeamTokens(TEAMS);
    saveTokenStore();
    res.json({
      ok: true,
      tokens: buildPublicTeamTokens(),
    });
  });

  app.post('/api/host/subop-pins/regenerate', (req, res) => {
    if (!isHostAuthorized(req)) {
      res.status(401).json({ error: 'Main Operator login required to regenerate sub-operator PINs' });
      return;
    }
    const pins = generateSubOpPins();
    tokenStore.displayPin = pins.displayPin;
    tokenStore.bidsPin = pins.bidsPin;
    tokenStore.subOpSessions = {};
    saveTokenStore();
    res.json({
      ok: true,
      subOpPins: pins,
    });
  });

  app.post('/api/host/subop-pins/update', (req, res) => {
    if (!isHostAuthorized(req)) {
      res.status(401).json({ error: 'Main Operator login required to update sub-operator PINs' });
      return;
    }
    const body = (req.body || {}) as { displayPin?: string; bidsPin?: string };
    const cleanDisplay = normalizePin(typeof body.displayPin === 'string' ? body.displayPin : '');
    const cleanBids = normalizePin(typeof body.bidsPin === 'string' ? body.bidsPin : '');
    if (cleanDisplay.length < 4 || cleanDisplay.length > 12 || cleanBids.length < 4 || cleanBids.length > 12) {
      res.status(400).json({ error: 'PINs must be 4–12 characters (digits or letters)' });
      return;
    }
    if (cleanDisplay === cleanBids) {
      res.status(400).json({ error: 'Display PIN (Arena 1) and Bids Operator PIN must be different' });
      return;
    }
    tokenStore.displayPin = cleanDisplay;
    tokenStore.bidsPin = cleanBids;
    tokenStore.subOpSessions = {};
    saveTokenStore();
    res.json({
      ok: true,
      subOpPins: { displayPin: cleanDisplay, bidsPin: cleanBids },
    });
  });

  app.post('/api/host/logout', (req, res) => {
    if (isHostAuthorized(req) || !tokenStore.hostSessionToken) {
      tokenStore.hostSessionToken = null;
      tokenStore.hostEmail = null;
      tokenStore.hostName = null;
      tokenStore.hostLoggedInAt = null;
      saveTokenStore();
    }
    res.json({ ok: true });
  });

  // =========================================================================
  // SUB-OPERATOR PIN ENTRY & VERIFICATION (Display Arena 1 / Bids Operator)
  // =========================================================================
  app.get('/api/subop/status', (_req, res) => {
    res.json({
      configured: Boolean(tokenStore.displayPin && tokenStore.bidsPin),
    });
  });

  app.get('/api/subop/verify', (req, res) => {
    const role = getSubOpRole(req);
    if (!role) {
      res.status(401).json({ ok: false, error: 'Sub-operator session expired or invalid' });
      return;
    }
    res.json({ ok: true, role });
  });

  app.post('/api/subop/redeem', (req, res) => {
    const body = (req.body || {}) as { pin?: string };
    const rawPin = typeof body.pin === 'string' ? body.pin : '';
    if (!tokenStore.displayPin || !tokenStore.bidsPin) {
      res.status(400).json({
        error: 'Sub-operator PINs are not open yet. Ask the Main Operator to log in first.',
      });
      return;
    }
    const role = resolveSubOpByPin(tokenStore, rawPin);
    if (!role) {
      res.status(401).json({
        error: 'Invalid Sub-Operator PIN. Ask the Main Operator for the Arena 1 Display PIN or Bids Operator PIN.',
      });
      return;
    }
    const subOpToken = generateSubOpSessionToken(role);
    tokenStore.subOpSessions[subOpToken] = role;
    saveTokenStore();
    res.json({
      ok: true,
      role,
      subOpToken,
    });
  });

  app.post('/api/tokens/redeem', (req, res) => {
    const body = (req.body || {}) as { token?: string };
    const rawToken = typeof body.token === 'string' ? body.token : '';
    if (!TEAMS.every((t) => Boolean(tokenStore.teamTokens[t.id]))) {
      res.status(400).json({
        error: 'Room tokens are not open yet. Ask the host to log in first.',
      });
      return;
    }
    const teamId = resolveTeamIdByToken(tokenStore.teamTokens, rawToken);
    if (!teamId) {
      res.status(401).json({
        error: 'Invalid room token. Double-check the token provided by the host.',
      });
      return;
    }
    const vm = currentView();
    const teamView = vm.teams.find((t) => t.id === teamId);
    res.json({
      ok: true,
      teamId,
      short: teamView?.short || teamId.toUpperCase(),
      name: teamView?.name || teamId,
      paddle: teamView?.paddle || '',
      token: tokenStore.teamTokens[teamId],
    });
  });

  app.get('/api/logos/status', (_req, res) => {
    const exists = fs.existsSync(DC_LOGO_PATH);
    const stats = exists ? fs.statSync(DC_LOGO_PATH) : null;
    res.json({
      filename: DC_LOGO_FILENAME,
      storagePath: `public/logos/${DC_LOGO_FILENAME}`,
      publicUrl: `/logos/${DC_LOGO_FILENAME}`,
      exists,
      bytes: stats?.size ?? 0,
      updatedAt: stats?.mtimeMs ?? null,
    });
  });

  app.post('/api/logos/delhi-capitals', (req, res) => {
    if (IS_VERCEL) {
      res.status(400).json({
        error:
          'Vercel serverless storage is read-only. Replace public/logos/delhi_captails.png in your repository and redeploy.',
      });
      return;
    }
    try {
      const body = (req.body || {}) as { dataUrl?: string; base64?: string };
      const raw = typeof body.dataUrl === 'string' ? body.dataUrl : body.base64;
      if (!raw) {
        res.status(400).json({ error: 'Missing PNG base64 payload' });
        return;
      }
      const cleaned = raw.replace(/^data:image\/png;base64,/i, '').trim();
      const buffer = Buffer.from(cleaned, 'base64');
      if (buffer.length < 24 || buffer.length > 2 * 1024 * 1024) {
        res.status(400).json({ error: 'PNG file must be between 24 bytes and 2 MB' });
        return;
      }
      const isPng =
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47;
      if (!isPng) {
        res.status(400).json({ error: 'Uploaded file must be a valid PNG image' });
        return;
      }
      fs.mkdirSync(LOGOS_DIR, { recursive: true });
      fs.writeFileSync(DC_LOGO_PATH, buffer);
      const distLogosDir = path.resolve(process.cwd(), 'dist', 'logos');
      if (fs.existsSync(distLogosDir)) {
        fs.writeFileSync(path.join(distLogosDir, DC_LOGO_FILENAME), buffer);
      }
      res.json({
        ok: true,
        filename: DC_LOGO_FILENAME,
        storagePath: `public/logos/${DC_LOGO_FILENAME}`,
        publicUrl: `/logos/${DC_LOGO_FILENAME}`,
        bytes: buffer.length,
        updatedAt: Date.now(),
      });
    } catch {
      res.status(500).json({ error: 'Failed to save delhi_captails.png' });
    }
  });

  app.get('/api/network', (_req, res) => {
    const nets = os.networkInterfaces();
    const lanUrls: Array<{ name: string; address: string; url: string }> = [];
    for (const [name, list] of Object.entries(nets)) {
      for (const iface of list || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          lanUrls.push({
            name,
            address: iface.address,
            url: `http://${iface.address}:${PORT}`,
          });
        }
      }
    }
    res.json({
      port: PORT,
      lanUrls,
      appUrl: process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : null,
    });
  });

  app.get('/api/export.csv', (_req, res) => {
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', 'attachment; filename="auction-results.csv"');
    res.send(buildCsvOut(events, players, pidMap, PRESET));
  });

  app.post('/api/cmd', (req, res) => {
    const body = (req.body || {}) as CommandBody;
    const isBidAction = body.type === 'bid' || body.type === 'custom' || body.type === 'jump';
    const teamTokenHeader =
      typeof req.headers['x-team-token'] === 'string' ? req.headers['x-team-token'] : '';
    const subOpRole = getSubOpRole(req);
    const hostOk = isHostAuthorized(req);

    if (isBidAction) {
      if (hostOk) {
        // Main Operator has full authority
      } else if (subOpRole === 'bids') {
        // Bids Sub-Operator can place bids for any participating team
      } else if (subOpRole === 'display') {
        res.status(403).json({
          error: 'Display Sub-Operator PIN is read-only for Arena 1. Use a Bids Operator PIN or Team Token to bid.',
        });
        return;
      } else if (teamTokenHeader) {
        const resolvedTeam = resolveTeamIdByToken(tokenStore.teamTokens, teamTokenHeader);
        if (!resolvedTeam) {
          res.status(401).json({ error: 'Invalid or expired team token. Re-join room with a valid token.' });
          return;
        }
        if ('team' in body && resolvedTeam !== body.team) {
          res.status(403).json({ error: 'Your token only permits bidding for your assigned team.' });
          return;
        }
      } else if (tokenStore.hostSessionToken) {
        res.status(401).json({
          error: 'Enter a Bids Operator PIN or Team Room Token to place bids.',
        });
        return;
      } else if (PIN && req.headers['x-pin'] !== PIN) {
        res.status(401).json({ error: 'Wrong operator PIN' });
        return;
      }
    } else if (!hostOk) {
      if (subOpRole) {
        res.status(403).json({
          error: 'Main Operator login required — Sub-Operators cannot release players/franchises or modify the Up Next queue.',
        });
        return;
      }
      res.status(401).json({ error: 'Main Operator authentication required.' });
      return;
    }

    try {
      events = executeCommand(events, players, pidMap, PRESET, body, Date.now());
      saveEvents();
      const vm = currentView();
      broadcast();
      res.json({ ok: true, vm });
    } catch (err) {
      const message = typeof err === 'string' ? err : 'Bad request';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/reset', (req, res) => {
    if (!isHostAuthorized(req)) {
      res.status(401).json({ error: 'Main Operator authentication required to reset the auction.' });
      return;
    }
    backupEvents();
    events = [];
    saveEvents();
    const vm = currentView();
    broadcast();
    res.json({ ok: true, vm });
  });

  let closeVite: (() => Promise<void>) | undefined;

  if (!IS_VERCEL) {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const hmrDisabled = process.env.DISABLE_HMR === 'true';
      let viteInstance: Awaited<ReturnType<typeof createViteServer>> | null = null;
      const vitePromise = createViteServer({
        server: {
          middlewareMode: true,
          allowedHosts: true,
          hmr: hmrDisabled ? false : httpServer ? { server: httpServer } : true,
          ws: hmrDisabled ? false : undefined,
        },
        appType: 'spa',
      }).then((vite) => {
        viteInstance = vite;
        return vite;
      });
      vitePromise.catch((err) => {
        console.error('Vite dev server initialization error:', err);
      });

      app.use((req, res, next) => {
        if (viteInstance) {
          viteInstance.middlewares(req, res, next);
          return;
        }
        vitePromise
          .then((vite) => vite.middlewares(req, res, next))
          .catch(next);
      });
      closeVite = async () => {
        const vite = viteInstance ?? (await vitePromise.catch(() => null));
        if (vite) await vite.close();
      };
    } else {
      const distDir = path.resolve(process.cwd(), 'dist');
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  return { app, closeVite };
}

if (!IS_VERCEL) {
  if (!process.env.NO_BACKUP_TIMER) {
    setInterval(backupEvents, 60_000).unref();
  }

  // Auto-hammer lot when category countdown timer reaches 00:00
  setInterval(() => {
    const now = Date.now();
    const vm = currentView(now);
    if (vm.lot && now >= vm.lot.expiresAt) {
      try {
        events = executeCommand(events, players, pidMap, PRESET, { type: 'hammer' }, now);
        saveEvents();
        broadcast(now);
      } catch {
        // Ignore concurrent state transition
      }
    }
  }, 500).unref();

  setInterval(() => {
    for (const res of clients) {
      res.write(': ping\n\n');
    }
  }, 15_000).unref();

  const httpServer = http.createServer();

  createApp(httpServer)
    .then(({ app, closeVite }) => {
      httpServer.on('request', app);
      httpServer.on('error', (err) => {
        console.error('Server listen error:', err);
        process.exit(1);
      });

      const shutdown = () => {
        for (const res of clients) {
          res.end();
        }
        clients.clear();
        void closeVite?.().finally(() => {
          httpServer.close(() => process.exit(0));
        });
      };
      process.once('SIGINT', shutdown);
      process.once('SIGTERM', shutdown);

      httpServer.listen(PORT, HOST, () => {
        console.log(
          `${players.length} players, ${PRESET} preset, ${events.length} events restored\n` +
            `Operator: http://localhost:${PORT}/operator   Arena: http://localhost:${PORT}/arena   Bidder: http://localhost:${PORT}/bid   Login: http://localhost:${PORT}/login   Deploy: http://localhost:${PORT}/deploy`
        );
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
