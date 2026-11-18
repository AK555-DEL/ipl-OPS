import type { AuctionViewModel, LotCategory, Player, TeamView } from '../auction/types.ts';
import { formatCurrency, formatPlayerCardMeta } from '../auction/engine.ts';

export type BidderPlayerFilter = 'all' | 'live' | 'sold' | 'unsold' | 'pending';

export type BidderPlayerStatus = 'live' | 'sold' | 'unsold' | 'queued' | 'pending';

export interface BidderPlayerRow {
  id: string;
  name: string;
  jersey: number;
  role: string;
  category: LotCategory;
  base: number;
  ovr: number;
  os: boolean;
  isTitle: boolean;
  status: BidderPlayerStatus;
  ownerShort: string | null;
  ownerName: string | null;
  ownerColor: string | null;
  soldPrice: number | null;
  meta: string;
}

export interface BidderHistoryItem {
  id: string;
  pid: string | null;
  lotName: string;
  teamId: string;
  teamShort: string;
  teamName: string;
  teamColor: string;
  price: number;
  ts: number;
  isCurrentLot: boolean;
}

export function buildBidderPlayerRows(
  players: Player[],
  vm: AuctionViewModel
): BidderPlayerRow[] {
  const ownerMap = new Map<string, { team: TeamView; price: number }>();
  for (const t of vm.teams) {
    if (t.titleId) {
      ownerMap.set(t.titleId, { team: t, price: t.titlePrice });
    }
    for (const sp of t.squad) {
      ownerMap.set(sp.id, { team: t, price: sp.price });
    }
  }

  const queuedIds = new Set(vm.upNext.map((p) => p.id));
  const liveId = vm.lot?.p.id ?? null;

  const rows: BidderPlayerRow[] = players.map((p) => {
    const owned = ownerMap.get(p.id);
    let status: BidderPlayerStatus = 'pending';
    if (liveId === p.id) {
      status = 'live';
    } else if (vm.status[p.id] === 'sold' || owned) {
      status = 'sold';
    } else if (vm.status[p.id] === 'unsold') {
      status = 'unsold';
    } else if (queuedIds.has(p.id)) {
      status = 'queued';
    }

    return {
      id: p.id,
      name: p.name,
      jersey: p.jersey,
      role: p.role,
      category: p.category,
      base: p.base,
      ovr: p.ovr,
      os: p.os,
      isTitle: Boolean(p.isTitle),
      status,
      ownerShort: owned?.team.short ?? null,
      ownerName: owned?.team.name ?? null,
      ownerColor: owned?.team.c ?? null,
      soldPrice: owned ? owned.price : null,
      meta: formatPlayerCardMeta(p),
    };
  });

  // Pin active live lot at top, then queued lots, preserving catalog order within each group
  const priority: Record<BidderPlayerStatus, number> = {
    live: 0,
    queued: 1,
    pending: 2,
    sold: 3,
    unsold: 4,
  };

  return rows
    .map((row, idx) => ({ row, idx }))
    .sort((a, b) => priority[a.row.status] - priority[b.row.status] || a.idx - b.idx)
    .map((x) => x.row);
}

export function filterBidderPlayerRows(
  rows: BidderPlayerRow[],
  query: string,
  filter: BidderPlayerFilter
): BidderPlayerRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter === 'live' && row.status !== 'live') return false;
    if (filter === 'sold' && row.status !== 'sold') return false;
    if (filter === 'unsold' && row.status !== 'unsold') return false;
    if (filter === 'pending' && row.status !== 'pending' && row.status !== 'queued') return false;
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.id.toLowerCase().includes(q) ||
      row.role.toLowerCase().includes(q) ||
      row.category.toLowerCase().includes(q) ||
      (row.ownerShort ? row.ownerShort.toLowerCase().includes(q) : false) ||
      (row.ownerName ? row.ownerName.toLowerCase().includes(q) : false)
    );
  });
}

export function buildBidderHistoryFeed(vm: AuctionViewModel): BidderHistoryItem[] {
  const activeLotId = vm.lot?.p.id ?? null;
  return vm.recentBids.map((entry) => ({
    id: entry.id,
    pid: entry.pid,
    lotName: entry.lotName,
    teamId: entry.team,
    teamShort: entry.teamShort,
    teamName: entry.teamName,
    teamColor: entry.teamColor,
    price: entry.price,
    ts: entry.ts,
    isCurrentLot: Boolean(activeLotId && entry.pid === activeLotId),
  }));
}

export function getUndoPreview(vm: AuctionViewModel): { canUndo: boolean; label: string } {
  if (!vm.canUndo) {
    return { canUndo: false, label: 'Nothing to undo' };
  }
  const latest = vm.log[0];
  if (!latest) {
    return { canUndo: true, label: 'Revert last auction action' };
  }
  return { canUndo: true, label: latest.text };
}

export function formatHistoryPrice(lakhs: number): string {
  return formatCurrency(lakhs);
}
