import type { BriefPlayer, Player, SquadPlayer, TeamView } from '../auction/types.ts';
import { formatRole, isWicketkeeperPlayer } from '../auction/engine.ts';

export const DASHBOARD_RULE = {
  targetPlayers: 12,
  bat: 4,
  bowl: 3,
  ar: 2,
  wk: 1,
} as const;

export const DASHBOARD_SQUAD_TARGET = DASHBOARD_RULE.targetPlayers;

export const DASHBOARD_ROLE_QUOTAS = {
  bat: DASHBOARD_RULE.bat,
  bowl: DASHBOARD_RULE.bowl,
  ar: DASHBOARD_RULE.ar,
  wk: DASHBOARD_RULE.wk,
} as const;

export type DashboardSortKey = 'overall' | 'pop' | 'bat' | 'bowl' | 'default';
export type DashboardSortMetric = 'overall' | 'pop' | 'bat' | 'bowl';
export type DashboardSortDir = 'desc' | 'asc';
export type DashboardSortDirection = DashboardSortDir;
export type DashboardFilterMode = 'all' | 'met' | 'incomplete';

export interface RoleBreakdown {
  bat: number;
  bowl: number;
  ar: number;
  wk: number;
}

export interface RoleCounts extends RoleBreakdown {
  total: number;
}

export interface RoleNeeds {
  bat: number;
  bowl: number;
  ar: number;
  wk: number;
  playersRemaining: number;
}

export interface NeededRoles extends RoleBreakdown {
  total: number;
}

export interface TeamDashboardMetrics {
  team: TeamView;
  slotIndex: number;
  counts: RoleCounts;
  roles: RoleBreakdown;
  squadCount: number;
  targetCount: number;
  needs: RoleNeeds;
  neededRoles: NeededRoles;
  mandatoryFilledSlots: number;
  mandatoryTotalSlots: number;
  progressSlots: number;
  progressPct: number;
  criteriaMet: boolean;
  fullCriterionMet: boolean;
  roleCriterionMet: boolean;
  needsSummary: string;
  missingSummary: string;
  popAvg: number;
  batAvg: number;
  bowlAvg: number;
  overallScore: number;
}

function getMetric(
  sp: SquadPlayer | BriefPlayer,
  field: 'pop' | 'bat' | 'bowl',
  playerLookup?: ReadonlyMap<string, Player>
): number {
  const candidate = (sp as Partial<Record<'pop' | 'bat' | 'bowl', unknown>>)[field];
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
  const full = playerLookup?.get(sp.id);
  if (full && typeof full[field] === 'number' && Number.isFinite(full[field])) {
    return full[field];
  }
  return typeof sp.ovr === 'number' && Number.isFinite(sp.ovr) ? sp.ovr : 0;
}

export function computeRoleCounts(squad: readonly SquadPlayer[]): RoleCounts {
  let bat = 0;
  let bowl = 0;
  let ar = 0;
  let wk = 0;

  for (const p of squad) {
    if (p.isTitle) continue;
    if (isWicketkeeperPlayer({ role: p.role, wk: Boolean(p.wk), isTitle: Boolean(p.isTitle) })) {
      wk += 1;
      continue;
    }
    const role = formatRole(p.role);
    if (role === 'Batter') {
      bat += 1;
    } else if (role === 'Bowler') {
      bowl += 1;
    } else if (role === 'All-Rounder') {
      ar += 1;
    }
  }

  return {
    bat,
    bowl,
    ar,
    wk,
    total: squad.length,
  };
}

export function buildNeedsSummary(needs: RoleNeeds, totalPlayers: number): string {
  const parts: string[] = [];
  if (needs.bat > 0) parts.push(`${needs.bat} BAT`);
  if (needs.bowl > 0) parts.push(`${needs.bowl} BOWL`);
  if (needs.ar > 0) parts.push(`${needs.ar} AR`);
  if (needs.wk > 0) parts.push(`${needs.wk} WK`);

  if (parts.length === 0 && needs.playersRemaining === 0) {
    return totalPlayers > DASHBOARD_RULE.targetPlayers
      ? `Rule Met (${totalPlayers}/${DASHBOARD_RULE.targetPlayers})`
      : `Rule Met (${DASHBOARD_RULE.targetPlayers}/${DASHBOARD_RULE.targetPlayers})`;
  }

  const mandatoryNeeded = needs.bat + needs.bowl + needs.ar + needs.wk;
  const anyExtraNeeded = Math.max(0, needs.playersRemaining - mandatoryNeeded);

  if (parts.length > 0 && anyExtraNeeded > 0) {
    return `Need ${parts.join(', ')} + ${anyExtraNeeded} any`;
  }
  if (parts.length > 0) {
    return `Need ${parts.join(', ')}`;
  }
  return `Need ${needs.playersRemaining} more player${needs.playersRemaining === 1 ? '' : 's'}`;
}

function computeSingleTeamDashboardMetrics(
  team: TeamView,
  slotIndex: number,
  playerLookup?: ReadonlyMap<string, Player>
): TeamDashboardMetrics {
  const counts = computeRoleCounts(team.squad);
  const needs: RoleNeeds = {
    bat: Math.max(0, DASHBOARD_RULE.bat - counts.bat),
    bowl: Math.max(0, DASHBOARD_RULE.bowl - counts.bowl),
    ar: Math.max(0, DASHBOARD_RULE.ar - counts.ar),
    wk: Math.max(0, DASHBOARD_RULE.wk - counts.wk),
    playersRemaining: Math.max(0, DASHBOARD_RULE.targetPlayers - counts.total),
  };

  const mandatoryTotalSlots =
    DASHBOARD_RULE.bat + DASHBOARD_RULE.bowl + DASHBOARD_RULE.ar + DASHBOARD_RULE.wk; // 10
  const mandatoryFilledSlots =
    Math.min(counts.bat, DASHBOARD_RULE.bat) +
    Math.min(counts.bowl, DASHBOARD_RULE.bowl) +
    Math.min(counts.ar, DASHBOARD_RULE.ar) +
    Math.min(counts.wk, DASHBOARD_RULE.wk);

  const flexTarget = DASHBOARD_RULE.targetPlayers - mandatoryTotalSlots; // 2
  const extraPlayersBeyondMandatoryQuotas = Math.max(0, counts.total - mandatoryFilledSlots);
  const flexFilled = Math.min(flexTarget, extraPlayersBeyondMandatoryQuotas);

  const progressSlots = Math.min(
    DASHBOARD_RULE.targetPlayers,
    mandatoryFilledSlots + flexFilled
  );
  const progressPct = Math.round((progressSlots / DASHBOARD_RULE.targetPlayers) * 100);

  const roleCriterionMet =
    needs.bat === 0 &&
    needs.bowl === 0 &&
    needs.ar === 0 &&
    needs.wk === 0;

  const criteriaMet = counts.total >= DASHBOARD_RULE.targetPlayers && roleCriterionMet;

  let popAvg = 0;
  let batAvg = 0;
  let bowlAvg = 0;
  let overallScore = 0;

  if (team.squad.length > 0) {
    let sumPop = 0;
    let sumBat = 0;
    let sumBowl = 0;
    for (const sp of team.squad) {
      sumPop += getMetric(sp, 'pop', playerLookup);
      sumBat += getMetric(sp, 'bat', playerLookup);
      sumBowl += getMetric(sp, 'bowl', playerLookup);
    }
    const n = team.squad.length;
    popAvg = Math.round((sumPop / n) * 10) / 10;
    batAvg = Math.round((sumBat / n) * 10) / 10;
    bowlAvg = Math.round((sumBowl / n) * 10) / 10;
    overallScore = Math.round(((popAvg + batAvg + bowlAvg) / 3) * 10) / 10;
  }

  const needsSummary = buildNeedsSummary(needs, counts.total);
  const missingSummary = criteriaMet
    ? `${counts.total}/${DASHBOARD_RULE.targetPlayers} · Rules Met`
    : needsSummary;

  const roles: RoleBreakdown = {
    bat: counts.bat,
    bowl: counts.bowl,
    ar: counts.ar,
    wk: counts.wk,
  };

  const neededRoles: NeededRoles = {
    bat: needs.bat,
    bowl: needs.bowl,
    ar: needs.ar,
    wk: needs.wk,
    total: needs.playersRemaining,
  };

  return {
    team,
    slotIndex,
    counts,
    roles,
    squadCount: counts.total,
    targetCount: DASHBOARD_SQUAD_TARGET,
    needs,
    neededRoles,
    mandatoryFilledSlots,
    mandatoryTotalSlots,
    progressSlots,
    progressPct,
    criteriaMet,
    fullCriterionMet: criteriaMet,
    roleCriterionMet,
    needsSummary,
    missingSummary,
    popAvg,
    batAvg,
    bowlAvg,
    overallScore,
  };
}

export function computeTeamDashboardMetrics(
  teams: readonly TeamView[],
  players: readonly Player[]
): TeamDashboardMetrics[];
export function computeTeamDashboardMetrics(
  team: TeamView,
  slotIndex: number,
  playerLookup?: ReadonlyMap<string, Player>
): TeamDashboardMetrics;
export function computeTeamDashboardMetrics(
  teamOrTeams: TeamView | readonly TeamView[],
  slotIndexOrPlayers: number | readonly Player[],
  playerLookup?: ReadonlyMap<string, Player>
): TeamDashboardMetrics | TeamDashboardMetrics[] {
  if (Array.isArray(teamOrTeams)) {
    const players = Array.isArray(slotIndexOrPlayers) ? slotIndexOrPlayers : [];
    const lookup = new Map<string, Player>(players.map((p) => [p.id, p]));
    return teamOrTeams.map((team, idx) => computeSingleTeamDashboardMetrics(team, idx, lookup));
  }
  return computeSingleTeamDashboardMetrics(
    teamOrTeams as TeamView,
    typeof slotIndexOrPlayers === 'number' ? slotIndexOrPlayers : 0,
    playerLookup
  );
}

export function buildAllTeamDashboardMetrics(
  teams: readonly TeamView[],
  players: readonly Player[]
): TeamDashboardMetrics[] {
  return computeTeamDashboardMetrics(teams, players);
}

export function countTeamsMeetingCriteria(items: readonly TeamDashboardMetrics[]): {
  fullMetCount: number;
  roleMetCount: number;
  totalTeams: number;
} {
  let fullMetCount = 0;
  let roleMetCount = 0;
  for (const item of items) {
    if (item.fullCriterionMet) fullMetCount += 1;
    if (item.roleCriterionMet) roleMetCount += 1;
  }
  return {
    fullMetCount,
    roleMetCount,
    totalTeams: items.length,
  };
}

export function filterDashboardTeams(
  items: readonly TeamDashboardMetrics[],
  filter: DashboardFilterMode
): TeamDashboardMetrics[] {
  if (filter === 'met') return items.filter((item) => item.criteriaMet);
  if (filter === 'incomplete') return items.filter((item) => !item.criteriaMet);
  return [...items];
}

export function getSortMetricValue(
  item: TeamDashboardMetrics,
  sortBy: DashboardSortKey
): number {
  switch (sortBy) {
    case 'overall':
      return item.overallScore;
    case 'pop':
      return item.popAvg;
    case 'bat':
      return item.batAvg;
    case 'bowl':
      return item.bowlAvg;
    case 'default':
    default:
      return item.slotIndex;
  }
}

export function sortDashboardTeams(
  items: readonly TeamDashboardMetrics[],
  sortBy: DashboardSortKey,
  sortDir: DashboardSortDir
): TeamDashboardMetrics[] {
  const copy = [...items];
  copy.sort((a, b) => {
    if (sortBy === 'default') {
      return sortDir === 'asc'
        ? a.slotIndex - b.slotIndex
        : b.slotIndex - a.slotIndex;
    }
    const va = getSortMetricValue(a, sortBy);
    const vb = getSortMetricValue(b, sortBy);
    const diff = va - vb;
    if (Math.abs(diff) > 1e-9) {
      return sortDir === 'desc' ? -diff : diff;
    }
    // Secondary tie-breaker: criterion progress, then original paddle slot order
    const progDiff = b.progressPct - a.progressPct;
    if (progDiff !== 0) return progDiff;
    return a.slotIndex - b.slotIndex;
  });
  return copy;
}

export function sortTeamDashboardMetrics(
  items: readonly TeamDashboardMetrics[],
  sortBy: DashboardSortMetric,
  sortDir: DashboardSortDirection
): TeamDashboardMetrics[] {
  return sortDashboardTeams(items, sortBy, sortDir);
}

export function formatRatingAvg(value: number): string {
  if (!Number.isFinite(value)) return '0.0';
  return value.toFixed(1);
}
