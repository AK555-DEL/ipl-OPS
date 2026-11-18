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
  Share2,
  ShieldAlert,
  SlidersHorizontal,
  Tv,
  Wifi,
  Zap,
} from 'lucide-react';
import type { AuctionViewModel, CommandBody, LotCategory, Player } from '../auction/types.ts';
import { formatCurrency, formatLakhs, formatPlayerCardMeta } from '../auction/engine.ts';
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

  const handleJumpBid = async (deltaLakhs: number) => {
    if (!lot || busy || !activeTeam || !canPlaceBids) return;
    if (activeTeam.lead) {
      onToast(`${activeTeam.short} already holds the highest bid`);
      return;
    }
    if (activeTeam.block) {
      onToast(`${activeTeam.short}: ${activeTeam.block}`);
      return;
    }
    await onSend({ type: 'jump', team: activeTeam.id, delta: deltaLakhs });
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

  const jumpOptions: Array<{ delta: number; label: string; sub: string; accent?: boolean }> = lot
    ? lot.team === null
      ? [
          { delta: 0, label: 'OPEN AT BASE', sub: formatCurrency(lot.price), accent: true },
          { delta: 25, label: '+₹25 L', sub: `→ ${formatCurrency(lot.price + 25)}` },
          { delta: 50, label: '+₹50 L', sub: `→ ${formatCurrency(lot.price + 50)}` },
          { delta: 100, label: '+₹1.00 Cr', sub: `→ ${formatCurrency(lot.price + 100)}` },
          { delta: 200, label: '+₹2.00 Cr', sub: `→ ${formatCurrency(lot.price + 200)}` },
          { delta: 500, label: '+₹5.00 Cr', sub: `→ ${formatCurrency(lot.price + 500)}` },
        ]
      : [
          {
            delta: lot.p.inc,
            label: `+${formatCurrency(lot.p.inc)}`,
            sub: `→ ${formatCurrency(lot.price + lot.p.inc)}`,
            accent: true,
          },
          ...[25, 50, 100, 200, 500, 1000]
            .filter((d) => d > lot.p.inc)
            .slice(0, 5)
            .map((d) => ({
              delta: d,
              label: `+${formatCurrency(d)}`,
              sub: `→ ${formatCurrency(lot.price + d)}`,
            })),
        ]
    : [];

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
        {/* LEFT COLUMN (3 cols): Up Next (Main Op Staged) + Overseas 80x80 Spotlight */}
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
              <div className="py-3 text-center font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
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

          {/* Role Lock Notice */}
          <div className="mt-auto bg-[#1c192f] border border-[#504533] rounded-lg p-2.5 flex items-start gap-2 font-[JetBrains_Mono] text-[10px] text-[#d5c4ac]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#fdb813] shrink-0 mt-0.5" />
            <span>
              Main Operator releases lots &amp; manages queues. Use keys <strong className="text-[#fdb813]">1–9, 0, -</strong> or
              click a team card to place bids on their behalf.
            </span>
          </div>
        </section>

        {/* CENTER COLUMN (6 cols): Active Team Selector + Live Bid Controls */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-2.5 min-h-0 overflow-hidden">
          {/* Live Lot Banner */}
          <div className="bg-[#0e0b21] border-2 border-[#fdb813]/50 rounded-lg p-3 shrink-0">
            {lot ? (
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

          {/* 11-Team Selector Grid */}
          <div className="bg-[#0e0b21] border border-[#504533] rounded-lg p-2.5 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe]">
                Select Bidding Team (1–9, 0, -)
              </span>
              {activeTeam && (
                <span className="font-[JetBrains_Mono] text-[10px] text-[#fdb813] font-bold">
                  ACTIVE: {activeTeam.name} ({activeTeam.short})
                  {activeTeam.titleSubFranchise ? ` · Sub: ${activeTeam.titleSubFranchise}` : ''} · SLOTS{' '}
                  {activeTeam.n}/{vm.cfg.max}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-1.5">
              {vm.teams.map((t, index) => {
                const selected = t.id === activeTeam?.id;
                const hotkey = index === 9 ? '0' : index === 10 ? '-' : String(index + 1);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelectTeamId(t.id)}
                    data-testid={`bids-op-team-${t.id}`}
                    className={`text-left px-2 py-1.5 rounded border transition-all flex items-center justify-between gap-1.5 ${
                      selected
                        ? 'bg-[#2b273e] border-2 border-[#fdb813] text-[#e6defe]'
                        : t.lead
                          ? 'bg-[#00a572]/20 border-[#4edea3] text-[#4edea3]'
                          : t.block
                            ? 'bg-[#1c192f]/50 border-[#504533]/50 text-[#9d8f79] opacity-70'
                            : 'bg-[#1c192f] border-[#504533] hover:border-[#fdb813]/70 text-[#e6defe]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <TeamLogoBadge team={t} size="xs" />
                      <div className="min-w-0">
                        <div className="font-[Space_Grotesk] text-[11px] font-bold truncate leading-tight">
                          [{hotkey}] {t.short}
                        </div>
                        <div className="font-[JetBrains_Mono] text-[9px] text-[#d5c4ac] truncate">
                          {t.n}/{vm.cfg.max} SLOTS · OS {t.os}/{vm.cfg.os}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Large Jump Bid Controls */}
          <div className="flex-1 min-h-0 bg-[#0e0b21] border border-[#504533] rounded-lg p-3 flex flex-col justify-between gap-2.5 overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-[#fdb813]" />
                <span className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe]">
                  Place Bid For: <span className="text-[#fdb813]">{activeTeam?.name}</span>
                </span>
              </div>
              {activeTeam && (
                <div className="font-[JetBrains_Mono] text-[10px] text-[#4edea3]">
                  SLOTS {activeTeam.n}/{vm.cfg.max} · OS {activeTeam.os}/{vm.cfg.os} · B{' '}
                  {activeTeam.bowlers}/{vm.cfg.minBowlers} · WK {activeTeam.wicketkeepers}/
                  {vm.cfg.minWicketkeepers}
                </div>
              )}
            </div>

            {activeTeam?.block && lot && (
              <div className="bg-[#93000a]/30 border border-[#ffb4ab]/60 rounded px-3 py-1.5 font-[JetBrains_Mono] text-[11px] text-[#ffb4ab] font-bold">
                Blocked for {activeTeam.short}: {activeTeam.block}
              </div>
            )}

            {activeTeam?.lead && lot && (
              <div className="bg-[#00a572]/20 border border-[#4edea3]/60 rounded px-3 py-1.5 font-[JetBrains_Mono] text-[11px] text-[#4edea3] font-bold">
                ★ {activeTeam.short} currently holds the highest bid — select another franchise to counter-bid!
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
              {jumpOptions.map((opt) => {
                const disabled = !lot || busy || Boolean(activeTeam?.lead) || Boolean(activeTeam?.block);
                return (
                  <button
                    key={`${opt.delta}-${opt.label}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => void handleJumpBid(opt.delta)}
                    data-testid={`bids-op-jump-${opt.delta}`}
                    className={`rounded-lg px-3 py-2.5 border-2 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                      opt.accent
                        ? 'bg-[#fdb813] hover:bg-[#ffbb1e] border-[#ffdb9f] text-[#271900] shadow-lg'
                        : 'bg-[#1c192f] hover:bg-[#2b273e] border-[#504533] hover:border-[#fdb813] text-[#e6defe]'
                    }`}
                  >
                    <span className="font-[JetBrains_Mono] text-base font-black leading-none">
                      {opt.label}
                    </span>
                    <span
                      className={`font-[JetBrains_Mono] text-[10px] font-bold ${
                        opt.accent ? 'text-[#271900]/80' : 'text-[#4edea3]'
                      }`}
                    >
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCustomBid} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customCr}
                onChange={(e) => setCustomCr(e.target.value)}
                disabled={!lot || busy || Boolean(activeTeam?.lead) || Boolean(activeTeam?.block)}
                placeholder="Custom Bid in Cr (e.g. 6.50)"
                aria-label="Custom bid in crores"
                className="flex-1 bg-[#141026] border border-[#504533] rounded-lg px-3 py-1.5 text-xs font-[JetBrains_Mono] text-[#e6defe] focus:outline-none focus:border-[#fdb813] disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!lot || busy || Boolean(activeTeam?.lead) || Boolean(activeTeam?.block)}
                className="px-4 py-1.5 rounded-lg bg-[#00a572] hover:bg-[#00a572]/90 text-[#002113] font-[JetBrains_Mono] text-xs font-extrabold disabled:opacity-40"
              >
                Place Custom Bid
              </button>
            </form>
          </div>
        </section>

        {/* RIGHT COLUMN (3 cols): Live Bid Trail & 11 Franchise Squads */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-2.5 min-h-0 overflow-hidden">
          <div className="bg-[#0e0b21] border border-[#504533] rounded-lg p-2.5 flex flex-col gap-1.5 shrink-0 max-h-40 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#2b273e] pb-1">
              <span className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] flex items-center gap-1.5">
                {lot && lot.bidCount >= 3 ? (
                  <Flame className="w-3.5 h-3.5 text-[#fdb813]" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-[#4edea3]" />
                )}
                <span>Live Bid Trail</span>
              </span>
              <span className="font-[JetBrains_Mono] text-[10px] text-[#fdb813]">
                {lot ? `${lot.bidCount} bids` : 'IDLE'}
              </span>
            </div>
            <div className="overflow-y-auto custom-scroll space-y-1 font-[JetBrains_Mono] text-[10px]">
              {!lot || lot.trail.length === 0 ? (
                <div className="text-[#9d8f79] py-2 text-center">No bids placed on current lot yet.</div>
              ) : (
                [...lot.trail].reverse().map((b, idx) => {
                  const tm = vm.teams.find((x) => x.id === b.team);
                  return (
                    <div
                      key={`${b.team}-${b.price}-${idx}`}
                      className={`px-2 py-1 rounded flex items-center justify-between ${
                        idx === 0
                          ? 'bg-[#fdb813]/15 border border-[#fdb813]/50 text-[#fdb813] font-bold'
                          : 'bg-[#1c192f] text-[#d5c4ac]'
                      }`}
                    >
                      <span>{tm?.short || b.team}</span>
                      <span>{formatCurrency(b.price)}</span>
                    </div>
                  );
                })
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
