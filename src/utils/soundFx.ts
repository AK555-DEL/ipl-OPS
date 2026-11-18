import type { AuctionViewModel, LotCategory } from '../auction/types.ts';

export type AuctionAudioCue =
  | 'LOT_OPEN'
  | 'BID_ACCEPTED'
  | 'BIDDING_WAR'
  | 'TITLE_SOLD'
  | 'SOLD'
  | 'UNSOLD'
  | 'TICK_WARNING';

export interface AuctionCueSnapshot {
  seq: number;
  lotId: string | null;
  bidCount: number;
  lotCategory: LotCategory | null;
  lastOutcomeType: 'SOLD' | 'UNSOLD' | null;
  lastOutcomeIsTitle: boolean;
  lastTs: number | null;
}

export function createCueSnapshot(vm: AuctionViewModel): AuctionCueSnapshot {
  return {
    seq: vm.seq,
    lotId: vm.lot?.p.id ?? null,
    bidCount: vm.lot?.bidCount ?? 0,
    lotCategory: vm.lot?.category ?? null,
    lastOutcomeType: vm.last?.t ?? null,
    lastOutcomeIsTitle: Boolean(vm.last?.p.isTitle),
    lastTs: vm.last?.ts ?? null,
  };
}

/**
 * Pure state-transition classifier for auction audio cues.
 * Returns the distinct cue to trigger when the auction state advances,
 * or null if no audio cue should play for this update.
 */
export function detectAuctionCue(
  prev: AuctionCueSnapshot | null,
  next: AuctionCueSnapshot,
  remainingSec = 0,
  prevTickSec: number | null = null
): AuctionAudioCue | null {
  if (!prev) {
    return null;
  }

  // 1. Lot completed (SOLD / TITLE_SOLD / UNSOLD)
  if (next.seq > prev.seq && prev.lotId && !next.lotId && next.lastOutcomeType) {
    if (next.lastOutcomeType === 'SOLD') {
      return next.lastOutcomeIsTitle ? 'TITLE_SOLD' : 'SOLD';
    }
    return 'UNSOLD';
  }

  // 2. Also detect outcome if seq jumped directly from idle or rapid transition
  if (
    next.seq > prev.seq &&
    !next.lotId &&
    next.lastOutcomeType &&
    next.lastTs !== prev.lastTs
  ) {
    if (next.lastOutcomeType === 'SOLD') {
      return next.lastOutcomeIsTitle ? 'TITLE_SOLD' : 'SOLD';
    }
    return 'UNSOLD';
  }

  // 3. New lot opened on the arena floor
  if (next.lotId && next.lotId !== prev.lotId) {
    return 'LOT_OPEN';
  }

  // 4. Bid accepted / escalated into a bidding war on active lot
  if (next.lotId && next.lotId === prev.lotId && next.bidCount > prev.bidCount) {
    return next.bidCount >= 3 ? 'BIDDING_WAR' : 'BID_ACCEPTED';
  }

  // 5. Final 10-second urgent countdown tick
  if (
    next.lotId &&
    remainingSec > 0 &&
    remainingSec <= 10 &&
    prevTickSec !== remainingSec
  ) {
    return 'TICK_WARNING';
  }

  return null;
}

export interface GlobalAudioSettings {
  muted: boolean;
  volume: number; // 0 to 1
}

const AUDIO_SETTINGS_KEY = 'ipl_auction_audio_settings';
let globalAudioSettings: GlobalAudioSettings = {
  muted: false,
  volume: 0.75,
};
const audioSubscribers = new Set<(next: GlobalAudioSettings) => void>();

export function clampAudioVolume(val: number): number {
  if (!Number.isFinite(val)) return 0.75;
  return Math.max(0, Math.min(1, Math.round(val * 100) / 100));
}

function hydrateAudioSettings(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<GlobalAudioSettings>;
    globalAudioSettings = {
      muted: Boolean(parsed.muted),
      volume: clampAudioVolume(typeof parsed.volume === 'number' ? parsed.volume : 0.75),
    };
  } catch {
    // Ignore storage read error
  }
}

hydrateAudioSettings();

export function getGlobalAudioSettings(): GlobalAudioSettings {
  return { ...globalAudioSettings };
}

export function setGlobalAudioSettings(partial: Partial<GlobalAudioSettings>): GlobalAudioSettings {
  globalAudioSettings = {
    muted: typeof partial.muted === 'boolean' ? partial.muted : globalAudioSettings.muted,
    volume:
      typeof partial.volume === 'number'
        ? clampAudioVolume(partial.volume)
        : globalAudioSettings.volume,
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(globalAudioSettings));
    } catch {
      // Ignore storage error
    }
  }
  const snapshot = getGlobalAudioSettings();
  for (const cb of audioSubscribers) {
    cb(snapshot);
  }
  return snapshot;
}

export function subscribeGlobalAudioSettings(
  cb: (next: GlobalAudioSettings) => void
): () => void {
  audioSubscribers.add(cb);
  return () => {
    audioSubscribers.delete(cb);
  };
}

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'triangle',
  gainPeak = 0.08,
  delaySec = 0
) {
  if (globalAudioSettings.muted || globalAudioSettings.volume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;
  const scaledPeak = Math.max(0.0002, gainPeak * globalAudioSettings.volume);
  try {
    const start = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(scaledPeak, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  } catch {
    // Ignore Web Audio autoplay restrictions or closed contexts
  }
}

export function playLotOpenCue() {
  playTone(440, 0.11, 'triangle', 0.075, 0);
  playTone(659.25, 0.18, 'sine', 0.085, 0.08);
}

export function playBidAcceptedCue(streakCount = 1) {
  const pitchBoost = Math.min(200, streakCount * 20);
  playTone(520 + pitchBoost, 0.1, 'triangle', 0.09, 0);
  playTone(780 + pitchBoost, 0.14, 'sine', 0.075, 0.05);
}

export function playBidWarCue(streakCount = 3) {
  const pitchBoost = Math.min(260, streakCount * 24);
  playTone(580 + pitchBoost, 0.09, 'square', 0.05, 0);
  playTone(760 + pitchBoost, 0.1, 'triangle', 0.085, 0.05);
  playTone(980 + pitchBoost, 0.15, 'sine', 0.085, 0.1);
}

export function playTitleSoldCue() {
  playTone(392.0, 0.14, 'triangle', 0.1, 0);
  playTone(523.25, 0.14, 'triangle', 0.1, 0.08);
  playTone(659.25, 0.16, 'triangle', 0.11, 0.16);
  playTone(783.99, 0.22, 'sine', 0.12, 0.24);
  playTone(1046.5, 0.36, 'sine', 0.12, 0.34);
}

export function playBidSound(streakCount = 1) {
  playBidAcceptedCue(streakCount);
}

export function playSoldFanfare() {
  playTone(523.25, 0.16, 'triangle', 0.1, 0);
  playTone(659.25, 0.16, 'triangle', 0.1, 0.09);
  playTone(783.99, 0.2, 'triangle', 0.11, 0.18);
  playTone(1046.5, 0.35, 'sine', 0.12, 0.27);
}

export function playUnsoldTone() {
  playTone(260, 0.18, 'sawtooth', 0.05, 0);
  playTone(195, 0.28, 'sawtooth', 0.05, 0.12);
}

export function playTickWarning() {
  playTone(880, 0.06, 'sine', 0.045, 0);
}

export function triggerAuctionCue(cue: AuctionAudioCue, bidCount = 1): void {
  switch (cue) {
    case 'LOT_OPEN':
      playLotOpenCue();
      break;
    case 'BID_ACCEPTED':
      playBidAcceptedCue(bidCount);
      break;
    case 'BIDDING_WAR':
      playBidWarCue(bidCount);
      break;
    case 'TITLE_SOLD':
      playTitleSoldCue();
      break;
    case 'SOLD':
      playSoldFanfare();
      break;
    case 'UNSOLD':
      playUnsoldTone();
      break;
    case 'TICK_WARNING':
      playTickWarning();
      break;
  }
}
