import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download } from 'lucide-react';
import type { AuctionViewModel, TeamView } from '../auction/types.ts';
import { formatCurrency } from '../auction/engine.ts';
import { TeamLogoBadge } from './TeamLogoBadge.tsx';

type SortKey = 'name' | 'n' | 'os' | 'bowlers' | 'wicketkeepers';

interface OperatorTeamStatsProps {
  vm: AuctionViewModel;
}

export function OperatorTeamStats({ vm }: OperatorTeamStatsProps) {
  const [sortKey, setSortKey] = useState<SortKey>('n');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedTeams = useMemo(() => {
    const copy = [...vm.teams];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [vm.teams, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 inline ml-1 text-[#fdb813]" />
    ) : (
      <ArrowDown className="w-3 h-3 inline ml-1 text-[#fdb813]" />
    );
  };

  const totalPlayers = vm.teams.reduce((a, t) => a + t.n, 0);
  const totalOverseas = vm.teams.reduce((a, t) => a + t.os, 0);
  const totalBowlers = vm.teams.reduce((a, t) => a + t.bowlers, 0);
  const totalWicketkeepers = vm.teams.reduce((a, t) => a + t.wicketkeepers, 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#141026] p-4 gap-3">
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[#1c192f] border border-[#504533] rounded p-3 shrink-0">
        <div>
          <h1 className="font-[Space_Grotesk] text-xl font-bold text-[#e6defe]">
            Franchise Roster &amp; Composition Ledger
          </h1>
          <p className="font-[JetBrains_Mono] text-xs text-[#d5c4ac] mt-0.5">
            Sortable order-wise squad compliance across all {vm.teams.length} club teams ({vm.preset} · manual funds mode)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3 py-1.5 rounded bg-[#201d33] border border-[#504533] font-[JetBrains_Mono] text-xs">
            <span className="text-[#9d8f79]">TITLES SOLD: </span>
            <strong className="text-[#fdb813]">
              {vm.counts.titlesSold}/{vm.counts.titlesTotal}
            </strong>
          </div>
          <div className="px-3 py-1.5 rounded bg-[#201d33] border border-[#504533] font-[JetBrains_Mono] text-xs">
            <span className="text-[#9d8f79]">OS USED: </span>
            <strong className="text-[#4edea3]">
              {totalOverseas}/{vm.teams.length * vm.cfg.os}
            </strong>
          </div>
          <a
            href="/api/export.csv"
            download="auction-results.csv"
            className="px-3.5 py-2 rounded bg-[#00a572] hover:bg-[#00a572]/90 text-[#002113] border border-[#4edea3] font-[JetBrains_Mono] text-xs font-extrabold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      <div className="flex-1 bg-[#0e0b21] border border-[#504533] rounded overflow-auto custom-scroll">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#201d33] border-b border-[#504533] font-[JetBrains_Mono] text-[11px] text-[#d5c4ac] z-10">
            <tr>
              <th className="py-2.5 px-4">
                <button type="button" onClick={() => toggleSort('name')} className="hover:text-[#fdb813]">
                  FRANCHISE / TEAM {renderSortIcon('name')}
                </button>
              </th>
              <th className="py-2.5 px-4">FRANCHISE TITLE &amp; SUB</th>
              <th className="py-2.5 px-3 text-center">
                <button type="button" onClick={() => toggleSort('n')} className="hover:text-[#fdb813]">
                  PLAYERS {renderSortIcon('n')}
                </button>
              </th>
              <th className="py-2.5 px-3 text-center">
                <button type="button" onClick={() => toggleSort('bowlers')} className="hover:text-[#fdb813]">
                  BOWLERS {renderSortIcon('bowlers')}
                </button>
              </th>
              <th className="py-2.5 px-3 text-center">
                <button type="button" onClick={() => toggleSort('wicketkeepers')} className="hover:text-[#fdb813]">
                  WICKETKEEPERS {renderSortIcon('wicketkeepers')}
                </button>
              </th>
              <th className="py-2.5 px-3 text-center">
                <button type="button" onClick={() => toggleSort('os')} className="hover:text-[#fdb813]">
                  OVERSEAS {renderSortIcon('os')}
                </button>
              </th>
              <th className="py-2.5 px-4 text-center">COMPOSITION STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#504533]/60 font-[JetBrains_Mono] text-xs">
            {sortedTeams.map((t: TeamView) => (
              <tr key={t.id} className="hover:bg-[#1c192f] transition-colors">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <TeamLogoBadge team={t} size="sm" />
                    <div>
                      <span className="font-[Inter] font-semibold text-[#e6defe] block">{t.name}</span>
                      <span className="text-[10px] text-[#9d8f79]">
                        {t.paddle} · {t.slotLabel}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  {t.titleId ? (
                    <div>
                      <span className="font-bold text-[#fdb813]">
                        {t.short} · {t.titleName}
                      </span>
                      <span className="block text-[10px] text-[#4edea3]">
                        {t.titleSubFranchise
                          ? `Sub-Franchise: ${t.titleSubFranchise}`
                          : `Hammered @ ${formatCurrency(t.titlePrice)}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#9d8f79]">No Title Claimed Yet</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center text-[#e6defe]">
                  {t.n} / {vm.cfg.max}
                  <span className="text-[10px] text-[#9d8f79] ml-1">
                    ({t.n >= vm.cfg.min ? 'Min OK' : `Need ${vm.cfg.min - t.n}`})
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={t.bowlersNeeded === 0 ? 'text-[#4edea3] font-bold' : 'text-[#ffdb9f]'}>
                    {t.bowlers} / {vm.cfg.minBowlers}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={t.wicketkeepersNeeded === 0 ? 'text-[#4edea3] font-bold' : 'text-[#ffdb9f]'}>
                    {t.wicketkeepers} / {vm.cfg.minWicketkeepers}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center text-[#4edea3]">
                  {t.os} / {vm.cfg.os}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${
                      t.compositionOk
                        ? 'bg-[#00a572]/20 border-[#4edea3] text-[#4edea3]'
                        : 'bg-[#ffdb9f]/15 border-[#ffdb9f]/60 text-[#ffdb9f]'
                    }`}
                  >
                    {t.compositionOk
                      ? 'QUOTA COMPLETE'
                      : `NEED ${t.bowlersNeeded}B · ${t.wicketkeepersNeeded}WK`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#1c192f] border-t-2 border-[#504533] font-[JetBrains_Mono] text-xs font-bold">
            <tr>
              <td className="py-2.5 px-4 text-[#ffdb9f]">ALL {vm.teams.length} FRANCHISES TOTAL</td>
              <td className="py-2.5 px-4 text-[#fdb813]">
                {vm.counts.titlesSold} / {vm.counts.titlesTotal} Titles
              </td>
              <td className="py-2.5 px-3 text-center text-[#e6defe]">{totalPlayers}</td>
              <td className="py-2.5 px-3 text-center text-[#d5c4ac]">{totalBowlers}</td>
              <td className="py-2.5 px-3 text-center text-[#d5c4ac]">{totalWicketkeepers}</td>
              <td className="py-2.5 px-3 text-center text-[#4edea3]">
                {totalOverseas} / {vm.teams.length * vm.cfg.os}
              </td>
              <td className="py-2.5 px-4 text-center text-[#9d8f79] font-normal">
                Sold: {vm.counts.sold} · Unsold: {vm.counts.unsold} · Pending: {vm.counts.left}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

