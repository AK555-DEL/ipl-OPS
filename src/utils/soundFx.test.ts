import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampAudioVolume,
  detectAuctionCue,
  getGlobalAudioSettings,
  setGlobalAudioSettings,
  type AuctionCueSnapshot,
} from './soundFx';

function snap(partial: Partial<AuctionCueSnapshot> = {}): AuctionCueSnapshot {
  return {
    seq: 0,
    lotId: null,
    bidCount: 0,
    lotCategory: null,
    lastOutcomeType: null,
    lastOutcomeIsTitle: false,
    lastTs: null,
    ...partial,
  };
}

test('detectAuctionCue returns null on initial mount', () => {
  assert.equal(detectAuctionCue(null, snap({ seq: 3, lotId: 'IPL-056' }), 180, null), null);
});

test('detectAuctionCue triggers LOT_OPEN when a new lot enters the arena', () => {
  const prev = snap({ seq: 1, lotId: null });
  const next = snap({ seq: 2, lotId: 'IPL-056', lotCategory: 'MAVERICK', bidCount: 0 });
  assert.equal(detectAuctionCue(prev, next, 300, null), 'LOT_OPEN');
});

test('detectAuctionCue triggers BID_ACCEPTED for bids 1-2 and BIDDING_WAR at 3+ bids', () => {
  const open = snap({ seq: 2, lotId: 'IPL-056', bidCount: 0 });
  const bid1 = snap({ seq: 3, lotId: 'IPL-056', bidCount: 1 });
  const bid2 = snap({ seq: 4, lotId: 'IPL-056', bidCount: 2 });
  const bid3 = snap({ seq: 5, lotId: 'IPL-056', bidCount: 3 });

  assert.equal(detectAuctionCue(open, bid1, 290, 291), 'BID_ACCEPTED');
  assert.equal(detectAuctionCue(bid1, bid2, 288, 290), 'BID_ACCEPTED');
  assert.equal(detectAuctionCue(bid2, bid3, 285, 288), 'BIDDING_WAR');
});

test('detectAuctionCue triggers SOLD, TITLE_SOLD, and UNSOLD on lot hammer', () => {
  const activePlayer = snap({ seq: 5, lotId: 'IPL-056', lotCategory: 'MAVERICK', bidCount: 3 });
  const soldPlayer = snap({
    seq: 6,
    lotId: null,
    lastOutcomeType: 'SOLD',
    lastOutcomeIsTitle: false,
    lastTs: 1000,
  });
  assert.equal(detectAuctionCue(activePlayer, soldPlayer, 0, 12), 'SOLD');

  const activeTitle = snap({ seq: 6, lotId: 'IPL-T03', lotCategory: 'TITLE', bidCount: 2 });
  const soldTitle = snap({
    seq: 7,
    lotId: null,
    lastOutcomeType: 'SOLD',
    lastOutcomeIsTitle: true,
    lastTs: 2000,
  });
  assert.equal(detectAuctionCue(activeTitle, soldTitle, 0, 10), 'TITLE_SOLD');

  const activeUnsold = snap({ seq: 7, lotId: 'IPL-099', lotCategory: 'UNCAPPED', bidCount: 0 });
  const unsold = snap({
    seq: 8,
    lotId: null,
    lastOutcomeType: 'UNSOLD',
    lastOutcomeIsTitle: false,
    lastTs: 3000,
  });
  assert.equal(detectAuctionCue(activeUnsold, unsold, 0, 1), 'UNSOLD');
});

test('detectAuctionCue triggers TICK_WARNING once per second in final 10 seconds', () => {
  const active = snap({ seq: 4, lotId: 'IPL-056', bidCount: 2 });
  assert.equal(detectAuctionCue(active, active, 10, 11), 'TICK_WARNING');
  assert.equal(detectAuctionCue(active, active, 10, 10), null);
  assert.equal(detectAuctionCue(active, active, 9, 10), 'TICK_WARNING');
  assert.equal(detectAuctionCue(active, active, 15, 16), null);
});

test('global audio settings clamp volume and toggle mute cleanly', () => {
  assert.equal(clampAudioVolume(-0.4), 0);
  assert.equal(clampAudioVolume(1.8), 1);
  assert.equal(clampAudioVolume(0.456), 0.46);

  const updated = setGlobalAudioSettings({ muted: true, volume: 0.4 });
  assert.equal(updated.muted, true);
  assert.equal(updated.volume, 0.4);
  assert.deepEqual(getGlobalAudioSettings(), { muted: true, volume: 0.4 });

  setGlobalAudioSettings({ muted: false, volume: 0.75 });
});
