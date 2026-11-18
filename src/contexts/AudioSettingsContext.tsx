import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type AuctionAudioCue,
  getGlobalAudioSettings,
  setGlobalAudioSettings,
  subscribeGlobalAudioSettings,
  triggerAuctionCue,
} from '../utils/soundFx.ts';

interface AudioSettingsContextValue {
  muted: boolean;
  volume: number;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  setVolume: (volume: number) => void;
  playTestCue: (cue?: AuctionAudioCue) => void;
}

const AudioSettingsContext = createContext<AudioSettingsContextValue | null>(null);

export function AudioSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(() => getGlobalAudioSettings());

  useEffect(() => {
    return subscribeGlobalAudioSettings((next) => {
      setSettings(next);
    });
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setSettings(setGlobalAudioSettings({ muted }));
  }, []);

  const toggleMuted = useCallback(() => {
    const curr = getGlobalAudioSettings();
    setSettings(setGlobalAudioSettings({ muted: !curr.muted }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setSettings(
      setGlobalAudioSettings({
        volume,
        muted: volume <= 0 ? true : false,
      })
    );
  }, []);

  const playTestCue = useCallback((cue: AuctionAudioCue = 'BID_ACCEPTED') => {
    triggerAuctionCue(cue, 2);
  }, []);

  return (
    <AudioSettingsContext.Provider
      value={{
        muted: settings.muted,
        volume: settings.volume,
        setMuted,
        toggleMuted,
        setVolume,
        playTestCue,
      }}
    >
      {children}
    </AudioSettingsContext.Provider>
  );
}

export function useAudioSettings(): AudioSettingsContextValue {
  const ctx = useContext(AudioSettingsContext);
  if (!ctx) {
    throw new Error('useAudioSettings must be used within AudioSettingsProvider');
  }
  return ctx;
}
