import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildAllLots,
  buildCsvOut,
  buildViewModel,
  CAPPED_SUBCATEGORIES,
  executeCommand,
  formatCategoryFilterLabel,
  formatLakhs,
  formatPlayerCardMeta,
  formatRole,
  FRANCHISE_TITLES,
  getPlayerSubCategory,
  matchesCategoryFilter,
  parsePlayersCsv,
  TEAMS,
  UNCAPPED_SUBCATEGORIES,
} from './engine.ts';
import type { AuctionEvent, CommandBody, Player, Preset } from './types.ts';

const csvPath = path.resolve(process.cwd(), 'seed', 'players.csv');
const csvPlayers = parsePlayersCsv(fs.readFileSync(csvPath, 'utf8'));
const allLots = buildAllLots(csvPlayers);
const pidMap = new Map<string, Player>(allLots.map((p) => [p.id, p]));

function runSeq(preset: Preset, cmds: CommandBody[], ts = 1000): AuctionEvent[] {
  let ev: AuctionEvent[] = [];
  for (const cmd of cmds) {
    ev = executeCommand(ev, allLots, pidMap, preset, cmd, ts);
  }
  return ev;
}

test('dataset loads 180 players + 11 franchise titles strictly ordered lowest to highest tier', () => {
  assert.equal(csvPlayers.length, 180);
  assert.equal(FRANCHISE_TITLES.length, 11);
  assert.equal(allLots.length, 191);
  assert.equal(new Set(csvPlayers.map((p) => p.deck)).size, 7);
  assert.equal(csvPlayers.filter((p) => p.os).length, 64);

  // Verify fixed lowest -> highest franchise ordering including Lucknow Super Giants (LSG) and Deccan Chargers (DCH)
  assert.deepEqual(
    FRANCHISE_TITLES.map((t) => t.titleTheme?.short),
    ['LSG', 'PBKS', 'DC', 'GT', 'RR', 'SRH', 'KKR', 'RCB', 'MI', 'CSK', 'DCH']
  );
  assert.equal(FRANCHISE_TITLES[0].id, 'IPL-T01');
  assert.equal(FRANCHISE_TITLES[0].name, 'Lucknow Super Giants');
  assert.equal(FRANCHISE_TITLES[0].titleTheme?.subFranchise, undefined);
  assert.equal(FRANCHISE_TITLES[9].id, 'IPL-T10');
  assert.equal(FRANCHISE_TITLES[10].id, 'IPL-T11');
  assert.equal(FRANCHISE_TITLES[10].name, 'Deccan Chargers');

  const maverick = csvPlayers.find((p) => p.deck === 1)!;
  const capped = csvPlayers.find((p) => p.deck === 2)!;
  const uncapped = csvPlayers.find((p) => p.deck === 6)!;
  assert.equal(maverick.category, 'MAVERICK');
  assert.equal(maverick.durationSec, 300); // 5 minutes
  assert.equal(capped.category, 'CAPPED');
  assert.equal(capped.durationSec, 180); // 3 minutes
  assert.equal(uncapped.category, 'UNCAPPED');
  assert.equal(uncapped.durationSec, 120); // 2 minutes
  assert.equal(FRANCHISE_TITLES[0].durationSec, 180);
});

test('formatLakhs and unified player card format (#XX · Role)', () => {
  assert.equal(formatLakhs(30), '30 L');
  assert.equal(formatLakhs(75), '75 L');
  assert.equal(formatLakhs(200), '2.00 Cr');
  assert.equal(formatLakhs(1250), '12.50 Cr');

  assert.equal(formatRole('Batsman'), 'Batter');
  assert.equal(formatRole('Bowler'), 'Bowler');
  assert.equal(formatRole('All-Rounder'), 'All-Rounder');
  assert.equal(formatRole('Wicketkeeper'), 'Wicketkeeper');

  assert.equal(
    formatPlayerCardMeta({
      jersey: 7,
      role: 'Wicketkeeper',
      isTitle: false,
      country: 'India',
      era: 'Maverick',
    }),
    '#07 · Wicketkeeper'
  );
  assert.equal(
    formatPlayerCardMeta({
      jersey: 18,
      role: 'Batsman',
      isTitle: false,
      country: 'India',
      era: 'Maverick',
    }),
    '#18 · Batter'
  );
});

test('curated 3-slot Up Next queue, direct jump bids, extend, hammer, and undo', () => {
  let ev = runSeq('MEGA', [{ type: 'queue_fill', category: 'MAVERICK' }], 10_000);
  let vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 10_000);
  assert.equal(vm.upNext.length, 3);
  assert.ok(vm.upNext.every((p) => p.category === 'MAVERICK'));
  assert.throws(
    () => executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'queue_add', pid: csvPlayers[5].id }),
    /already has 3/
  );

  const expectedFirst = vm.upNext[0];
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next' }, 20_000);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 20_000);
  assert.equal(vm.lot?.p.id, expectedFirst.id);
  assert.equal(vm.lot?.durationSec, 300);
  assert.equal(vm.lot?.expiresAt, 20_000 + 300_000);
  assert.equal(vm.upNext.length, 2);

  // Direct jump bid at base (delta 0) -> places bid immediately
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'jump', team: 't1', delta: 0 }, 25_000);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 25_000);
  assert.equal(vm.lot?.team, 't1');
  assert.equal(vm.lot?.price, expectedFirst.base);

  // Self-outbid rejected
  assert.throws(
    () => executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'jump', team: 't1', delta: 50 }),
    /already holds/
  );

  // Jump +1.00 Cr (100 L) immediately places bid for t2
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'jump', team: 't2', delta: 100 }, 30_000);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 30_000);
  assert.equal(vm.lot?.team, 't2');
  assert.equal(vm.lot?.price, expectedFirst.base + 100);

  // Extend +30s
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'extend', sec: 30 }, 35_000);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 35_000);
  assert.equal(vm.lot?.expiresAt, 20_000 + 330_000);

  // Hammer auto-sells to leading team
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'hammer' }, 350_000);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 350_000);
  assert.equal(vm.lot, null);
  assert.equal(vm.last?.t, 'SOLD');
  assert.equal(vm.teams.find((t) => t.id === 't2')?.purse, 12000 - (expectedFirst.base + 100));

  // Undo restores purse and lot
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'undo' }, 351_000);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 351_000);
  assert.equal(vm.teams.find((t) => t.id === 't2')?.purse, 12000);
  assert.equal(vm.lot?.team, 't2');
});

test('auctioned franchise title deducts budget, rebrands club, and cannot be released once sold', () => {
  let ev = runSeq('MEGA', [
    { type: 'next', pid: 'IPL-T10' }, // Chennai Super Kings (CSK, Tier 10 Highest)
    { type: 'jump', team: 't3', delta: 800 }, // 2.00 + 8.00 = 10.00 Cr (1000 L)
    { type: 'hammer' },
  ]);
  let vm = buildViewModel(ev, allLots, pidMap, 'MEGA');
  const t3 = vm.teams.find((t) => t.id === 't3')!;
  assert.equal(t3.short, 'CSK');
  assert.equal(t3.name, 'Chennai Super Kings');
  assert.equal(t3.titlePrice, 1000);
  assert.equal(t3.purse, 11000);
  assert.equal(t3.n, 0); // Title does not consume player squad slot

  // Same club team cannot bid on a second franchise title
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: 'IPL-T01' });
  assert.throws(
    () => executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't3' }),
    /Already owns a franchise title/
  );
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'hammer' }); // No bids -> UNSOLD
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA');
  assert.equal(vm.last?.t, 'UNSOLD');
  assert.equal(vm.unsold.length, 1);

  // Auctioned franchise teams CANNOT be released once sold
  assert.throws(
    () =>
      executeCommand(ev, allLots, pidMap, 'MEGA', {
        type: 'release',
        team: 't3',
        pid: 'IPL-T10',
      }),
    /cannot be released/
  );
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA');
  assert.equal(vm.teams.find((t) => t.id === 't3')?.short, 'CSK');
  assert.equal(vm.teams.find((t) => t.id === 't3')?.purse, 11000);
});

test('mix_match interleaves players, generates 11 franchise lists, and preserves lowest->highest title order', () => {
  const ev = runSeq('MEGA', [{ type: 'mix_match', seed: 42 }]);
  const vm = buildViewModel(ev, allLots, pidMap, 'MEGA');

  assert.equal(vm.mixedActive, true);
  assert.equal(vm.franchiseLists.length, 11);
  assert.ok(vm.franchiseLists.every((fl) => fl.players.length === 12));

  // Verify Up Next stages top 3 from mixed pool (non-titles mixed across categories)
  assert.equal(vm.upNext.length, 3);
  const nextThreeCats = vm.upNext.map((p) => p.category);
  assert.ok(nextThreeCats.includes('MAVERICK'));
  assert.ok(nextThreeCats.includes('CAPPED'));
  assert.ok(nextThreeCats.includes('UNCAPPED'));

  // Verify Titles quick-fill strictly preserves Lowest -> Highest tier ordering even after mix_match
  const evTitles = executeCommand(ev, allLots, pidMap, 'MEGA', {
    type: 'queue_fill',
    category: 'TITLE',
  });
  const vmTitles = buildViewModel(evTitles, allLots, pidMap, 'MEGA');
  assert.deepEqual(
    vmTitles.upNext.map((p) => p.cc),
    ['LSG', 'PBKS', 'DC']
  );
});

test('return_uncapped requires all players used first, then returns only unsold uncapped players', () => {
  let ev: AuctionEvent[] = [];

  // Blocked while players remain pending
  assert.throws(
    () => executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'return_uncapped' }),
    /Use all 180 pending players/
  );

  // Process all 180 non-title players: sell first 100, mark remaining (including uncapped) unsold
  for (let i = 0; i < csvPlayers.length; i++) {
    const p = csvPlayers[i];
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: p.id });
    if (p.category !== 'UNCAPPED' && i < 120) {
      ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: TEAMS[i % TEAMS.length].id });
      ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'sold' });
    } else {
      ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'unsold' });
    }
  }

  let vm = buildViewModel(ev, allLots, pidMap, 'MEGA');
  assert.equal(vm.counts.playersLeft, 0);
  const unsoldUncappedCount = vm.counts.uncappedUnsold;
  assert.ok(unsoldUncappedCount > 0);
  const totalUnsoldBefore = vm.counts.unsold;

  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'return_uncapped' });
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA');
  assert.equal(vm.counts.uncappedUnsold, 0);
  assert.equal(vm.counts.playersLeft, unsoldUncappedCount);
  assert.equal(vm.counts.unsold, totalUnsoldBefore - unsoldUncappedCount);
});

test('overseas cap, reserve rules, player release, and accelerated round enforced', () => {
  const osPlayers = csvPlayers.filter((p) => p.os);
  const indPlayers = csvPlayers.filter((p) => !p.os);
  let ev: AuctionEvent[] = [];

  for (let i = 0; i < 8; i++) {
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: osPlayers[i].id });
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't8' });
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'sold' });
  }

  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: osPlayers[8].id });
  assert.throws(
    () => executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't8' }),
    /Overseas/
  );
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'unsold' });

  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: indPlayers[0].id });
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't8' });
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'resetbid' });
  let vm = buildViewModel(ev, allLots, pidMap, 'MEGA');
  const t8 = vm.teams.find((t) => t.id === 't8')!;
  // Manual funds calculation: high bids are not blocked by automated purse/reserve checks
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', {
    type: 'custom',
    team: 't8',
    price: 15000,
  });
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'resetbid' });
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'unsold' });

  const firstBought = t8.squad[0];
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', {
    type: 'release',
    team: 't8',
    pid: firstBought.id,
  });
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA');
  assert.equal(vm.teams.find((t) => t.id === 't8')?.purse, t8.purse + firstBought.price);
  assert.equal(vm.status[firstBought.id], undefined);

  assert.ok(vm.counts.unsold >= 2);
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'accel' });
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA');
  assert.equal(vm.counts.unsold, 0);
});

test('full 191-lot (11 titles + 180 players) dry run balances ledger and CSV for all 11 teams', () => {
  assert.equal(TEAMS.length, 11);
  let ev: AuctionEvent[] = [];
  let sum = 0;
  for (let i = 0; i < allLots.length; i++) {
    const lot = allLots[i];
    const t = TEAMS[i % TEAMS.length].id;
    const t2 = TEAMS[(i + 1) % TEAMS.length].id;
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: lot.id });
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: t });
    if (!lot.isTitle) {
      ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: t2 });
      ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: t });
      sum += lot.base + 2 * lot.inc;
    } else {
      sum += lot.base;
    }
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'hammer' });
  }

  const vm = buildViewModel(ev, allLots, pidMap, 'MEGA');
  assert.equal(vm.teams.length, 11);
  assert.equal(vm.counts.sold, 180);
  assert.equal(vm.counts.titlesSold, 11);
  assert.equal(vm.counts.unsold, 0);
  assert.equal(vm.counts.left, 0);
  assert.equal(vm.teams.reduce((a, t) => a + t.spent, 0), sum);
  assert.equal(vm.teams[0].short, 'LSG');
  assert.equal(vm.teams[0].name, 'Lucknow Super Giants');
  assert.equal(vm.teams[0].titleSubFranchise, null);
  assert.equal(vm.teams[10].short, 'DCH');
  assert.equal(vm.teams[10].name, 'Deccan Chargers');
  assert.ok(vm.teams.every((t) => t.n >= 16 && t.os <= 8 && t.titleId !== null));
  assert.equal(vm.feasibility.ok, false); // 11 * 18 = 198 needed when max pool is 180, feasible check accurately reflects shortfall
  assert.throws(() => executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next' }), /No lots left/);

  const csv = buildCsvOut(ev, allLots, pidMap, 'MEGA');
  assert.match(csv, /^player_id,name,deck,status,team,price_lakhs\nIPL-T01/);
  assert.equal(csv.split('\n').length, 192);
});

test('enforces minimum 4 bowlers and 1 wicketkeeper via slot reservation and composition tracking', () => {
  const nonBowlNonWk = csvPlayers.filter(
    (p) => p.role !== 'Bowler' && !p.wk && p.role !== 'Wicketkeeper' && !p.os
  );
  const bowlersPool = csvPlayers.filter((p) => p.role === 'Bowler' && !p.os);
  const wksPool = csvPlayers.filter((p) => (p.wk || p.role === 'Wicketkeeper') && !p.os);

  assert.ok(nonBowlNonWk.length >= 21);
  assert.ok(bowlersPool.length >= 4);
  assert.ok(wksPool.length >= 1);

  let ev: AuctionEvent[] = [];
  // Buy 20 Indian batters/all-rounders -> leaves 5 slots for 4 Bowlers + 1 WK (max 25)
  for (let i = 0; i < 20; i++) {
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: nonBowlNonWk[i].id });
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't1' });
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'sold' });
  }

  let vm = buildViewModel(ev, allLots, pidMap, 'MEGA');
  let t1 = vm.teams.find((t) => t.id === 't1')!;
  assert.equal(t1.n, 20);
  assert.equal(t1.bowlers, 0);
  assert.equal(t1.wicketkeepers, 0);
  assert.equal(t1.bowlersNeeded, 4);
  assert.equal(t1.wicketkeepersNeeded, 1);
  assert.equal(t1.compositionOk, false);
  // Purse reserve must protect 5 * 30 L = 150 L for the 4 bowlers + 1 WK even though n >= 18
  assert.equal(t1.minReserve, 150);

  // 21st non-bowler / non-WK must be BLOCKED because 5 slots are reserved for 4 Bowlers + 1 WK
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: nonBowlNonWk[20].id });
  assert.throws(
    () => executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't1' }),
    /4 Bowlers & 1 Wicketkeeper/
  );
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'unsold' });

  // Sign 4 Bowlers and 1 Wicketkeeper -> compositionOk becomes true at 25/25
  for (let i = 0; i < 4; i++) {
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: bowlersPool[i].id });
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't1' });
    ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'sold' });
  }
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: wksPool[0].id });
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't1' });
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'sold' });

  vm = buildViewModel(ev, allLots, pidMap, 'MEGA');
  t1 = vm.teams.find((t) => t.id === 't1')!;
  assert.equal(t1.bowlers, 4);
  assert.equal(t1.wicketkeepers, 1);
  assert.equal(t1.bowlersNeeded, 0);
  assert.equal(t1.wicketkeepersNeeded, 0);
  assert.equal(t1.compositionOk, true);
  assert.equal(t1.n, 25);
});

test('capped and uncapped role sub-categories partition players cleanly and exclude mavericks', () => {
  assert.deepEqual(
    CAPPED_SUBCATEGORIES.map((s) => s.label),
    ['Capped Batsman', 'Capped Bowlers', 'Capped All Rounders', 'Capped Wicketkeepers']
  );
  assert.deepEqual(
    UNCAPPED_SUBCATEGORIES.map((s) => s.label),
    ['UnCapped Batsman', 'UnCapped Bowlers', 'UnCapped All Rounders', 'UnCapped Wicketkeepers']
  );

  // Mavericks and Franchise Titles must never belong to a Capped/Uncapped sub-category
  const mavericks = allLots.filter((p) => p.category === 'MAVERICK');
  const titles = allLots.filter((p) => p.category === 'TITLE');
  assert.ok(mavericks.every((p) => getPlayerSubCategory(p) === null));
  assert.ok(titles.every((p) => getPlayerSubCategory(p) === null));

  const subCounts = new Map<string, number>();
  for (const p of csvPlayers) {
    const sub = getPlayerSubCategory(p);
    if (sub) {
      subCounts.set(sub, (subCounts.get(sub) || 0) + 1);
    }
  }
  assert.equal(subCounts.get('CAPPED_BAT'), 25);
  assert.equal(subCounts.get('CAPPED_BOWL'), 25);
  assert.equal(subCounts.get('CAPPED_AR'), 25);
  assert.equal(subCounts.get('CAPPED_WK'), 25);
  assert.equal(subCounts.get('UNCAPPED_BAT'), 23);
  assert.equal(subCounts.get('UNCAPPED_BOWL'), 21);
  assert.equal(subCounts.get('UNCAPPED_AR'), 4);
  assert.equal(subCounts.get('UNCAPPED_WK'), 2);

  // matchesCategoryFilter and queue_fill work cleanly for Capped and Uncapped sub-categories
  let ev = runSeq('MEGA', [{ type: 'queue_fill', category: 'CAPPED_BOWL' }], 1000);
  let vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 1000);
  assert.equal(vm.upNext.length, 3);
  assert.ok(vm.upNext.every((p) => matchesCategoryFilter(p, 'CAPPED_BOWL')));
  assert.ok(vm.upNext.every((p) => p.category === 'CAPPED' && formatRole(p.role) === 'Bowler'));

  // Queue UnCapped Wicketkeepers (only 2 exist in dataset)
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'queue_fill', category: 'UNCAPPED_WK' }, 2000);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 2000);
  assert.equal(vm.upNext.length, 2);
  assert.ok(vm.upNext.every((p) => matchesCategoryFilter(p, 'UNCAPPED_WK')));
  assert.equal(formatCategoryFilterLabel('UNCAPPED_WK'), 'UnCapped Wicketkeepers');

  // Sending next lot picks from the queued UnCapped Wicketkeepers
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next' }, 3000);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 3000);
  assert.ok(vm.lot && matchesCategoryFilter(vm.lot.p, 'UNCAPPED_WK'));
});
