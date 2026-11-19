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
import type { AuctionEvent, Player } from '../auction/types.ts';
import {
  DASHBOARD_ROLE_QUOTAS,
  DASHBOARD_SQUAD_TARGET,
  computeTeamDashboardMetrics,
  countTeamsMeetingCriteria,
  formatRatingAvg,
  sortTeamDashboardMetrics,
} from './arenaDashboard.ts';

const csvPath = path.resolve(process.cwd(), 'seed', 'players.csv');
const csvPlayers = parsePlayersCsv(fs.readFileSync(csvPath, 'utf8'));
const allLots = buildAllLots(csvPlayers);
const pidMap = new Map<string, Player>(allLots.map((p) => [p.id, p]));

test('zero-state safety: empty squads produce 0 role counts, 0.0 averages, and stable sort order', () => {
  const vm = buildViewModel([], allLots, pidMap, 'MEGA', 1000);
  const metrics = computeTeamDashboardMetrics(vm.teams, allLots);
  assert.equal(metrics.length, 11);

  for (const m of metrics) {
    assert.equal(m.squadCount, 0);
    assert.equal(m.targetCount, DASHBOARD_SQUAD_TARGET);
    assert.equal(m.progressPct, 0);
    assert.deepEqual(m.roles, { bat: 0, bowl: 0, ar: 0, wk: 0 });
    assert.deepEqual(m.neededRoles, {
      bat: DASHBOARD_ROLE_QUOTAS.bat,
      bowl: DASHBOARD_ROLE_QUOTAS.bowl,
      ar: DASHBOARD_ROLE_QUOTAS.ar,
      wk: DASHBOARD_ROLE_QUOTAS.wk,
      total: DASHBOARD_SQUAD_TARGET,
    });
    assert.equal(m.popAvg, 0);
    assert.equal(m.batAvg, 0);
    assert.equal(m.bowlAvg, 0);
    assert.equal(m.overallScore, 0);
    assert.equal(formatRatingAvg(m.overallScore), '0.0');
    assert.equal(m.roleCriterionMet, false);
    assert.equal(m.fullCriterionMet, false);
  }

  for (const metric of ['overall', 'pop', 'bat', 'bowl'] as const) {
    const desc = sortTeamDashboardMetrics(metrics, metric, 'desc');
    const asc = sortTeamDashboardMetrics(metrics, metric, 'asc');
    assert.deepEqual(
      desc.map((x) => x.team.id),
      vm.teams.map((t) => t.id)
    );
    assert.deepEqual(
      asc.map((x) => x.team.id),
      vm.teams.map((t) => t.id)
    );
  }
});

test('real-time sync: tracks BAT/BOWL/AR/WK counts, averages, 12-player criterion, and undo updates', () => {
  const batters = csvPlayers.filter((p) => p.role === 'Batsman').slice(0, 5);
  const bowlers = csvPlayers.filter((p) => p.role === 'Bowler').slice(0, 4);
  const allRounders = csvPlayers.filter((p) => p.role === 'All-Rounder').slice(0, 3);
  const keepers = csvPlayers.filter((p) => p.wk).slice(0, 2);

  let ev: AuctionEvent[] = [];
  let ts = 1000;
  const sell = (player: Player, teamId: string) => {
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: player.id }, ts++);
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: teamId }, ts++);
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'sold' }, ts++);
  };

  // Build full 12-player compliant squad on t1: 4 BAT, 3 BOWL, 2 AR, 1 WK + 2 extra (1 BAT + 1 BOWL)
  for (const p of [...batters, ...bowlers, ...allRounders.slice(0, 2), keepers[0]]) {
    sell(p, 't1');
  }
  // Give t2 one bowler and one keeper
  sell(allRounders[2], 't2');
  sell(keepers[1], 't2');

  let vm = buildViewModel(ev, allLots, pidMap, 'MEGA', ts);
  let metrics = computeTeamDashboardMetrics(vm.teams, allLots);
  const t1 = metrics.find((m) => m.team.id === 't1')!;
  const t2 = metrics.find((m) => m.team.id === 't2')!;
  const t3 = metrics.find((m) => m.team.id === 't3')!;

  assert.equal(t1.squadCount, 12);
  assert.equal(t1.progressPct, 100);
  assert.deepEqual(t1.roles, { bat: 5, bowl: 4, ar: 2, wk: 1 });
  assert.equal(t1.roleCriterionMet, true);
  assert.equal(t1.fullCriterionMet, true);
  assert.equal(t1.missingSummary, '12/12 · Rules Met');

  assert.equal(t2.squadCount, 2);
  assert.deepEqual(t2.roles, { bat: 0, bowl: 0, ar: 1, wk: 1 });
  assert.equal(t2.roleCriterionMet, false);
  assert.equal(t2.fullCriterionMet, false);
  assert.equal(t2.neededRoles.bat, 4);
  assert.equal(t2.neededRoles.bowl, 3);
  assert.equal(t2.neededRoles.ar, 1);
  assert.equal(t2.neededRoles.wk, 0);

  const summary = countTeamsMeetingCriteria(metrics);
  assert.equal(summary.fullMetCount, 1);
  assert.equal(summary.roleMetCount, 1);
  assert.equal(summary.totalTeams, 11);

  // Verify two-way sorting across all 4 metrics places populated teams vs 0-player t3 properly
  for (const metric of ['overall', 'pop', 'bat', 'bowl'] as const) {
    const desc = sortTeamDashboardMetrics(metrics, metric, 'desc');
    const asc = sortTeamDashboardMetrics(metrics, metric, 'asc');
    assert.ok(desc[0].team.id === 't1' || desc[0].team.id === 't2');
    assert.equal(asc[0].squadCount, 0);
    assert.equal(asc[0].team.id, t3.team.id);
    assert.ok(desc[desc.length - 1].squadCount === 0);
  }

  // Verify averages match exact player values for t2
  const expectedPop = Math.round(((allRounders[2].pop + keepers[1].pop) / 2) * 10) / 10;
  const expectedBat = Math.round(((allRounders[2].bat + keepers[1].bat) / 2) * 10) / 10;
  const expectedBowl = Math.round(((allRounders[2].bowl + keepers[1].bowl) / 2) * 10) / 10;
  assert.equal(t2.popAvg, expectedPop);
  assert.equal(t2.batAvg, expectedBat);
  assert.equal(t2.bowlAvg, expectedBowl);
  assert.equal(
    t2.overallScore,
    Math.round(((expectedPop + expectedBat + expectedBowl) / 3) * 10) / 10
  );

  // Undo last SOLD (keepers[1] from t2) -> t2 immediately drops to 1 player, wk = 0
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'undo' }, ts++);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', ts);
  metrics = computeTeamDashboardMetrics(vm.teams, allLots);
  const t2AfterUndo = metrics.find((m) => m.team.id === 't2')!;
  assert.equal(t2AfterUndo.squadCount, 1);
  assert.deepEqual(t2AfterUndo.roles, { bat: 0, bowl: 0, ar: 1, wk: 0 });
  assert.equal(t2AfterUndo.popAvg, Math.round(allRounders[2].pop * 10) / 10);
});
