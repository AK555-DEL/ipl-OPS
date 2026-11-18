'use strict';
// Run: node --test   (Node 18+). Boots a real server on a random port with a throwaway data dir.
const { test, before, after } = require('node:test'), assert = require('node:assert/strict');
const { spawn } = require('node:child_process'), fs = require('fs'), os = require('os'), path = require('path');
const PORT = 3900 + Math.floor(Math.random() * 500), DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'auction-'));
const URL = 'http://127.0.0.1:' + PORT; let proc;
const boot = (env = {}) => new Promise((ok, no) => {
  proc = spawn(process.execPath, ['server.js'], { cwd: __dirname, env: { ...process.env, PORT, DATA_DIR: DIR, NO_BACKUP_TIMER: '1', ...env } });
  let out = ''; proc.stdout.on('data', d => { out += d; if (out.includes('Operator:')) ok(); }); proc.stderr.on('data', d => out += d);
  proc.on('exit', c => no(new Error('server exited ' + c + '\n' + out)));
});
const stop = () => new Promise(r => { proc.removeAllListeners('exit'); proc.on('exit', r); proc.kill(); });
const get = async p => (await fetch(URL + p)).json();
const cmd = async b => { const r = await fetch(URL + '/api/cmd', { method: 'POST', body: JSON.stringify(b) }); return { ok: r.ok, ...(await r.json()) }; };
const ok = async b => { const r = await cmd(b); assert.ok(r.ok, JSON.stringify(b) + ' -> ' + r.error); };
const bad = async (b, re) => { const r = await cmd(b); assert.ok(!r.ok, 'should refuse ' + JSON.stringify(b)); assert.match(r.error, re); };
before(() => boot()); after(async () => { await stop(); fs.rmSync(DIR, { recursive: true, force: true }); });

test('photo flag matches the file on disk', async () => {
  const players = await get('/api/players');
  for (const p of players) {
    const rel = String(p.photo || '').replace(/^[/\\]+/, '');
    assert.equal(p.hasPhoto, fs.existsSync(path.join(__dirname, 'public', rel)), p.id);
  }
});

test('dataset loads: 180 players, 7 decks, 64 overseas, ordered by deck', async () => {
  const P = await get('/api/players'); assert.equal(P.length, 180);
  assert.equal(new Set(P.map(p => p.deck)).size, 7); assert.equal(P.filter(p => p.os).length, 64);
  assert.ok(P.every((p, i) => i === 0 || P[i - 1].deck <= p.deck));
  assert.equal((await get('/api/health')).ok, true);
});

test('per-player increments, no self-outbid, custom bid, undo restores purse', async () => {
  await ok({ type: 'next' }); let s = await get('/api/state');
  const p = s.lot.p; assert.equal(s.lot.price, p.base);
  await ok({ type: 'bid', team: 'mi' }); await bad({ type: 'bid', team: 'mi' }, /already holds/);
  await ok({ type: 'bid', team: 'csk' }); s = await get('/api/state'); assert.equal(s.lot.price, p.base + p.inc);
  await bad({ type: 'custom', team: 'rcb', price: s.lot.price }, /above/); await bad({ type: 'custom', team: 'rcb', price: s.lot.price + 3 }, /steps of 5/);
  await ok({ type: 'custom', team: 'rcb', price: 1000 });
  await bad({ type: 'unsold' }, /Bids exist/); await bad({ type: 'next' }, /Finish/);
  await ok({ type: 'sold' }); s = await get('/api/state');
  assert.equal(s.teams.find(t => t.id === 'rcb').purse, 12000 - 1000); assert.equal(s.last.t, 'SOLD');
  await ok({ type: 'undo' }); s = await get('/api/state');
  assert.equal(s.teams.find(t => t.id === 'rcb').purse, 12000); assert.equal(s.lot.team, 'rcb');
  await ok({ type: 'resetbid' }); s = await get('/api/state'); assert.equal(s.lot.team, null); assert.equal(s.lot.price, p.base);
  await ok({ type: 'unsold' }); s = await get('/api/state'); assert.equal(s.counts.unsold, 1);
  for (let i = 0; i < 6; i++) await ok({ type: 'undo' }); // CALL, 3 bids, RESET... all the way back
  await bad({ type: 'undo' }, /Nothing/); s = await get('/api/state'); assert.equal(s.seq, 0);
});

test('purse, squad size, overseas cap and reserve rule are enforced server-side', async () => {
  const P = await get('/api/players'), Ind = P.filter(p => !p.os), Os = P.filter(p => p.os);
  for (let i = 0; i < 8; i++) { await ok({ type: 'next', pid: Os[i].id }); await ok({ type: 'bid', team: 'gt' }); await ok({ type: 'sold' }); }
  await ok({ type: 'next', pid: Os[8].id }); await bad({ type: 'bid', team: 'gt' }, /Overseas/); await ok({ type: 'unsold' });
  await ok({ type: 'next', pid: Ind[0].id }); await ok({ type: 'bid', team: 'gt' }); // India still fine
  let s = await get('/api/state'); assert.equal(s.teams.find(t => t.id === 'gt').block, null);
  await ok({ type: 'resetbid' });
  // reserve: with 9 players held GT needs 8 more slots at 30 L = 240 L kept back after this buy
  const gt = s.teams.find(t => t.id === 'gt'); const maxOk = gt.purse - Math.max(0, 18 - (gt.n + 1)) * 30;
  await bad({ type: 'custom', team: 'gt', price: Math.ceil((maxOk + 5) / 5) * 5 }, /reserve/);
  await ok({ type: 'custom', team: 'gt', price: Math.floor(maxOk / 5) * 5 });
  await ok({ type: 'resetbid' }); await ok({ type: 'unsold' });
  await bad({ type: 'bid', team: 'mi' }, /No player/); await bad({ type: 'bid', team: 'xxx' }, /No player|Unknown/);
  await bad({ type: 'release', team: 'mi', pid: Os[0].id }, /not in MI/);
});

test('release returns the purse; accelerated round re-queues unsold', async () => {
  let s = await get('/api/state'); const before = s.teams.find(t => t.id === 'gt'), first = before.squad[0];
  await ok({ type: 'release', team: 'gt', pid: first.id }); s = await get('/api/state');
  assert.equal(s.teams.find(t => t.id === 'gt').purse, before.purse + first.price); assert.equal(s.status[first.id], undefined);
  assert.ok(s.counts.unsold >= 1); await ok({ type: 'accel' }); s = await get('/api/state'); assert.equal(s.counts.unsold, 0);
});

test('restart replays the log to the identical state', async () => {
  const a = await get('/api/state'); await stop(); await boot(); const b = await get('/api/state');
  assert.deepEqual(b, a);
});

test('security and delivery: PIN, path traversal, pages, SSE, export', async () => {
  for (const p of ['/operator', '/arena']) { const r = await fetch(URL + p); assert.equal(r.status, 200); assert.match(await r.text(), /<html/); }
  assert.equal((await fetch(URL + '/..%2fserver.js')).status, 404); assert.equal((await fetch(URL + '/%2e%2e/server.js')).status, 404);
  assert.equal((await fetch(URL + '/assets/players/deck_1/missing.png')).status, 404);
  assert.match(await (await fetch(URL + '/api/export.csv')).text(), /^player_id,name,deck,status,team,price_lakhs\nIPL-001/);
  const ac = new AbortController(), r = await fetch(URL + '/api/stream', { signal: ac.signal }), rd = r.body.getReader();
  const first = new TextDecoder().decode((await rd.read()).value); ac.abort(); assert.match(first, /^retry: 1000\ndata: \{/);
  await stop(); await boot({ PIN: '4321' });
  assert.equal((await fetch(URL + '/api/cmd', { method: 'POST', body: '{"type":"next"}' })).status, 401);
  assert.equal((await fetch(URL + '/api/cmd', { method: 'POST', headers: { 'x-pin': '4321' }, body: '{"type":"next"}' })).status, 200);
  await ok_pin();
});
async function ok_pin() { const r = await fetch(URL + '/api/cmd', { method: 'POST', headers: { 'x-pin': '4321' }, body: '{"type":"undo"}' }); assert.equal(r.status, 200); }

test('full dry run: all 180 players sold round-robin, ledger balances', async () => {
  await stop(); fs.rmSync(DIR, { recursive: true, force: true }); await boot();
  const P = await get('/api/players'), ids = (await get('/api/state')).teams.map(t => t.id); let sum = 0;
  for (let i = 0; i < P.length; i++) {
    await ok({ type: 'next' }); const t = ids[i % 10];
    await ok({ type: 'bid', team: t }); await ok({ type: 'bid', team: ids[(i + 1) % 10] }); await ok({ type: 'bid', team: t }); // base, base+inc, base+2inc
    await ok({ type: 'sold' }); sum += P[i].base + 2 * P[i].inc;
  }
  const s = await get('/api/state');
  assert.equal(s.counts.sold, 180); assert.equal(s.counts.left, 0); assert.equal(s.teams.reduce((a, t) => a + t.spent, 0), sum);
  assert.ok(s.teams.every(t => t.n === 18 && t.os <= 8 && t.purse >= 0)); assert.equal(s.feasibility.ok, true);
  await bad({ type: 'next' }, /No players left/);
});
