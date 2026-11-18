import { useMemo, useState } from 'react';
import { Info, Lock, Search } from 'lucide-react';
import type { AuctionViewModel, CommandBody, TeamView } from '../auction/types.ts';
import { formatCurrency, formatPlayerCardMeta, formatRole } from '../auction/engine.ts';
import { getInitials } from '../utils/playerMedia.ts';
import { PlayerTeamLogoPill, TeamLogoBadge } from './TeamLogoBadge.tsx';

interface OperatorSquadsProps {
  vm: AuctionViewModel;
  busy: boolean;
  onSend: (cmd: CommandBody) => Promise<boolean>;
}

export function OperatorSquads({ vm, busy, onSend }: OperatorSquadsProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(vm.teams[0]?.id ?? 't1');
  const [filterText, setFilterText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [pendingRelease, setPendingRelease] = useState<{
    team: TeamView;
    pid: string;
    name: string;
    price: number;
  } | null>(null);

  const selectedTeam = vm.teams.find((t) => t.id === selectedTeamId) ?? vm.teams[0];

  const rankedTeams = useMemo(
    () => [...vm.teams].sort((a, b) => b.n - a.n || b.os - a.os || a.name.localeCompare(b.name)),
    [vm.teams]
  );

  const filteredSquad = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return selectedTeam.squad.filter((p) => {
      const normalizedRole = formatRole(p.role);
      if (roleFilter !== 'ALL' && normalizedRole !== roleFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        normalizedRole.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        String(p.jersey).includes(q)
      );
    });
  }, [selectedTeam.squad, filterText, roleFilter]);

  const avgSquadUtil = useMemo(() => {
    const totalSlots = vm.teams.reduce((a, t) => a + t.n, 0);
    return ((totalSlots / (vm.teams.length * vm.cfg.max)) * 100).toFixed(1);
  }, [vm.teams, vm.cfg.max]);

  const overseasRemaining = useMemo(() => {
    const used = vm.teams.reduce((a, t) => a + t.os, 0);
    return vm.teams.length * vm.cfg.os - used;
  }, [vm.teams, vm.cfg.os]);

  const confirmRelease = async () => {
    if (!pendingRelease) return;
    const ok = await onSend({
      type: 'release',
      team: pendingRelease.team.id,
      pid: pendingRelease.pid,
    });
    if (ok) setPendingRelease(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#141026]">
      {/* FRANCHISE SELECTOR BAR */}
      <section className="w-full bg-[#1c192f] border-b border-[#504533] px-3 py-1.5 shrink-0">
        <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-11 gap-1.5">
          {vm.teams.map((t) => {
            const active = t.id === selectedTeam.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTeamId(t.id)}
                className={`flex items-center justify-between gap-1 px-2 py-1 rounded transition-colors min-w-0 ${
                  active
                    ? 'bg-[#2b273e] border-2 border-[#fdb813] text-[#fdb813] bidder-active-ring'
                    : 'bg-[#201d33] border border-[#504533] hover:border-[#9d8f79] text-[#d5c4ac]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: t.c }}
                  />
                  <span className="font-[JetBrains_Mono] text-[11px] font-bold text-[#e6defe] truncate">
                    {t.short}
                  </span>
                </div>
                <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] shrink-0">
                  {t.n}/{vm.cfg.max}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SPLIT MODULAR GRID */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden divide-x divide-[#504533] min-h-0">
        {/* PANEL A: ACTIVE SQUAD ROSTER TABLE (7 Cols) */}
        <section className="col-span-12 lg:col-span-7 flex flex-col h-full overflow-hidden bg-[#0e0b21] min-h-0">
          <div className="px-4 py-2.5 bg-[#1c192f] border-b border-[#504533] shrink-0 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <TeamLogoBadge team={selectedTeam} size="sm" className="w-9 h-9" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-[Space_Grotesk] text-lg font-bold text-[#e6defe]">
                      {selectedTeam.name}
                    </h2>
                    <span className="bg-[#36324a] text-[#d5c4ac] font-[JetBrains_Mono] text-[10px] px-1.5 py-0.5 rounded border border-[#504533] flex items-center gap-1">
                      {selectedTeam.titleId ? (
                        <>
                          <Lock className="w-3 h-3 text-[#fdb813]" />
                          <span className="text-[#fdb813] font-bold">
                            {selectedTeam.paddle} · FRANCHISE PERMANENT (LOCKED)
                          </span>
                        </>
                      ) : (
                        <span>{selectedTeam.paddle} · NO TITLE YET</span>
                      )}
                    </span>
                  </div>
                  <span className="font-[JetBrains_Mono] text-[11px] text-[#d5c4ac] flex items-center gap-2 flex-wrap">
                    <span>
                      Slots: {selectedTeam.n}/{vm.cfg.max}
                      {selectedTeam.titleId
                        ? ` · ${selectedTeam.short} (${formatCurrency(selectedTeam.titlePrice)})`
                        : ''}
                      {' '}· OS: {selectedTeam.os}/{vm.cfg.os}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded border text-[10px] font-bold ${
                        selectedTeam.bowlersNeeded === 0
                          ? 'bg-[#00a572]/20 border-[#4edea3]/50 text-[#4edea3]'
                          : 'bg-[#201d33] border-[#fdb813]/50 text-[#fdb813]'
                      }`}
                    >
                      BOWL {selectedTeam.bowlers}/{vm.cfg.minBowlers}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded border text-[10px] font-bold ${
                        selectedTeam.wicketkeepersNeeded === 0
                          ? 'bg-[#00a572]/20 border-[#4edea3]/50 text-[#4edea3]'
                          : 'bg-[#201d33] border-[#fdb813]/50 text-[#fdb813]'
                      }`}
                    >
                      WK {selectedTeam.wicketkeepers}/{vm.cfg.minWicketkeepers}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#201d33] px-3 py-1.5 rounded border border-[#504533]">
                <div className="text-right">
                  <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">SQUAD SLOTS</div>
                  <div className="font-[JetBrains_Mono] text-xs font-bold text-[#e6defe]">
                    {selectedTeam.n}/{vm.cfg.max}
                  </div>
                </div>
                <div className="h-6 w-px bg-[#504533]" />
                <div className="text-right">
                  <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">OVERSEAS</div>
                  <div className="font-[JetBrains_Mono] text-xs font-bold text-[#fdb813]">
                    {selectedTeam.os}/{vm.cfg.os}
                  </div>
                </div>
                <div className="h-6 w-px bg-[#504533]" />
                <div className="text-right">
                  <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">FRANCHISE</div>
                  <div className="font-[JetBrains_Mono] text-xs font-bold text-[#4edea3]">
                    {selectedTeam.titleSubFranchise
                      ? `${selectedTeam.short} · LSG`
                      : selectedTeam.titleId
                        ? selectedTeam.short
                        : 'PENDING'}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Role Controls */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#9d8f79] absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter roster by player, role, or country..."
                  aria-label="Filter squad roster"
                  className="w-full bg-[#141026] border border-[#504533] rounded pl-8 pr-3 py-1 text-xs text-[#e6defe] placeholder:text-[#9d8f79] font-[JetBrains_Mono] focus:outline-none focus:border-[#fdb813]"
                />
              </div>
              <div className="flex items-center gap-1 bg-[#141026] p-0.5 rounded border border-[#504533]">
                {['ALL', 'Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    className={`px-2 py-0.5 rounded font-[JetBrains_Mono] text-[10px] transition-colors whitespace-nowrap ${
                      roleFilter === role
                        ? 'bg-[#fdb813] text-[#271900] font-bold'
                        : 'text-[#d5c4ac] hover:text-[#e6defe]'
                    }`}
                  >
                    {role === 'ALL' ? 'All Roles' : role}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-2.5 py-1 bg-[#2b273e]/70 border border-[#504533] rounded text-[11px] font-[JetBrains_Mono] text-[#d5c4ac]">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#fdb813] shrink-0" />
                <span>
                  Auctioned franchise titles are permanent once sold. Releasing a player returns the lot to the pending auction pool.
                </span>
              </span>
              {selectedTeam.titleId && (
                <span
                  data-testid="title-locked-badge"
                  className="ml-2 px-2 py-0.5 rounded border border-[#fdb813]/50 bg-[#fdb813]/15 text-[#fdb813] text-[10px] font-bold flex items-center gap-1 shrink-0"
                >
                  <Lock className="w-3 h-3" />
                  <span>{selectedTeam.short} LOCKED</span>
                </span>
              )}
              {vm.lot && (
                <span className="text-[#ffb4ab] font-semibold shrink-0 ml-2">
                  Finish active lot before releasing
                </span>
              )}
            </div>
          </div>

          {/* Squad Table */}
          <div className="flex-1 overflow-y-auto custom-scroll">
            {filteredSquad.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-[Space_Grotesk] text-base text-[#e6defe] font-semibold">
                  {selectedTeam.squad.length === 0
                    ? `No auction signings yet for ${selectedTeam.name}`
                    : 'No players match the current filter'}
                </p>
                <p className="font-[JetBrains_Mono] text-xs text-[#9d8f79] mt-1">
                  {selectedTeam.squad.length === 0
                    ? selectedTeam.held > 0
                      ? `${selectedTeam.held} pre-retained slots active in MINI preset.`
                      : 'Sign players on the Stage tab to populate this roster.'
                    : 'Clear the search box or switch the role filter.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#201d33] border-b border-[#504533] z-10">
                  <tr className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] tracking-wider">
                    <th className="py-2 px-3">LOT</th>
                    <th className="py-2 px-3">PLAYER</th>
                    <th className="py-2 px-3">ROLE</th>
                    <th className="py-2 px-3">ORIGIN</th>
                    <th className="py-2 px-3 text-right">PRICE</th>
                    <th className="py-2 px-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#504533]/60 font-[JetBrains_Mono] text-xs">
                  {filteredSquad.map((player) => (
                    <tr
                      key={player.id}
                      className="hover:bg-[#1c192f] transition-colors"
                    >
                      <td className="py-2 px-3 text-[#9d8f79] text-[11px]">{player.id}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          {selectedTeam.short === 'DC' ? (
                            <PlayerTeamLogoPill teamShort={selectedTeam.short} teamName={selectedTeam.name} size="sm" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-[#2b273e] border border-[#504533] flex items-center justify-center font-bold text-[#e6defe] text-[10px] shrink-0">
                              {getInitials(player.name)}
                            </div>
                          )}
                          <div>
                            <span className="font-[Inter] font-semibold text-[#e6defe] block">
                              {player.name}
                            </span>
                            <span className="text-[10px] text-[#4edea3] block">
                              {formatPlayerCardMeta(player)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[#d5c4ac]">{formatRole(player.role)}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[10px] ${
                            player.os
                              ? 'bg-[#00a572]/20 border-[#00a572] text-[#4edea3]'
                              : 'bg-[#2b273e] border-[#504533] text-[#ffdb9f]'
                          }`}
                        >
                          {player.os ? `OVERSEAS (${player.cc})` : `INDIAN (${player.cc})`}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-[#fdb813]">
                        {formatCurrency(player.price)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          disabled={Boolean(vm.lot) || busy}
                          onClick={() =>
                            setPendingRelease({
                              team: selectedTeam,
                              pid: player.id,
                              name: player.name,
                              price: player.price,
                            })
                          }
                          className="px-2 py-0.5 border border-[#504533] rounded text-[#d5c4ac] text-[10px] hover:border-[#ffb4ab] hover:text-[#ffb4ab] hover:bg-[#93000a]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          RELEASE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* PANEL B: SQUAD & COMPOSITION RADAR (5 Cols) */}
        <section className="col-span-12 lg:col-span-5 flex flex-col h-full overflow-hidden bg-[#0e0b21] min-h-0">
          <div className="px-4 py-2.5 bg-[#1c192f] border-b border-[#504533] shrink-0 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-[Space_Grotesk] text-base font-bold text-[#e6defe]">
                  Squad &amp; Composition Radar
                </h2>
                <span className="bg-[#00a572]/20 text-[#4edea3] border border-[#4edea3]/30 px-1.5 py-0.5 rounded font-[JetBrains_Mono] text-[10px]">
                  LIVE ROSTERS
                </span>
              </div>
              <p className="font-[JetBrains_Mono] text-[11px] text-[#9d8f79]">
                Click any franchise row to inspect its squad
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#201d33] border-b border-[#504533] z-10 font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                <tr>
                  <th className="py-2 px-2.5"># FRANCHISE</th>
                  <th className="py-2 px-2.5 text-center">TITLE</th>
                  <th className="py-2 px-2.5 text-center">SLOTS</th>
                  <th className="py-2 px-2.5 text-center">BOWL / WK</th>
                  <th className="py-2 px-2.5 text-center">O/S</th>
                  <th className="py-2 px-2.5 text-center">QUOTA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#504533]/60 font-[JetBrains_Mono] text-xs">
                {rankedTeams.map((t, index) => {
                  const isSelected = t.id === selectedTeam.id;
                  const pct = Math.min(100, Math.round((t.n / Math.max(1, vm.cfg.max)) * 100));
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTeamId(t.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#fdb813]/15'
                          : 'hover:bg-[#1c192f]'
                      }`}
                    >
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[#9d8f79] w-4">{index + 1}</span>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: t.c }}
                          />
                          <div className="min-w-0">
                            <span
                              className={`font-bold block truncate ${
                                isSelected ? 'text-[#fdb813]' : 'text-[#e6defe]'
                              }`}
                            >
                              {t.short}
                            </span>
                            {t.titleSubFranchise && (
                              <span className="text-[9px] text-[#fdb813] block truncate">
                                Sub: LSG
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            t.titleId
                              ? 'bg-[#fdb813]/15 border-[#fdb813]/50 text-[#fdb813]'
                              : 'bg-[#1c192f] border-[#504533] text-[#9d8f79]'
                          }`}
                        >
                          {t.titleId ? t.short : 'NONE'}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center text-[#d5c4ac]">
                        <div>{t.n}/{vm.cfg.max}</div>
                        <div className="w-14 h-1 bg-[#36324a] rounded mx-auto mt-1 overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: t.c,
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-2.5 text-center text-[10px]">
                        <span className={t.bowlersNeeded === 0 ? 'text-[#4edea3] font-bold' : 'text-[#ffdb9f]'}>
                          {t.bowlers}/{vm.cfg.minBowlers}B
                        </span>
                        <span className="text-[#504533] mx-0.5">·</span>
                        <span className={t.wicketkeepersNeeded === 0 ? 'text-[#4edea3] font-bold' : 'text-[#ffdb9f]'}>
                          {t.wicketkeepers}/{vm.cfg.minWicketkeepers}W
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center text-[#e6defe]">
                        {t.os}/{vm.cfg.os}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${
                            t.compositionOk
                              ? 'bg-[#00a572]/20 border-[#4edea3] text-[#4edea3]'
                              : 'bg-[#ffdb9f]/15 border-[#ffdb9f]/60 text-[#ffdb9f]'
                          }`}
                        >
                          {t.compositionOk ? 'QUOTA OK' : `NEED ${t.bowlersNeeded}B/${t.wicketkeepersNeeded}W`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mini Tactical Analytics */}
          <div className="p-3 bg-[#1c192f] border-t border-[#504533] shrink-0 grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-[#201d33] rounded border border-[#504533]">
              <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                AVG SQUAD UTILIZATION
              </div>
              <div className="font-[Space_Grotesk] text-lg font-bold text-[#e6defe]">
                {avgSquadUtil}%
              </div>
              <div className="w-full h-1 bg-[#36324a] rounded mt-1 overflow-hidden">
                <div className="h-full bg-[#fdb813]" style={{ width: `${avgSquadUtil}%` }} />
              </div>
            </div>
            <div
              className="p-2.5 bg-[#201d33] rounded border border-[#504533]"
              data-testid="overseas-80-by-80"
            >
              <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                OVERSEAS SLOTS REMAINING ({vm.teams.length} × {vm.cfg.os})
              </div>
              <div className="font-[Space_Grotesk] text-lg font-bold text-[#4edea3]">
                {overseasRemaining} / {vm.teams.length * vm.cfg.os}
              </div>
              <div className="w-full h-1 bg-[#36324a] rounded mt-1 overflow-hidden">
                <div
                  className="h-full bg-[#4edea3]"
                  style={{
                    width: `${Math.round(
                      (overseasRemaining / (vm.teams.length * vm.cfg.os)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* BOTTOM TELEMETRY STRIP */}
      <footer className="h-10 bg-[#0e0b21] border-t border-[#504533] px-4 flex items-center justify-between shrink-0 font-[JetBrains_Mono] text-[11px] text-[#d5c4ac]">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span>
            TITLES SOLD:{' '}
            <strong className="text-[#fdb813]">
              {vm.counts.titlesSold} / {vm.counts.titlesTotal}
            </strong>
          </span>
          <span className="text-[#504533]">/</span>
          <span>
            OVERSEAS LEFT:{' '}
            <strong className="text-[#4edea3]">
              {overseasRemaining} / {vm.teams.length * vm.cfg.os}
            </strong>
          </span>
          <span className="text-[#504533]">/</span>
          <span>
            PLAYERS SOLD: <strong className="text-[#e6defe]">{vm.counts.sold}</strong>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] text-[#9d8f79]">
          <span>Click any row on the right to switch franchise roster</span>
        </div>
      </footer>

      {/* RELEASE CONFIRMATION MODAL */}
      {pendingRelease && (
        <div
          className="fixed inset-0 bg-[#0e0b21]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="release-dialog-title"
        >
          <div className="bg-[#1c192f] border-2 border-[#ffb4ab]/60 rounded-lg max-w-md w-full p-5 shadow-2xl">
            <h3
              id="release-dialog-title"
              className="font-[Space_Grotesk] text-lg font-bold text-[#e6defe]"
            >
              Confirm Player Release
            </h3>
            <p className="text-sm text-[#d5c4ac] mt-2">
              Release <strong className="text-[#e6defe]">{pendingRelease.name}</strong> from{' '}
              <strong className="text-[#ffdb9f]">{pendingRelease.team.name}</strong>?
            </p>
            <p className="font-[JetBrains_Mono] text-xs text-[#4edea3] mt-2 bg-[#201d33] p-2.5 rounded border border-[#504533]">
              Lot returns to the pending auction pool (last recorded bid: {formatCurrency(pendingRelease.price)}).
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setPendingRelease(null)}
                className="px-3.5 py-1.5 rounded border border-[#504533] text-[#d5c4ac] hover:text-[#e6defe] font-[JetBrains_Mono] text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmRelease}
                className="px-4 py-1.5 rounded bg-[#93000a] hover:bg-[#a50031] text-[#ffdad6] border border-[#ffb4ab]/50 font-[JetBrains_Mono] text-xs font-bold"
              >
                Confirm Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
