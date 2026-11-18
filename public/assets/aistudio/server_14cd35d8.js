'use strict';
// Auction Room v2. Zero dependencies, Node 18+. Money = integer lakh (100 L = 1 Cr).
// Players come from seed/players.csv (validated at boot). State = replay(event log).
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = +process.env.PORT || 3000, PIN = process.env.PIN || '';
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
const CSV = process.env.PLAYERS_CSV || path.join(__dirname, 'seed', 'players.csv');
const PUB = path.join(__dirname, 'public'), FILE = path.join(DATA, 'events.json');
const CFG = { min: 18, max: 25, os: 8, minBase: 30 };

// Teams and presets. MINI numbers are copied from the supplied host file (unverified, edit freely).
const TEAMS = [
  ['kkr', 'Kolkata Knight Riders', 'KKR', '#9B7BF0', 6430, 12, 2], ['csk', 'Chennai Super Kings', 'CSK', '#F2C14E', 4340, 16, 4],
  ['srh', 'Sunrisers Hyderabad', 'SRH', '#F28C38', 2550, 15, 6], ['lsg', 'Lucknow Super Giants', 'LSG', '#7FD16B', 2295, 19, 4],
  ['dc', 'Delhi Capitals', 'DC', '#35B8E8', 2180, 17, 3], ['rcb', 'Royal Challengers Bengaluru', 'RCB', '#E5484D', 1640, 17, 6],
  ['rr', 'Rajasthan Royals', 'RR', '#EE7FB8', 1605, 16, 7], ['gt', 'Gujarat Titans', 'GT', '#3AA6A0', 1290, 20, 4],
  ['pbks', 'Punjab Kings', 'PBKS', '#D9D9E3', 1150, 21, 6], ['mi', 'Mumbai Indians', 'MI', '#4F8EF7', 275, 20, 7],
].map(([id, name, short, c, mini, held, heldOs]) => ({ id, name, short, c, mini, held, heldOs }));

// ---------- CSV ----------
function parseCSV(t) {
  t = t.replace(/^\uFEFF/, ''); const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; r.push(f); f = ''; if (r.length > 1 || r[0] !== '') rows.push(r); r = []; }
    else f += c;
  }
  if (f !== '' || r.length) { r.push(f); rows.push(r); }
  return rows;
}
const REQ = ['player_id', 'name', 'jersey_number', 'deck_number', 'deck_name', 'player_era', 'nationality_category', 'country', 'country_code', 'role', 'is_wicketkeeper', 'popularity_score', 'batting_metric', 'bowling_metric', 'keeping_metric', 'overall_rating', 'base_price_lakhs', 'bid_increment_lakhs', 'photo_path'];
function loadPlayers(file) {
  const rows = parseCSV(fs.readFileSync(file, 'utf8')), head = rows.shift(), err = [];
  const miss = REQ.filter(c => !head.includes(c)); if (miss.length) throw new Error('players.csv is missing columns: ' + miss.join(', '));
  const seen = new Set(), out = [];
  rows.forEach((row, i) => {
    const o = Object.fromEntries(head.map((h, k) => [h, (row[k] ?? '').trim()])), n = i + 2, bad = m => err.push(`row ${n} (${o.player_id || '?'}): ${m}`);
    const num = k => { const v = Number(o[k]); if (o[k] === '' || !Number.isFinite(v)) { bad(k + ' is not a number'); return 0; } return v; };
    const p = { id: o.player_id, name: o.name, jersey: num('jersey_number'), deck: num('deck_number'), deckName: o.deck_name, era: o.player_era,
      os: o.nationality_category === 'Overseas', country: o.country, cc: o.country_code, role: o.role, wk: o.is_wicketkeeper.toLowerCase() === 'true',
      pop: num('popularity_score'), bat: num('batting_metric'), bowl: num('bowling_metric'), keep: num('keeping_metric'), ovr: num('overall_rating'),
      base: num('base_price_lakhs'), inc: num('bid_increment_lakhs'), photo: o.photo_path };
    if (!p.id || seen.has(p.id)) bad('missing or duplicate player_id'); seen.add(p.id);
    if (!p.name) bad('missing name');
    if (!['Indian', 'Overseas'].includes(o.nationality_category)) bad('nationality_category must be Indian or Overseas');
    if (p.base <= 0 || p.base % 5) bad('base_price_lakhs must be a positive multiple of 5');
    if (p.inc <= 0 || p.inc % 5) bad('bid_increment_lakhs must be a positive multiple of 5');
    out.push(p);
  });
  if (err.length) throw new Error('players.csv has errors:\n  ' + err.slice(0, 20).join('\n  ') + (err.length > 20 ? `\n  ...and ${err.length - 20} more` : ''));
  return out.map((p, i) => ({ p, i })).sort((a, b) => a.p.deck - b.p.deck || a.i - b.i).map(x => x.p);
}
const P = loadPlayers(CSV), PID = new Map(P.map(p => [p.id, p]));
for (const p of P) {
  const rel = String(p.photo || '').replace(/^[/\\]+/, '');
  p.hasPhoto = rel !== '' && fs.existsSync(path.join(PUB, rel)); // skip missing files so the monogram does not 404
}
const fmt = l => (l >= 100 ? +(l / 100).toFixed(2) + ' Cr' : l + ' L');

// ---------- Persistence ----------
let saved = { preset: null, events: [] };
try { const j = JSON.parse(fs.readFileSync(FILE, 'utf8')); saved = Array.isArray(j) ? { preset: null, events: j } : j; } catch { }
const PRESET = (process.env.PRESET || saved.preset || 'MEGA').toUpperCase();
if (!['MEGA', 'MINI'].includes(PRESET)) throw new Error('PRESET must be MEGA or MINI');
if (saved.events.length && saved.preset && saved.preset !== PRESET) throw new Error(`data/events.json belongs to a ${saved.preset} auction. Move it aside to start a ${PRESET} auction.`);
let ev = saved.events;
const unknown = ev.find(e => e.pid && !PID.has(e.pid));
if (unknown) throw new Error(`data/events.json references ${unknown.pid}, which is not in players.csv. Restore the original CSV or move data/events.json aside.`);
function save() {
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(FILE + '.tmp', JSON.stringify({ preset: PRESET, events: ev })); fs.renameSync(FILE + '.tmp', FILE); // atomic
}
function backup() {
  if (!ev.length) return; const d = path.join(DATA, 'backups'); fs.mkdirSync(d, { recursive: true });
  fs.copyFileSync(FILE, path.join(d, 'events-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json'));
  fs.readdirSync(d).sort().slice(0, -30).forEach(f => fs.unlinkSync(path.join(d, f)));
}
if (!process.env.NO_BACKUP_TIMER) setInterval(backup, 60000).unref();

// ---------- Event-sourced state ----------
const start = t => (PRESET === 'MINI' ? t.mini : 12000);
const init = () => ({ lot: null, status: {}, t: Object.fromEntries(TEAMS.map(t => [t.id, { purse: start(t), held: PRESET === 'MINI' ? t.held : 0, heldOs: PRESET === 'MINI' ? t.heldOs : 0, squad: [] }])) });
const cnt = t => t.held + t.squad.length, osn = t => t.heldOs + t.squad.filter(x => PID.get(x.pid).os).length;
function apply(s, e) {
  switch (e.t) {
    case 'CALL': s.lot = { pid: e.pid, price: PID.get(e.pid).base, team: null, trail: [] }; break;
    case 'BID': s.lot.price = e.price; s.lot.team = e.team; s.lot.trail.push({ team: e.team, price: e.price }); break;
    case 'RESET': s.lot.price = PID.get(s.lot.pid).base; s.lot.team = null; s.lot.trail = []; break;
    case 'SOLD': { const t = s.t[e.team]; t.purse -= e.price; t.squad.push({ pid: e.pid, price: e.price }); s.status[e.pid] = 'sold'; s.lot = null; break; }
    case 'UNSOLD': s.status[e.pid] = 'unsold'; s.lot = null; break;
    case 'ACCEL': for (const k in s.status) if (s.status[k] === 'unsold') delete s.status[k]; break;
    case 'RELEASE': { const t = s.t[e.team], i = t.squad.findIndex(x => x.pid === e.pid); t.purse += t.squad[i].price; t.squad.splice(i, 1); delete s.status[e.pid]; break; }
  }
  return s;
}
const replay = evs => evs.reduce(apply, init());
let S = replay(ev);

// ---------- Rules: the only place a bid can be refused ----------
const nextPrice = l => (l.team === null ? l.price : l.price + PID.get(l.pid).inc);
function check(tid, price) {
  const p = PID.get(S.lot.pid), t = S.t[tid];
  if (t.purse < price) return 'Not enough purse';
  if (cnt(t) >= CFG.max) return 'Squad is full';
  if (p.os && osn(t) >= CFG.os) return 'Overseas slots are full';
  const need = Math.max(0, CFG.min - (cnt(t) + 1));
  if (t.purse - price < need * CFG.minBase) return 'Must keep ' + fmt(need * CFG.minBase) + ' in reserve';
  return null;
}
const must = l => { if (!l) throw 'No player is on the floor'; };
const teamOf = id => TEAMS.find(t => t.id === id) || (() => { throw 'Unknown team'; })();
function commit(e) { const n = ev.concat(e), s = replay(n); ev = n; S = s; save(); broadcast(); }

function run(b) {
  const l = S.lot;
  switch (b.type) {
    case 'next': {
      if (l) throw 'Finish the current lot first';
      const p = b.pid ? PID.get(b.pid) : P.find(x => !S.status[x.id]);
      if (!p) throw b.pid ? 'Unknown player' : 'No players left. Run the accelerated round for unsold players';
      if (S.status[p.id]) throw p.name + ' is already ' + S.status[p.id];
      return commit({ t: 'CALL', pid: p.id });
    }
    case 'bid': {
      must(l); const t = teamOf(b.team);
      if (l.team === t.id) throw t.short + ' already holds the highest bid';
      const price = nextPrice(l), r = check(t.id, price); if (r) throw t.short + ': ' + r;
      return commit({ t: 'BID', team: t.id, price });
    }
    case 'custom': {
      must(l); const t = teamOf(b.team), price = Math.round(+b.price);
      if (l.team === t.id) throw t.short + ' already holds the highest bid';
      if (!(price > 0) || price % 5) throw 'Bids move in steps of 5 L';
      if (l.team === null ? price < l.price : price <= l.price) throw 'Bid must be above ' + fmt(l.price);
      const r = check(t.id, price); if (r) throw t.short + ': ' + r;
      return commit({ t: 'BID', team: t.id, price });
    }
    case 'resetbid': must(l); if (!l.trail.length) throw 'No bids to clear'; return commit({ t: 'RESET' });
    case 'sold': must(l); if (!l.team) throw 'No bids yet. Take a bid or mark unsold'; return commit({ t: 'SOLD', pid: l.pid, team: l.team, price: l.price });
    case 'unsold': must(l); if (l.team) throw 'Bids exist. Sell the player or clear the bids'; return commit({ t: 'UNSOLD', pid: l.pid });
    case 'accel':
      if (l) throw 'Finish the current lot first';
      if (!Object.values(S.status).includes('unsold')) throw 'No unsold players';
      return commit({ t: 'ACCEL' });
    case 'release': {
      if (l) throw 'Finish the current lot first';
      const t = teamOf(b.team); if (!S.t[t.id].squad.some(x => x.pid === b.pid)) throw 'That player is not in ' + t.short + "'s auction buys";
      return commit({ t: 'RELEASE', team: t.id, pid: b.pid });
    }
    case 'undo': if (!ev.length) throw 'Nothing to undo'; ev = ev.slice(0, -1); S = replay(ev); save(); return broadcast();
    default: throw 'Unknown command';
  }
}

const tn = id => TEAMS.find(t => t.id === id).short;
const say = e => ({ CALL: () => PID.get(e.pid).name + ' called', BID: () => tn(e.team) + ' bid ' + fmt(e.price), RESET: () => 'Bids cleared',
  SOLD: () => PID.get(e.pid).name + ' sold to ' + tn(e.team) + ' for ' + fmt(e.price), UNSOLD: () => PID.get(e.pid).name + ' unsold',
  ACCEL: () => 'Accelerated round opened', RELEASE: () => PID.get(e.pid).name + ' released by ' + tn(e.team) }[e.t]());
const brief = p => ({ id: p.id, name: p.name, base: p.base, inc: p.inc, deck: p.deck, deckName: p.deckName, role: p.role, os: p.os, photo: p.photo });

function view() {
  const l = S.lot, np = l && nextPrice(l), last = ev[ev.length - 1], st = Object.values(S.status);
  const pool = P.length - st.filter(x => x === 'sold').length; // everyone not yet sold can still be bought
  const needed = TEAMS.reduce((a, t) => a + Math.max(0, CFG.min - cnt(S.t[t.id])), 0);
  return {
    cfg: CFG, preset: PRESET, seq: ev.length, canUndo: ev.length > 0,
    teams: TEAMS.map(t => { const s = S.t[t.id]; return { id: t.id, name: t.name, short: t.short, c: t.c, start: start(t), purse: s.purse, spent: start(t) - s.purse, n: cnt(s), held: s.held, os: osn(s),
      lead: !!l && l.team === t.id, block: l && l.team !== t.id ? check(t.id, np) : null,
      squad: s.squad.map(x => ({ ...brief(PID.get(x.pid)), price: x.price })) }; }),
    lot: l && { p: PID.get(l.pid), price: l.price, team: l.team, trail: l.trail.slice(-6), next: np },
    queue: P.filter(x => !S.status[x.id] && !(l && l.pid === x.id)).slice(0, 5).map(brief),
    unsold: P.filter(x => S.status[x.id] === 'unsold').map(brief),
    status: S.status,
    decks: [...new Set(P.map(p => p.deck))].map(d => { const m = P.filter(p => p.deck === d); return { deck: d, name: m[0].deckName, total: m.length, sold: m.filter(p => S.status[p.id] === 'sold').length, unsold: m.filter(p => S.status[p.id] === 'unsold').length }; }),
    counts: { total: P.length, sold: st.filter(x => x === 'sold').length, unsold: st.filter(x => x === 'unsold').length, left: P.length - st.length - (l ? 1 : 0) },
    feasibility: { needed, pool, ok: needed <= pool, msg: needed > pool ? `Teams still need ${needed} players to reach ${CFG.min}, but only ${pool} remain` : null },
    last: last && (last.t === 'SOLD' || last.t === 'UNSOLD') ? { t: last.t, p: brief(PID.get(last.pid)), team: last.team, price: last.price } : null,
    log: ev.slice(-10).reverse().map(say),
  };
}
const csvOut = () => ['player_id,name,deck,status,team,price_lakhs'].concat(P.map(p => {
  const own = TEAMS.find(t => S.t[t.id].squad.some(x => x.pid === p.id)), x = own && S.t[own.id].squad.find(y => y.pid === p.id);
  return [p.id, '"' + p.name.replace(/"/g, '""') + '"', p.deck, S.status[p.id] || 'pending', own ? own.short : '', x ? x.price : ''].join(',');
})).join('\n');

// ---------- HTTP + SSE ----------
const clients = new Set();
function broadcast() { const d = 'data: ' + JSON.stringify(view()) + '\n\n'; for (const c of clients) c.write(d); }
setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 15000).unref();
const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
function serve(res, rel) {
  let f; try { f = path.normalize(path.join(PUB, decodeURIComponent(rel))); } catch { return send(res, 400, { error: 'Bad path' }); }
  if (f !== PUB && !f.startsWith(PUB + path.sep)) return send(res, 404, { error: 'Not found' });
  fs.stat(f, (e, s) => {
    if (e || !s.isFile()) return send(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'content-type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': f.endsWith('.html') ? 'no-cache' : 'max-age=3600' });
    fs.createReadStream(f).pipe(res);
  });
}
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/stream') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    res.write('retry: 1000\ndata: ' + JSON.stringify(view()) + '\n\n'); clients.add(res);
    return req.on('close', () => clients.delete(res));
  }
  if (url === '/api/state') return send(res, 200, view());
  if (url === '/api/players') return send(res, 200, P);
  if (url === '/api/health') return send(res, 200, { ok: true, players: P.length, events: ev.length, clients: clients.size, preset: PRESET });
  if (url === '/api/export.csv') { res.writeHead(200, { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename="auction-results.csv"' }); return res.end(csvOut()); }
  if (url === '/api/cmd' && req.method === 'POST') {
    if (PIN && req.headers['x-pin'] !== PIN) return send(res, 401, { error: 'Wrong operator PIN' });
    let body = ''; req.on('data', d => { body += d; if (body.length > 1e4) req.destroy(); });
    return req.on('end', () => {
      try { run(JSON.parse(body || '{}')); send(res, 200, { ok: true }); }
      catch (e) { send(res, 400, { error: typeof e === 'string' ? e : 'Bad request' }); if (typeof e !== 'string' && !(e instanceof SyntaxError)) console.error(e); }
    });
  }
  if (url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  if (url === '/') { res.writeHead(302, { location: '/operator' }); return res.end(); }
  if (url === '/operator' || url === '/arena') return serve(res, 'index.html');
  serve(res, url);
});
if (require.main === module) server.listen(PORT, '0.0.0.0', () => console.log(`${P.length} players, ${PRESET} preset, ${ev.length} events restored\nOperator: http://localhost:${PORT}/operator   Arena: http://localhost:${PORT}/arena`));
module.exports = { server, P };
