import type { BriefPlayer, LastOutcome, LotView, Player, TeamView } from '../auction/types.ts';
import { formatRole } from '../auction/engine.ts';

export interface StageCardFields {
  displayName: string;
  subFranchiseLabel: string | null;
  jerseyLabel: string;
  stars: number;
  battingValue: string;
  battingSub: string;
  secondaryHeader: 'BOWLING' | 'KEEPING';
  secondaryValue: string;
  secondarySub: string;
  roleLabel: string;
  deckLabel: string;
  countryCode: string;
  countryName: string;
  basePriceLabel: string;
  initialsBadge: string;
}

export interface BiddingRateInfo {
  currentPriceLakhs: number;
  nextBidLakhs: number;
  incrementLakhs: number;
  multiplier: string;
  bidCount: number;
  bidsPerMinute: string;
  leaderTeam: TeamView | null;
}

export interface StageHoldResult {
  player: Player;
  holdMode: 'live' | 'sold' | 'unsold' | 'preview';
  outcomeTeamShort?: string;
  outcomeTeamName?: string;
  outcomePrice?: number;
}

export function getPopularityStars(popScore: number): number {
  if (!Number.isFinite(popScore) || popScore <= 0) return 1;
  // Support either 1-5 scale or 0-100 CSV scale
  const normalized = popScore <= 5 ? popScore : Math.round(popScore / 20);
  return Math.max(1, Math.min(5, normalized));
}

export function formatBasePriceShort(lakhs: number): string {
  if (!Number.isFinite(lakhs) || lakhs <= 0) return '₹30 L';
  if (lakhs >= 100) {
    const cr = lakhs / 100;
    const formatted = Number.isInteger(cr)
      ? String(cr)
      : String(Number(cr.toFixed(2)));
    return `₹${formatted} Cr`;
  }
  return `₹${Math.round(lakhs)} L`;
}

export function buildCardInitials(name: string, jersey: number, isTitle?: boolean): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const chars =
    parts.length === 0
      ? '?'
      : parts.length === 1
        ? parts[0].slice(0, 3).toUpperCase()
        : parts
            .map((p) => p[0] || '')
            .join('')
            .slice(0, 3)
            .toUpperCase();
  return isTitle ? chars : `${chars} #${jersey}`;
}

function briefToPlayerFallback(b: BriefPlayer): Player {
  return {
    id: b.id,
    name: b.name,
    jersey: b.jersey,
    deck: b.deck,
    deckName: b.deckName,
    era: b.era,
    os: b.os,
    country: b.country,
    cc: b.cc,
    role: b.role,
    wk: Boolean(b.wk),
    pop: Math.min(100, Math.max(60, b.ovr)),
    bat: b.ovr,
    bowl: b.ovr,
    keep: b.wk ? b.ovr : 50,
    ovr: b.ovr,
    base: b.base,
    inc: b.inc,
    photo: b.photo,
    hasPhoto: b.hasPhoto,
    isTitle: b.isTitle,
    tier: b.tier,
    category: b.category,
    durationSec: b.durationSec,
    titleTheme: b.titleTheme,
  };
}

export function resolveStageHoldPlayer(
  lot: LotView | null,
  last: LastOutcome | null,
  queue: BriefPlayer[],
  players: Player[]
): StageHoldResult | null {
  if (lot) {
    return {
      player: lot.p,
      holdMode: 'live',
      outcomePrice: lot.price,
    };
  }
  if (last) {
    const full = players.find((p) => p.id === last.p.id) ?? briefToPlayerFallback(last.p);
    return {
      player: full,
      holdMode: last.t === 'SOLD' ? 'sold' : 'unsold',
      outcomeTeamShort: last.teamShort,
      outcomeTeamName: last.teamName,
      outcomePrice: last.price,
    };
  }
  if (queue.length > 0) {
    const first = queue[0];
    const full = players.find((p) => p.id === first.id) ?? briefToPlayerFallback(first);
    return {
      player: full,
      holdMode: 'preview',
    };
  }
  if (players.length > 0) {
    return {
      player: players[0],
      holdMode: 'preview',
    };
  }
  return null;
}

export function formatStageCardFields(player: Player): StageCardFields {
  const formattedRole = formatRole(player.role).toUpperCase();
  const isKeeper = Boolean(player.wk) || formattedRole === 'WICKETKEEPER';

  const roleLabel = player.isTitle
    ? 'FRANCHISE'
    : formattedRole === 'BATTER'
      ? 'BATSMAN'
      : formattedRole;

  const secondaryHeader: 'BOWLING' | 'KEEPING' =
    !player.isTitle && isKeeper ? 'KEEPING' : 'BOWLING';

  const secondaryValue =
    !player.isTitle && isKeeper ? `${player.keep} WK` : `${player.bowl} OVR`;

  const secondarySub = player.isTitle
    ? `OVR ${player.ovr} · TIER ${player.tier ?? 1}`
    : isKeeper
      ? `Bowl ${player.bowl} · OVR ${player.ovr}`
      : `OVR ${player.ovr} · ${player.os ? 'Overseas' : 'Indian'}`;

  return {
    displayName: player.name.toUpperCase(),
    subFranchiseLabel: player.titleTheme?.subFranchise
      ? `Sub-Franchise: ${player.titleTheme.subFranchise}`
      : null,
    jerseyLabel: player.isTitle ? `T-${player.tier ?? player.jersey}` : `#${player.jersey}`,
    stars: getPopularityStars(player.pop),
    battingValue: `${player.bat} OVR`,
    battingSub: player.isTitle ? player.era : `${player.era} · Pop ${player.pop}`,
    secondaryHeader,
    secondaryValue,
    secondarySub,
    roleLabel,
    deckLabel: player.isTitle
      ? 'Deck 0 · Franchise'
      : `Deck ${player.deck} · ${player.deckName}`,
    countryCode: (player.cc || 'IND').toUpperCase(),
    countryName: player.country || 'India',
    basePriceLabel: formatBasePriceShort(player.base),
    initialsBadge: buildCardInitials(player.name, player.jersey, player.isTitle),
  };
}

export function computeBiddingRateInfo(
  lot: LotView,
  teams: TeamView[],
  nowMs: number
): BiddingRateInfo {
  const leaderTeam = lot.team ? teams.find((t) => t.id === lot.team) ?? null : null;
  const multNum = lot.price / Math.max(1, lot.p.base);
  const multiplier = Number.isInteger(multNum) ? `${multNum}.00` : multNum.toFixed(2);

  const elapsedSec = Math.max(15, (nowMs - (lot.startedAt || nowMs)) / 1000);
  const bidsPerMinute =
    lot.bidCount > 0 ? ((lot.bidCount / elapsedSec) * 60).toFixed(1) : '0.0';

  return {
    currentPriceLakhs: lot.price,
    nextBidLakhs: lot.next,
    incrementLakhs: lot.p.inc,
    multiplier,
    bidCount: lot.bidCount,
    bidsPerMinute,
    leaderTeam,
  };
}
