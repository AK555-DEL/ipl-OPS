import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Clock,
  Flame,
  Gavel,
  Globe2,
  Home,
  Lock,
  LogOut,
  RotateCcw,
  Share2,
  ShieldAlert,
  SlidersHorizontal,
  Tv,
  Wifi,
  Zap,
} from 'lucide-react';
import type { AuctionViewModel, CommandBody, LotCategory, Player } from '../auction/types.ts';
import {
  formatCurrency,
  formatLakhs,
  formatPlayerCardMeta,
  getIplBidIncrement,
} from '../auction/engine.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudioSettings } from '../contexts/AudioSettingsContext.tsx';
import { GlobalSoundControl } from './GlobalSoundControl.tsx';
import { PlayerPortrait } from './PlayerPortrait.tsx';
import { TeamLogoBadge } from './TeamLogoBadge.tsx';
import { useAuctionAudioCues } from '../hooks/useAuctionAudioCues.ts';

interface BidsOperatorConsoleProps {
  vm: AuctionViewModel;
  players: Player[];
  connected: boolean;
  busy: boolean;
  selectedTeamId: string;
  onSelectTeamId: (teamId: string) => void;
  onSend: (cmd: CommandBody) => Promise<boolean>;
  onNavigateLanding: () => void;
  onNavigateArena: () => void;
  onNavigateOperator: () => void;
  onOpenShare: () => void;
  onToast: (msg: string) => void;
}

const CATEGORY_LABEL: Record<LotCategory, string> = {
  TITLE: 'FRANCHISE TITLE · 3:00',
  MAVERICK: 'MAVERICK · 5:00',
  CAPPED: 'CAPPED · 3:00',
  UNCAPPED: 'UNCAPPED · 2:00',
};

const IPL_INCREMENT_SLABS = [
  { id: 'slab-25', range: 'Below ₹4 Cr', step: '+₹25 L', inc: 25 },
  { id: 'slab-50', range: '₹4 Cr – ₹10 Cr', step: '+₹50 L', inc: 50 },
  { id: 'slab-100', range: '₹10 Cr – ₹20 Cr', step: '+₹1.00 Cr', inc: 100 },
  { id: 'slab-200', range: 'Above ₹20 Cr', step: '+₹2.00 Cr', inc: 200 },
] as const;

function formatClock(sec: number): string {
  const clamped = Math.max(0, Math.floor(sec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function BidsOperatorConsole({
  vm,
  players,
  connected,
  busy,
  selectedTeamId,
  onSelectTeamId,
  onSend,
  onNavigateLanding,
  onNavigateArena,
  onNavigateOperator,
  onOpenShare,
  onToast,
}: BidsOperatorConsoleProps) {
  const {
    hostToken,
    hostStatus,
    subOpRole,
    redeemSubOpPin,
    leaveSubOpSession,
  } = useAuth();
  const { muted } = useAudioSettings();

  const isHostAuthenticated = Boolean(hostToken && hostStatus.hostLoggedIn);
  const canPlaceBids = isHostAuthenticated || subOpRole === 'bids';

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [customCr, setCustomCr] = useState('');
  const [showCustomOverride, setShowCustomOverride] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const offset = vm.serverNow ? Date.now() - vm.serverNow : 0;
    setNowMs(Date.now() - offset);
    const id = window.setInterval(() => {
      setNowMs(Date.now() - offset);
    }, 200);
    return () => window.clearInterval(id);
  }, [vm.serverNow, vm.seq]);

  const lot = vm.lot;
  const remainingSec = lot ? Math.max(0, Math.ceil((lot.expiresAt - nowMs) / 1000)) : 0;
  const leader = lot?.team ? vm.teams.find((t) => t.id === lot.team) ?? null : null;
  const activeIncrement = lot ? getIplBidIncrement(lot.price) : 25;

  useAuctionAudioCues(vm, remainingSec, !muted);

  const activeTeam =
    vm.teams.find((t) => t.id === selectedTeamId) ?? vm.teams[0];

  const upcomingStrip = vm.upNext.length > 0 ? vm.upNext : vm.queue.slice(0, 3);

  const totalOverseasCapacity = vm.teams.length * vm.cfg.os; // 11 x 8 = 88
  const usedOverseasSlots = useMemo(
    () => vm.teams.reduce((sum, t) => sum + t.os, 0),
    [vm.teams]
  );
  const remainingOverseasSlots = Math.max(0, totalOverseasCapacity - usedOverseasSlots);

  const spotlightOverseasPlayer = useMemo(() => {
    if (lot?.p.os) return lot.p;
    const queuedOs = upcomingStrip.find((p) => p.os);
    if (queuedOs) return queuedOs;
    const soldSet = new Set(vm.teams.flatMap((t) => t.squad.map((p) => p.id)));
    return players.find((p) => p.os && !soldSet.has(p.id)) ?? players.find((p) => p.os) ?? null;
  }, [lot, upcomingStrip, players, vm.teams]);

  const handlePinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = pinInput.trim();
    if (!cleaned) {
      setPinError('Enter the Bids Operator PIN issued by the Main Operator.');
      return;
    }
    setUnlocking(true);
    setPinError(null);
    const res = await redeemSubOpPin(cleaned);
    setUnlocking(false);
    if (!res.ok || !res.role) {
      setPinError(res.error || 'Invalid Sub-Operator PIN');
      return;
    }
    if (res.role === 'display') {
      setPinError(
        'That PIN is Display-Only (Arena 1). Enter the Bids Operator PIN to place live bids.'
      );
      return;
    }
    setPinInput('');
    onToast('Bids Operator Console + Arena 1 unlocked!');
  };

  const handleTeamAutoBid = async (teamId: string) => {
    onSelectTeamId(teamId);
    if (!lot || busy || !canPlaceBids) return;
    const team = vm.teams.find((t) => t.id === teamId);
    if (!team) return;
    if (team.lead) {
      onToast(`${team.short} already holds the highest bid`);
      return;
    }
    if (team.block) {
      onToast(`${team.short}: ${team.block}`);
      return;
    }
    await onSend({ type: 'bid', team: team.id });
  };

  const handleCustomBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lot || busy || !activeTeam || !canPlaceBids) return;
    if (activeTeam.lead) {
      onToast(`${activeTeam.short} already holds the highest bid`);
      return;
    }
    if (activeTeam.block) {
      onToast(`${activeTeam.short}: ${activeTeam.block}`);
      return;
    }
    const raw = customCr.trim();
    if (!raw || raw.includes(',') || !/^\d+(\.\d+)?$/.test(raw)) {
      onToast('Enter bid in Cr (e.g. 4.50)');
      return;
    }
    const lakhs = Math.round(Number(raw) * 100);
    const ok = await onSend({ type: 'custom', team: activeTeam.id, price: lakhs });
    if (ok) setCustomCr('');
  };

  const handleUndoLastBid = async () => {
    if (!lot || busy || !canPlaceBids || lot.trail.length === 0) return;
    await onSend({ type: 'undobid', count: 1 });
  };

  const handleRevertToBid = async (toIndex: number) => {
    if (!lot || busy || !canPlaceBids || lot.trail.length === 0) return;
    await onSend({ type: 'undobid', toIndex });
  };

  const headerBar = (
    <header className="h-12 bg-[#0e0b21] border-b border-[#504533] px-3.5 flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onNavigateLanding}
          aria-label="Back to Landing Hub"
          className="p-1.5 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#4edea3] transition-colors shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
        </button>
        <span className="font-[Space_Grotesk] text-sm font-extrabold uppercase tracking-wider text-[#fdb813] whitespace-nowrap">
          BIDS OPERATOR DESK
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#201d33] border border-[#fdb813]/40 font-[JetBrains_Mono] text-[10px] font-bold text-[#ffdb9f] whitespace-nowrap">
          {isHostAuthenticated ? 'MAIN OPERATOR' : 'SUB-OP: BIDS + ARENA 1'}
        </span>
        <div
          className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded border font-[JetBrains_Mono] text-[10px] whitespace-nowrap ${
            connected
              ? 'bg-[#00a572]/20 border-[#4edea3] text-[#4edea3]'
              : 'bg-[#93000a]/30 border-[#ffb4ab] text-[#ffb4ab]'
          }`}
        >
          <Wifi className="w-3 h-3" />
          <span>{connected ? 'LIVE' : 'POLL'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <GlobalSoundControl compact />

        <a
          href="/arena"
          onClick={(e) => {
            e.preventDefault();
            onNavigateArena();
          }}
          data-testid="bids-op-to-arena"
          className="px-2.5 py-1 rounded border border-[#4edea3]/60 bg-[#00a572]/15 hover:bg-[#00a572]/25 text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 whitespace-nowrap"
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Arena 1</span>
        </a>

        <button
          type="button"
          onClick={onOpenShare}
          className="px-2 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#4edea3] font-[JetBrains_Mono] text-[10px] flex items-center gap-1 whitespace-nowrap"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Share</span>
        </button>

        {isHostAuthenticated ? (
          <a
            href="/operator"
            onClick={(e) => {
              e.preventDefault();
              onNavigateOperator();
            }}
            className="px-2 py-1 rounded border border-[#fdb813]/50 bg-[#201d33] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] flex items-center gap-1 whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#fdb813]" />
            <span>Main Op</span>
          </a>
        ) : (
          subOpRole && (
            <button
              type="button"
              onClick={() => {
                leaveSubOpSession();
                onToast('Exited Sub-Operator session');
              }}
              data-testid="bids-op-exit-pin"
              className="px-2 py-1 rounded border border-[#ffb4ab]/50 bg-[#93000a]/25 hover:bg-[#93000a]/45 text-[#ffb4ab] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 whitespace-nowrap"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit PIN</span>
            </button>
          )
        )}
      </div>
    </header>
  );

  // PIN-ENTRY GATE WHEN NOT AUTHORIZED AS BIDS SUB-OPERATOR OR MAIN OPERATOR
  if (!canPlaceBids) {
    return (
      <div
        className="w-screen h-screen overflow-hidden flex flex-col bg-[#141026] text-[#e6defe]"
        data-testid="bids-op-pin-gate"
      >
        {headerBar}
        <main className="flex-1 flex items-center justify-center p-4">
          <form
            onSubmit={handlePinUnlock}
            className="w-full max-w-md bg-[#0e0b21] border-2 border-[#fdb813]/70 rounded-xl p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#fdb813]/15 border border-[#fdb813]/50 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-[#fdb813]" />
              </div>
              <div>
                <h1 className="font-[Space_Grotesk] text-lg font-extrabold text-[#e6defe] leading-tight">
                  Bids Operator Sub-Access
                </h1>
                <p className="font-[JetBrains_Mono] text-[10px] text-[#fdb813]">
                  BIDS + ARENA 1 ONLY · SEPARATE LAPTOP CONSOLE
                </p>
              </div>
            </div>

            <p className="font-[Inter] text-xs text-[#d5c4ac] leading-relaxed">
              Enter the <strong className="text-[#fdb813]">Bids Operator PIN</strong> issued by the
              Main Operator to place incoming team bids and update <strong className="text-[#4edea3]">Arena 1</strong> in
              real time. Main Operator controls (releasing lots, Up Next queue, Mix &amp; Match) remain locked.
            </p>

            {subOpRole === 'display' && (
              <div className="bg-[#201d33] border border-[#4edea3]/50 rounded-lg p-2.5 flex items-center justify-between gap-2 font-[JetBrains_Mono] text-[11px] text-[#4edea3]">
                <span>Current session is Display-Only (Arena 1).</span>
                <button
                  type="button"
                  onClick={onNavigateArena}
                  className="px-2 py-0.5 rounded bg-[#00a572] text-[#002113] font-bold shrink-0"
                >
                  Open Arena 1
                </button>
              </div>
            )}

            {pinError && (
              <div
                role="alert"
                className="bg-[#93000a]/35 border border-[#ffb4ab]/60 rounded-lg p-2.5 flex items-start gap-2 font-[JetBrains_Mono] text-[11px] text-[#ffb4ab]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{pinError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="bids-op-pin-input"
                className="block font-[JetBrains_Mono] text-[10px] text-[#9d8f79] uppercase mb-1"
              >
                Bids Operator PIN
              </label>
              <input
                id="bids-op-pin-input"
                type="text"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Bids Op PIN"
                autoFocus
                data-testid="bids-op-pin-input"
                className="w-full bg-[#141026] border-2 border-[#504533] focus:border-[#fdb813] rounded-lg px-3 py-2 text-base font-[JetBrains_Mono] font-bold tracking-widest text-[#e6defe] focus:outline-none uppercase"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={onNavigateLanding}
                className="px-3.5 py-2 rounded-lg border border-[#504533] text-[#d5c4ac] font-[JetBrains_Mono] text-xs"
              >
                Back to Hub
              </button>
              <button
                type="submit"
                disabled={unlocking}
                data-testid="bids-op-pin-submit"
                className="px-4 py-2 rounded-lg bg-[#fdb813] hover:bg-[#ffbb1e] text-[#271900] font-[JetBrains_Mono] text-xs font-extrabold disabled:opacity-50"
              >
                {unlocking ? 'Verifying...' : 'Unlock Bids Operator'}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col bg-[#141026] text-[#e6defe] select-none"
      data-testid="bids-op-console"
    >
      {headerBar}

      <main className="flex-1 min-h-0 grid grid-cols-12 gap-2.5 p-2.5 overflow-hidden">
        {/* LEFT COLUMN (3 cols): Up Next (Main Op Staged) + Overseas 80x80 + IPL Slab Rules */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-2.5 min-h-0 overflow-hidden">
          {/* Read-only Up Next Queue */}
          <div className="bg-[#0e0b21] border border-[#504533] rounded-lg p-2.5 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between border-b border-[#2b273e] pb-1.5">
              <span className="font-[Space_Grotesk] text-xs font-bold text-[#ffdb9f] uppercase">
                Coming Up Next (Main Op)
              </span>
              <span className="font-[JetBrains_Mono] text-[9px] text-[#9d8f79] bg-[#201d33] px-1.5 py-0.5 rounded border border-[#504533]">
                READ-ONLY
              </span>
            </div>
            {upcomingStrip.length === 0 ? (
              <div className="py-2.5 text-center font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                Waiting for Main Operator to queue next lots...
              </div>
            ) : (
              <div className="space-y-1.5">
                {upcomingStrip.slice(0, 3).map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-[#1c192f] border border-[#504533] rounded px-2.5 py-1.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] truncate">
                        <span className="text-[#fdb813] mr-1">#{idx + 1}</span>
                        {q.name}
                      </div>
                      <div className="font-[JetBrains_Mono] text-[10px] text-[#4edea3] truncate">
                        {formatPlayerCardMeta(q)} · {q.os ? `OS (${q.cc})` : q.cc}
                      </div>
                    </div>
                    <span className="font-[JetBrains_Mono] text-[10px] text-[#ffdb9f] font-bold shrink-0">
                      {formatCurrency(q.base)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overseas Player 80x80 Section & 88-slot Overseas Quota */}
          <div
            className="bg-[#0e0b21] border border-[#4edea3]/50 rounded-lg p-2.5 flex flex-col gap-2 shrink-0"
            data-testid="overseas-player-80x80"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#2b273e] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-[#4edea3]" />
                <span className="font-[Space_Grotesk] text-xs font-bold text-[#4edea3] uppercase">
                  Overseas Player (80×80)
                </span>
              </div>
              <span
                className="font-[JetBrains_Mono] text-[10px] font-extrabold text-[#fdb813]"
                data-testid="bids-overseas-counter"
              >
                {remainingOverseasSlots} / {totalOverseasCapacity}
              </span>
            </div>

            {spotlightOverseasPlayer ? (
              <div className="flex items-center gap-2.5">
                <div className="w-20 h-20 rounded border-2 border-[#4edea3]/60 overflow-hidden shrink-0 bg-[#1c192f]">
                  <PlayerPortrait
                    player={spotlightOverseasPlayer}
                    size="md"
                    className="w-20 h-20"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="inline-block px-1.5 py-0.5 rounded bg-[#00a572]/20 border border-[#4edea3]/40 font-[JetBrains_Mono] text-[9px] font-bold text-[#4edea3]">
                    {lot?.p.id === spotlightOverseasPlayer.id ? 'ON FLOOR NOW' : 'OVERSEAS POOL'} ·{' '}
                    {spotlightOverseasPlayer.cc}
                  </div>
                  <div className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe] truncate">
                    {spotlightOverseasPlayer.name}
                  </div>
                  <div className="font-[JetBrains_Mono] text-[10px] text-[#4edea3] font-bold truncate">
                    {formatPlayerCardMeta(spotlightOverseasPlayer)}
                  </div>
                  <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                    Base {formatCurrency(spotlightOverseasPlayer.base)} · Max 8 OS/team
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2 font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                All {totalOverseasCapacity} overseas slots accounted for.
              </div>
            )}
          </div>

          {/* IPL Automatic Increment Slabs */}
          <div
            className="bg-[#0e0b21] border border-[#fdb813]/45 rounded-lg p-2.5 flex flex-col gap-1.5 shrink-0"
            data-testid="bids-op-slab-rules"
          >
            <div className="flex items-center justify-between border-b border-[#2b273e] pb-1">
              <span className="font-[Space_Grotesk] text-xs font-bold text-[#fdb813] uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>IPL Auto-Increment Slabs</span>
              </span>
              <span className="font-[JetBrains_Mono] text-[9px] text-[#4edea3] font-bold">
                1-CLICK BID
              </span>
            </div>
            <div className="space-y-1 font-[JetBrains_Mono] text-[10px]">
              {IPL_INCREMENT_SLABS.map((slab) => {
                const isActive = Boolean(lot && lot.team !== null && activeIncrement === slab.inc);
                return (
                  <div
                    key={slab.id}
                    data-testid={slab.id}
                    data-active={isActive ? 'true' : 'false'}
                    className={`px-2 py-1 rounded border flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-[#fdb813]/20 border-[#fdb813] text-[#ffdb9f] font-extrabold'
                        : 'bg-[#1c192f] border-[#504533]/60 text-[#d5c4ac]'
                    }`}
                  >
                    <span>{slab.range}</span>
                    <span className={isActive ? 'text-[#fdb813]' : 'text-[#4edea3] font-bold'}>
                      {slab.step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Lock Notice */}
          <div className="mt-auto bg-[#1c192f] border border-[#504533] rounded-lg p-2.5 flex items-start gap-2 font-[JetBrains_Mono] text-[10px] text-[#d5c4ac]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#fdb813] shrink-0 mt-0.5" />
            <span>
              Click any team or press <strong className="text-[#fdb813]">1–9, 0, -</strong> to place an
              instant automatic bid.
            </span>
          </div>
        </section>

        {/* CENTER COLUMN (6 cols): Live Lot Banner + One-Click 11-Team Bidding Pad */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-2.5 min-h-0 overflow-hidden">
          {/* Live Lot Banner */}
          <div className="bg-[#0e0b21] border-2 border-[#fdb813]/50 rounded-lg p-3 shrink-0">
            {lot ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-20 h-20 rounded border border-[#fdb813]/60 overflow-hidden shrink-0 bg-[#1c192f]">
                      <PlayerPortrait player={lot.p} size="md" className="w-20 h-20" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-[#201d33] border border-[#504533] font-[JetBrains_Mono] text-[9px] text-[#ffdb9f] font-bold">
                          {CATEGORY_LABEL[lot.category]}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#2b273e] border border-[#504533] font-[JetBrains_Mono] text-[9px] text-[#4edea3] font-bold">
                          {lot.p.isTitle ? 'FRANCHISE' : lot.p.os ? `OVERSEAS (${lot.p.cc})` : `INDIAN (${lot.p.cc})`}
                        </span>
                      </div>
                      <h1 className="font-[Space_Grotesk] text-xl font-extrabold text-[#e6defe] truncate mt-1">
                        {lot.p.name}
                      </h1>
                      <div className="font-[JetBrains_Mono] text-[11px] text-[#4edea3] font-bold">
                        {formatPlayerCardMeta(lot.p)} · Base {formatCurrency(lot.p.base)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-[JetBrains_Mono] text-[9px] text-[#9d8f79] uppercase">
                        {leader ? `HELD BY ${leader.short}` : 'OPENING BASE'}
                      </div>
                      <div
                        className="font-[JetBrains_Mono] text-3xl font-black text-[#fdb813] leading-none"
                        data-testid="bids-op-price"
                      >
                        ₹ {formatLakhs(lot.price)}
                      </div>
                      <div className="font-[JetBrains_Mono] text-[10px] text-[#4edea3] mt-0.5">
                        {lot.bidCount} bids
                      </div>
                    </div>
                    <div
                      className={`px-2.5 py-1.5 rounded border font-[JetBrains_Mono] text-sm font-black flex items-center gap-1.5 ${
                        remainingSec <= 15
                          ? 'bg-[#93000a]/60 border-[#ffb4ab] text-[#ffb4ab] animate-pulse'
                          : 'bg-[#201d33] border-[#4edea3]/50 text-[#4edea3]'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{formatClock(remainingSec)}</span>
                    </div>
                  </div>
                </div>

                {/* Next Auto-Bid Callout */}
                <div
                  className="bg-[#1c192f] border border-[#fdb813]/40 rounded-md px-3 py-1.5 flex items-center justify-between gap-2 flex-wrap font-[JetBrains_Mono] text-[11px]"
                  data-testid="bids-op-next-banner"
                >
                  <div className="flex items-center gap-2 text-[#ffdb9f]">
                    <Gavel className="w-3.5 h-3.5 text-[#fdb813] shrink-0" />
                    {lot.team === null ? (
                      <span>
                        Click any team to <strong className="text-[#fdb813]">OPEN AT BASE</strong> (₹{' '}
                        {formatLakhs(lot.price)})
                      </span>
                    ) : (
                      <span>
                        Click any team to add{' '}
                        <strong className="text-[#4edea3]">+₹{formatLakhs(activeIncrement)}</strong>{' '}
                        → <strong className="text-[#fdb813]">₹ {formatLakhs(lot.next)}</strong>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lot.trail.length > 0 && (
                      <button
                        type="button"
                        disabled={busy || !canPlaceBids}
                        onClick={() => void handleUndoLastBid()}
                        data-testid="bids-op-undo-bid-btn"
                        title="Undo the most recent bid from bid history (Shortcut: Z)"
                        className="px-2.5 py-0.5 rounded bg-[#93000a]/50 hover:bg-[#93000a]/80 border border-[#ffb4ab]/60 text-[#ffb4ab] text-[10px] font-bold flex items-center gap-1 transition-colors disabled:opacity-40"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>
                          [Z] Undo {leader?.short ?? ''} {formatCurrency(lot.price)}
                        </span>
                      </button>
                    )}
                    <span className="px-2 py-0.5 rounded bg-[#00a572]/20 border border-[#4edea3]/50 text-[#4edea3] text-[10px] font-bold">
                      {lot.team === null ? 'FIRST BID: BASE' : `AUTO STEP +₹${formatLakhs(activeIncrement)}`}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-5 text-center space-y-1">
                <div className="font-[Space_Grotesk] text-base font-bold text-[#ffdb9f]">
                  Floor Idle — Waiting for Main Operator to Release Next Lot
                </div>
                <div className="font-[JetBrains_Mono] text-[11px] text-[#9d8f79]">
                  Arena 1 updates immediately as soon as the Main Operator sends a player or title to the floor.
                </div>
              </div>
            )}
          </div>

          {/* ONE-CLICK 11-TEAM BIDDING PAD */}
          <div className="flex-1 min-h-0 bg-[#0e0b21] border border-[#504533] rounded-lg p-3 flex flex-col gap-2.5 overflow-hidden">
            <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-[#fdb813]" />
                <h2 className="font-[Space_Grotesk] text-sm font-extrabold text-[#e6defe] uppercase tracking-wide">
                  Click Team That Bid (Auto-Increment)
                </h2>
              </div>
              <span className="font-[JetBrains_Mono] text-[10px] text-[#4edea3] font-bold">
                KEYS 1–9, 0, - · INSTANT BID
              </span>
            </div>

            <div
              className="flex-1 min-h-0 overflow-y-auto custom-scroll grid grid-cols-2 sm:grid-cols-3 gap-2 content-start pr-0.5"
              data-testid="bids-op-team-pad"
            >
              {vm.teams.map((t, index) => {
                const hotkey = index === 9 ? '0' : index === 10 ? '-' : String(index + 1);
                const disabled = !lot || busy || t.lead || Boolean(t.block);

                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => void handleTeamAutoBid(t.id)}
                    data-testid={`bids-op-team-${t.id}`}
                    aria-label={
                      !lot
                        ? `${t.name} (${t.short}) floor idle`
                        : t.lead
                          ? `${t.name} (${t.short}) currently leading`
                          : t.block
                            ? `${t.name} (${t.short}) blocked: ${t.block}`
                            : lot.team === null
                              ? `Open bid for ${t.name} (${t.short}) at ${formatCurrency(lot.price)}`
                              : `Place bid for ${t.name} (${t.short}) at ${formatCurrency(lot.next)}`
                    }
                    className={`rounded-lg border-2 p-2.5 text-left flex flex-col justify-between gap-2 transition-all active:scale-[0.98] min-h-[96px] ${
                      t.lead
                        ? 'bg-[#00a572]/20 border-[#4edea3] text-[#e6defe] cursor-default'
                        : t.block
                          ? 'bg-[#1c192f]/40 border-[#93000a]/60 text-[#9d8f79] opacity-60 cursor-not-allowed'
                          : !lot
                            ? 'bg-[#1c192f]/60 border-[#504533]/60 text-[#9d8f79] opacity-65 cursor-not-allowed'
                            : 'bg-[#1c192f] hover:bg-[#2b273e] border-[#504533] hover:border-[#fdb813] text-[#e6defe]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <TeamLogoBadge team={t} size="sm" />
                        <div className="min-w-0">
                          <div className="font-[Space_Grotesk] text-sm font-extrabold leading-tight truncate flex items-center gap-1">
                            <span className="font-[JetBrains_Mono] text-[10px] text-[#fdb813]">
                              [{hotkey}]
                            </span>
                            <span className="truncate">{t.short}</span>
                          </div>
                          <div className="font-[Inter] text-[10px] text-[#d5c4ac] truncate">
                            {t.name}
                          </div>
                        </div>
                      </div>
                      <span className="font-[JetBrains_Mono] text-[9px] text-[#9d8f79] shrink-0 text-right leading-tight">
                        {t.n}/{vm.cfg.max}
                        <br />
                        OS {t.os}/{vm.cfg.os}
                      </span>
                    </div>

                    <div
                      className={`px-2 py-1 rounded font-[JetBrains_Mono] text-[10px] font-extrabold flex items-center justify-between gap-1 ${
                        t.lead
                          ? 'bg-[#00a572] text-[#002113]'
                          : t.block
                            ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                            : !lot
                              ? 'bg-[#141026] text-[#9d8f79]'
                              : lot.team === null
                                ? 'bg-[#fdb813] text-[#271900]'
                                : 'bg-[#141026] border border-[#fdb813]/50 text-[#fdb813]'
                      }`}
                    >
                      {t.lead ? (
                        <span className="w-full text-center">★ HIGHEST BID</span>
                      ) : t.block ? (
                        <span className="truncate w-full">{t.block}</span>
                      ) : !lot ? (
                        <span className="w-full text-center">FLOOR IDLE</span>
                      ) : lot.team === null ? (
                        <>
                          <span>OPEN</span>
                          <span>₹{formatLakhs(lot.price)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[#4edea3]">+₹{formatLakhs(activeIncrement)}</span>
                          <span>₹{formatLakhs(lot.next)}</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional Manual Price Override Bar */}
            <div className="pt-1.5 border-t border-[#2b273e] shrink-0">
              {!showCustomOverride ? (
                <div className="flex items-center justify-between gap-2 font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                  <span>
                    Rule: &lt;4Cr +25L · 4–10Cr +50L · 10–20Cr +1Cr · &gt;20Cr +2Cr
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!activeTeam || activeTeam.lead || activeTeam.block) {
                        const fallback = vm.teams.find((t) => !t.lead && !t.block);
                        if (fallback) onSelectTeamId(fallback.id);
                      }
                      setShowCustomOverride(true);
                    }}
                    data-testid="bids-op-toggle-custom"
                    className="text-[#ffdb9f] hover:text-[#fdb813] underline font-bold shrink-0"
                  >
                    Custom Amount Override
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleCustomBid}
                  className="flex items-center gap-2 flex-wrap"
                  data-testid="bids-op-custom-form"
                >
                  <select
                    value={activeTeam?.id ?? 't1'}
                    onChange={(e) => onSelectTeamId(e.target.value)}
                    aria-label="Select team for custom bid override"
                    className="bg-[#141026] border border-[#504533] rounded px-2 py-1 text-xs font-[JetBrains_Mono] text-[#fdb813] font-bold focus:outline-none focus:border-[#fdb813]"
                  >
                    {vm.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.short} ({t.name})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customCr}
                    onChange={(e) => setCustomCr(e.target.value)}
                    disabled={!lot || busy}
                    placeholder="Bid in Cr (e.g. 4.00)"
                    aria-label="Custom bid in crores"
                    data-testid="bids-op-custom-input"
                    className="flex-1 min-w-[140px] bg-[#141026] border border-[#504533] rounded px-2.5 py-1 text-xs font-[JetBrains_Mono] text-[#e6defe] focus:outline-none focus:border-[#fdb813] disabled:opacity-40"
                  />
                  <button
                    type="submit"
                    disabled={!lot || busy || Boolean(activeTeam?.lead) || Boolean(activeTeam?.block)}
                    data-testid="bids-op-custom-submit"
                    className="px-3 py-1 rounded bg-[#00a572] hover:bg-[#00a572]/90 text-[#002113] font-[JetBrains_Mono] text-xs font-extrabold disabled:opacity-40"
                  >
                    Set Bid
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomOverride(false)}
                    className="px-2 py-1 rounded border border-[#504533] text-[#9d8f79] hover:text-[#e6defe] font-[JetBrains_Mono] text-[10px]"
                  >
                    Hide
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN (3 cols): Interactive Bid History (Undo/Revert) & 11 Franchise Squads */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-2.5 min-h-0 overflow-hidden">
          <div
            className="bg-[#0e0b21] border border-[#504533] rounded-lg p-2.5 flex flex-col gap-1.5 shrink-0 min-h-[180px] max-h-[290px] overflow-hidden"
            data-testid="bids-op-bid-history"
          >
            <div className="flex items-center justify-between border-b border-[#2b273e] pb-1.5 gap-1.5">
              <span className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] flex items-center gap-1.5">
                {lot && lot.bidCount >= 3 ? (
                  <Flame className="w-3.5 h-3.5 text-[#fdb813]" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-[#4edea3]" />
                )}
                <span>Bid History ({lot ? lot.trail.length : 0})</span>
              </span>
              {lot && lot.trail.length > 0 ? (
                <button
                  type="button"
                  disabled={busy || !canPlaceBids}
                  onClick={() => void handleUndoLastBid()}
                  data-testid="bids-op-history-undo-latest"
                  className="px-2 py-0.5 rounded bg-[#93000a]/50 hover:bg-[#93000a]/80 border border-[#ffb4ab]/50 text-[#ffb4ab] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 disabled:opacity-40"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Undo Last</span>
                </button>
              ) : (
                <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">IDLE</span>
              )}
            </div>
            <div className="overflow-y-auto custom-scroll space-y-1 font-[JetBrains_Mono] text-[10px] flex-1 min-h-0 pr-0.5">
              {!lot || lot.trail.length === 0 ? (
                <div className="text-[#9d8f79] py-4 text-center">
                  No bids placed on current lot yet.
                </div>
              ) : (
                <>
                  {[...lot.trail]
                    .map((b, bidIdx) => {
                      const prevPrice = bidIdx === 0 ? lot.p.base : lot.trail[bidIdx - 1].price;
                      const delta = Math.max(0, b.price - prevPrice);
                      return { ...b, bidIdx, delta };
                    })
                    .reverse()
                    .map((b) => {
                      const tm = vm.teams.find((x) => x.id === b.team);
                      const isLatest = b.bidIdx === lot.trail.length - 1;
                      return (
                        <div
                          key={`${b.team}-${b.price}-${b.bidIdx}`}
                          data-testid={`bids-op-history-row-${b.bidIdx}`}
                          className={`px-2 py-1.5 rounded flex items-center justify-between gap-1.5 ${
                            isLatest
                              ? 'bg-[#fdb813]/15 border border-[#fdb813]/50 text-[#fdb813] font-bold'
                              : 'bg-[#1c192f] border border-[#2b273e] text-[#d5c4ac]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[9px] text-[#9d8f79] w-5 shrink-0">
                              #{b.bidIdx + 1}
                            </span>
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: tm?.c ?? '#fdb813' }}
                            />
                            <span className="truncate">{tm?.short || b.team}</span>
                            <span className="text-[9px] text-[#4edea3] shrink-0">
                              {b.bidIdx === 0 ? 'OPEN' : `+₹${formatLakhs(b.delta)}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span>{formatCurrency(b.price)}</span>
                            {isLatest ? (
                              <button
                                type="button"
                                disabled={busy || !canPlaceBids}
                                onClick={() => void handleUndoLastBid()}
                                data-testid={`bids-op-undo-entry-${b.bidIdx}`}
                                title="Undo this misbid"
                                className="px-1.5 py-0.5 rounded bg-[#93000a]/60 hover:bg-[#93000a] text-[#ffb4ab] text-[9px] font-extrabold disabled:opacity-40"
                              >
                                Undo
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy || !canPlaceBids}
                                onClick={() => void handleRevertToBid(b.bidIdx)}
                                data-testid={`bids-op-revert-${b.bidIdx}`}
                                title={`Revert back to #${b.bidIdx + 1} (${tm?.short || b.team} ${formatCurrency(b.price)})`}
                                className="px-1.5 py-0.5 rounded bg-[#201d33] hover:bg-[#2b273e] border border-[#504533] hover:border-[#fdb813] text-[#ffdb9f] text-[9px] font-bold disabled:opacity-40"
                              >
                                Revert
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  <div className="pt-1 flex items-center justify-between px-2 py-1 rounded bg-[#141026] border border-[#2b273e] text-[#9d8f79]">
                    <span>Base · {formatCurrency(lot.p.base)}</span>
                    <button
                      type="button"
                      disabled={busy || !canPlaceBids}
                      onClick={() => void handleRevertToBid(-1)}
                      data-testid="bids-op-revert-base"
                      className="px-1.5 py-0.5 rounded bg-[#93000a]/40 hover:bg-[#93000a]/70 text-[#ffb4ab] text-[9px] font-bold disabled:opacity-40"
                    >
                      Clear to Base
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 bg-[#0e0b21] border border-[#504533] rounded-lg p-2.5 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#2b273e] pb-1 mb-1.5 shrink-0">
              <span className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe]">
                {vm.teams.length} Franchise Squads
              </span>
              <span className="font-[JetBrains_Mono] text-[9px] text-[#4edea3]">
                OS {remainingOverseasSlots}/{totalOverseasCapacity} LEFT
              </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll space-y-1">
              {vm.teams.map((t) => (
                <div
                  key={t.id}
                  className={`px-2 py-1 rounded border flex items-center justify-between gap-1 text-[10px] font-[JetBrains_Mono] ${
                    t.lead
                      ? 'bg-[#00a572]/15 border-[#4edea3]'
                      : 'bg-[#1c192f] border-[#504533]/70'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: t.c }}
                    />
                    <span className="font-bold text-[#e6defe] truncate">
                      {t.short}
                      {t.titleSubFranchise ? ' (LSG)' : ''}
                    </span>
                    <span className="text-[#9d8f79]">{t.n}/{vm.cfg.max}</span>
                  </div>
                  <span className="font-bold text-[#4edea3] shrink-0">
                    OS {t.os}/{vm.cfg.os}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
