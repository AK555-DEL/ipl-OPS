import crypto from 'node:crypto';
import type { TeamConfig } from './types.ts';

export type SubOperatorRole = 'display' | 'bids';

export interface SubOperatorPins {
  displayPin: string;
  bidsPin: string;
}

export interface TokenStoreData {
  hostSessionToken: string | null;
  hostEmail: string | null;
  hostName: string | null;
  hostLoggedInAt: number | null;
  teamTokens: Record<string, string>;
  displayPin: string | null;
  bidsPin: string | null;
  subOpSessions: Record<string, SubOperatorRole>;
}

export interface PublicTeamTokenInfo {
  teamId: string;
  slotLabel: string;
  paddle: string;
  token: string;
}

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeToken(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function normalizePin(raw: string): string {
  return raw.trim().replace(/\s+/g, '').toUpperCase();
}

export function generateSixDigitPin(): string {
  const num = crypto.randomInt(100000, 1000000);
  return String(num);
}

export function generateSubOpPins(existing?: Partial<SubOperatorPins>): SubOperatorPins {
  const displayPin =
    existing?.displayPin && normalizePin(existing.displayPin).length >= 4
      ? normalizePin(existing.displayPin)
      : generateSixDigitPin();
  let bidsPin =
    existing?.bidsPin && normalizePin(existing.bidsPin).length >= 4
      ? normalizePin(existing.bidsPin)
      : generateSixDigitPin();
  while (bidsPin === displayPin) {
    bidsPin = generateSixDigitPin();
  }
  return { displayPin, bidsPin };
}

export function generateSubOpSessionToken(role: SubOperatorRole): string {
  const prefix = role === 'bids' ? 'SUBOP-BIDS' : 'SUBOP-DISP';
  return `${prefix}-${crypto.randomBytes(10).toString('hex').toUpperCase()}`;
}

export function resolveSubOpByPin(
  store: Pick<TokenStoreData, 'displayPin' | 'bidsPin'>,
  rawPin: string
): SubOperatorRole | null {
  const clean = normalizePin(rawPin);
  if (!clean) return null;
  if (store.bidsPin && normalizePin(store.bidsPin) === clean) {
    return 'bids';
  }
  if (store.displayPin && normalizePin(store.displayPin) === clean) {
    return 'display';
  }
  return null;
}

export function generateTeamAccessCode(teamShort: string): string {
  const bytes = crypto.randomBytes(4);
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  }
  return `${teamShort.toUpperCase()}-${suffix}`;
}

export function generateAllTeamTokens(teams: Pick<TeamConfig, 'id' | 'short'>[]): Record<string, string> {
  const used = new Set<string>();
  const map: Record<string, string> = {};
  for (const team of teams) {
    let code = generateTeamAccessCode(team.short);
    while (used.has(code)) {
      code = generateTeamAccessCode(team.short);
    }
    used.add(code);
    map[team.id] = code;
  }
  return map;
}

export function generateHostSessionToken(): string {
  return `HOST-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
}

export function resolveTeamIdByToken(
  teamTokens: Record<string, string>,
  rawToken: string
): string | null {
  const clean = normalizeToken(rawToken);
  if (!clean) return null;
  for (const [teamId, stored] of Object.entries(teamTokens)) {
    if (normalizeToken(stored) === clean) {
      return teamId;
    }
  }
  return null;
}

export function createEmptyTokenStore(): TokenStoreData {
  return {
    hostSessionToken: null,
    hostEmail: null,
    hostName: null,
    hostLoggedInAt: null,
    teamTokens: {},
    displayPin: null,
    bidsPin: null,
    subOpSessions: {},
  };
}
