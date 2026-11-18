import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  FRANCHISE_TITLES,
  buildAllLots,
  buildViewModel,
  executeCommand,
  parsePlayersCsv,
} from '../auction/engine.ts';
import {
  computeBiddingRateInfo,
  formatBasePriceShort,
  formatStageCardFields,
  getPopularityStars,
  resolveStageHoldPlayer,
} from './stageCard.ts';

const csvPath = path.resolve(process.cwd(), 'seed/players.csv');
const csvPlayers = parsePlayersCsv(fs.readFileSync(csvPath, 'utf8'));
const allLots = buildAllLots(csvPlayers);
const pidMap = new Map(allLots.map((p) => [p.id, p]));

test('formatStageCardFields maps all 180 CSV players cleanly with valid flags, prices, and stars', () => {
  assert.equal(csvPlayers.length, 180);
  const supportedCountryCodes = new Set([
    'IND',
    'RSA',
    'WI',
    'SL',
    'AUS',
    'NZ',
    'ENG',
    'AFG',
    'USA',
    'CAN',
  ]);

  for (const player of csvPlayers) {
    const fields = formatStageCardFields(player);
    assert.ok(fields.displayName.length > 0);
    assert.match(fields.jerseyLabel, /^#\d+$/);
    assert.ok(fields.stars >= 1 && fields.stars <= 5);
    assert.match(fields.battingValue, /^\d+ OVR$/);
    assert.ok(
      fields.secondaryHeader === 'KEEPING' || fields.secondaryHeader === 'BOWLING'
    );
    assert.ok(
      supportedCountryCodes.has(fields.countryCode),
      `Unsupported country code ${fields.countryCode} for ${player.name}`
    );
    assert.match(fields.basePriceLabel, /^₹\d+(\.\d+)? (Cr|L)$/);
  }
});

test('formatStageCardFields differentiates wicketkeepers, bowlers, and franchise titles including LSG & Deccan Chargers', () => {
  const kohli = csvPlayers.find((p) => p.name === 'Virat Kohli');
  assert.ok(kohli);
  const kohliFields = formatStageCardFields(kohli);
  assert.equal(kohliFields.displayName, 'VIRAT KOHLI');
  assert.equal(kohliFields.jerseyLabel, '#18');
  assert.equal(kohliFields.stars, 5);
  assert.equal(kohliFields.secondaryHeader, 'BOWLING');
  assert.equal(kohliFields.basePriceLabel, '₹2 Cr');
  assert.equal(kohliFields.countryCode, 'IND');

  const keeper = csvPlayers.find((p) => p.wk);
  assert.ok(keeper);
  const keeperFields = formatStageCardFields(keeper);
  assert.equal(keeperFields.secondaryHeader, 'KEEPING');
  assert.equal(keeperFields.secondaryValue, `${keeper.keep} WK`);

  const title = FRANCHISE_TITLES[0];
  const titleFields = formatStageCardFields(title);
  assert.equal(titleFields.displayName, 'LUCKNOW SUPER GIANTS');
  assert.equal(titleFields.subFranchiseLabel, null);
  assert.equal(titleFields.roleLabel, 'FRANCHISE');
  assert.equal(titleFields.jerseyLabel, 'T-1');
  assert.equal(titleFields.countryCode, 'LSG');

  const dch = FRANCHISE_TITLES.find((t) => t.id === 'IPL-T11');
  assert.ok(dch);
  assert.equal(formatStageCardFields(dch).displayName, 'DECCAN CHARGERS');
});

test('formatBasePriceShort and getPopularityStars normalize all slab values', () => {
  assert.equal(formatBasePriceShort(200), '₹2 Cr');
  assert.equal(formatBasePriceShort(150), '₹1.5 Cr');
  assert.equal(formatBasePriceShort(125), '₹1.25 Cr');
  assert.equal(formatBasePriceShort(100), '₹1 Cr');
  assert.equal(formatBasePriceShort(75), '₹75 L');
  assert.equal(formatBasePriceShort(30), '₹30 L');

  assert.equal(getPopularityStars(100), 5);
  assert.equal(getPopularityStars(85), 4);
  assert.equal(getPopularityStars(60), 3);
  assert.equal(getPopularityStars(40), 2);
  assert.equal(getPopularityStars(5), 5);
});

test('computeBiddingRateInfo tracks highest bidder, multiplier, and bid rate, and resolveStageHoldPlayer holds last sold player', () => {
  let events = executeCommand([], allLots, pidMap, 'MEGA', { type: 'next', pid: 'IPL-001' }, 10_000);
  events = executeCommand(events, allLots, pidMap, 'MEGA', { type: 'bid', team: 't1' }, 20_000);
  events = executeCommand(events, allLots, pidMap, 'MEGA', { type: 'bid', team: 't2' }, 40_000);

  let vm = buildViewModel(events, allLots, pidMap, 'MEGA', 40_000);
  assert.ok(vm.lot);
  const rate = computeBiddingRateInfo(vm.lot, vm.teams, 40_000);

  assert.equal(rate.leaderTeam?.id, 't2');
  assert.equal(rate.currentPriceLakhs, vm.lot.price);
  assert.equal(rate.bidCount, 2);
  assert.equal(rate.incrementLakhs, vm.lot.p.inc);
  assert.equal(rate.bidsPerMinute, '4.0');

  events = executeCommand(events, allLots, pidMap, 'MEGA', { type: 'hammer' }, 50_000);
  vm = buildViewModel(events, allLots, pidMap, 'MEGA', 50_000);
  assert.equal(vm.lot, null);
  const hold = resolveStageHoldPlayer(vm.lot, vm.last, vm.queue, allLots);
  assert.ok(hold);
  assert.equal(hold.holdMode, 'sold');
  assert.equal(hold.player.id, 'IPL-001');
  assert.equal(hold.outcomeTeamShort, 'T02');
});
