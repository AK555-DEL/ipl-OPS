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
  buildBidderHistoryFeed,
  buildBidderPlayerRows,
  filterBidderPlayerRows,
  getUndoPreview,
} from './bidderPanel.ts';

const csvPath = path.resolve(process.cwd(), 'seed', 'players.csv');
const csvPlayers = parsePlayersCsv(fs.readFileSync(csvPath, 'utf8'));
const allLots = buildAllLots(csvPlayers);
const pidMap = new Map<string, Player>(allLots.map((p) => [p.id, p]));

test('bidder panel builds all players with live, queued, sold, and unsold states', () => {
  const soldPlayer = csvPlayers[0];
  const unsoldPlayer = csvPlayers[1];
  const livePlayer = csvPlayers[2];
  const queuedPlayer = csvPlayers[3];

  let ev: AuctionEvent[] = [];
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: soldPlayer.id }, 1000);
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't1' }, 1100);
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'sold' }, 1200);

  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: unsoldPlayer.id }, 2000);
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'unsold' }, 2100);

  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'queue_add', pid: queuedPlayer.id }, 2500);
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: livePlayer.id }, 3000);
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't2' }, 3100);
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't3' }, 3200);

  const vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 3300);
  const rows = buildBidderPlayerRows(allLots, vm);

  assert.equal(rows.length, allLots.length);
  assert.equal(rows[0].id, livePlayer.id);
  assert.equal(rows[0].status, 'live');
  assert.equal(rows[1].id, queuedPlayer.id);
  assert.equal(rows[1].status, 'queued');

  const soldRow = rows.find((r) => r.id === soldPlayer.id)!;
  assert.equal(soldRow.status, 'sold');
  assert.equal(soldRow.ownerShort, 'T01');
  assert.equal(soldRow.soldPrice, soldPlayer.base);

  const unsoldRow = rows.find((r) => r.id === unsoldPlayer.id)!;
  assert.equal(unsoldRow.status, 'unsold');

  assert.equal(filterBidderPlayerRows(rows, '', 'live').length, 1);
  assert.equal(filterBidderPlayerRows(rows, '', 'sold').length, 1);
  assert.equal(filterBidderPlayerRows(rows, '', 'unsold').length, 1);
  assert.equal(filterBidderPlayerRows(rows, livePlayer.name.slice(0, 5), 'all')[0].id, livePlayer.id);
});

test('bidder panel history feed reflects direct bids and updates immediately after undo', () => {
  const lotPlayer = csvPlayers[0];
  let ev: AuctionEvent[] = [];
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'next', pid: lotPlayer.id }, 1000);
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't1' }, 1100);
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'bid', team: 't2' }, 1200);

  let vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 1300);
  let history = buildBidderHistoryFeed(vm);
  assert.equal(history.length, 2);
  assert.equal(history[0].teamId, 't2');
  assert.equal(history[0].isCurrentLot, true);
  assert.equal(history[1].teamId, 't1');

  const previewBeforeUndo = getUndoPreview(vm);
  assert.equal(previewBeforeUndo.canUndo, true);
  assert.match(previewBeforeUndo.label, /T02 bid/);

  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'undo' }, 1400);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 1400);
  history = buildBidderHistoryFeed(vm);
  assert.equal(history.length, 1);
  assert.equal(history[0].teamId, 't1');
  assert.equal(vm.lot?.team, 't1');

  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'undo' }, 1500);
  ev = executeCommand(ev, allLots, pidMap, 'MEGA', { type: 'undo' }, 1600);
  vm = buildViewModel(ev, allLots, pidMap, 'MEGA', 1600);
  assert.equal(getUndoPreview(vm).canUndo, false);
});
