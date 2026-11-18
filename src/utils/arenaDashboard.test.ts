import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildAllLots,
  buildViewModel,
  executeCommand,
  parsePlayersCsv,
} from '../auction/engine.ts';
import type { AuctionEvent, Player, SquadPlayer, TeamView } from '../auction/types.ts';
import {
  buildAllTeamDashboardMetrics,
  computeTeamDashboardMetrics,
  DASHBOARD_RULE,
  filterDashboardTeams,
  formatRatingAvg,
  sortDashboardTeams,
} from './arenaDashboard.ts';

const csvPath = path.resolve(process.cwd(), 'seed', 'players.csv');
const csvPlayers = parsePlayersCsv(fs.readFileSync(csvPath, 'utf8'));
const allLots = buildAllLots(csvPlayers);
const pidMap = new Map<string, Player>(allLots.map((p) => [p.id, p]));

function makeStubTeam(id: string, name: string, squad: SquadPlayer[]): TeamView {
  return {
    id,
    slotLabel: id.toUpperCase(),
    name,
    short: id.toUpperCase(),
    city: 'Test',
    c: '#9B7BF0',
    badgeBg: '#3A225D',
    badgeText: '#E6DEFE',
    paddle: '#01',
    hotkey: '1',
    titleId: null,
    titleName: null,
    titleSubFranchise: null,
    titlePrice: 0,
    start: 12000,
    purse: 12000,
    spent: 0,
    n: squad.length,
    held: 0,
    os: squad.filter((p) => p.os).length,
    bowlers: 0,
    wicketkeepers: 0,
    bowlersNeeded: 4,
    wicketkeepersNeeded: 1,
    compositionOk: false,
    lead: false,
    block: null,
    minReserve: 0,
    maxBid: 12000,
    solvency: 'OPTIMAL',
    squad,
  };
}

function makeSquadPlayer(
  id: string,
  role: string,
  wk: boolean,
  pop: number,
  bat: number,
  bowl: number
): SquadPlayer {
  return {
    id,
    name: `Player ${id}`,
    jersey: 1,
    deck: 2,
    deckName: 'Capped',
    era: 'Capped',
    role,
    country: 'India',
    cc: 'IND',
    os: false,
    wk,
    base: 100,
    inc: 10,
    pop,
    bat,
    bowl,
    keep: wk ? 85 : 20,
    ovr: Math.round((pop + bat + bowl) / 3),
    photo: '',
    category: 'CAPPED',
    durationSec: 180,
    price: 100,
  };
}

test('zero-state safety: empty teams produce 0 role counts, 0.0 averages, 0% progress, and stable sort', () => {
  const vm = buildViewModel([], allLots, pidMap, 'MEGA', 1000);
  const metrics = buildAllTeamDashboardMetrics(vm.teams, allLots);
  assert.equal(metrics.length, 11);

  for (const m of metrics) {
    assert.equal(m.counts.bat, 0);
    assert.equal(m.counts.bowl, 0);
    assert.equal(m.counts.ar, 0);
    assert.equal(m.counts.wk, 0);
    assert.equal(m.counts.total, 0);
    assert.equal(m.progressPct, 0);
    assert.equal(m.criteriaMet, false);
    assert.equal(formatRatingAvg(m.popAvg), '0.0');
    assert.equal(formatRatingAvg(m.batAvg), '0.0');
    assert.equal(formatRatingAvg(m.bowlAvg), '0.0');
    assert.equal(formatRatingAvg(m.overallScore), '0.0');
    assert.match(m.needsSummary, /Need 4 BAT, 3 BOWL, 2 AR, 1 WK \+ 2 any/);
  }

  const descSorted = sortDashboardTeams(metrics, 'overall', 'desc');
  const ascSorted = sortDashboardTeams(metrics, 'overall', 'asc');
  assert.deepEqual(
    descSorted.map((m) => m.team.id),
    vm.teams.map((t) => t.id)
  );
  assert.deepEqual(
    ascSorted.map((m) => m.team.id),
    vm.teams.map((t) => t.id)
  );
});

test('12-player and BAT:4 | BOWL:3 | AR:2 | WK:1 criterion blocks false completion when roles are missing', () => {
  // 12 pure batters only -> fulfills 4 BAT + 2 flex slots (6/12 = 50%), but misses BOWL/AR/WK!
  const twelveBatters = Array.from({ length: 12 }, (_, i) =>
    makeSquadPlayer(`b${i}`, 'Batsman', false, 80, 90, 20)
  );
  const skewedTeam = computeTeamDashboardMetrics(
    makeStubTeam('t1', 'Skewed Batters', twelveBatters),
    0
  );
  assert.equal(skewedTeam.counts.bat, 12);
  assert.equal(skewedTeam.counts.bowl, 0);
  assert.equal(skewedTeam.counts.ar, 0);
  assert.equal(skewedTeam.counts.wk, 0);
  assert.equal(skewedTeam.counts.total, 12);
  assert.equal(skewedTeam.progressSlots, 6);
  assert.equal(skewedTeam.progressPct, 50);
  assert.equal(skewedTeam.criteriaMet, false);
  assert.equal(skewedTeam.needsSummary, 'Need 3 BOWL, 2 AR, 1 WK');

  // Balanced 12-player squad: 4 BAT + 3 BOWL + 2 AR + 1 WK + 2 extra = 12 total -> 100% criterion met
  const completeSquad: SquadPlayer[] = [
    makeSquadPlayer('b1', 'Batsman', false, 90, 92, 20),
    makeSquadPlayer('b2', 'Batsman', false, 88, 90, 20),
    makeSquadPlayer('b3', 'Batsman', false, 86, 88, 20),
    makeSquadPlayer('b4', 'Batsman', false, 84, 86, 20),
    makeSquadPlayer('bw1', 'Bowler', false, 85, 25, 92),
    makeSquadPlayer('bw2', 'Bowler', false, 82, 20, 89),
    makeSquadPlayer('bw3', 'Bowler', false, 80, 20, 88),
    makeSquadPlayer('ar1', 'All-Rounder', false, 92, 85, 84),
    makeSquadPlayer('ar2', 'All-Rounder', false, 89, 82, 82),
    makeSquadPlayer('wk1', 'Wicketkeeper', true, 94, 88, 15),
    makeSquadPlayer('b5', 'Batsman', false, 78, 84, 20),
    makeSquadPlayer('bw4', 'Bowler', false, 76, 20, 86),
  ];
  assert.equal(completeSquad.length, DASHBOARD_RULE.targetPlayers);

  const balancedTeam = computeTeamDashboardMetrics(
    makeStubTeam('t2', 'Balanced XI', completeSquad),
    1
  );
  assert.equal(balancedTeam.counts.bat, 5);
  assert.equal(balancedTeam.counts.bowl, 4);
  assert.equal(balancedTeam.counts.ar, 2);
  assert.equal(balancedTeam.counts.wk, 1);
  assert.equal(balancedTeam.counts.total, 12);
  assert.equal(balancedTeam.progressPct, 100);
  assert.equal(balancedTeam.criteriaMet, true);
  assert.equal(balancedTeam.needsSummary, 'Rule Met (12/12)');

  const metOnly = filterDashboardTeams([skewedTeam, balancedTeam], 'met');
  const incompleteOnly = filterDashboardTeams([skewedTeam, balancedTeam], 'incomplete');
  assert.deepEqual(
    metOnly.map((m) => m.team.id),
    ['t2']
  );
  assert.deepEqual(
    incompleteOnly.map((m) => m.team.id),
    ['t1']
  );
});

test('two-way sorting toggles accurately across Overall, Pop Avg, Bat Avg, and Bowl Avg', () => {
  const t1 = computeTeamDashboardMetrics(
    makeStubTeam('t1', 'Star Batters', [makeSquadPlayer('p1', 'Batsman', false, 95, 96, 20)]), // overall = 70.33
    0
  );
  const t2 = computeTeamDashboardMetrics(
    makeStubTeam('t2', 'Pace Attack', [makeSquadPlayer('p2', 'Bowler', false, 70, 25, 96)]), // overall = 63.67
    1
  );
  const t3 = computeTeamDashboardMetrics(
    makeStubTeam('t3', 'Balanced Core', [makeSquadPlayer('p3', 'All-Rounder', false, 85, 85, 85)]), // overall = 85.0
    2
  );
  const t4 = computeTeamDashboardMetrics(makeStubTeam('t4', 'Empty Team', []), 3); // 0.0

  const list = [t1, t2, t3, t4];

  assert.deepEqual(
    sortDashboardTeams(list, 'overall', 'desc').map((m) => m.team.id),
    ['t3', 't1', 't2', 't4']
  );
  assert.deepEqual(
    sortDashboardTeams(list, 'overall', 'asc').map((m) => m.team.id),
    ['t4', 't2', 't1', 't3']
  );

  assert.deepEqual(
    sortDashboardTeams(list, 'pop', 'desc').map((m) => m.team.id),
    ['t1', 't3', 't2', 't4']
  );
  assert.deepEqual(
    sortDashboardTeams(list, 'pop', 'asc').map((m) => m.team.id),
    ['t4', 't2', 't3', 't1']
  );

  assert.deepEqual(
    sortDashboardTeams(list, 'bat', 'desc').map((m) => m.team.id),
    ['t1', 't3', 't2', 't4']
  );
  assert.deepEqual(
    sortDashboardTeams(list, 'bowl', 'desc').map((m) => m.team.id),
    ['t2', 't3', 't1', 't4']
  );
});

test('real auction SOLD and UNDO events synchronize role breakdown and rating averages in real time', () => {
  const batter = csvPlayers.find((p) => formatRoleSafe(p.role) === 'Batter' && !p.wk)!;
  const bowler = csvPlayers.find((p) => formatRoleSafe(p.role) === 'Bowler')!;
  const keeper = csvPlayers.find((p) => p.wk)!;

  let ev: AuctionEvent[] = [];
  for (const player of [batter, bowler, keeper]) {
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: player.id }, 10_000);
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't1' }, 11_000);
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'sold' }, 12_000);
  }

  let vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 13_000);
  let t1Metric = buildAllTeamDashboardMetrics(vm.teams, allLots).find((m) => m.team.id === 't1')!;

  assert.equal(t1Metric.counts.bat, 1);
  assert.equal(t1Metric.counts.bowl, 1);
  assert.equal(t1Metric.counts.wk, 1);
  assert.equal(t1Metric.counts.ar, 0);
  assert.equal(t1Metric.counts.total, 3);
  assert.equal(t1Metric.progressSlots, 3);
  assert.equal(t1Metric.progressPct, 25);

  const expectedPop = (batter.pop + bowler.pop + keeper.pop) / 3;
  const expectedBat = (batter.bat + bowler.bat + keeper.bat) / 3;
  const expectedBowl = (batter.bowl + bowler.bowl + keeper.bowl) / 3;
  assert.ok(Math.abs(t1Metric.popAvg - expectedPop) < 1e-6);
  assert.ok(Math.abs(t1Metric.batAvg - expectedBat) < 1e-6);
  assert.ok(Math.abs(t1Metric.bowlAvg - expectedBowl) < 1e-6);
  assert.ok(Math.abs(t1Metric.overallScore - (expectedPop + expectedBat + expectedBowl) / 3) < 1e-6);

  // Undo last SOLD -> removes wicketkeeper and recalculates immediately
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'undo' }, 14_000);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 14_000);
  t1Metric = buildAllTeamDashboardMetrics(vm.teams, allLots).find((m) => m.team.id === 't1')!;
  assert.equal(t1Metric.counts.wk, 0);
  assert.equal(t1Metric.counts.total, 2);
  assert.ok(Math.abs(t1Metric.popAvg - (batter.pop + bowler.pop) / 2) < 1e-6);
});

function formatRoleSafe(role: string): string {
  const r = role.trim().toLowerCase();
  if (r === 'batsman' || r === 'batter') return 'Batter';
  if (r === 'bowler') return 'Bowler';
  if (r === 'wicketkeeper' || r === 'wicket-keeper' || r === 'keeper') return 'Wicketkeeper';
  if (r === 'all-rounder' || r === 'allrounder') return 'All-Rounder';
  return role;
}
