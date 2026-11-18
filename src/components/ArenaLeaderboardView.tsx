import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import type { AuctionConfig, Player, TeamView } from '../auction/types.ts';
import { formatCurrency, formatPlayerCardMeta } from '../auction/engine.ts';
import {
  buildAllTeamDashboardMetrics,
  DASHBOARD_RULE,
  type DashboardFilterMode,
  type DashboardSortDir,
  type DashboardSortKey,
  filterDashboardTeams,
  formatRatingAvg,
  sortDashboardTeams,
  type TeamDashboardMetrics,
} from '../utils/arenaDashboard.ts';
import { PlayerTeamLogoPill, TeamLogoBadge } from './TeamLogoBadge.tsx';

interface ArenaLeaderboardViewProps {
  teams: TeamView[];
  players: Player[];
  cfg: AuctionConfig;
}

const SORT_OPTIONS: Array<{ key: DashboardSortKey; label: string }> = [
  { key: 'overall', label: 'Overall Score' },
  { key: 'pop', label: 'Popularity Avg' },
  { key: 'bat', label: 'Batting Avg' },
  { key: 'bowl', label: 'Bowling Avg' },
  { key: 'default', label: 'Paddle Order' },
];

export function ArenaLeaderboardView({
  teams,
  players,
  cfg,
}: ArenaLeaderboardViewProps) {
  const [sortBy, setSortBy] = useState<DashboardSortKey>('overall');
  const [sortDir, setSortDir] = useState<DashboardSortDir>('desc');
  const [filterMode, setFilterMode] = useState<DashboardFilterMode>('all');

  const allMetrics = useMemo(
    () => buildAllTeamDashboardMetrics(teams, players),
    [teams, players]
  );

  const metCount = useMemo(
    () => allMetrics.filter((m) => m.criteriaMet).length,
    [allMetrics]
  );
  const incompleteCount = allMetrics.length - metCount;

  const displayedMetrics = useMemo(() => {
    const filtered = filterDashboardTeams(allMetrics, filterMode);
    return sortDashboardTeams(filtered, sortBy, sortDir);
  }, [allMetrics, filterMode, sortBy, sortDir]);

  const handleSortMetricClick = (key: DashboardSortKey) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'default' ? 'asc' : 'desc');
    }
  };

  const toggleDirection = () => {
    setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Leaderboard Controls: Squad Rule Progress + Filters + Two-Way Metric Sorters */}
      <section
        aria-label="Leaderboard filters and sorting controls"
        className="w-full bg-[#18142b] border-b border-[#504533] px-3.5 py-2 flex items-center justify-between gap-3 flex-wrap shrink-0"
        data-testid="dashboard-leaderboard-controls"
      >
        {/* Left: Mandatory 12-Player & Role Criterion Progress Summary + Filter Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex items-center gap-x-2 gap-y-1 flex-wrap font-[JetBrains_Mono] text-[11px] text-[#e6defe]"
            data-testid="dashboard-criteria-summary"
          >
            <span className="font-bold text-[#ffdb9f]">
              Rule: {DASHBOARD_RULE.targetPlayers} Players · BAT {DASHBOARD_RULE.bat} | BOWL{' '}
              {DASHBOARD_RULE.bowl} | AR {DASHBOARD_RULE.ar} | WK {DASHBOARD_RULE.wk}
            </span>
            <span className="text-[#9d8f79] hidden sm:inline" aria-hidden="true">
              /
            </span>
            <span className="font-bold text-[#4edea3] tabular-nums whitespace-nowrap">
              {metCount}/{allMetrics.length} Teams Met
            </span>
          </div>

          <div
            className="flex items-center bg-[#0e0b21] p-0.5 rounded-md border border-[#504533]"
            role="group"
            aria-label="Filter teams by rule completion"
          >
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              data-testid="dash-filter-all"
              className={`px-2.5 py-1 rounded text-[11px] font-[JetBrains_Mono] font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                filterMode === 'all'
                  ? 'bg-[#fdb813] text-[#271900]'
                  : 'text-[#d5c4ac] hover:text-[#e6defe]'
              }`}
            >
              All ({allMetrics.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('met')}
              data-testid="dash-filter-met"
              className={`px-2.5 py-1 rounded text-[11px] font-[JetBrains_Mono] font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                filterMode === 'met'
                  ? 'bg-[#4edea3] text-[#002113]'
                  : 'text-[#d5c4ac] hover:text-[#e6defe]'
              }`}
            >
              Rule Met ({metCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('incomplete')}
              data-testid="dash-filter-incomplete"
              className={`px-2.5 py-1 rounded text-[11px] font-[JetBrains_Mono] font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                filterMode === 'incomplete'
                  ? 'bg-[#fdb813] text-[#271900]'
                  : 'text-[#d5c4ac] hover:text-[#e6defe]'
              }`}
            >
              Needs Players ({incompleteCount})
            </button>
          </div>
        </div>

        {/* Right: Two-Way Leaderboard Metric Sorting */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] font-semibold mr-0.5 whitespace-nowrap">
            Sort By:
          </span>
          <div
            className="flex items-center gap-1 flex-wrap"
            role="group"
            aria-label="Sort leaderboard by team metric"
          >
            {SORT_OPTIONS.map((opt) => {
              const active = sortBy === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSortMetricClick(opt.key)}
                  data-testid={`dash-sort-${opt.key}`}
                  aria-pressed={active}
                  className={`px-2.5 py-1 rounded border font-[JetBrains_Mono] text-[11px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#fdb813] text-[#271900] border-[#fdb813]'
                      : 'bg-[#0e0b21] text-[#d5c4ac] border-[#504533] hover:border-[#fdb813] hover:text-[#e6defe]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {active &&
                    (sortDir === 'desc' ? (
                      <ArrowDown className="w-3 h-3 shrink-0" />
                    ) : (
                      <ArrowUp className="w-3 h-3 shrink-0" />
                    ))}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={toggleDirection}
            data-testid="dash-sort-direction"
            aria-label={
              sortDir === 'desc'
                ? 'Sort direction: Highest to Lowest. Click to switch to Lowest to Highest.'
                : 'Sort direction: Lowest to Highest. Click to switch to Highest to Lowest.'
            }
            className="px-2.5 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#4edea3] font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowUpDown className="w-3 h-3 shrink-0" />
            <span>{sortDir === 'desc' ? 'Highest → Lowest' : 'Lowest → Highest'}</span>
          </button>
        </div>
      </section>

      {/* Main Leaderboard Team Cards Grid */}
      <main className="flex-1 overflow-y-auto custom-scroll p-3">
        {displayedMetrics.length === 0 ? (
          <div
            className="h-full min-h-[240px] flex flex-col items-center justify-center text-center bg-[#0e0b21] border border-[#504533] rounded-lg p-6"
            data-testid="dashboard-teams-empty-filter"
          >
            <p className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe]">
              No teams match the selected filter
            </p>
            <p className="font-[JetBrains_Mono] text-xs text-[#9d8f79] mt-1">
              {filterMode === 'met'
                ? `No franchise has completed all ${DASHBOARD_RULE.targetPlayers} players (${DASHBOARD_RULE.bat} BAT, ${DASHBOARD_RULE.bowl} BOWL, ${DASHBOARD_RULE.ar} AR, ${DASHBOARD_RULE.wk} WK) yet.`
                : 'All teams have met the mandatory squad rule.'}
            </p>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className="mt-3 px-4 py-1.5 rounded border border-[#fdb813] bg-[#fdb813]/15 text-[#fdb813] font-[JetBrains_Mono] text-xs font-bold hover:bg-[#fdb813] hover:text-[#271900] transition-colors"
            >
              Show All Teams
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 content-start">
            {displayedMetrics.map((m: TeamDashboardMetrics, rankIdx: number) => {
              const { team: t, counts, progressPct, criteriaMet, needsSummary } = m;
              return (
                <section
                  key={t.id}
                  data-testid={`dashboard-team-${t.id}`}
                  className={`bg-[#0e0b21] rounded-lg flex flex-col overflow-hidden border transition-colors ${
                    criteriaMet ? 'border-[#4edea3]/70' : 'border-[#504533]'
                  }`}
                >
                  {/* Top Team Identity + Progress Bar Directly Below Team Name */}
                  <div className="p-2.5 bg-[#19152c] border-b border-[#504533]/80 space-y-2 shrink-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="font-[JetBrains_Mono] text-[11px] font-bold text-[#9d8f79] w-5 shrink-0 tabular-nums"
                          title={`Rank #${rankIdx + 1}`}
                        >
                          #{rankIdx + 1}
                        </span>
                        <TeamLogoBadge team={t} size="xs" />
                        <div className="min-w-0">
                          <h2 className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe] truncate leading-tight">
                            {t.name}
                          </h2>
                          <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] flex items-center gap-1 truncate mt-0.5">
                            <span>{t.paddle}</span>
                            {t.titleSubFranchise ? (
                              <span className="text-[#4edea3] font-semibold truncate">
                                · {t.titleSubFranchise.split(' · ')[0]}
                              </span>
                            ) : t.titleId ? (
                              <span className="text-[#fdb813] font-semibold inline-flex items-center gap-0.5">
                                · <Crown className="w-2.5 h-2.5 inline" /> {t.short}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-[JetBrains_Mono] tabular-nums">
                        <div
                          className={`text-xs font-bold ${
                            counts.total >= DASHBOARD_RULE.targetPlayers
                              ? 'text-[#4edea3]'
                              : 'text-[#e6defe]'
                          }`}
                        >
                          {counts.total}/{DASHBOARD_RULE.targetPlayers} Players
                        </div>
                        <div className="text-[10px] text-[#9d8f79]">
                          OS {t.os}/{cfg.os} · Cap {t.n}/{cfg.max}
                        </div>
                      </div>
                    </div>

                    {/* Mandatory Criterion Progress Bar Below Team's Name */}
                    <div
                      className="space-y-1"
                      data-testid={`dashboard-team-progress-${t.id}`}
                    >
                      <div className="flex items-center justify-between gap-2 font-[JetBrains_Mono] text-[10px]">
                        <span
                          className={`truncate font-semibold inline-flex items-center gap-1 ${
                            criteriaMet ? 'text-[#4edea3]' : 'text-[#ffdb9f]'
                          }`}
                        >
                          {criteriaMet && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                          <span className="truncate">{needsSummary}</span>
                        </span>
                        <span
                          className={`font-bold tabular-nums shrink-0 ${
                            criteriaMet ? 'text-[#4edea3]' : 'text-[#fdb813]'
                          }`}
                        >
                          {progressPct}%
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`${t.name} squad criterion progress`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progressPct}
                        className="h-1.5 w-full rounded-full bg-[#0e0b21] border border-[#504533]/70 overflow-hidden"
                      >
                        <div
                          className={`h-full transition-all duration-300 ${
                            criteriaMet ? 'bg-[#4edea3]' : 'bg-[#fdb813]'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Live Squad Role Breakdown: BAT | BOWL | AR | WK */}
                    <div
                      className="grid grid-cols-4 divide-x divide-[#504533]/60 rounded border border-[#504533]/80 bg-[#120f24] font-[JetBrains_Mono] text-[10px] tabular-nums"
                      data-testid={`dashboard-team-roles-${t.id}`}
                    >
                      <div className="px-1.5 py-1 text-center">
                        <span className="text-[#9d8f79]">BAT: </span>
                        <strong
                          className={
                            counts.bat >= DASHBOARD_RULE.bat
                              ? 'text-[#4edea3]'
                              : 'text-[#e6defe]'
                          }
                        >
                          {counts.bat}
                        </strong>
                        <span className="text-[#9d8f79]">/{DASHBOARD_RULE.bat}</span>
                      </div>
                      <div className="px-1.5 py-1 text-center">
                        <span className="text-[#9d8f79]">BOWL: </span>
                        <strong
                          className={
                            counts.bowl >= DASHBOARD_RULE.bowl
                              ? 'text-[#4edea3]'
                              : 'text-[#e6defe]'
                          }
                        >
                          {counts.bowl}
                        </strong>
                        <span className="text-[#9d8f79]">/{DASHBOARD_RULE.bowl}</span>
                      </div>
                      <div className="px-1.5 py-1 text-center">
                        <span className="text-[#9d8f79]">AR: </span>
                        <strong
                          className={
                            counts.ar >= DASHBOARD_RULE.ar
                              ? 'text-[#4edea3]'
                              : 'text-[#e6defe]'
                          }
                        >
                          {counts.ar}
                        </strong>
                        <span className="text-[#9d8f79]">/{DASHBOARD_RULE.ar}</span>
                      </div>
                      <div className="px-1.5 py-1 text-center">
                        <span className="text-[#9d8f79]">WK: </span>
                        <strong
                          className={
                            counts.wk >= DASHBOARD_RULE.wk
                              ? 'text-[#4edea3]'
                              : 'text-[#e6defe]'
                          }
                        >
                          {counts.wk}
                        </strong>
                        <span className="text-[#9d8f79]">/{DASHBOARD_RULE.wk}</span>
                      </div>
                    </div>

                    {/* Rating Metrics: Overall Composite Score + Pop / Bat / Bowl Averages */}
                    <div
                      className="grid grid-cols-4 divide-x divide-[#504533]/60 rounded border border-[#504533]/80 bg-[#0e0b21] font-[JetBrains_Mono] text-[10px] tabular-nums"
                      data-testid={`dashboard-team-ratings-${t.id}`}
                    >
                      <div
                        className={`px-1.5 py-1 text-center ${
                          sortBy === 'overall' ? 'bg-[#fdb813]/12' : ''
                        }`}
                      >
                        <div className="text-[9px] text-[#9d8f79]">OVERALL</div>
                        <div
                          className={`text-xs font-bold ${
                            sortBy === 'overall' ? 'text-[#fdb813]' : 'text-[#e6defe]'
                          }`}
                        >
                          {formatRatingAvg(m.overallScore)}
                        </div>
                      </div>
                      <div
                        className={`px-1.5 py-1 text-center ${
                          sortBy === 'pop' ? 'bg-[#fdb813]/12' : ''
                        }`}
                      >
                        <div className="text-[9px] text-[#9d8f79]">POP AVG</div>
                        <div
                          className={`text-xs font-bold ${
                            sortBy === 'pop' ? 'text-[#fdb813]' : 'text-[#e6defe]'
                          }`}
                        >
                          {formatRatingAvg(m.popAvg)}
                        </div>
                      </div>
                      <div
                        className={`px-1.5 py-1 text-center ${
                          sortBy === 'bat' ? 'bg-[#fdb813]/12' : ''
                        }`}
                      >
                        <div className="text-[9px] text-[#9d8f79]">BAT AVG</div>
                        <div
                          className={`text-xs font-bold ${
                            sortBy === 'bat' ? 'text-[#fdb813]' : 'text-[#e6defe]'
                          }`}
                        >
                          {formatRatingAvg(m.batAvg)}
                        </div>
                      </div>
                      <div
                        className={`px-1.5 py-1 text-center ${
                          sortBy === 'bowl' ? 'bg-[#fdb813]/12' : ''
                        }`}
                      >
                        <div className="text-[9px] text-[#9d8f79]">BOWL AVG</div>
                        <div
                          className={`text-xs font-bold ${
                            sortBy === 'bowl' ? 'text-[#fdb813]' : 'text-[#e6defe]'
                          }`}
                        >
                          {formatRatingAvg(m.bowlAvg)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acquired Squad Roster List */}
                  <div className="flex-1 min-h-[112px] max-h-[156px] overflow-y-auto custom-scroll p-2 space-y-1.5">
                    {t.squad.length === 0 ? (
                      <div className="h-full min-h-[92px] flex flex-col items-center justify-center text-center p-2 font-[JetBrains_Mono] text-[11px] text-[#9d8f79]">
                        <span>No players acquired yet</span>
                        <span className="text-[10px] opacity-80 mt-0.5">
                          {t.titleId
                            ? `Franchise: ${t.name}${
                                t.titleSubFranchise
                                  ? ` (${t.titleSubFranchise.split(' · ')[0]})`
                                  : ''
                              }`
                            : 'Awaiting Franchise & Player signings'}
                        </span>
                      </div>
                    ) : (
                      t.squad.map((p) => (
                        <div
                          key={p.id}
                          className="bg-[#19152c]/80 border border-[#36324a] rounded px-2 py-1 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <PlayerTeamLogoPill teamShort={t.short} teamName={t.name} size="sm" />
                            <div className="min-w-0">
                              <div className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] truncate">
                                {p.name}
                              </div>
                              <div className="font-[JetBrains_Mono] text-[10px] text-[#4edea3] truncate">
                                {formatPlayerCardMeta(p)}
                              </div>
                            </div>
                          </div>
                          <span className="font-[JetBrains_Mono] text-[11px] font-bold text-[#fdb813] shrink-0 tabular-nums">
                            {formatCurrency(p.price)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
