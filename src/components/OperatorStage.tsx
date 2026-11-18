import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Crown,
  Gavel,
  LayoutList,
  ListPlus,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Shuffle,
  Sparkles,
  Terminal,
  Trash2,
  Tv,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {
  AuctionViewModel,
  CategoryFilter,
  CommandBody,
  LotCategory,
  Player,
  PlayerSubCategory,
} from '../auction/types.ts';
import {
  CAPPED_SUBCATEGORIES,
  formatCategoryFilterLabel,
  formatCurrency,
  formatLakhs,
  formatPlayerCardMeta,
  getPlayerSubCategory,
  matchesCategoryFilter,
  UNCAPPED_SUBCATEGORIES,
} from '../auction/engine.ts';
import { PlayerPortrait } from './PlayerPortrait.tsx';
import { TeamLogoBadge } from './TeamLogoBadge.tsx';
import { useAuctionAudioCues } from '../hooks/useAuctionAudioCues.ts';
import { useAudioSettings } from '../contexts/AudioSettingsContext.tsx';

interface OperatorStageProps {
  vm: AuctionViewModel;
  players: Player[];
  busy: boolean;
  onSend: (cmd: CommandBody) => Promise<boolean>;
  onNavigateArena: () => void;
}

const CATEGORY_BADGE: Record<LotCategory, { label: string; time: string; cls: string }> = {
  TITLE: {
    label: 'FRANCHISE TITLE',
    time: '3:00',
    cls: 'bg-[#fdb813]/20 text-[#fdb813] border-[#fdb813]/50',
  },
  MAVERICK: {
    label: 'MAVERICK',
    time: '5:00',
    cls: 'bg-[#9b7bf0]/20 text-[#e6defe] border-[#9b7bf0]/50',
  },
  CAPPED: {
    label: 'CAPPED',
    time: '3:00',
    cls: 'bg-[#4f8ef7]/20 text-[#a8c7ff] border-[#4f8ef7]/50',
  },
  UNCAPPED: {
    label: 'UNCAPPED',
    time: '2:00',
    cls: 'bg-[#00a572]/20 text-[#4edea3] border-[#4edea3]/50',
  },
};

function formatCountdown(sec: number): string {
  const clamped = Math.max(0, Math.floor(sec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function OperatorStage({
  vm,
  players,
  busy,
  onSend,
  onNavigateArena,
}: OperatorStageProps) {
  const [catFilter, setCatFilter] = useState<CategoryFilter | 'UNSOLD'>('ALL');
  const [poolQuery, setPoolQuery] = useState('');
  const [listsModalOpen, setListsModalOpen] = useState(false);
  const { muted, toggleMuted } = useAudioSettings();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const offset = vm.serverNow ? Date.now() - vm.serverNow : 0;
    const id = window.setInterval(() => {
      setNowMs(Date.now() - offset);
    }, 250);
    return () => window.clearInterval(id);
  }, [vm.serverNow, vm.seq]);

  const lot = vm.lot;
  const leader = lot?.team ? vm.teams.find((t) => t.id === lot.team) ?? null : null;
  const remainingSec = lot ? Math.max(0, Math.ceil((lot.expiresAt - nowMs) / 1000)) : 0;
  useAuctionAudioCues(vm, remainingSec, !muted);
  const upNextSet = useMemo(() => new Set(vm.upNext.map((p) => p.id)), [vm.upNext]);
  const hasFranchiseLists = vm.franchiseLists.some((fl) => fl.players.length > 0);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter | 'UNSOLD', number> = {
      ALL: 0,
      TITLE: 0,
      MAVERICK: 0,
      CAPPED: 0,
      UNCAPPED: 0,
      CAPPED_BAT: 0,
      CAPPED_BOWL: 0,
      CAPPED_AR: 0,
      CAPPED_WK: 0,
      UNCAPPED_BAT: 0,
      UNCAPPED_BOWL: 0,
      UNCAPPED_AR: 0,
      UNCAPPED_WK: 0,
      UNSOLD: 0,
    };
    for (const p of players) {
      const st = vm.status[p.id];
      if (st === 'unsold') {
        counts.UNSOLD++;
        continue;
      }
      if (st === 'sold' || lot?.p.id === p.id) continue;
      counts.ALL++;
      counts[p.category]++;
      const subCat = getPlayerSubCategory(p);
      if (subCat) {
        counts[subCat]++;
      }
    }
    return counts;
  }, [players, vm.status, lot?.p.id]);

  const activeCappedFilter: CategoryFilter | null =
    catFilter === 'CAPPED' || catFilter.startsWith('CAPPED_')
      ? (catFilter as CategoryFilter)
      : null;
  const activeUncappedFilter: CategoryFilter | null =
    catFilter === 'UNCAPPED' || catFilter.startsWith('UNCAPPED_')
      ? (catFilter as CategoryFilter)
      : null;
  const isCappedView = activeCappedFilter !== null;
  const isUncappedView = activeUncappedFilter !== null;
  const showSubCategories = catFilter === 'ALL' || isCappedView || isUncappedView;
  const activeSubCategory: PlayerSubCategory | null =
    catFilter.startsWith('CAPPED_') || catFilter.startsWith('UNCAPPED_')
      ? (catFilter as PlayerSubCategory)
      : null;

  const filteredPool = useMemo(() => {
    const q = poolQuery.trim().toLowerCase();
    return players
      .filter((p) => {
        const st = vm.status[p.id];
        if (catFilter === 'UNSOLD') {
          if (st !== 'unsold') return false;
        } else {
          if (st || lot?.p.id === p.id) return false;
          if (!matchesCategoryFilter(p, catFilter)) return false;
        }
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.deckName.toLowerCase().includes(q) ||
          String(p.jersey).includes(q)
        );
      })
      .slice(0, 60);
  }, [players, vm.status, lot?.p.id, catFilter, poolQuery]);

  const canReturnUncapped =
    !lot && vm.counts.playersLeft === 0 && vm.counts.uncappedUnsold > 0 && !busy;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#141026]">
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT & CENTER: COMPACT UP-NEXT QUEUE + ENLARGED LOT SELECTION POOL */}
        <section className="flex-1 flex flex-col h-full overflow-hidden p-2.5 gap-2 min-w-0">
          {/* COMPACT 3-SLOT UP-NEXT QUEUE */}
          <div className="bg-[#1c192f] border border-[#504533] rounded-lg px-3 py-2 shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-1.5 pb-1.5 border-b border-[#2b273e]">
              <div className="flex items-center gap-2 flex-wrap">
                <ListPlus className="w-3.5 h-3.5 text-[#fdb813]" />
                <h1 className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe]">
                  Up Next Queue
                </h1>
                <span className="px-1.5 py-0.5 rounded bg-[#201d33] border border-[#504533] font-[JetBrains_Mono] text-[10px] text-[#ffdb9f]">
                  {vm.upNext.length}/3
                </span>
                {vm.mixedActive && (
                  <span className="px-1.5 py-0.5 rounded bg-[#00a572]/20 border border-[#4edea3]/40 font-[JetBrains_Mono] text-[9px] text-[#4edea3] font-bold">
                    MIX ACTIVE
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  disabled={Boolean(lot) || busy}
                  onClick={() => onSend({ type: 'mix_match' })}
                  data-testid="mix-match-btn"
                  className="px-2 py-1 rounded bg-[#fdb813] hover:bg-[#ffbb1e] text-[#271900] font-[JetBrains_Mono] text-[10px] font-extrabold flex items-center gap-1 disabled:opacity-40 whitespace-nowrap"
                  title="Interleave Mavericks, Capped, and Uncapped players + generate a balanced scouting list for each of the 11 franchises"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Mix &amp; Match Pool + Lists</span>
                </button>

                {hasFranchiseLists && (
                  <button
                    type="button"
                    onClick={() => setListsModalOpen(true)}
                    data-testid="view-franchise-lists-btn"
                    className="px-2 py-1 rounded bg-[#201d33] border border-[#4edea3]/60 hover:bg-[#00a572]/20 text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 whitespace-nowrap"
                  >
                    <LayoutList className="w-3 h-3" />
                    <span>Franchise Lists (11)</span>
                  </button>
                )}

                <span className="font-[JetBrains_Mono] text-[9px] text-[#9d8f79] ml-0.5">
                  FILL 3:
                </span>
                {(
                  [
                    ['TITLE', 'Titles (3m)'],
                    ['MAVERICK', 'Mav (5m)'],
                    ['CAPPED', 'Cap (3m)'],
                    ['UNCAPPED', 'Uncap (2m)'],
                  ] as const
                ).map(([cat, label]) => (
                  <button
                    key={cat}
                    type="button"
                    disabled={busy}
                    onClick={() => onSend({ type: 'queue_fill', category: cat })}
                    className="px-1.5 py-0.5 rounded bg-[#201d33] border border-[#504533] hover:border-[#fdb813] text-[#d5c4ac] hover:text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {label}
                  </button>
                ))}
                {vm.upNext.length > 0 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSend({ type: 'queue_clear' })}
                    className="px-1.5 py-0.5 rounded border border-[#ffb4ab]/40 text-[#ffb4ab] hover:bg-[#93000a]/30 font-[JetBrains_Mono] text-[10px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1.5" data-testid="up-next-slots">
              {[0, 1, 2].map((slotIdx) => {
                const queued = vm.upNext[slotIdx];
                if (!queued) {
                  return (
                    <div
                      key={slotIdx}
                      className="rounded border border-dashed border-[#504533]/80 bg-[#141026]/55 px-2.5 py-1.5 flex items-center justify-between gap-2 min-h-[40px]"
                    >
                      <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] uppercase">
                        Slot {slotIdx + 1} · Empty
                      </span>
                      <span className="font-[JetBrains_Mono] text-[9px] text-[#9d8f79]/75 truncate">
                        Queue below or Mix
                      </span>
                    </div>
                  );
                }
                const badge = CATEGORY_BADGE[queued.category];
                return (
                  <div
                    key={queued.id}
                    className={`rounded border px-2 py-1.5 flex items-center justify-between gap-2 relative min-h-[40px] ${
                      slotIdx === 0
                        ? 'bg-[#201d33] border-[#fdb813]/70'
                        : 'bg-[#141026] border-[#504533]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PlayerPortrait
                        player={queued}
                        size="sm"
                        className="w-8 h-8 rounded border border-[#504533] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-[JetBrains_Mono] text-[9px] font-bold text-[#fdb813]">
                            #{slotIdx + 1}
                          </span>
                          <span className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] truncate">
                            {queued.name}
                          </span>
                          <span className={`px-1 rounded border font-[JetBrains_Mono] text-[8px] shrink-0 ${badge.cls}`}>
                            {badge.time}
                          </span>
                        </div>
                        <div className="font-[JetBrains_Mono] text-[9px] text-[#4edea3] truncate">
                          {formatPlayerCardMeta(queued)} · {formatCurrency(queued.base)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onSend({ type: 'queue_remove', pid: queued.id })}
                      aria-label={`Remove ${queued.name} from Up Next queue`}
                      className="p-0.5 rounded text-[#9d8f79] hover:text-[#ffb4ab] hover:bg-[#93000a]/30 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-1.5 pt-1.5 border-t border-[#2b273e] flex items-center justify-between flex-wrap gap-2">
              <span className="font-[JetBrains_Mono] text-[10px] text-[#d5c4ac]">
                Titles Low→High (LSG→DCH) ·{' '}
                <button
                  type="button"
                  onClick={onNavigateArena}
                  className="text-[#fdb813] underline font-bold hover:text-[#ffdb9f]"
                >
                  Arena Dashboard
                </button>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={!canReturnUncapped}
                  onClick={() => onSend({ type: 'return_uncapped' })}
                  data-testid="return-uncapped-btn"
                  title={
                    vm.counts.playersLeft > 0
                      ? `Use all ${vm.counts.playersLeft} pending players before returning unsold uncapped players`
                      : 'Return unsold uncapped players to the active pool'
                  }
                  className="px-2.5 py-1 rounded bg-[#201d33] border border-[#4edea3]/50 hover:bg-[#00a572]/20 text-[#4edea3] font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    Return Uncapped ({vm.counts.uncappedUnsold})
                    {vm.counts.playersLeft > 0 ? ` · ${vm.counts.playersLeft} left` : ''}
                  </span>
                </button>

                {vm.unsold.length > 0 && (
                  <button
                    type="button"
                    disabled={Boolean(lot) || busy}
                    onClick={() => onSend({ type: 'accel' })}
                    className="px-2.5 py-1 rounded bg-[#201d33] border border-[#504533] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1 disabled:opacity-40"
                  >
                    <RotateCcw className="w-3 h-3 text-[#fdb813]" />
                    <span>Re-Queue Unsold ({vm.unsold.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={Boolean(lot) || (vm.counts.left === 0 && vm.unsold.length === 0) || busy}
                  onClick={() => onSend({ type: 'next' })}
                  data-testid="send-next-lot-btn"
                  className="px-3.5 py-1 rounded bg-[#00a572] hover:bg-[#00a572]/90 text-[#002113] border border-[#4edea3] disabled:opacity-40 disabled:cursor-not-allowed font-[JetBrains_Mono] text-[11px] font-extrabold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>
                    {lot
                      ? 'Lot Live in Arena'
                      : vm.upNext[0]
                        ? `Send ${vm.upNext[0].name} (N)`
                        : 'Send Next Lot to Arena (N)'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ENLARGED LOT SELECTION POOL BROWSER */}
          <div className="flex-1 bg-[#1c192f] border border-[#504533] rounded-lg flex flex-col min-h-0 overflow-hidden">
            <div className="px-3 py-2 border-b border-[#36324a] flex items-center justify-between flex-wrap gap-2 shrink-0 bg-[#201d33]">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    ['ALL', `All (${categoryCounts.ALL})`, catFilter === 'ALL'],
                    ['TITLE', `Titles Low→High (${categoryCounts.TITLE})`, catFilter === 'TITLE'],
                    ['MAVERICK', `Mavericks 5m (${categoryCounts.MAVERICK})`, catFilter === 'MAVERICK'],
                    ['CAPPED', `Capped 3m (${categoryCounts.CAPPED})`, isCappedView],
                    ['UNCAPPED', `Uncapped 2m (${categoryCounts.UNCAPPED})`, isUncappedView],
                    ['UNSOLD', `Unsold (${categoryCounts.UNSOLD})`, catFilter === 'UNSOLD'],
                  ] as const
                ).map(([id, label, active]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCatFilter(id)}
                    className={`px-2.5 py-1 rounded-md font-[JetBrains_Mono] text-[11px] font-semibold border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#fdb813] text-[#271900] border-[#fdb813]'
                        : 'bg-[#141026] text-[#d5c4ac] border-[#504533] hover:border-[#9d8f79] hover:text-[#e6defe]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="relative w-52 xl:w-64 shrink-0">
                <Search className="w-3.5 h-3.5 text-[#9d8f79] absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  value={poolQuery}
                  onChange={(e) => setPoolQuery(e.target.value)}
                  placeholder="Filter name, #jersey, or role..."
                  aria-label="Filter auction pool"
                  className="w-full bg-[#141026] border border-[#504533] rounded-md pl-8 pr-2.5 py-1 text-xs text-[#e6defe] placeholder:text-[#9d8f79] font-[JetBrains_Mono] focus:outline-none focus:border-[#fdb813]"
                />
              </div>
            </div>

            {showSubCategories && (
              <div
                className="px-3 py-1.5 border-b border-[#36324a] bg-[#161229] flex flex-col gap-1.5 shrink-0"
                data-testid="role-subcategory-bar"
              >
                {(catFilter === 'ALL' || isCappedView) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-[JetBrains_Mono] text-[10px] font-bold uppercase tracking-wider text-[#a8c7ff] w-[96px] shrink-0">
                      Capped · 3m
                    </span>
                    {CAPPED_SUBCATEGORIES.map((sub) => {
                      const count = categoryCounts[sub.id];
                      const active = catFilter === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          data-testid={`subcat-${sub.id}`}
                          onClick={() => setCatFilter(active ? 'CAPPED' : sub.id)}
                          className={`px-2 py-0.5 rounded border font-[JetBrains_Mono] text-[10px] font-semibold transition-colors whitespace-nowrap ${
                            active
                              ? 'bg-[#4f8ef7] text-[#091529] border-[#a8c7ff] font-bold'
                              : count === 0
                                ? 'bg-[#141026]/50 text-[#9d8f79]/60 border-[#36324a]'
                                : 'bg-[#141026] text-[#a8c7ff] border-[#4f8ef7]/40 hover:border-[#a8c7ff] hover:bg-[#4f8ef7]/15'
                          }`}
                        >
                          {sub.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {(catFilter === 'ALL' || isUncappedView) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-[JetBrains_Mono] text-[10px] font-bold uppercase tracking-wider text-[#4edea3] w-[96px] shrink-0">
                      Uncapped · 2m
                    </span>
                    {UNCAPPED_SUBCATEGORIES.map((sub) => {
                      const count = categoryCounts[sub.id];
                      const active = catFilter === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          data-testid={`subcat-${sub.id}`}
                          onClick={() => setCatFilter(active ? 'UNCAPPED' : sub.id)}
                          className={`px-2 py-0.5 rounded border font-[JetBrains_Mono] text-[10px] font-semibold transition-colors whitespace-nowrap ${
                            active
                              ? 'bg-[#4edea3] text-[#002113] border-[#4edea3] font-bold'
                              : count === 0
                                ? 'bg-[#141026]/50 text-[#9d8f79]/60 border-[#36324a]'
                                : 'bg-[#141026] text-[#4edea3] border-[#4edea3]/40 hover:border-[#4edea3] hover:bg-[#00a572]/20'
                          }`}
                        >
                          {sub.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {(activeCappedFilter || activeUncappedFilter) && (
                  <div className="flex items-center justify-between gap-2 text-[10px] font-[JetBrains_Mono] text-[#d5c4ac] pt-1 border-t border-[#2b273e]/70 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span>
                        Showing{' '}
                        <strong className="text-[#fdb813]">
                          {formatCategoryFilterLabel(activeCappedFilter ?? activeUncappedFilter!)}
                        </strong>{' '}
                        ({categoryCounts[(activeCappedFilter ?? activeUncappedFilter)!]} pending)
                      </span>
                      {activeSubCategory && (
                        <button
                          type="button"
                          onClick={() => setCatFilter('ALL')}
                          className="text-[#9d8f79] hover:text-[#ffdb9f] underline"
                        >
                          Show All Capped &amp; Uncapped
                        </button>
                      )}
                    </div>

                    {(() => {
                      const targetCat = (activeCappedFilter ?? activeUncappedFilter)!;
                      const pendingCount = categoryCounts[targetCat];
                      if (pendingCount <= 0) return null;
                      return (
                        <button
                          type="button"
                          disabled={busy}
                          data-testid="queue-selected-category-btn"
                          onClick={() => onSend({ type: 'queue_fill', category: targetCat })}
                          className={`px-2.5 py-0.5 rounded border font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 whitespace-nowrap disabled:opacity-40 ${
                            activeCappedFilter
                              ? 'bg-[#4f8ef7]/20 hover:bg-[#4f8ef7]/35 border-[#4f8ef7]/60 text-[#a8c7ff]'
                              : 'bg-[#00a572]/25 hover:bg-[#00a572]/40 border-[#4edea3]/60 text-[#4edea3]'
                          }`}
                        >
                          <ListPlus className="w-3 h-3" />
                          <span>
                            Queue {Math.min(3, pendingCount)} {formatCategoryFilterLabel(targetCat)}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scroll p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 content-start">
              {filteredPool.length === 0 ? (
                <div className="col-span-full p-8 text-center font-[JetBrains_Mono] text-xs text-[#9d8f79]">
                  {catFilter === 'UNSOLD'
                    ? 'No unsold lots right now.'
                    : 'No pending lots match the selected category/search.'}
                </div>
              ) : (
                filteredPool.map((p) => {
                  const badge = CATEGORY_BADGE[p.category];
                  const isQueued = upNextSet.has(p.id);
                  const isUnsold = vm.status[p.id] === 'unsold';
                  return (
                    <div
                      key={p.id}
                      className="rounded-lg border border-[#3e3857] bg-[#141026] hover:border-[#fdb813]/70 hover:bg-[#191430] p-3 flex flex-col justify-between gap-2.5 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <PlayerPortrait
                            player={p}
                            size="sm"
                            className="w-12 h-12 rounded-md border border-[#504533] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                                {p.id}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded border font-[JetBrains_Mono] text-[9px] font-bold leading-none ${badge.cls}`}
                              >
                                {badge.label} · {badge.time}
                              </span>
                            </div>
                            <div className="font-[Space_Grotesk] text-[15px] font-bold text-[#e6defe] truncate mt-1 leading-tight">
                              {p.name}
                            </div>
                            <div className="font-[JetBrains_Mono] text-[11px] text-[#4edea3] truncate mt-0.5">
                              {formatPlayerCardMeta(p)} · {p.cc} · OVR {p.ovr}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#201d33] border border-[#fdb813]/40 font-[JetBrains_Mono] text-xs font-extrabold text-[#fdb813] shrink-0">
                          {formatCurrency(p.base)}
                        </span>
                      </div>

                      {!isUnsold && (
                        <div className="flex items-center gap-2 pt-2 border-t border-[#2b273e]/80">
                          <button
                            type="button"
                            disabled={isQueued || vm.upNext.length >= 3 || busy}
                            onClick={() => onSend({ type: 'queue_add', pid: p.id })}
                            className={`flex-1 py-1.5 px-2.5 rounded-md border font-[JetBrains_Mono] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              isQueued
                                ? 'bg-[#00a572]/15 border-[#4edea3]/50 text-[#4edea3]'
                                : 'bg-[#1c2538] border-[#4edea3]/45 hover:bg-[#00a572]/20 hover:border-[#4edea3] text-[#4edea3]'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isQueued ? 'Queued' : 'Queue'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(lot) || busy}
                            onClick={() => onSend({ type: 'next', pid: p.id })}
                            className="flex-[1.35] py-1.5 px-3 rounded-md bg-[#fdb813] hover:bg-[#ffca45] text-[#271900] font-[JetBrains_Mono] text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send to Arena</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* RIGHT SIDEBAR: LIVE ARENA MONITOR & HOST CONTROLS */}
        <aside className="w-[320px] xl:w-[350px] border-l border-[#36324a] bg-[#0e0b21] flex flex-col h-full shrink-0 hidden lg:flex">
          <div className="p-2.5 border-b border-[#36324a] bg-[#1c192f] shrink-0">
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-[#fdb813]" />
                <span>Live Arena Floor</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMuted}
                  className={`px-2 py-0.5 rounded border font-[JetBrains_Mono] text-[10px] flex items-center gap-1 ${
                    !muted
                      ? 'bg-[#201d33] border-[#4edea3]/50 text-[#4edea3]'
                      : 'bg-[#141026] border-[#504533] text-[#9d8f79]'
                  }`}
                  title="Toggle global audio cues"
                >
                  {!muted ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  <span>{!muted ? 'SFX' : 'MUTE'}</span>
                </button>
                {lot ? (
                  <span className="px-2 py-0.5 rounded bg-[#00a572]/20 border border-[#4edea3]/50 font-[JetBrains_Mono] text-[10px] font-bold text-[#4edea3]">
                    BIDDING LIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-[#201d33] border border-[#504533] font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                    ARENA IDLE
                  </span>
                )}
              </div>
            </div>

            {lot ? (
              <div className="bg-[#141026] border border-[#fdb813]/60 rounded p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="font-[JetBrains_Mono] text-[10px] text-[#fdb813] font-bold">
                      {lot.p.id} · {CATEGORY_BADGE[lot.category].label}
                    </div>
                    <div className="font-[Space_Grotesk] text-lg font-bold text-[#e6defe] truncate">
                      {lot.p.name}
                    </div>
                    <div className="font-[JetBrains_Mono] text-[10px] text-[#4edea3]">
                      {formatPlayerCardMeta(lot.p)}
                    </div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded border font-[JetBrains_Mono] text-sm font-bold flex items-center gap-1.5 shrink-0 ${
                      remainingSec <= 15
                        ? 'bg-[#93000a]/60 border-[#ffb4ab] text-[#ffb4ab] animate-pulse'
                        : 'bg-[#201d33] border-[#504533] text-[#4edea3]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatCountdown(remainingSec)}</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between bg-[#201d33] px-3 py-2 rounded border border-[#504533]">
                  <div>
                    <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] block">
                      {leader ? 'CURRENT BID' : 'OPENING BASE'}
                    </span>
                    <span className="font-[JetBrains_Mono] text-2xl font-bold text-[#fdb813]">
                      ₹ {formatLakhs(lot.price)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] block">
                      HIGHEST TEAM
                    </span>
                    <span className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe]">
                      {leader ? `${leader.short} (${leader.paddle})` : 'Awaiting Bid'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSend({ type: 'extend', sec: 30 })}
                    className="px-2.5 py-1.5 rounded bg-[#201d33] border border-[#504533] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[11px] font-semibold flex items-center justify-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>+30s Clock</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSend({ type: 'hammer' })}
                    className="px-2.5 py-1.5 rounded bg-[#00a572]/25 border border-[#4edea3]/60 hover:bg-[#00a572]/40 text-[#4edea3] font-[JetBrains_Mono] text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>{leader ? 'Hammer Sold Now' : 'Pass Unsold'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#141026] border border-[#504533] rounded p-3 text-center space-y-2">
                {vm.last ? (
                  <div
                    className={`rounded border px-2.5 py-2 text-left font-[JetBrains_Mono] text-[11px] ${
                      vm.last.t === 'SOLD'
                        ? 'bg-[#00a572]/15 border-[#4edea3]/50 text-[#4edea3]'
                        : 'bg-[#93000a]/25 border-[#ffb4ab]/40 text-[#ffb4ab]'
                    }`}
                  >
                    <div className="text-[9px] uppercase tracking-wider opacity-85">
                      LAST LOT {vm.last.t}
                    </div>
                    <div className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] truncate">
                      {vm.last.p.name} ({formatPlayerCardMeta(vm.last.p)})
                    </div>
                    <div className="text-[11px] font-bold">
                      {vm.last.t === 'SOLD'
                        ? `${vm.last.teamShort ?? vm.last.team} · ${formatCurrency(vm.last.price ?? 0)}`
                        : 'Returned to Unsold Pool'}
                    </div>
                  </div>
                ) : (
                  <Sparkles className="w-5 h-5 text-[#fdb813] mx-auto" />
                )}
                <div className="text-xs text-[#d5c4ac] font-[JetBrains_Mono]">
                  Click &ldquo;Mix &amp; Match Pool + Lists&rdquo; or fill 3 slots, then release the next lot.
                </div>
                <button
                  type="button"
                  onClick={onNavigateArena}
                  className="w-full py-1.5 rounded bg-[#fdb813] text-[#271900] font-[JetBrains_Mono] text-xs font-bold hover:bg-[#ffbb1e]"
                >
                  Open Arena Team–Players Dashboard
                </button>
              </div>
            )}
          </div>

          <div className="p-3 border-b border-[#36324a] bg-[#141026] space-y-2 shrink-0 font-[JetBrains_Mono] text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#d5c4ac] flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-[#fdb813]" />
                <span>Franchise Titles Sold:</span>
              </span>
              <span className="text-[#fdb813] font-bold">
                {vm.counts.titlesSold} / {vm.counts.titlesTotal}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#d5c4ac]">Players Sold / Unsold:</span>
              <span className="text-[#4edea3] font-bold">
                {vm.counts.sold} / {vm.counts.playersTotal} ({vm.counts.unsold} Unsold)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#d5c4ac]">Overseas Slots Left (11 × 8):</span>
              <span className="text-[#e6defe] font-bold">
                {Math.max(0, vm.teams.length * vm.cfg.os - vm.teams.reduce((s, t) => s + t.os, 0))}{' '}
                <span className="text-[#9d8f79]">/ {vm.teams.length * vm.cfg.os}</span>
              </span>
            </div>

            {!vm.feasibility.ok && vm.feasibility.msg && (
              <div
                className="p-2 rounded bg-[#93000a]/35 border border-[#ffb4ab]/50 text-[#ffb4ab] text-[10px] flex items-start gap-1.5"
                role="alert"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{vm.feasibility.msg}</span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col bg-[#0e0b21] min-h-0">
            <div className="px-3 py-1.5 bg-[#1c192f] border-b border-[#36324a] flex items-center justify-between shrink-0">
              <span className="font-[JetBrains_Mono] text-[10px] text-[#d5c4ac] uppercase flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-[#4edea3]" />
                <span>Host &amp; Bidder Audit Log</span>
              </span>
              <span className="font-[JetBrains_Mono] text-[9px] text-[#9d8f79]">
                SEQ #{vm.seq}
              </span>
            </div>
            <div
              className="flex-1 p-2.5 overflow-y-auto custom-scroll font-[JetBrains_Mono] text-[10px] space-y-1.5"
              data-testid="activity-log"
            >
              {vm.log.length === 0 ? (
                <div className="text-[#9d8f79]">
                  Nothing yet. Click &ldquo;Mix &amp; Match Pool + Lists&rdquo; or fill 3 slots to start.
                </div>
              ) : (
                vm.log.map((entry, idx) => (
                  <div
                    key={`${entry.ts}-${idx}`}
                    className={`flex items-start gap-1.5 ${
                      entry.kind === 'SOLD'
                        ? 'text-[#4edea3]'
                        : entry.kind === 'UNSOLD'
                          ? 'text-[#ffb4ab]'
                          : entry.kind === 'BID'
                            ? 'text-[#fdb813]'
                            : 'text-[#d5c4ac]'
                    }`}
                  >
                    <span className="text-[#9d8f79] shrink-0">[{entry.kind}]</span>
                    <span>{entry.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* MIX & MATCH 11-FRANCHISE SCOUTING LISTS MODAL */}
      {listsModalOpen && (
        <div
          className="fixed inset-0 bg-[#0e0b21]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="franchise-lists-title"
          data-testid="franchise-lists-modal"
        >
          <div className="bg-[#1c192f] border-2 border-[#4edea3]/60 rounded-lg max-w-6xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3 bg-[#0e0b21] border-b border-[#504533] flex items-center justify-between shrink-0">
              <div>
                <h2
                  id="franchise-lists-title"
                  className="font-[Space_Grotesk] text-lg font-bold text-[#e6defe] flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4 text-[#fdb813]" />
                  <span>Generated Mix &amp; Match Lists ({vm.franchiseLists.length} Franchises)</span>
                </h2>
                <p className="font-[JetBrains_Mono] text-[11px] text-[#9d8f79]">
                  Balanced Mavericks, Capped, and Uncapped player targets per club team (Name · #Jersey · Role)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setListsModalOpen(false)}
                aria-label="Close franchise mix lists"
                className="p-1.5 rounded text-[#9d8f79] hover:text-[#e6defe] hover:bg-[#201d33]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 content-start">
              {vm.franchiseLists.map((fl) => {
                const tm = vm.teams.find((t) => t.id === fl.teamId);
                return (
                <div
                  key={fl.teamId}
                  className="bg-[#141026] border border-[#504533] rounded-lg p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[#2b273e] pb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {tm && <TeamLogoBadge team={tm} size="xs" />}
                      <span className="font-[Space_Grotesk] text-sm font-bold text-[#fdb813] truncate">
                        {fl.teamShort} · {fl.teamName}
                      </span>
                    </div>
                    <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] shrink-0">
                      {fl.paddle}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scroll pr-1">
                    {fl.players.map((p) => (
                      <div
                        key={p.id}
                        className="bg-[#1c192f] border border-[#36324a] rounded px-2 py-1 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] truncate">
                            {p.name}
                          </div>
                          <div className="font-[JetBrains_Mono] text-[10px] text-[#4edea3] truncate">
                            {formatPlayerCardMeta(p)}
                          </div>
                        </div>
                        <span className="font-[JetBrains_Mono] text-[10px] text-[#ffdb9f] shrink-0">
                          {formatCurrency(p.base)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
