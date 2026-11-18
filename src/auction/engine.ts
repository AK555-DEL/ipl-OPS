import type {
  AuctionConfig,
  AuctionEvent,
  AuctionViewModel,
  BriefPlayer,
  CappedSubCategory,
  CategoryFilter,
  CommandBody,
  FranchiseMixList,
  LogEntry,
  LotCategory,
  Player,
  PlayerSubCategory,
  Preset,
  TeamConfig,
  TeamView,
  UncappedSubCategory,
} from './types.ts';

export const CFG: AuctionConfig = {
  min: 18,
  max: 25,
  os: 8,
  minBase: 30,
  minBowlers: 4,
  minWicketkeepers: 1,
};

export const DURATION_BY_CATEGORY: Record<LotCategory, number> = {
  MAVERICK: 300, // 5 minutes
  CAPPED: 180, // 3 minutes
  UNCAPPED: 120, // 2 minutes
  TITLE: 180, // 3 minutes
};

export function getCategoryForDeck(deck: number): LotCategory {
  if (deck === 0) return 'TITLE';
  if (deck === 1) return 'MAVERICK';
  if (deck >= 2 && deck <= 5) return 'CAPPED';
  return 'UNCAPPED';
}

export const TEAMS: TeamConfig[] = [
  { id: 't1', slotLabel: 'Team 01', name: 'Club Team 01', short: 'T01', city: 'Paddle #01', c: '#9B7BF0', badgeBg: '#3A225D', badgeText: '#E6DEFE', paddle: '#01', hotkey: '1', mini: 6430, held: 12, heldOs: 2 },
  { id: 't2', slotLabel: 'Team 02', name: 'Club Team 02', short: 'T02', city: 'Paddle #02', c: '#F2C14E', badgeBg: '#F2C14E', badgeText: '#141026', paddle: '#02', hotkey: '2', mini: 4340, held: 16, heldOs: 4 },
  { id: 't3', slotLabel: 'Team 03', name: 'Club Team 03', short: 'T03', city: 'Paddle #03', c: '#F28C38', badgeBg: '#FF822A', badgeText: '#141026', paddle: '#03', hotkey: '3', mini: 2550, held: 15, heldOs: 6 },
  { id: 't4', slotLabel: 'Team 04', name: 'Club Team 04', short: 'T04', city: 'Paddle #04', c: '#7FD16B', badgeBg: '#7FD16B', badgeText: '#141026', paddle: '#04', hotkey: '4', mini: 2295, held: 19, heldOs: 4 },
  { id: 't5', slotLabel: 'Team 05', name: 'Club Team 05', short: 'T05', city: 'Paddle #05', c: '#35B8E8', badgeBg: '#004C97', badgeText: '#E6DEFE', paddle: '#05', hotkey: '5', mini: 2180, held: 17, heldOs: 3 },
  { id: 't6', slotLabel: 'Team 06', name: 'Club Team 06', short: 'T06', city: 'Paddle #06', c: '#E5484D', badgeBg: '#EC1C24', badgeText: '#FFFFFF', paddle: '#06', hotkey: '6', mini: 1640, held: 17, heldOs: 6 },
  { id: 't7', slotLabel: 'Team 07', name: 'Club Team 07', short: 'T07', city: 'Paddle #07', c: '#EE7FB8', badgeBg: '#EA1A85', badgeText: '#FFFFFF', paddle: '#07', hotkey: '7', mini: 1605, held: 16, heldOs: 7 },
  { id: 't8', slotLabel: 'Team 08', name: 'Club Team 08', short: 'T08', city: 'Paddle #08', c: '#3AA6A0', badgeBg: '#0B4973', badgeText: '#E6DEFE', paddle: '#08', hotkey: '8', mini: 1290, held: 20, heldOs: 4 },
  { id: 't9', slotLabel: 'Team 09', name: 'Club Team 09', short: 'T09', city: 'Paddle #09', c: '#D9D9E3', badgeBg: '#DD1F2D', badgeText: '#FFFFFF', paddle: '#09', hotkey: '9', mini: 1150, held: 21, heldOs: 6 },
  { id: 't10', slotLabel: 'Team 10', name: 'Club Team 10', short: 'T10', city: 'Paddle #10', c: '#4F8EF7', badgeBg: '#004BA0', badgeText: '#FFFFFF', paddle: '#10', hotkey: '0', mini: 275, held: 20, heldOs: 7 },
  { id: 't11', slotLabel: 'Team 11', name: 'Club Team 11', short: 'T11', city: 'Paddle #11', c: '#2DD4BF', badgeBg: '#16324F', badgeText: '#F5D061', paddle: '#11', hotkey: '-', mini: 1200, held: 18, heldOs: 4 },
];

// Fixed Franchise Tier Ladder: Strictly ordered from Lowest Tier / Least Popular (Tier 1)
// to Highest Tier / Most Popular (Tier 11) across all 11 participating franchises.
export const FRANCHISE_TITLES: Player[] = [
  { id: 'IPL-T01', name: 'Lucknow Super Giants', jersey: 1, deck: 0, deckName: 'Franchise Titles', era: 'Tier 1', os: false, country: 'Lucknow', cc: 'LSG', role: 'Franchise Title', wk: false, pop: 82, bat: 91, bowl: 91, keep: 90, ovr: 91, base: 200, inc: 25, photo: '', isTitle: true, tier: 1, category: 'TITLE', durationSec: 180, titleTheme: { short: 'LSG', city: 'Lucknow', c: '#7FD16B', badgeBg: '#A0E6FF', badgeText: '#141026' } },
  { id: 'IPL-T02', name: 'Punjab Kings', jersey: 10, deck: 0, deckName: 'Franchise Titles', era: 'Tier 2', os: false, country: 'Mohali', cc: 'PBKS', role: 'Franchise Title', wk: false, pop: 84, bat: 92, bowl: 90, keep: 89, ovr: 92, base: 200, inc: 25, photo: '', isTitle: true, tier: 2, category: 'TITLE', durationSec: 180, titleTheme: { short: 'PBKS', city: 'Mohali', c: '#D9D9E3', badgeBg: '#DD1F2D', badgeText: '#FFFFFF' } },
  { id: 'IPL-T03', name: 'Delhi Capitals', jersey: 17, deck: 0, deckName: 'Franchise Titles', era: 'Tier 3', os: false, country: 'Delhi', cc: 'DC', role: 'Franchise Title', wk: false, pop: 86, bat: 92, bowl: 92, keep: 92, ovr: 93, base: 200, inc: 25, photo: '', isTitle: true, tier: 3, category: 'TITLE', durationSec: 180, titleTheme: { short: 'DC', city: 'Delhi', c: '#35B8E8', badgeBg: '#004C97', badgeText: '#E6DEFE' } },
  { id: 'IPL-T04', name: 'Gujarat Titans', jersey: 33, deck: 0, deckName: 'Franchise Titles', era: 'Tier 4', os: false, country: 'Ahmedabad', cc: 'GT', role: 'Franchise Title', wk: false, pop: 88, bat: 93, bowl: 94, keep: 89, ovr: 94, base: 200, inc: 25, photo: '', isTitle: true, tier: 4, category: 'TITLE', durationSec: 180, titleTheme: { short: 'GT', city: 'Ahmedabad', c: '#3AA6A0', badgeBg: '#0B4973', badgeText: '#E6DEFE' } },
  { id: 'IPL-T05', name: 'Rajasthan Royals', jersey: 11, deck: 0, deckName: 'Franchise Titles', era: 'Tier 5', os: false, country: 'Jaipur', cc: 'RR', role: 'Franchise Title', wk: false, pop: 90, bat: 94, bowl: 92, keep: 91, ovr: 94, base: 200, inc: 25, photo: '', isTitle: true, tier: 5, category: 'TITLE', durationSec: 180, titleTheme: { short: 'RR', city: 'Jaipur', c: '#EE7FB8', badgeBg: '#EA1A85', badgeText: '#FFFFFF' } },
  { id: 'IPL-T06', name: 'Sunrisers Hyderabad', jersey: 30, deck: 0, deckName: 'Franchise Titles', era: 'Tier 6', os: false, country: 'Hyderabad', cc: 'SRH', role: 'Franchise Title', wk: false, pop: 92, bat: 96, bowl: 93, keep: 88, ovr: 95, base: 200, inc: 25, photo: '', isTitle: true, tier: 6, category: 'TITLE', durationSec: 180, titleTheme: { short: 'SRH', city: 'Hyderabad', c: '#F28C38', badgeBg: '#FF822A', badgeText: '#141026' } },
  { id: 'IPL-T07', name: 'Kolkata Knight Riders', jersey: 12, deck: 0, deckName: 'Franchise Titles', era: 'Tier 7', os: false, country: 'Kolkata', cc: 'KKR', role: 'Franchise Title', wk: false, pop: 95, bat: 95, bowl: 95, keep: 90, ovr: 97, base: 200, inc: 25, photo: '', isTitle: true, tier: 7, category: 'TITLE', durationSec: 180, titleTheme: { short: 'KKR', city: 'Kolkata', c: '#9B7BF0', badgeBg: '#3A225D', badgeText: '#E6DEFE' } },
  { id: 'IPL-T08', name: 'Royal Challengers Bengaluru', jersey: 18, deck: 0, deckName: 'Franchise Titles', era: 'Tier 8', os: false, country: 'Bengaluru', cc: 'RCB', role: 'Franchise Title', wk: false, pop: 98, bat: 99, bowl: 89, keep: 90, ovr: 98, base: 200, inc: 25, photo: '', isTitle: true, tier: 8, category: 'TITLE', durationSec: 180, titleTheme: { short: 'RCB', city: 'Bengaluru', c: '#E5484D', badgeBg: '#EC1C24', badgeText: '#FFFFFF' } },
  { id: 'IPL-T09', name: 'Mumbai Indians', jersey: 45, deck: 0, deckName: 'Franchise Titles', era: 'Tier 9', os: false, country: 'Mumbai', cc: 'MI', role: 'Franchise Title', wk: false, pop: 99, bat: 97, bowl: 96, keep: 92, ovr: 99, base: 200, inc: 25, photo: '', isTitle: true, tier: 9, category: 'TITLE', durationSec: 180, titleTheme: { short: 'MI', city: 'Mumbai', c: '#4F8EF7', badgeBg: '#004BA0', badgeText: '#FFFFFF' } },
  { id: 'IPL-T10', name: 'Chennai Super Kings', jersey: 7, deck: 0, deckName: 'Franchise Titles', era: 'Tier 10', os: false, country: 'Chennai', cc: 'CSK', role: 'Franchise Title', wk: false, pop: 100, bat: 98, bowl: 94, keep: 95, ovr: 99, base: 200, inc: 25, photo: '', isTitle: true, tier: 10, category: 'TITLE', durationSec: 180, titleTheme: { short: 'CSK', city: 'Chennai', c: '#F2C14E', badgeBg: '#FFFF00', badgeText: '#141026' } },
  { id: 'IPL-T11', name: 'Deccan Chargers', jersey: 24, deck: 0, deckName: 'Franchise Titles', era: 'Tier 11 · Heritage Franchise', os: false, country: 'Deccan', cc: 'DCH', role: 'Franchise Title', wk: false, pop: 94, bat: 95, bowl: 94, keep: 91, ovr: 95, base: 200, inc: 25, photo: '', isTitle: true, tier: 11, category: 'TITLE', durationSec: 180, titleTheme: { short: 'DCH', city: 'Deccan', c: '#2DD4BF', badgeBg: '#16324F', badgeText: '#F5D061' } },
];

export function buildAllLots(csvPlayers: Player[]): Player[] {
  return [...FRANCHISE_TITLES, ...csvPlayers];
}

export function formatRole(role: string): string {
  const r = role.trim().toLowerCase();
  if (r === 'batsman' || r === 'batter') return 'Batter';
  if (r === 'bowler') return 'Bowler';
  if (r === 'wicketkeeper' || r === 'wicket-keeper' || r === 'keeper') return 'Wicketkeeper';
  if (r === 'all-rounder' || r === 'allrounder') return 'All-Rounder';
  return role;
}

export function formatPlayerCardMeta(
  p: Pick<Player | BriefPlayer, 'jersey' | 'role' | 'isTitle' | 'country' | 'era'>
): string {
  if (p.isTitle) return `${p.country} · ${p.era}`;
  return `#${String(p.jersey).padStart(2, '0')} · ${formatRole(p.role)}`;
}

export function isBowlerPlayer(p: Pick<Player, 'role' | 'isTitle'>): boolean {
  return !p.isTitle && formatRole(p.role) === 'Bowler';
}

export function isWicketkeeperPlayer(p: Pick<Player, 'role' | 'wk' | 'isTitle'>): boolean {
  return !p.isTitle && (Boolean(p.wk) || formatRole(p.role) === 'Wicketkeeper');
}

export interface SubCategoryMeta<T extends PlayerSubCategory = PlayerSubCategory> {
  id: T;
  parent: 'CAPPED' | 'UNCAPPED';
  label: string;
  shortLabel: string;
}

export const CAPPED_SUBCATEGORIES: ReadonlyArray<SubCategoryMeta<CappedSubCategory>> = [
  { id: 'CAPPED_BAT', parent: 'CAPPED', label: 'Capped Batsman', shortLabel: 'Batsman' },
  { id: 'CAPPED_BOWL', parent: 'CAPPED', label: 'Capped Bowlers', shortLabel: 'Bowlers' },
  { id: 'CAPPED_AR', parent: 'CAPPED', label: 'Capped All Rounders', shortLabel: 'All Rounders' },
  { id: 'CAPPED_WK', parent: 'CAPPED', label: 'Capped Wicketkeepers', shortLabel: 'Wicketkeepers' },
];

export const UNCAPPED_SUBCATEGORIES: ReadonlyArray<SubCategoryMeta<UncappedSubCategory>> = [
  { id: 'UNCAPPED_BAT', parent: 'UNCAPPED', label: 'UnCapped Batsman', shortLabel: 'Batsman' },
  { id: 'UNCAPPED_BOWL', parent: 'UNCAPPED', label: 'UnCapped Bowlers', shortLabel: 'Bowlers' },
  { id: 'UNCAPPED_AR', parent: 'UNCAPPED', label: 'UnCapped All Rounders', shortLabel: 'All Rounders' },
  { id: 'UNCAPPED_WK', parent: 'UNCAPPED', label: 'UnCapped Wicketkeepers', shortLabel: 'Wicketkeepers' },
];

export const PLAYER_SUBCATEGORY_META: Record<PlayerSubCategory, SubCategoryMeta> = {
  CAPPED_BAT: CAPPED_SUBCATEGORIES[0],
  CAPPED_BOWL: CAPPED_SUBCATEGORIES[1],
  CAPPED_AR: CAPPED_SUBCATEGORIES[2],
  CAPPED_WK: CAPPED_SUBCATEGORIES[3],
  UNCAPPED_BAT: UNCAPPED_SUBCATEGORIES[0],
  UNCAPPED_BOWL: UNCAPPED_SUBCATEGORIES[1],
  UNCAPPED_AR: UNCAPPED_SUBCATEGORIES[2],
  UNCAPPED_WK: UNCAPPED_SUBCATEGORIES[3],
};

export function getPlayerSubCategory(
  p: Pick<Player | BriefPlayer, 'category' | 'role' | 'wk' | 'isTitle'>
): PlayerSubCategory | null {
  if (p.isTitle || (p.category !== 'CAPPED' && p.category !== 'UNCAPPED')) {
    return null;
  }
  const isWk = isWicketkeeperPlayer({ role: p.role, wk: Boolean(p.wk), isTitle: p.isTitle });
  if (isWk) {
    return p.category === 'CAPPED' ? 'CAPPED_WK' : 'UNCAPPED_WK';
  }
  const normalizedRole = formatRole(p.role);
  if (normalizedRole === 'Bowler') {
    return p.category === 'CAPPED' ? 'CAPPED_BOWL' : 'UNCAPPED_BOWL';
  }
  if (normalizedRole === 'All-Rounder') {
    return p.category === 'CAPPED' ? 'CAPPED_AR' : 'UNCAPPED_AR';
  }
  if (normalizedRole === 'Batter') {
    return p.category === 'CAPPED' ? 'CAPPED_BAT' : 'UNCAPPED_BAT';
  }
  return null;
}

export function matchesCategoryFilter(
  p: Pick<Player | BriefPlayer, 'category' | 'role' | 'wk' | 'isTitle'>,
  filter: CategoryFilter
): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'TITLE' || filter === 'MAVERICK' || filter === 'CAPPED' || filter === 'UNCAPPED') {
    return p.category === filter;
  }
  return getPlayerSubCategory(p) === filter;
}

export function formatCategoryFilterLabel(filter: CategoryFilter): string {
  if (filter === 'ALL') return 'All';
  if (filter === 'TITLE') return 'Titles';
  if (filter === 'MAVERICK') return 'Mavericks';
  if (filter === 'CAPPED') return 'Capped';
  if (filter === 'UNCAPPED') return 'Uncapped';
  return PLAYER_SUBCATEGORY_META[filter]?.label ?? filter;
}

export function formatLakhs(lakhs: number): string {
  if (lakhs >= 100) {
    const cr = lakhs / 100;
    return `${cr.toFixed(2)} Cr`;
  }
  return `${lakhs} L`;
}

export function formatCurrency(lakhs: number): string {
  return `₹${formatLakhs(lakhs)}`;
}

export function parseCSV(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const REQUIRED_COLUMNS = [
  'player_id',
  'name',
  'jersey_number',
  'deck_number',
  'deck_name',
  'player_era',
  'nationality_category',
  'country',
  'country_code',
  'role',
  'is_wicketkeeper',
  'popularity_score',
  'batting_metric',
  'bowling_metric',
  'keeping_metric',
  'overall_rating',
  'base_price_lakhs',
  'bid_increment_lakhs',
  'photo_path',
];

export function parsePlayersCsv(csvText: string): Player[] {
  const rows = parseCSV(csvText);
  const head = rows.shift();
  if (!head) throw new Error('players.csv is empty');
  const miss = REQUIRED_COLUMNS.filter((c) => !head.includes(c));
  if (miss.length) {
    throw new Error('players.csv is missing columns: ' + miss.join(', '));
  }

  const seen = new Set<string>();
  const errors: string[] = [];
  const out: Player[] = [];

  rows.forEach((row, i) => {
    const o = Object.fromEntries(head.map((h, k) => [h, (row[k] ?? '').trim()]));
    const rowNum = i + 2;
    const bad = (msg: string) => errors.push(`row ${rowNum} (${o.player_id || '?'}): ${msg}`);
    const num = (k: string) => {
      const v = Number(o[k]);
      if (o[k] === '' || !Number.isFinite(v)) {
        bad(`${k} is not a number`);
        return 0;
      }
      return v;
    };

    const deck = num('deck_number');
    const category = getCategoryForDeck(deck);

    const p: Player = {
      id: o.player_id,
      name: o.name,
      jersey: num('jersey_number'),
      deck,
      deckName: o.deck_name,
      era: o.player_era,
      os: o.nationality_category === 'Overseas',
      country: o.country,
      cc: o.country_code,
      role: o.role,
      wk: o.is_wicketkeeper.toLowerCase() === 'true',
      pop: num('popularity_score'),
      bat: num('batting_metric'),
      bowl: num('bowling_metric'),
      keep: num('keeping_metric'),
      ovr: num('overall_rating'),
      base: num('base_price_lakhs'),
      inc: num('bid_increment_lakhs'),
      photo: o.photo_path,
      isTitle: false,
      category,
      durationSec: DURATION_BY_CATEGORY[category],
    };

    if (!p.id || seen.has(p.id)) bad('missing or duplicate player_id');
    seen.add(p.id);
    if (!p.name) bad('missing name');
    if (!['Indian', 'Overseas'].includes(o.nationality_category)) {
      bad('nationality_category must be Indian or Overseas');
    }
    if (p.base <= 0 || p.base % 5) bad('base_price_lakhs must be a positive multiple of 5');
    if (p.inc <= 0 || p.inc % 5) bad('bid_increment_lakhs must be a positive multiple of 5');
    out.push(p);
  });

  if (errors.length) {
    throw new Error(
      'players.csv has errors:\n  ' +
        errors.slice(0, 20).join('\n  ') +
        (errors.length > 20 ? `\n  ...and ${errors.length - 20} more` : '')
    );
  }

  return out
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.deck - b.p.deck || a.i - b.i)
    .map((x) => x.p);
}

interface InternalTeamState {
  purse: number;
  held: number;
  heldOs: number;
  titleId: string | null;
  titlePrice: number;
  squad: Array<{ pid: string; price: number }>;
}

interface InternalLotState {
  pid: string;
  price: number;
  team: string | null;
  trail: Array<{ team: string; price: number; ts: number }>;
  startedAt: number;
  durationSec: number;
  expiresAt: number;
}

export interface InternalState {
  lot: InternalLotState | null;
  upNext: string[];
  playerOrder: string[];
  franchiseLists: Record<string, string[]>;
  status: Record<string, 'sold' | 'unsold'>;
  t: Record<string, InternalTeamState>;
}

export const startPurse = (t: TeamConfig, preset: Preset): number => (preset === 'MINI' ? t.mini : 12000);

function initState(preset: Preset): InternalState {
  return {
    lot: null,
    upNext: [],
    playerOrder: [],
    franchiseLists: {},
    status: {},
    t: Object.fromEntries(
      TEAMS.map((t) => [
        t.id,
        {
          purse: startPurse(t, preset),
          held: preset === 'MINI' ? t.held : 0,
          heldOs: preset === 'MINI' ? t.heldOs : 0,
          titleId: null,
          titlePrice: 0,
          squad: [],
        },
      ])
    ),
  };
}

const teamCount = (t: InternalTeamState): number => t.held + t.squad.length;
const teamOsCount = (t: InternalTeamState, pidMap: Map<string, Player>): number =>
  t.heldOs + t.squad.filter((x) => pidMap.get(x.pid)?.os).length;
const teamBowlerCount = (t: InternalTeamState, pidMap: Map<string, Player>): number =>
  t.squad.filter((x) => {
    const pl = pidMap.get(x.pid);
    return pl ? isBowlerPlayer(pl) : false;
  }).length;
const teamWkCount = (t: InternalTeamState, pidMap: Map<string, Player>): number =>
  t.squad.filter((x) => {
    const pl = pidMap.get(x.pid);
    return pl ? isWicketkeeperPlayer(pl) : false;
  }).length;

export function applyEvent(s: InternalState, e: AuctionEvent, pidMap: Map<string, Player>): InternalState {
  switch (e.t) {
    case 'CALL': {
      const p = pidMap.get(e.pid);
      if (!p) throw new Error(`Unknown player ${e.pid}`);
      const durationSec = p.durationSec || DURATION_BY_CATEGORY[p.category];
      const ts = e.ts || Date.now();
      s.lot = {
        pid: e.pid,
        price: p.base,
        team: null,
        trail: [],
        startedAt: ts,
        durationSec,
        expiresAt: ts + durationSec * 1000,
      };
      s.upNext = s.upNext.filter((id) => id !== e.pid);
      break;
    }
    case 'BID': {
      if (!s.lot) break;
      s.lot.price = e.price;
      s.lot.team = e.team;
      s.lot.trail.push({ team: e.team, price: e.price, ts: e.ts });
      break;
    }
    case 'RESET': {
      if (!s.lot) break;
      const p = pidMap.get(s.lot.pid)!;
      s.lot.price = p.base;
      s.lot.team = null;
      s.lot.trail = [];
      break;
    }
    case 'EXTEND': {
      if (!s.lot) break;
      s.lot.durationSec += e.sec;
      s.lot.expiresAt += e.sec * 1000;
      break;
    }
    case 'SOLD': {
      const team = s.t[e.team];
      const lotItem = pidMap.get(e.pid);
      team.purse -= e.price;
      if (lotItem?.isTitle) {
        team.titleId = e.pid;
        team.titlePrice = e.price;
      } else {
        team.squad.push({ pid: e.pid, price: e.price });
      }
      s.status[e.pid] = 'sold';
      s.lot = null;
      break;
    }
    case 'UNSOLD': {
      s.status[e.pid] = 'unsold';
      s.lot = null;
      break;
    }
    case 'ACCEL': {
      for (const k of Object.keys(s.status)) {
        if (s.status[k] === 'unsold') delete s.status[k];
      }
      break;
    }
    case 'RETURN_UNCAPPED': {
      for (const k of Object.keys(s.status)) {
        const p = pidMap.get(k);
        if (p && !p.isTitle && p.category === 'UNCAPPED' && s.status[k] === 'unsold') {
          delete s.status[k];
        }
      }
      break;
    }
    case 'MIX_MATCH': {
      s.playerOrder = e.playerOrder.filter((pid) => pidMap.has(pid));
      s.franchiseLists = e.franchiseLists;
      s.upNext = s.playerOrder
        .filter((pid) => {
          const p = pidMap.get(pid);
          return Boolean(p && !p.isTitle && !s.status[pid] && s.lot?.pid !== pid);
        })
        .slice(0, 3);
      break;
    }
    case 'RELEASE': {
      const team = s.t[e.team];
      const p = pidMap.get(e.pid);
      if (p?.isTitle || team.titleId === e.pid) {
        // Auctioned franchise teams remain permanently locked
        break;
      }
      const idx = team.squad.findIndex((x) => x.pid === e.pid);
      if (idx >= 0) {
        team.purse += team.squad[idx].price;
        team.squad.splice(idx, 1);
      }
      delete s.status[e.pid];
      break;
    }
    case 'QUEUE_SET': {
      s.upNext = e.pids.filter((pid) => pidMap.has(pid) && !s.status[pid] && s.lot?.pid !== pid).slice(0, 3);
      break;
    }
  }
  return s;
}

export function replayEvents(
  events: AuctionEvent[],
  pidMap: Map<string, Player>,
  preset: Preset
): InternalState {
  return events.reduce((acc, ev) => applyEvent(acc, ev, pidMap), initState(preset));
}

export function getIplBidIncrement(priceLakhs: number): number {
  if (priceLakhs < 400) return 25; // Below 4 Cr: +25 L
  if (priceLakhs < 1000) return 50; // 4 Cr to below 10 Cr: +50 L
  if (priceLakhs < 2000) return 100; // 10 Cr to 20 Cr: +1 Cr
  return 200; // Above 20 Cr: +2 Cr
}

export function nextBidPrice(lot: InternalLotState, _pidMap?: Map<string, Player>): number {
  if (lot.team === null) return lot.price;
  return lot.price + getIplBidIncrement(lot.price);
}

export function checkBidEligibility(
  state: InternalState,
  pidMap: Map<string, Player>,
  teamId: string,
  _price: number
): string | null {
  if (!state.lot) return null;
  const p = pidMap.get(state.lot.pid)!;
  const t = state.t[teamId];
  const bowlers = teamBowlerCount(t, pidMap);
  const wks = teamWkCount(t, pidMap);
  if (p.isTitle) {
    if (t.titleId) return 'Already owns a franchise title';
    return null;
  }
  if (teamCount(t) >= CFG.max) return 'Squad is full';
  if (p.os && teamOsCount(t, pidMap) >= CFG.os) return 'Overseas slots are full';
  const remBowlAfter =
    t.held === 0 ? Math.max(0, CFG.minBowlers - (bowlers + (isBowlerPlayer(p) ? 1 : 0))) : 0;
  const remWkAfter =
    t.held === 0 ? Math.max(0, CFG.minWicketkeepers - (wks + (isWicketkeeperPlayer(p) ? 1 : 0))) : 0;
  const mandatoryCompAfter = remBowlAfter + remWkAfter;
  const slotsLeftAfter = CFG.max - (teamCount(t) + 1);
  if (t.held === 0 && slotsLeftAfter < mandatoryCompAfter) {
    return `Must reserve slots for min ${CFG.minBowlers} Bowlers & ${CFG.minWicketkeepers} Wicketkeeper`;
  }
  return null;
}

function teamOf(id: string): TeamConfig {
  const t = TEAMS.find((x) => x.id === id);
  if (!t) throw 'Unknown team';
  return t;
}

function resolvedTeamMeta(baseTeam: TeamConfig, state: InternalTeamState, pidMap: Map<string, Player>) {
  const wonTitle = state.titleId ? pidMap.get(state.titleId) : undefined;
  if (wonTitle?.titleTheme) {
    return {
      name: wonTitle.name,
      short: wonTitle.titleTheme.short,
      city: wonTitle.titleTheme.city,
      c: wonTitle.titleTheme.c,
      badgeBg: wonTitle.titleTheme.badgeBg,
      badgeText: wonTitle.titleTheme.badgeText,
      titleId: wonTitle.id,
      titleName: wonTitle.name,
      titleSubFranchise: wonTitle.titleTheme.subFranchise ?? null,
    };
  }
  return {
    name: baseTeam.name,
    short: baseTeam.short,
    city: baseTeam.city,
    c: baseTeam.c,
    badgeBg: baseTeam.badgeBg,
    badgeText: baseTeam.badgeText,
    titleId: null,
    titleName: null,
    titleSubFranchise: null,
  };
}

function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateMixAndMatch(
  players: Player[],
  status: Record<string, 'sold' | 'unsold'>,
  activePid: string | null,
  seed: number
): { playerOrder: string[]; franchiseLists: Record<string, string[]> } {
  const rng = createRng(seed || 1);
  // Franchise titles always stay strictly ordered from lowest tier to highest tier
  const pendingTitles = players.filter(
    (p) => p.isTitle && !status[p.id] && activePid !== p.id
  );
  const pendingPlayers = players.filter(
    (p) => !p.isTitle && !status[p.id] && activePid !== p.id
  );

  const mavericks = shuffleWithRng(
    pendingPlayers.filter((p) => p.category === 'MAVERICK'),
    rng
  );
  const capped = shuffleWithRng(
    pendingPlayers.filter((p) => p.category === 'CAPPED'),
    rng
  );
  const uncapped = shuffleWithRng(
    pendingPlayers.filter((p) => p.category === 'UNCAPPED'),
    rng
  );

  // Interleave Mavericks, Capped, and Uncapped so every player gets a chance to appear
  const mixedPlayers: Player[] = [];
  let mi = 0;
  let ci = 0;
  let ui = 0;
  while (mi < mavericks.length || ci < capped.length || ui < uncapped.length) {
    if (mi < mavericks.length) mixedPlayers.push(mavericks[mi++]);
    if (ci < capped.length) mixedPlayers.push(capped[ci++]);
    if (ui < uncapped.length) mixedPlayers.push(uncapped[ui++]);
    if (ci < capped.length) mixedPlayers.push(capped[ci++]);
    if (ui < uncapped.length) mixedPlayers.push(uncapped[ui++]);
  }

  const playerOrder = [...pendingTitles, ...mixedPlayers].map((p) => p.id);

  // Generate an engaging balanced Mix & Match list for each of the 11 franchises
  const batters = shuffleWithRng(
    pendingPlayers.filter((p) => formatRole(p.role) === 'Batter'),
    rng
  );
  const bowlers = shuffleWithRng(
    pendingPlayers.filter((p) => formatRole(p.role) === 'Bowler'),
    rng
  );
  const allRounders = shuffleWithRng(
    pendingPlayers.filter((p) => formatRole(p.role) === 'All-Rounder'),
    rng
  );
  const keepers = shuffleWithRng(
    pendingPlayers.filter((p) => formatRole(p.role) === 'Wicketkeeper'),
    rng
  );

  const franchiseLists: Record<string, string[]> = {};
  TEAMS.forEach((team, idx) => {
    const picks: Player[] = [];
    const addUnique = (pool: Player[], count: number, offset: number) => {
      if (!pool.length) return;
      for (let k = 0; k < count; k++) {
        const candidate = pool[(offset + k) % pool.length];
        if (!picks.some((x) => x.id === candidate.id)) {
          picks.push(candidate);
        }
      }
    };
    addUnique(mavericks, 2, idx * 2);
    addUnique(batters, 3, idx * 3);
    addUnique(bowlers, 3, idx * 3);
    addUnique(allRounders, 2, idx * 2);
    addUnique(keepers, 1, idx);
    addUnique(uncapped, 3, idx * 3);
    franchiseLists[team.id] = picks.slice(0, 12).map((p) => p.id);
  });

  return { playerOrder, franchiseLists };
}

function resolveOrderedPlayers(players: Player[], state: InternalState): Player[] {
  const titles = players.filter((p) => p.isTitle);
  const nonTitles = players.filter((p) => !p.isTitle);
  if (!state.playerOrder.length) return [...titles, ...nonTitles];
  const orderMap = new Map(state.playerOrder.map((id, idx) => [id, idx]));
  const ordered = [...players].sort((a, b) => {
    if (a.isTitle && b.isTitle) return (a.tier ?? a.deck) - (b.tier ?? b.deck);
    if (a.isTitle) return -1;
    if (b.isTitle) return 1;
    const ia = orderMap.get(a.id);
    const ib = orderMap.get(b.id);
    if (ia !== undefined && ib !== undefined) return ia - ib;
    if (ia !== undefined) return -1;
    if (ib !== undefined) return 1;
    return 0;
  });
  return ordered;
}

export function executeCommand(
  events: AuctionEvent[],
  players: Player[],
  pidMap: Map<string, Player>,
  preset: Preset,
  body: CommandBody,
  now = Date.now()
): AuctionEvent[] {
  const S = replayEvents(events, pidMap, preset);
  const l = S.lot;
  const orderedPlayers = resolveOrderedPlayers(players, S);

  switch (body.type) {
    case 'next': {
      if (l) throw 'Finish the current lot first';
      const queuedNext = S.upNext.map((id) => pidMap.get(id)).find((x) => x && !S.status[x.id]);
      const p = body.pid ? pidMap.get(body.pid) : queuedNext || orderedPlayers.find((x) => !S.status[x.id]);
      if (!p) throw body.pid ? 'Unknown player or title' : 'No lots left. Return uncapped inventory or run the accelerated round';
      if (S.status[p.id]) throw `${p.name} is already ${S.status[p.id]}`;
      return events.concat({ t: 'CALL', pid: p.id, ts: now });
    }
    case 'bid': {
      if (!l) throw 'No lot is live in the arena';
      const t = teamOf(body.team);
      const label = resolvedTeamMeta(t, S.t[t.id], pidMap).short;
      if (l.team === t.id) throw `${label} already holds the highest bid`;
      const price = nextBidPrice(l, pidMap);
      const block = checkBidEligibility(S, pidMap, t.id, price);
      if (block) throw `${label}: ${block}`;
      return events.concat({ t: 'BID', team: t.id, price, ts: now });
    }
    case 'jump': {
      if (!l) throw 'No lot is live in the arena';
      const t = teamOf(body.team);
      const label = resolvedTeamMeta(t, S.t[t.id], pidMap).short;
      if (l.team === t.id) throw `${label} already holds the highest bid`;
      const delta = Math.round(Number(body.delta));
      if (delta < 0 || delta % 5) throw 'Jump increments move in steps of 5 L';
      const price = l.team === null ? l.price + delta : l.price + Math.max(5, delta);
      const block = checkBidEligibility(S, pidMap, t.id, price);
      if (block) throw `${label}: ${block}`;
      return events.concat({ t: 'BID', team: t.id, price, ts: now });
    }
    case 'custom': {
      if (!l) throw 'No lot is live in the arena';
      const t = teamOf(body.team);
      const label = resolvedTeamMeta(t, S.t[t.id], pidMap).short;
      const price = Math.round(Number(body.price));
      if (l.team === t.id) throw `${label} already holds the highest bid`;
      if (!(price > 0) || price % 5) throw 'Bids move in steps of 5 L';
      if (l.team === null ? price < l.price : price <= l.price) {
        throw `Bid must be above ${formatCurrency(l.price)}`;
      }
      const block = checkBidEligibility(S, pidMap, t.id, price);
      if (block) throw `${label}: ${block}`;
      return events.concat({ t: 'BID', team: t.id, price, ts: now });
    }
    case 'resetbid': {
      if (!l) throw 'No lot is live in the arena';
      if (!l.trail.length) throw 'No bids to clear';
      return events.concat({ t: 'RESET', ts: now });
    }
    case 'extend': {
      if (!l) throw 'No lot is live in the arena';
      const sec = Math.max(10, Math.min(300, Math.round(Number(body.sec ?? 30))));
      return events.concat({ t: 'EXTEND', sec, ts: now });
    }
    case 'sold': {
      if (!l) throw 'No lot is live in the arena';
      if (!l.team) throw 'No bids yet. Take a bid or mark unsold';
      return events.concat({ t: 'SOLD', pid: l.pid, team: l.team, price: l.price, ts: now });
    }
    case 'unsold': {
      if (!l) throw 'No lot is live in the arena';
      if (l.team) throw 'Bids exist. Hammer sold or clear the bids';
      return events.concat({ t: 'UNSOLD', pid: l.pid, ts: now });
    }
    case 'hammer': {
      if (!l) throw 'No lot is live in the arena';
      if (l.team) {
        return events.concat({ t: 'SOLD', pid: l.pid, team: l.team, price: l.price, ts: now });
      }
      return events.concat({ t: 'UNSOLD', pid: l.pid, ts: now });
    }
    case 'accel': {
      if (l) throw 'Finish the current lot first';
      if (!Object.values(S.status).includes('unsold')) throw 'No unsold lots';
      return events.concat({ t: 'ACCEL', ts: now });
    }
    case 'return_uncapped': {
      if (l) throw 'Finish the current lot first';
      const pendingPlayers = players.filter((p) => !p.isTitle && !S.status[p.id]);
      if (pendingPlayers.length > 0) {
        throw `Use all ${pendingPlayers.length} pending players before returning uncapped inventory to the pool`;
      }
      const unsoldUncapped = players.filter(
        (p) => !p.isTitle && p.category === 'UNCAPPED' && S.status[p.id] === 'unsold'
      );
      if (!unsoldUncapped.length) {
        throw 'No unsold uncapped players left to return to the pool';
      }
      return events.concat({ t: 'RETURN_UNCAPPED', ts: now });
    }
    case 'mix_match': {
      if (l) throw 'Finish the current lot first';
      const seed = Number.isFinite(body.seed) ? Number(body.seed) : now;
      const { playerOrder, franchiseLists } = generateMixAndMatch(
        players,
        S.status,
        null,
        seed
      );
      if (!playerOrder.length) throw 'No pending lots left to mix and match';
      return events.concat({
        t: 'MIX_MATCH',
        playerOrder,
        franchiseLists,
        ts: now,
      });
    }
    case 'release': {
      if (l) throw 'Finish the current lot first';
      const t = teamOf(body.team);
      const label = resolvedTeamMeta(t, S.t[t.id], pidMap).short;
      const p = pidMap.get(body.pid);
      if (p?.isTitle || S.t[t.id].titleId === body.pid) {
        throw 'Auctioned franchise teams cannot be released once sold';
      }
      const ownsPlayer = S.t[t.id].squad.some((x) => x.pid === body.pid);
      if (!ownsPlayer) {
        throw `That player is not owned by ${label}`;
      }
      return events.concat({ t: 'RELEASE', team: t.id, pid: body.pid, ts: now });
    }
    case 'queue_add': {
      const p = pidMap.get(body.pid);
      if (!p) throw 'Unknown lot';
      if (S.status[p.id]) throw `${p.name} is already ${S.status[p.id]}`;
      if (l?.pid === p.id) throw `${p.name} is currently live in the arena`;
      if (S.upNext.includes(p.id)) throw `${p.name} is already in the 3-slot queue`;
      if (S.upNext.length >= 3) throw 'Up Next queue already has 3 players (remove one first)';
      return events.concat({ t: 'QUEUE_SET', pids: [...S.upNext, p.id], ts: now });
    }
    case 'queue_remove': {
      return events.concat({
        t: 'QUEUE_SET',
        pids: S.upNext.filter((id) => id !== body.pid),
        ts: now,
      });
    }
    case 'queue_fill': {
      const cat: CategoryFilter = body.category || 'ALL';
      const matches = orderedPlayers.filter((x) => {
        if (S.status[x.id] || l?.pid === x.id) return false;
        return matchesCategoryFilter(x, cat);
      });
      if (!matches.length) throw `No pending ${formatCategoryFilterLabel(cat)} lots remaining`;
      return events.concat({
        t: 'QUEUE_SET',
        pids: matches.slice(0, 3).map((x) => x.id),
        ts: now,
      });
    }
    case 'queue_clear': {
      if (!S.upNext.length) return events;
      return events.concat({ t: 'QUEUE_SET', pids: [], ts: now });
    }
    case 'undo': {
      if (!events.length) throw 'Nothing to undo';
      return events.slice(0, -1);
    }
    default:
      throw 'Unknown command';
  }
}

function teamDisplayShort(state: InternalState, teamId: string, pidMap: Map<string, Player>): string {
  const base = TEAMS.find((t) => t.id === teamId);
  if (!base) return teamId.toUpperCase();
  return resolvedTeamMeta(base, state.t[teamId], pidMap).short;
}

function describeEvent(
  e: AuctionEvent,
  pidMap: Map<string, Player>,
  resolvedShorts: Record<string, string>
): LogEntry {
  const playerName = 'pid' in e ? (pidMap.get(e.pid)?.name ?? e.pid) : '';
  const tLabel = 'team' in e ? (resolvedShorts[e.team] ?? e.team.toUpperCase()) : '';
  let text = '';
  switch (e.t) {
    case 'CALL':
      text = `${playerName} sent to Arena`;
      break;
    case 'BID':
      text = `${tLabel} bid ${formatCurrency(e.price)}`;
      break;
    case 'RESET':
      text = 'Active bids cleared';
      break;
    case 'EXTEND':
      text = `Auction clock extended +${e.sec}s`;
      break;
    case 'SOLD':
      text = `${playerName} SOLD to ${tLabel} for ${formatCurrency(e.price)}`;
      break;
    case 'UNSOLD':
      text = `${playerName} passed (UNSOLD)`;
      break;
    case 'ACCEL':
      text = 'Accelerated round opened';
      break;
    case 'RETURN_UNCAPPED':
      text = 'Uncapped inventory returned to active pool';
      break;
    case 'MIX_MATCH':
      text = 'Mix & Match pool + 11 franchise scouting lists generated';
      break;
    case 'RELEASE':
      text = `${playerName} released by ${tLabel}`;
      break;
    case 'QUEUE_SET':
      text = `Up-Next 3-slot queue updated (${e.pids.length}/3)`;
      break;
  }
  return { text, ts: e.ts || 0, kind: e.t };
}

function brief(p: Player): BriefPlayer {
  return {
    id: p.id,
    name: p.name,
    jersey: p.jersey,
    deck: p.deck,
    deckName: p.deckName,
    era: p.era,
    role: p.role,
    country: p.country,
    cc: p.cc,
    os: p.os,
    wk: p.wk,
    base: p.base,
    inc: p.inc,
    ovr: p.ovr,
    photo: p.photo,
    hasPhoto: p.hasPhoto,
    isTitle: p.isTitle,
    tier: p.tier,
    category: p.category,
    durationSec: p.durationSec,
    titleTheme: p.titleTheme,
  };
}

function getSolvency(purse: number, n: number, os: number): TeamView['solvency'] {
  if (purse < 1000 || n >= CFG.max) return 'CRITICAL';
  if (os >= CFG.os || purse < 1500) return 'RESTRICTED';
  if (purse < 2000) return 'CAUTION';
  if (purse >= 3000) return 'HIGH LIQUIDITY';
  if (purse >= 2100) return 'OPTIMAL';
  return 'STABLE';
}

export function buildViewModel(
  events: AuctionEvent[],
  players: Player[],
  pidMap: Map<string, Player>,
  preset: Preset,
  serverNow = Date.now()
): AuctionViewModel {
  const S = replayEvents(events, pidMap, preset);
  const l = S.lot;
  const np = l ? nextBidPrice(l, pidMap) : 0;
  const lastEv = events[events.length - 1];

  const actualPlayers = players.filter((p) => !p.isTitle);
  const titleLots = players.filter((p) => p.isTitle);
  const pool = actualPlayers.filter((p) => S.status[p.id] !== 'sold').length;
  const needed = TEAMS.reduce((acc, t) => acc + Math.max(0, CFG.min - teamCount(S.t[t.id])), 0);

  const resolvedShorts: Record<string, string> = {};
  const teams: TeamView[] = TEAMS.map((t) => {
    const s = S.t[t.id];
    const meta = resolvedTeamMeta(t, s, pidMap);
    resolvedShorts[t.id] = meta.short;
    const start = startPurse(t, preset);
    const n = teamCount(s);
    const os = teamOsCount(s, pidMap);
    const bowlers = teamBowlerCount(s, pidMap);
    const wicketkeepers = teamWkCount(s, pidMap);
    const bowlersNeeded = s.held === 0 ? Math.max(0, CFG.minBowlers - bowlers) : 0;
    const wicketkeepersNeeded = s.held === 0 ? Math.max(0, CFG.minWicketkeepers - wicketkeepers) : 0;
    const compositionOk = s.held > 0 || (bowlersNeeded === 0 && wicketkeepersNeeded === 0);
    const needAfterOne = Math.max(0, CFG.min - (n + 1), bowlersNeeded + wicketkeepersNeeded);
    const minReserve = needAfterOne * CFG.minBase;
    const maxBid = n >= CFG.max ? 0 : Math.max(0, s.purse - minReserve);

    return {
      id: t.id,
      slotLabel: t.slotLabel,
      name: meta.name,
      short: meta.short,
      city: meta.city,
      c: meta.c,
      badgeBg: meta.badgeBg,
      badgeText: meta.badgeText,
      paddle: t.paddle,
      hotkey: t.hotkey,
      titleId: meta.titleId,
      titleName: meta.titleName,
      titleSubFranchise: meta.titleSubFranchise,
      titlePrice: s.titlePrice,
      start,
      purse: s.purse,
      spent: start - s.purse,
      n,
      held: s.held,
      os,
      bowlers,
      wicketkeepers,
      bowlersNeeded,
      wicketkeepersNeeded,
      compositionOk,
      lead: Boolean(l && l.team === t.id),
      block: l && l.team !== t.id ? checkBidEligibility(S, pidMap, t.id, np) : null,
      minReserve,
      maxBid,
      solvency: getSolvency(s.purse, n, os),
      squad: s.squad.map((x) => ({
        ...brief(pidMap.get(x.pid)!),
        price: x.price,
      })),
    };
  });

  const capTotal = teams.reduce((acc, t) => acc + t.start, 0);
  const spentTotal = teams.reduce((acc, t) => acc + t.spent, 0);

  const decks = [...new Set(players.map((p) => p.deck))].map((d) => {
    const members = players.filter((p) => p.deck === d);
    const sold = members.filter((p) => S.status[p.id] === 'sold').length;
    const unsold = members.filter((p) => S.status[p.id] === 'unsold').length;
    return {
      deck: d,
      name: members[0].deckName,
      total: members.length,
      sold,
      unsold,
      pending: members.length - sold - unsold,
    };
  });

  const orderedPlayers = resolveOrderedPlayers(players, S);
  const upNext = S.upNext
    .map((id) => pidMap.get(id))
    .filter((p): p is Player => Boolean(p && !S.status[p.id] && l?.pid !== p.id))
    .slice(0, 3)
    .map(brief);

  const upNextSet = new Set(upNext.map((p) => p.id));
  const fallbackQueue = orderedPlayers
    .filter((x) => !S.status[x.id] && !(l && l.pid === x.id) && !upNextSet.has(x.id))
    .slice(0, 8)
    .map(brief);
  const queue = [...upNext, ...fallbackQueue].slice(0, 8);

  const franchiseLists: FranchiseMixList[] = teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    teamShort: t.short,
    paddle: t.paddle,
    players: (S.franchiseLists[t.id] || [])
      .map((pid) => pidMap.get(pid))
      .filter((p): p is Player => Boolean(p))
      .map(brief),
  }));

  const lastTeam =
    lastEv && lastEv.t === 'SOLD' ? teams.find((tm) => tm.id === lastEv.team) : undefined;

  const last =
    lastEv && (lastEv.t === 'SOLD' || lastEv.t === 'UNSOLD')
      ? {
          t: lastEv.t,
          p: brief(pidMap.get(lastEv.pid)!),
          team: lastEv.t === 'SOLD' ? lastEv.team : undefined,
          teamShort: lastEv.t === 'SOLD' ? (lastTeam?.short ?? teamDisplayShort(S, lastEv.team, pidMap)) : undefined,
          teamName: lastEv.t === 'SOLD' ? (lastTeam?.name ?? lastEv.team) : undefined,
          price: lastEv.t === 'SOLD' ? lastEv.price : undefined,
          ts: lastEv.ts || 0,
        }
      : null;

  const activePlayer = l ? pidMap.get(l.pid)! : null;
  const recentBids = (() => {
    const out: AuctionViewModel['recentBids'] = [];
    let currentPid: string | null = null;
    for (let idx = 0; idx < events.length; idx++) {
      const ev = events[idx];
      if (ev.t === 'CALL') {
        currentPid = ev.pid;
      } else if (ev.t === 'BID') {
        const tm = teams.find((t) => t.id === ev.team);
        const lotItem = currentPid ? pidMap.get(currentPid) : undefined;
        out.push({
          id: `${idx}-${ev.team}-${ev.price}`,
          pid: currentPid,
          lotName: lotItem?.name ?? currentPid ?? 'Active Lot',
          team: ev.team,
          teamShort: tm?.short ?? ev.team.toUpperCase(),
          teamName: tm?.name ?? ev.team,
          teamColor: tm?.c ?? '#fdb813',
          price: ev.price,
          ts: ev.ts || 0,
        });
      } else if (ev.t === 'SOLD' || ev.t === 'UNSOLD') {
        currentPid = null;
      }
    }
    return out.slice(-80).reverse();
  })();

  return {
    cfg: CFG,
    preset,
    seq: events.length,
    serverNow,
    canUndo: events.length > 0,
    mixedActive: S.playerOrder.length > 0,
    teams,
    lot:
      l && activePlayer
        ? {
            p: activePlayer,
            price: l.price,
            team: l.team,
            trail: l.trail.slice(-6),
            next: np,
            inc: getIplBidIncrement(l.price),
            bidCount: l.trail.length,
            lastTimestamp: l.trail.length ? l.trail[l.trail.length - 1].ts : null,
            startedAt: l.startedAt,
            durationSec: l.durationSec,
            expiresAt: l.expiresAt,
            category: activePlayer.category,
          }
        : null,
    upNext,
    queue,
    unsold: players.filter((x) => S.status[x.id] === 'unsold').map(brief),
    franchiseLists,
    status: { ...S.status },
    decks,
    counts: {
      total: players.length,
      playersTotal: actualPlayers.length,
      titlesTotal: titleLots.length,
      sold: actualPlayers.filter((p) => S.status[p.id] === 'sold').length,
      titlesSold: titleLots.filter((p) => S.status[p.id] === 'sold').length,
      unsold: players.filter((p) => S.status[p.id] === 'unsold').length,
      uncappedUnsold: actualPlayers.filter(
        (p) => p.category === 'UNCAPPED' && S.status[p.id] === 'unsold'
      ).length,
      playersLeft: actualPlayers.filter((p) => !S.status[p.id] && l?.pid !== p.id).length,
      left: players.filter((p) => !S.status[p.id] && l?.pid !== p.id).length,
    },
    totals: {
      cap: capTotal,
      spent: spentTotal,
      remaining: capTotal - spentTotal,
    },
    feasibility: {
      needed,
      pool,
      ok: needed <= pool,
      msg:
        needed > pool
          ? `Teams still need ${needed} players to reach ${CFG.min}, but only ${pool} remain`
          : null,
    },
    last,
    recentBids,
    log: events
      .slice(-40)
      .reverse()
      .map((e) => describeEvent(e, pidMap, resolvedShorts)),
  };
}

export function buildCsvOut(
  events: AuctionEvent[],
  players: Player[],
  pidMap: Map<string, Player>,
  preset: Preset
): string {
  const S = replayEvents(events, pidMap, preset);
  const header = ['player_id,name,deck,status,team,price_lakhs'];
  const lines = players.map((p) => {
    const ownerBase = TEAMS.find((t) =>
      p.isTitle ? S.t[t.id].titleId === p.id : S.t[t.id].squad.some((x) => x.pid === p.id)
    );
    const ownerShort = ownerBase ? resolvedTeamMeta(ownerBase, S.t[ownerBase.id], pidMap).short : '';
    const entryPrice = ownerBase
      ? p.isTitle
        ? S.t[ownerBase.id].titlePrice
        : S.t[ownerBase.id].squad.find((y) => y.pid === p.id)?.price ?? ''
      : '';
    return [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.deck,
      S.status[p.id] || 'pending',
      ownerShort,
      entryPrice,
    ].join(',');
  });
  return header.concat(lines).join('\n');
}
