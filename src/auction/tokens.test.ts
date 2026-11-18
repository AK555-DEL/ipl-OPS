import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyTokenStore,
  generateAllTeamTokens,
  generateHostSessionToken,
  generateSubOpPins,
  generateSubOpSessionToken,
  normalizeToken,
  resolveSubOpByPin,
  resolveTeamIdByToken,
} from './tokens.ts';
import { TEAMS } from './engine.ts';

test('generates 11 unique non-empty tokens for Team 1 through Team 11 and resolves them cleanly', () => {
  const tokens = generateAllTeamTokens(TEAMS);
  assert.equal(Object.keys(tokens).length, 11);
  const values = Object.values(tokens);
  assert.equal(new Set(values).size, 11);

  // Team 1, Team 2, Team 3, Team 11 each have distinct tokens
  assert.notEqual(tokens.t1, tokens.t2);
  assert.notEqual(tokens.t2, tokens.t3);
  assert.notEqual(tokens.t10, tokens.t11);
  assert.match(tokens.t1, /^T01-[A-Z0-9]{4}$/);
  assert.match(tokens.t2, /^T02-[A-Z0-9]{4}$/);
  assert.match(tokens.t11, /^T11-[A-Z0-9]{4}$/);

  // Resolution ignores whitespace/case
  assert.equal(resolveTeamIdByToken(tokens, ` ${tokens.t2.toLowerCase()} `), 't2');
  assert.equal(resolveTeamIdByToken(tokens, 'INVALID-0000'), null);
  assert.equal(normalizeToken('  t03-ab12 '), 'T03-AB12');
});

test('generateHostSessionToken returns distinct HOST-* tokens', () => {
  const a = generateHostSessionToken();
  const b = generateHostSessionToken();
  assert.match(a, /^HOST-[A-F0-9]{24}$/);
  assert.notEqual(a, b);
});

test('generates distinct 6-digit sub-operator PINs for Display (Arena 1) and Bids Operator', () => {
  const pins = generateSubOpPins();
  assert.match(pins.displayPin, /^\d{6}$/);
  assert.match(pins.bidsPin, /^\d{6}$/);
  assert.notEqual(pins.displayPin, pins.bidsPin);

  const store = { ...createEmptyTokenStore(), ...pins };
  assert.equal(resolveSubOpByPin(store, ` ${pins.displayPin} `), 'display');
  assert.equal(resolveSubOpByPin(store, pins.bidsPin), 'bids');
  assert.equal(resolveSubOpByPin(store, '000000'), null);

  const dispTok = generateSubOpSessionToken('display');
  const bidsTok = generateSubOpSessionToken('bids');
  assert.match(dispTok, /^SUBOP-DISP-[A-F0-9]{20}$/);
  assert.match(bidsTok, /^SUBOP-BIDS-[A-F0-9]{20}$/);
});
