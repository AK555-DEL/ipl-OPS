import { useEffect, useRef, useState } from 'react';
import type { AuctionViewModel } from '../auction/types.ts';
import {
  type AuctionAudioCue,
  type AuctionCueSnapshot,
  createCueSnapshot,
  detectAuctionCue,
  triggerAuctionCue,
} from '../utils/soundFx.ts';

/**
 * Plays distinct Web Audio cues when the live auction state advances
 * (lot open, bid accepted, bidding war, title sold, player sold, unsold, countdown ticks).
 */
export function useAuctionAudioCues(
  vm: AuctionViewModel,
  remainingSec: number,
  enabled: boolean
): { lastCue: AuctionAudioCue | null } {
  const prevSnapshotRef = useRef<AuctionCueSnapshot | null>(null);
  const prevTickSecRef = useRef<number | null>(null);
  const [lastCue, setLastCue] = useState<AuctionAudioCue | null>(null);

  useEffect(() => {
    const nextSnapshot = createCueSnapshot(vm);
    const cue = detectAuctionCue(
      prevSnapshotRef.current,
      nextSnapshot,
      remainingSec,
      prevTickSecRef.current
    );

    if (cue && enabled) {
      triggerAuctionCue(cue, nextSnapshot.bidCount || 1);
      setLastCue(cue);
    }

    prevSnapshotRef.current = nextSnapshot;
    prevTickSecRef.current = nextSnapshot.lotId ? remainingSec : null;
  }, [
    vm.seq,
    vm.lot?.p.id,
    vm.lot?.bidCount,
    vm.lot?.category,
    vm.last?.t,
    vm.last?.p.isTitle,
    vm.last?.ts,
    remainingSec,
    enabled,
  ]);

  return { lastCue };
}
