import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Play, Volume2, VolumeX } from 'lucide-react';
import { useAudioSettings } from '../contexts/AudioSettingsContext.tsx';

interface GlobalSoundControlProps {
  compact?: boolean;
}

export function GlobalSoundControl({ compact = false }: GlobalSoundControlProps) {
  const { muted, volume, toggleMuted, setVolume, playTestCue } = useAudioSettings();
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pct = muted ? 0 : Math.round(volume * 100);

  return (
    <div className="relative shrink-0" ref={popRef}>
      <div className="flex items-center">
        <button
          type="button"
          onClick={toggleMuted}
          data-testid="global-mute-quick-btn"
          aria-label={muted ? 'Unmute global auction sound' : 'Mute global auction sound'}
          title={muted ? 'Unmute global audio cues' : 'Mute global audio cues'}
          className={`px-1.5 py-1 rounded-l border-y border-l font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 transition-colors ${
            muted
              ? 'bg-[#1c192f] border-[#504533] text-[#9d8f79] hover:text-[#ffb4ab]'
              : 'bg-[#201d33] border-[#4edea3]/50 text-[#4edea3] hover:bg-[#00a572]/20'
          }`}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          {!compact && <span className="hidden sm:inline">{muted ? 'MUTED' : `${pct}%`}</span>}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          data-testid="global-sound-btn"
          aria-expanded={open}
          aria-label="Global sound settings"
          title="Global sound volume & mute settings"
          className={`px-1 py-1 rounded-r border font-[JetBrains_Mono] text-[10px] transition-colors ${
            open
              ? 'bg-[#fdb813] text-[#271900] border-[#fdb813]'
              : 'bg-[#201d33] border-[#504533] text-[#d5c4ac] hover:text-[#ffdb9f]'
          }`}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {open && (
        <div
          data-testid="sound-settings-popover"
          role="dialog"
          aria-label="Global Sound Settings"
          className="absolute right-0 top-full mt-1.5 w-64 bg-[#1c192f] border border-[#fdb813]/70 rounded-lg shadow-2xl p-3 z-50 space-y-2.5"
        >
          <div className="flex items-center justify-between border-b border-[#2b273e] pb-2">
            <span className="font-[Space_Grotesk] text-xs font-bold text-[#ffdb9f] uppercase tracking-wider">
              Global Sound Settings
            </span>
            <button
              type="button"
              onClick={toggleMuted}
              data-testid="global-mute-toggle"
              className={`px-2 py-0.5 rounded border font-[JetBrains_Mono] text-[10px] font-bold ${
                muted
                  ? 'bg-[#93000a]/30 border-[#ffb4ab]/50 text-[#ffb4ab]'
                  : 'bg-[#00a572]/20 border-[#4edea3]/50 text-[#4edea3]'
              }`}
            >
              {muted ? 'MUTED' : 'ACTIVE'}
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between font-[JetBrains_Mono] text-[10px] text-[#d5c4ac]">
              <label htmlFor="global-volume-range">Master Volume</label>
              <span className="text-[#fdb813] font-bold">{pct}%</span>
            </div>
            <input
              id="global-volume-range"
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              data-testid="global-volume-slider"
              className="w-full accent-[#fdb813] cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-[#2b273e]">
            <button
              type="button"
              disabled={muted}
              onClick={() => playTestCue('BID_ACCEPTED')}
              className="flex-1 py-1 px-2 rounded bg-[#141026] border border-[#504533] hover:border-[#4edea3] text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <Play className="w-2.5 h-2.5" />
              <span>Test Bid</span>
            </button>
            <button
              type="button"
              disabled={muted}
              onClick={() => playTestCue('SOLD')}
              className="flex-1 py-1 px-2 rounded bg-[#141026] border border-[#504533] hover:border-[#fdb813] text-[#fdb813] font-[JetBrains_Mono] text-[10px] font-bold flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <Play className="w-2.5 h-2.5" />
              <span>Test Sold</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
