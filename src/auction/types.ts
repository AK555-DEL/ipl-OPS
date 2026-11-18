export type Preset = 'MEGA' | 'MINI';

export type LotCategory = 'TITLE' | 'MAVERICK' | 'CAPPED' | 'UNCAPPED';
export type CappedSubCategory =
  | 'CAPPED_BAT'
  | 'CAPPED_BOWL'
  | 'CAPPED_AR'
  | 'CAPPED_WK';
export type UncappedSubCategory =
  | 'UNCAPPED_BAT'
  | 'UNCAPPED_BOWL'
  | 'UNCAPPED_AR'
  | 'UNCAPPED_WK';
export type PlayerSubCategory = CappedSubCategory | UncappedSubCategory;
export type CategoryFilter = 'ALL' | LotCategory | PlayerSubCategory;

export interface Player {
  id: string;
  name: string;
  jersey: number;
  deck: number;
  deckName: string;
  era: string;
  os: boolean;
  country: string;
  cc: string;
  role: string;
  wk: boolean;
  pop: number;
  bat: number;
  bowl: number;
  keep: number;
  ovr: number;
  base: number;
  inc: number;
  photo: string;
  hasPhoto?: boolean;
  isTitle?: boolean;
  tier?: number;
  category: LotCategory;
  durationSec: number;
  titleTheme?: {
    short: string;
    city: string;
    c: string;
    badgeBg: string;
    badgeText: string;
    subFranchise?: string;
  };
}

export interface BriefPlayer {
  id: string;
  name: string;
  jersey: number;
  deck: number;
  deckName: string;
  era: string;
  role: string;
  country: string;
  cc: string;
  os: boolean;
  wk?: boolean;
  base: number;
  inc: number;
  ovr: number;
  photo: string;
  hasPhoto?: boolean;
  isTitle?: boolean;
  tier?: number;
  category: LotCategory;
  durationSec: number;
  titleTheme?: {
    short: string;
    city: string;
    c: string;
    badgeBg: string;
    badgeText: string;
    subFranchise?: string;
  };
}

export interface SquadPlayer extends BriefPlayer {
  price: number;
}

export interface FranchiseMixList {
  teamId: string;
  teamName: string;
  teamShort: string;
  paddle: string;
  players: BriefPlayer[];
}

export interface TeamConfig {
  id: string;
  slotLabel: string;
  name: string;
  short: string;
  city: string;
  c: string;
  badgeBg: string;
  badgeText: string;
  paddle: string;
  hotkey: string;
  mini: number;
  held: number;
  heldOs: number;
}

export interface TeamView {
  id: string;
  slotLabel: string;
  name: string;
  short: string;
  city: string;
  c: string;
  badgeBg: string;
  badgeText: string;
  paddle: string;
  hotkey: string;
  titleId: string | null;
  titleName: string | null;
  titleSubFranchise: string | null;
  titlePrice: number;
  start: number;
  purse: number;
  spent: number;
  n: number;
  held: number;
  os: number;
  bowlers: number;
  wicketkeepers: number;
  bowlersNeeded: number;
  wicketkeepersNeeded: number;
  compositionOk: boolean;
  lead: boolean;
  block: string | null;
  minReserve: number;
  maxBid: number;
  solvency: 'HIGH LIQUIDITY' | 'OPTIMAL' | 'STABLE' | 'CAUTION' | 'RESTRICTED' | 'CRITICAL';
  squad: SquadPlayer[];
}

export type AuctionEvent =
  | { t: 'CALL'; pid: string; ts: number }
  | { t: 'BID'; team: string; price: number; ts: number }
  | { t: 'UNDO_BID'; count: number; team: string; price: number; ts: number }
  | { t: 'RESET'; ts: number }
  | { t: 'SOLD'; pid: string; team: string; price: number; ts: number }
  | { t: 'UNSOLD'; pid: string; ts: number }
  | { t: 'ACCEL'; ts: number }
  | { t: 'RETURN_UNCAPPED'; ts: number }
  | { t: 'MIX_MATCH'; playerOrder: string[]; franchiseLists: Record<string, string[]>; ts: number }
  | { t: 'RELEASE'; team: string; pid: string; ts: number }
  | { t: 'QUEUE_SET'; pids: string[]; ts: number }
  | { t: 'EXTEND'; sec: number; ts: number };

export interface BidTrailEntry {
  team: string;
  price: number;
  ts: number;
}

export interface LotView {
  p: Player;
  price: number;
  team: string | null;
  trail: BidTrailEntry[];
  next: number;
  inc: number;
  bidCount: number;
  lastTimestamp: number | null;
  startedAt: number;
  durationSec: number;
  expiresAt: number;
  category: LotCategory;
}

export interface DeckSummary {
  deck: number;
  name: string;
  total: number;
  sold: number;
  unsold: number;
  pending: number;
}

export interface AuctionConfig {
  min: number;
  max: number;
  os: number;
  minBase: number;
  minBowlers: number;
  minWicketkeepers: number;
}

export interface LogEntry {
  text: string;
  ts: number;
  kind: AuctionEvent['t'];
}

export interface RecentBidEntry {
  id: string;
  pid: string | null;
  lotName: string;
  team: string;
  teamShort: string;
  teamName: string;
  teamColor: string;
  price: number;
  ts: number;
}

export interface LastOutcome {
  t: 'SOLD' | 'UNSOLD';
  p: BriefPlayer;
  team?: string;
  teamShort?: string;
  teamName?: string;
  price?: number;
  ts: number;
}

export interface AuctionViewModel {
  cfg: AuctionConfig;
  preset: Preset;
  seq: number;
  serverNow: number;
  canUndo: boolean;
  mixedActive: boolean;
  teams: TeamView[];
  lot: LotView | null;
  upNext: BriefPlayer[];
  queue: BriefPlayer[];
  unsold: BriefPlayer[];
  franchiseLists: FranchiseMixList[];
  status: Record<string, 'sold' | 'unsold'>;
  decks: DeckSummary[];
  counts: {
    total: number;
    playersTotal: number;
    titlesTotal: number;
    sold: number;
    titlesSold: number;
    unsold: number;
    uncappedUnsold: number;
    playersLeft: number;
    left: number;
  };
  totals: {
    cap: number;
    spent: number;
    remaining: number;
  };
  feasibility: {
    needed: number;
    pool: number;
    ok: boolean;
    msg: string | null;
  };
  last: LastOutcome | null;
  recentBids: RecentBidEntry[];
  log: LogEntry[];
}

export type CommandBody =
  | { type: 'next'; pid?: string }
  | { type: 'bid'; team: string }
  | { type: 'custom'; team: string; price: number }
  | { type: 'jump'; team: string; delta: number }
  | { type: 'undobid'; count?: number; toIndex?: number }
  | { type: 'resetbid' }
  | { type: 'sold' }
  | { type: 'unsold' }
  | { type: 'hammer' }
  | { type: 'extend'; sec?: number }
  | { type: 'accel' }
  | { type: 'return_uncapped' }
  | { type: 'mix_match'; seed?: number }
  | { type: 'release'; team: string; pid: string }
  | { type: 'queue_add'; pid: string }
  | { type: 'queue_remove'; pid: string }
  | { type: 'queue_fill'; category?: CategoryFilter }
  | { type: 'queue_clear' }
  | { type: 'undo' };
