import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  Gavel,
  Globe2,
  Home,
  Layers,
  LayoutGrid,
  Lock,
  LogIn,
  LogOut,
  Radio,
  Rocket,
  Search,
  Share2,
  SlidersHorizontal,
  Terminal,
  Tv,
  Users,
  Verified,
  Wifi,
} from 'lucide-react';
import type { AuctionViewModel, LastOutcome, LotCategory, Player } from '../auction/types.ts';
import { formatCurrency, formatLakhs, formatPlayerCardMeta, formatRole } from '../auction/engine.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudioSettings } from '../contexts/AudioSettingsContext.tsx';
import { GlobalSoundControl } from './GlobalSoundControl.tsx';
import { PlayerPortrait } from './PlayerPortrait.tsx';
import { StagePlayerCard } from './StagePlayerCard.tsx';
import { ArenaLivePrice } from './ArenaLivePrice.tsx';
import { PlayerTeamLogoPill, TeamLogoBadge } from './TeamLogoBadge.tsx';
import { useAuctionAudioCues } from '../hooks/useAuctionAudioCues.ts';
import { resolveStageHoldPlayer } from '../utils/stageCard.ts';

interface ArenaDisplayProps {
  vm: AuctionViewModel;
  players: Player[];
  connected: boolean;
  onNavigateLanding: () => void;
  onNavigateOperator: () => void;
  onNavigateBidsOp: () => void;
  onNavigateBid: () => void;
  onNavigateDeploy: () => void;
  onNavigateLogin: () => void;
  onOpenShare: () => void;
  onToast?: (msg: string) => void;
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

export function ArenaDisplay({
  vm,
  players,
  connected,
  onNavigateLanding,
  onNavigateOperator,
  onNavigateBidsOp,
  onNavigateBid,
  onNavigateDeploy,
  onNavigateLogin,
  onOpenShare,
  onToast,
}: ArenaDisplayProps) {
  const {
    hostToken,
    hostStatus,
    subOpRole,
    redeemSubOpPin,
    leaveSubOpSession,
  } = useAuth();
  const isHostAuthenticated = Boolean(hostToken && hostStatus.hostLoggedIn);
  const hasArenaAccess = isHostAuthenticated || subOpRole === 'display' || subOpRole === 'bids';

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const [overlayOutcome, setOverlayOutcome] = useState<LastOutcome | null>(null);
  const { muted } = useAudioSettings();
  const [arenaView, setArenaView] = useState<'dashboard' | 'stage' | 'livePrice'>(() => {
    try {
      const viewParam = new URLSearchParams(window.location.search).get('view');
      if (viewParam === 'live-price' || viewParam === 'livePrice') return 'livePrice';
      if (viewParam === 'stage') return 'stage';
      if (viewParam === 'dashboard') return 'dashboard';
    } catch {
      // ignore invalid URL search
    }
    return vm.lot ? 'stage' : 'dashboard';
  });
  const [dashTab, setDashTab] = useState<'teams' | 'players'>('teams');
  const [dashDeckFilter, setDashDeckFilter] = useState<number | 'ALL'>('ALL');
  const [dashQuery, setDashQuery] = useState('');

  const [nowMs, setNowMs] = useState(() => Date.now());

  const prevSeqRef = useRef<number | null>(null);
  const prevLotIdRef = useRef<string | null>(vm.lot?.p.id ?? null);
  const timerRef = useRef<number | null>(null);

  const lot = vm.lot;

  // Auto-switch to stage when a new lot goes live unless pinned to Live Price
  useEffect(() => {
    const lotId = lot?.p.id ?? null;
    if (lotId && lotId !== prevLotIdRef.current) {
      setArenaView((prev) => (prev === 'livePrice' ? 'livePrice' : 'stage'));
    }
    prevLotIdRef.current = lotId;
  }, [lot?.p.id]);

  // Sync smooth client clock with server timestamp
  useEffect(() => {
    const offset = vm.serverNow ? Date.now() - vm.serverNow : 0;
    setNowMs(Date.now() - offset);
    const id = window.setInterval(() => {
      setNowMs(Date.now() - offset);
    }, 200);
    return () => window.clearInterval(id);
  }, [vm.serverNow, vm.seq]);

  // Detect new SOLD/UNSOLD overlay
  useEffect(() => {
    const prev = prevSeqRef.current;
    prevSeqRef.current = vm.seq;

    const isFreshLiveTransition = prev !== null && vm.seq > prev && Boolean(vm.last) && !lot;
    const isRecentOnMount =
      prev === null &&
      Boolean(vm.last) &&
      !lot &&
      vm.last !== null &&
      Math.abs((vm.serverNow || Date.now()) - vm.last.ts) < 8000;

    if ((isFreshLiveTransition || isRecentOnMount) && vm.last) {
      setOverlayOutcome(vm.last);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setOverlayOutcome(null);
      }, 5000);
    } else if (prev !== null && vm.seq < prev) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setOverlayOutcome(null);
    } else if (!vm.last || lot) {
      setOverlayOutcome(null);
    }
  }, [vm.seq, vm.last, vm.serverNow, lot]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const remainingSec = lot ? Math.max(0, Math.ceil((lot.expiresAt - nowMs) / 1000)) : 0;
  useAuctionAudioCues(vm, remainingSec, !muted);

  const upcomingStrip = vm.upNext.length > 0 ? vm.upNext : vm.queue.slice(0, 3);
  const stageHold = useMemo(
    () => resolveStageHoldPlayer(lot, vm.last, upcomingStrip, players),
    [lot, vm.last, upcomingStrip, players]
  );

  const leader = useMemo(() => {
    if (lot?.team) return vm.teams.find((t) => t.id === lot.team) ?? null;
    if (!lot && vm.last?.t === 'SOLD' && vm.last.team) {
      return vm.teams.find((t) => t.id === vm.last?.team) ?? null;
    }
    return null;
  }, [lot, vm.last, vm.teams]);

  const totalOverseasCapacity = vm.teams.length * vm.cfg.os; // 11 x 8 = 88
  const usedOverseasSlots = useMemo(
    () => vm.teams.reduce((sum, t) => sum + t.os, 0),
    [vm.teams]
  );
  const remainingOverseasSlots = Math.max(0, totalOverseasCapacity - usedOverseasSlots);

  // Build map of player/title ownership for Dashboard All Players Data view
  const ownershipByLotId = useMemo(() => {
    const map = new Map<string, { teamShort: string; teamName: string; teamColor: string; price: number }>();
    for (const t of vm.teams) {
      if (t.titleId) {
        map.set(t.titleId, {
          teamShort: t.short,
          teamName: t.name,
          teamColor: t.c,
          price: t.titlePrice,
        });
      }
      for (const sp of t.squad) {
        map.set(sp.id, {
          teamShort: t.short,
          teamName: t.name,
          teamColor: t.c,
          price: sp.price,
        });
      }
    }
    return map;
  }, [vm.teams]);

  const filteredDashboardPlayers = useMemo(() => {
    const q = dashQuery.trim().toLowerCase();
    return players.filter((p) => {
      if (dashDeckFilter !== 'ALL' && p.deck !== dashDeckFilter) return false;
      if (!q) return true;
      const owner = ownershipByLotId.get(p.id);
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.deckName.toLowerCase().includes(q) ||
        (owner?.teamShort.toLowerCase().includes(q) ?? false) ||
        (owner?.teamName.toLowerCase().includes(q) ?? false)
      );
    });
  }, [players, dashDeckFilter, dashQuery, ownershipByLotId]);

  const recentOutcomeTeam =
    vm.last?.t === 'SOLD' && vm.last.team
      ? vm.teams.find((t) => t.id === vm.last?.team) ?? null
      : null;

  const handleArenaPinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = pinInput.trim();
    if (!cleaned) {
      setPinError('Enter the Display Operator PIN (or Bids Operator PIN) from the Main Operator.');
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
    setPinInput('');
    onToast?.(
      res.role === 'bids'
        ? 'Arena 1 + Bids Operator unlocked!'
        : 'Arena 1 Display unlocked (Sub-Operator read-only)'
    );
  };

  if (!hasArenaAccess) {
    return (
      <div
        className="w-screen h-screen overflow-hidden flex flex-col bg-[#141026] text-[#e6defe]"
        data-testid="arena-pin-gate"
      >
        <header className="h-12 bg-[#0e0b21] border-b border-[#504533] px-4 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateLanding}
              aria-label="Back to Landing Hub"
              className="p-1.5 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#4edea3]"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
            <span className="font-[Space_Grotesk] text-sm font-extrabold uppercase tracking-wider text-[#ffdb9f]">
              IPL AUCTION // ARENA 1 DISPLAY
            </span>
          </div>
          <GlobalSoundControl compact />
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <form
            onSubmit={handleArenaPinUnlock}
            className="w-full max-w-md bg-[#0e0b21] border-2 border-[#4edea3]/60 rounded-xl p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#00a572]/20 border border-[#4edea3]/50 flex items-center justify-center shrink-0">
                <Tv className="w-5 h-5 text-[#4edea3]" />
              </div>
              <div>
                <h1 className="font-[Space_Grotesk] text-lg font-extrabold text-[#e6defe] leading-tight">
                  Arena 1 Sub-Operator Unlock
                </h1>
                <p className="font-[JetBrains_Mono] text-[10px] text-[#4edea3]">
                  DISPLAY PIN OR BIDS OP PIN REQUIRED
                </p>
              </div>
            </div>

            <p className="font-[Inter] text-xs text-[#d5c4ac] leading-relaxed">
              Enter the event PIN issued by the Main Operator to display{' '}
              <strong className="text-[#4edea3]">Arena 1</strong> on this laptop. This grants
              sub-operator display access without full Main Operator controls.
            </p>

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
                htmlFor="arena-subop-pin-input"
                className="block font-[JetBrains_Mono] text-[10px] text-[#9d8f79] uppercase mb-1"
              >
                Enter Sub-Operator PIN
              </label>
              <input
                id="arena-subop-pin-input"
                type="text"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter 6-digit PIN"
                autoFocus
                data-testid="arena-pin-input"
                className="w-full bg-[#141026] border-2 border-[#504533] focus:border-[#4edea3] rounded-lg px-3 py-2 text-base font-[JetBrains_Mono] font-bold tracking-widest text-[#e6defe] focus:outline-none uppercase"
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
                data-testid="arena-pin-submit"
                className="px-4 py-2 rounded-lg bg-[#00a572] hover:bg-[#00a572]/90 text-[#002113] border border-[#4edea3] font-[JetBrains_Mono] text-xs font-extrabold disabled:opacity-50 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{unlocking ? 'Verifying...' : 'Display Arena 1'}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  const headerControls = (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onNavigateLanding}
        aria-label="Back to Landing Hub"
        title="Landing Hub (/)"
        className="p-1.5 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#4edea3] transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center bg-[#1c192f] p-0.5 rounded border border-[#504533]">
        <button
          type="button"
          onClick={() => {
            setOverlayOutcome(null);
            setArenaView('dashboard');
          }}
          data-testid="arena-tab-dashboard"
          className={`px-2 py-0.5 rounded font-[JetBrains_Mono] text-[10px] flex items-center gap-1 transition-colors whitespace-nowrap ${
            !overlayOutcome && arenaView === 'dashboard'
              ? 'bg-[#fdb813] text-[#271900] font-bold'
              : 'text-[#d5c4ac] hover:text-[#e6defe]'
          }`}
        >
          <LayoutGrid className="w-3 h-3" />
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setOverlayOutcome(null);
            setArenaView('stage');
          }}
          data-testid="arena-tab-stage"
          className={`px-2 py-0.5 rounded font-[JetBrains_Mono] text-[10px] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
            !overlayOutcome && arenaView === 'stage'
              ? 'bg-[#fdb813] text-[#271900] font-bold'
              : 'text-[#d5c4ac] hover:text-[#e6defe]'
          }`}
        >
          <Tv className="w-3 h-3" />
          <span>Stage</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setOverlayOutcome(null);
            setArenaView('livePrice');
          }}
          data-testid="arena-tab-live-price"
          className={`px-2 py-0.5 rounded font-[JetBrains_Mono] text-[10px] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
            !overlayOutcome && arenaView === 'livePrice'
              ? 'bg-[#fdb813] text-[#271900] font-bold'
              : 'text-[#d5c4ac] hover:text-[#e6defe]'
          }`}
        >
          <Flame className="w-3 h-3" />
          <span>Live Price</span>
        </button>
      </div>

      <GlobalSoundControl compact />

      {(isHostAuthenticated || subOpRole === 'bids') && (
        <a
          href="/bids-op"
          onClick={(e) => {
            e.preventDefault();
            onNavigateBidsOp();
          }}
          data-testid="arena-to-bids-op"
          className="px-2 py-1 rounded border border-[#fdb813]/70 bg-[#fdb813]/15 hover:bg-[#fdb813]/25 text-[#fdb813] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
          title="Open Bids Operator Console"
        >
          <Gavel className="w-3.5 h-3.5" />
          <span>Bids Desk</span>
        </a>
      )}

      {isHostAuthenticated && (
        <a
          href="/bid"
          onClick={(e) => {
            e.preventDefault();
            onNavigateBid();
          }}
          className="px-2 py-1 rounded border border-[#4edea3]/60 bg-[#00a572]/15 hover:bg-[#00a572]/25 text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
          title="Open User Bidding Console"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Bid</span>
        </a>
      )}

      <button
        type="button"
        onClick={onOpenShare}
        className="px-2 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#4edea3] font-[JetBrains_Mono] text-[10px] flex items-center gap-1 whitespace-nowrap"
        title="Share LAN URLs & QR codes"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden 2xl:inline">Share</span>
      </button>

      {isHostAuthenticated ? (
        <>
          <a
            href="/deploy"
            onClick={(e) => {
              e.preventDefault();
              onNavigateDeploy();
            }}
            className="hidden sm:flex p-1.5 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#d5c4ac] hover:text-[#4edea3] transition-colors"
            title="Deployment Guide & Logo Storage"
            aria-label="Deploy Guide"
          >
            <Rocket className="w-3.5 h-3.5" />
          </a>

          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              onNavigateLogin();
            }}
            className="hidden sm:flex px-2 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#fdb813] text-[#d5c4ac] hover:text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] items-center gap-1 transition-colors whitespace-nowrap"
            title="Host Login"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Host</span>
          </a>

          <a
            href="/operator"
            onClick={(e) => {
              e.preventDefault();
              onNavigateOperator();
            }}
            data-testid="arena-operator-link"
            className="px-2 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] flex items-center gap-1 transition-colors whitespace-nowrap"
            title="Switch to Host / Operator Queue Desk"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#fdb813]" />
            <span>Operator</span>
          </a>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            leaveSubOpSession();
            onToast?.('Exited Sub-Operator Arena 1 session');
          }}
          data-testid="arena-exit-pin"
          className="px-2 py-1 rounded border border-[#ffb4ab]/50 bg-[#93000a]/25 hover:bg-[#93000a]/45 text-[#ffb4ab] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 whitespace-nowrap"
          title="Exit Sub-Operator Display Session"
        >
          <LogOut className="w-3 h-3" />
          <span>{subOpRole === 'bids' ? 'Sub-Op: Bids' : 'Sub-Op: Display'}</span>
        </button>
      )}
    </div>
  );

  // =========================================================================
  // 1. MONUMENTAL SOLD / UNSOLD BROADCAST OVERLAY
  // =========================================================================
  if (overlayOutcome) {
    const isSold = overlayOutcome.t === 'SOLD';
    const buyer = overlayOutcome.team
      ? vm.teams.find((t) => t.id === overlayOutcome.team) ?? null
      : null;
    const finalPrice = overlayOutcome.price ?? overlayOutcome.p.base;
    const jump = finalPrice - overlayOutcome.p.base;
    const mult = (finalPrice / Math.max(1, overlayOutcome.p.base)).toFixed(2);
    const nextUp = upcomingStrip[0] ?? null;

    return (
      <div
        className="w-screen h-screen overflow-hidden bg-[#0e0b21] text-[#e6defe] flex flex-col justify-between select-none scanline-grid relative"
        data-testid="arena-overlay"
        data-outcome={overlayOutcome.t}
      >
        <header className="bg-[#0e0b21] text-[#ffdb9f] flex justify-between items-center w-full px-5 py-2 border-b border-[#504533] z-40 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isSold ? 'bg-[#4edea3]' : 'bg-[#ffb4ab]'}`}
              style={{ boxShadow: isSold ? '0 0 8px #4edea3' : '0 0 8px #ffb4ab' }}
            />
            <span className="font-[Space_Grotesk] text-lg uppercase tracking-wider font-bold text-[#ffdb9f] whitespace-nowrap">
              IPL AUCTION OPS // ARENA
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-[#93000a]/40 border border-[#ffb4ab]/50 px-3 py-1 rounded">
              <Gavel className="w-4 h-4 text-[#ffb4ab]" />
              <span className="font-[JetBrains_Mono] text-xs text-[#ffb4ab] font-bold tracking-wider">
                {isSold ? 'HAMMER DOWN // SOLD CONFIRMED' : 'TIME EXPIRED // LOT UNSOLD'}
              </span>
            </div>
            {headerControls}
          </div>
        </header>

        <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 py-4">
          <div
            className={`absolute w-[680px] h-[320px] rounded-full blur-[120px] pointer-events-none ${
              isSold ? 'bg-[#00a572]/25' : 'bg-[#93000a]/25'
            }`}
          />

          <div className="w-full max-w-6xl flex flex-col items-center">
            <div className="flex flex-col items-center mb-3">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className={`h-px w-16 bg-gradient-to-r from-transparent ${
                    isSold ? 'to-[#4edea3]' : 'to-[#ffb4ab]'
                  }`}
                />
                <span
                  className={`font-[JetBrains_Mono] text-xs font-bold tracking-[0.3em] uppercase ${
                    isSold ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                  }`}
                >
                  OFFICIAL ARENA HAMMER CONFIRMATION
                </span>
                <span
                  className={`h-px w-16 bg-gradient-to-l from-transparent ${
                    isSold ? 'to-[#4edea3]' : 'to-[#ffb4ab]'
                  }`}
                />
              </div>
              <h1
                className={`text-6xl lg:text-7xl leading-[0.88] font-[JetBrains_Mono] font-black tracking-[-0.04em] uppercase ${
                  isSold ? 'text-[#4edea3] text-glow-emerald' : 'text-[#ffb4ab] text-glow-madder'
                }`}
              >
                {isSold ? 'SOLD' : 'UNSOLD'}
              </h1>
            </div>

            <div
              className={`w-full bg-[#1c192f]/95 backdrop-blur-md border-2 rounded-lg p-4 box-glow-active relative overflow-hidden ${
                isSold ? 'border-[#4edea3]/70' : 'border-[#ffb4ab]/65'
              }`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-12 lg:col-span-4 flex items-center gap-3 lg:border-r border-[#504533]/60 lg:pr-3">
                  <div
                    className="relative w-20 h-20 rounded border border-[#9d8f79] shrink-0 overflow-hidden"
                    data-testid={overlayOutcome.p.os ? 'overseas-player-80x80' : 'sold-player-80x80'}
                  >
                    <PlayerPortrait
                      player={overlayOutcome.p}
                      teamShort={buyer?.short}
                      size="lg"
                      className="w-20 h-20"
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="inline-flex items-center gap-1.5 bg-[#201d33] px-2 py-0.5 rounded border border-[#504533] w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fdb813]" />
                      <span className="font-[JetBrains_Mono] text-[10px] text-[#ffdb9f] uppercase font-semibold">
                        {overlayOutcome.p.deckName} · {overlayOutcome.p.id}
                      </span>
                    </div>
                    <h2 className="font-[Space_Grotesk] text-xl font-bold text-[#e6defe] tracking-tight leading-tight mt-1.5">
                      {overlayOutcome.p.name.toUpperCase()}
                    </h2>
                    <div className="font-[JetBrains_Mono] text-xs text-[#4edea3] mt-1 font-bold">
                      {formatPlayerCardMeta(overlayOutcome.p)}
                    </div>
                    <div className="flex items-center gap-2 pt-1 font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                      <span>{overlayOutcome.p.country}</span>
                      <span>·</span>
                      <span>OVR {overlayOutcome.p.ovr}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 flex flex-col justify-center lg:border-r border-[#504533]/60 lg:pr-3">
                  <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] mb-1 uppercase tracking-wider">
                    {isSold ? 'ACQUIRED BY FRANCHISE' : 'DISPOSITION STATUS'}
                  </div>
                  {isSold && buyer ? (
                    <>
                      <div className="bg-[#0e0b21] border border-[#504533] p-2.5 rounded flex items-center gap-2.5 relative overflow-hidden">
                        <TeamLogoBadge team={buyer} size="md" />
                        <div className="min-w-0">
                          <span className="font-[Space_Grotesk] text-sm text-[#e6defe] font-bold block leading-tight">
                            {buyer.name.toUpperCase()}
                          </span>
                          <span className="font-[JetBrains_Mono] text-[10px] text-[#fdb813] font-semibold uppercase tracking-wider">
                            {buyer.slotLabel.toUpperCase()} · PADDLE {buyer.paddle}
                            {buyer.titleSubFranchise ? ` · ${buyer.titleSubFranchise}` : ''}
                          </span>
                        </div>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1.5"
                          style={{ backgroundColor: buyer.c }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between bg-[#2b273e]/70 px-2.5 py-1 rounded border border-[#504533]/50 font-[JetBrains_Mono] text-[10px]">
                        <span className="text-[#d5c4ac]">TEAM CODE:</span>
                        <span className="text-[#e6defe] font-bold">{buyer.short}</span>
                      </div>
                    </>
                  ) : (
                    <div className="bg-[#0e0b21] border border-[#ffb4ab]/40 p-2.5 rounded">
                      <span className="font-[Space_Grotesk] text-sm text-[#ffb4ab] font-bold block">
                        NO BIDS PLACED
                      </span>
                      <span className="font-[JetBrains_Mono] text-[10px] text-[#d5c4ac] mt-1 block">
                        Returned to Unsold Pool
                      </span>
                    </div>
                  )}
                </div>

                <div className="col-span-12 lg:col-span-4 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] uppercase tracking-wider">
                      {isSold ? 'FINAL WINNING BID' : 'RESERVE BASE PRICE'}
                    </span>
                    <span className="font-[JetBrains_Mono] text-[10px] bg-[#36324a] px-1.5 py-0.5 text-[#fdb813] rounded border border-[#504533]">
                      LOT CLOSED
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-[JetBrains_Mono] text-4xl font-bold tracking-tight leading-none ${
                        isSold ? 'text-[#fdb813] text-glow-gold' : 'text-[#ffb4ab]'
                      }`}
                    >
                      ₹ {formatLakhs(finalPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 font-[JetBrains_Mono] text-[11px]">
                    <span className="text-[#d5c4ac]">
                      BASE: {formatCurrency(overlayOutcome.p.base)}
                    </span>
                    {isSold && (
                      <>
                        <span className="text-[#504533]">|</span>
                        <span className="text-[#4edea3] font-bold bg-[#201d33] px-1.5 py-0.5 rounded border border-[#4edea3]/30">
                          +{formatCurrency(jump)} ({mult}x)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="h-12 bg-[#0e0b21] border-t border-[#504533] px-5 flex items-center justify-between z-30 font-[JetBrains_Mono] text-xs text-[#d5c4ac]">
          <div className="flex items-center gap-2 bg-[#201d33] px-2.5 py-1 rounded border border-[#504533]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3]" />
            <span className="text-[#e6defe] font-bold">
              {isSold ? 'SOLD AT HAMMER' : 'PASSED TO UNSOLD POOL'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {nextUp && (
              <div className="hidden md:flex items-center gap-2 bg-[#2b273e] px-3 py-1 rounded border border-[#9d8f79]">
                <span className="text-[#fdb813] font-bold">ON DECK:</span>
                <span className="text-[#e6defe] font-semibold">
                  {nextUp.name.toUpperCase()} ({formatPlayerCardMeta(nextUp)})
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setOverlayOutcome(null)}
              className="px-3 py-1 rounded bg-[#36324a] hover:bg-[#504533] text-[#ffdb9f] font-bold"
            >
              Continue
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // 2. ARENA STAGE VIEW (Full-Stage Large Player Card for Back-Row Visibility)
  // =========================================================================
  if (arenaView === 'stage' && stageHold) {
    const stagePlayer = stageHold.player;
    const isLive = Boolean(lot);
    const isUrgent = lot ? remainingSec <= 15 : false;

    return (
      <div
        className="w-screen h-screen overflow-hidden flex flex-col bg-[#0b1020] text-[#e6defe] select-none"
        data-testid="arena-live"
      >
        <header className="bg-[#0e0b21] text-[#ffdb9f] flex justify-between items-center w-full px-3.5 py-1.5 border-b border-[#504533] shrink-0 z-30 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-[#2b273e] px-2 py-1 rounded border border-[#504533] whitespace-nowrap">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isLive ? 'bg-[#ffb4ab]' : connected ? 'bg-[#4edea3]' : 'bg-[#9d8f79]'
                }`}
              />
              <span className="font-[Space_Grotesk] text-xs uppercase tracking-wider text-[#ffdb9f] font-bold">
                IPL AUCTION // ARENA STAGE
              </span>
            </div>
            <div className="px-2 py-1 bg-[#36324a] rounded border border-[#504533] whitespace-nowrap">
              <span className="font-[JetBrains_Mono] text-[10px] text-[#ffdea7] uppercase tracking-wider">
                {CATEGORY_LABEL[stagePlayer.category]}
              </span>
            </div>
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#141b30] border border-[#3a4d74] font-[JetBrains_Mono] text-[10px] text-[#9ec5ff]">
              <span>{stagePlayer.id}</span>
              <span>·</span>
              <span className="text-[#4edea3] font-bold">
                OS {remainingOverseasSlots}/{totalOverseasCapacity}
              </span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 bg-[#1c192f] px-3.5 py-1 rounded border border-[#fdb813]/40 whitespace-nowrap">
            {isLive ? (
              <>
                <span
                  className={`inline-flex items-center gap-1.5 font-[JetBrains_Mono] text-sm font-black tabular-nums ${
                    isUrgent ? 'text-[#ffb4ab] animate-pulse' : 'text-[#4edea3]'
                  }`}
                  data-testid="arena-countdown"
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{formatClock(remainingSec)}</span>
                </span>
                <span className="text-[#504533]">|</span>
                <span
                  className="font-[JetBrains_Mono] text-sm text-[#fdb813] font-extrabold tracking-wider tabular-nums"
                  data-testid="arena-price"
                >
                  ₹ {formatLakhs(lot!.price)}
                </span>
              </>
            ) : (
              <>
                <Terminal className="w-4 h-4 text-[#fdb813] shrink-0" />
                <span className="font-[JetBrains_Mono] text-sm text-[#fdb813] font-extrabold tracking-wider">
                  {stagePlayer.id} // {stagePlayer.name.toUpperCase()}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded border whitespace-nowrap ${
                connected
                  ? 'bg-[#00a572]/20 border-[#00a572] text-[#4edea3]'
                  : 'bg-[#93000a]/30 border-[#ffb4ab] text-[#ffb4ab]'
              }`}
            >
              <Wifi className="w-3 h-3" />
              <span className="font-[JetBrains_Mono] text-[10px] font-bold">
                {isLive ? 'LIVE' : stageHold.holdMode === 'sold' ? 'HOLD' : 'READY'}
              </span>
            </div>
            {headerControls}
          </div>
        </header>

        <main className="flex-1 min-h-0 p-2 sm:p-3 flex items-center justify-center overflow-hidden bg-[#0b1020]">
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ containerType: 'size' }}
          >
            <div
              className="aspect-[16/9] max-w-full max-h-full"
              style={{ width: 'min(100cqw, calc(100cqh * 16 / 9))' }}
            >
              <StagePlayerCard
                player={stagePlayer}
                leaderShort={leader?.short ?? null}
                holdMode={stageHold.holdMode}
                outcomeTeamShort={stageHold.outcomeTeamShort}
                outcomePrice={stageHold.outcomePrice}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // 2B. ARENA LIVE PRICE VIEW (Gamified Live Bid Price & Escalation Display)
  // =========================================================================
  if (arenaView === 'livePrice') {
    const isLive = Boolean(lot);

    return (
      <div
        className="w-screen h-screen overflow-hidden flex flex-col bg-[#090d1b] text-[#e6defe] select-none"
        data-testid="arena-live-price-shell"
      >
        <header className="bg-[#0e0b21] text-[#ffdb9f] flex justify-between items-center w-full px-3.5 py-1.5 border-b border-[#504533] shrink-0 z-30 gap-2">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="font-[Space_Grotesk] text-xs uppercase tracking-wider text-[#ffdb9f] font-bold whitespace-nowrap">
              IPL AUCTION // LIVE PRICE
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 font-[JetBrains_Mono] text-[10px] text-[#9ec5ff] whitespace-nowrap">
              <span>{vm.counts.sold}/{vm.counts.playersTotal} Sold</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#4edea3] font-bold">
                OS {remainingOverseasSlots}/{totalOverseasCapacity}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded border whitespace-nowrap ${
                connected
                  ? 'bg-[#00a572]/20 border-[#00a572] text-[#4edea3]'
                  : 'bg-[#93000a]/30 border-[#ffb4ab] text-[#ffb4ab]'
              }`}
            >
              <Wifi className="w-3 h-3" />
              <span className="font-[JetBrains_Mono] text-[10px] font-bold">
                {isLive ? 'BIDDING LIVE' : 'STANDBY'}
              </span>
            </div>
            {headerControls}
          </div>
        </header>

        <ArenaLivePrice
          vm={vm}
          players={players}
          remainingSec={remainingSec}
          nowMs={nowMs}
          upcomingStrip={upcomingStrip}
        />
      </div>
    );
  }

  // =========================================================================
  // 3. USER-FACING DASHBOARD VIEW (Separate from Stage: Recent Sold + Decks + All Players Data + 11 Teams)
  // =========================================================================
  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col bg-[#141026] text-[#e6defe] select-none"
      data-testid="arena-dashboard"
    >
      <header className="flex justify-between items-center w-full px-3.5 py-2 border-b border-[#504533] bg-[#0e0b21] shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#201d33] px-2 py-1 rounded border border-[#504533] whitespace-nowrap shrink-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-[#4edea3]' : 'bg-[#ffb4ab]'}`}
              style={{ boxShadow: connected ? '0 0 8px #4edea3' : 'none' }}
            />
            <span className="font-[JetBrains_Mono] text-[10px] font-bold text-[#4edea3] uppercase tracking-wider">
              {lot ? 'LOT LIVE' : connected ? 'ARENA' : 'SYNC'}
            </span>
          </div>
          <h1 className="font-[Space_Grotesk] text-sm uppercase tracking-wider text-[#ffdb9f] font-bold whitespace-nowrap">
            IPL AUCTION // ARENA DASHBOARD
          </h1>
        </div>

        {lot ? (
          <button
            type="button"
            onClick={() => setArenaView('stage')}
            className="hidden lg:flex items-center gap-1.5 bg-[#fdb813]/20 border border-[#fdb813] px-2.5 py-1 rounded font-[JetBrains_Mono] text-[11px] font-bold text-[#fdb813] whitespace-nowrap max-w-[360px] truncate"
          >
            <Radio className="w-3 h-3 shrink-0" />
            <span className="truncate">
              STAGE LIVE: {lot.p.name} · ₹{formatLakhs(lot.price)} · {formatClock(remainingSec)}
            </span>
          </button>
        ) : stageHold ? (
          <button
            type="button"
            onClick={() => setArenaView('stage')}
            className="hidden lg:flex items-center gap-1.5 bg-[#201d33] border border-[#504533] hover:border-[#fdb813] px-2.5 py-1 rounded font-[JetBrains_Mono] text-[10px] text-[#d5c4ac] whitespace-nowrap max-w-[320px] truncate"
          >
            <Tv className="w-3 h-3 text-[#fdb813] shrink-0" />
            <span className="truncate">
              STAGE HOLD: {stageHold.player.name}
            </span>
          </button>
        ) : null}

        <div className="flex items-center gap-2 shrink-0">{headerControls}</div>
      </header>

      {/* Most Recent Player Sold Spotlight + Stage & OS Summary */}
      <section className="w-full bg-[#1c192f] border-b border-[#504533] px-4 py-2 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        {/* Most Recent Sale Banner */}
        <div
          className="flex items-center gap-2.5 bg-[#141026] border border-[#fdb813]/55 rounded-lg px-3 py-1.5 min-w-0 max-w-full lg:max-w-[480px]"
          data-testid="dashboard-recent-sold"
        >
          {vm.last ? (
            <>
              <div className="w-9 h-9 rounded border border-[#fdb813]/60 overflow-hidden shrink-0 bg-[#1c192f]">
                <PlayerPortrait
                  player={vm.last.p}
                  teamShort={recentOutcomeTeam?.short}
                  size="sm"
                  className="w-9 h-9"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-[JetBrains_Mono] text-[9px] uppercase">
                  <span
                    className={`font-black ${
                      vm.last.t === 'SOLD' ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                    }`}
                  >
                    {vm.last.t === 'SOLD' ? '★ MOST RECENT SOLD' : 'MOST RECENT PASSED'}
                  </span>
                  <span className="text-[#9d8f79]">· {vm.last.p.deckName}</span>
                </div>
                <div className="font-[Space_Grotesk] text-xs font-extrabold text-[#e6defe] truncate">
                  {vm.last.p.name}
                  {vm.last.t === 'SOLD' && recentOutcomeTeam && (
                    <span className="text-[#fdb813] font-[JetBrains_Mono] text-[11px] ml-1.5">
                      → {recentOutcomeTeam.name} ({recentOutcomeTeam.short}
                      {recentOutcomeTeam.titleSubFranchise
                        ? ` · Sub: ${recentOutcomeTeam.titleSubFranchise.split(' · ')[0]}`
                        : ''}
                      ) · {formatCurrency(vm.last.price ?? vm.last.p.base)}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 font-[JetBrains_Mono] text-[11px] text-[#d5c4ac]">
              <Gavel className="w-4 h-4 text-[#fdb813]" />
              <span>No players sold yet — waiting for opening hammer</span>
            </div>
          )}
        </div>

        {/* Live Counts + Sub-Tab Switcher (Teams & Decks | All Players Data) */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 font-[JetBrains_Mono] text-xs">
            <span className="text-[#fdb813] font-bold">
              {vm.counts.titlesSold}/{vm.counts.titlesTotal} TITLES
            </span>
            <span className="text-[#4edea3] font-bold">
              {vm.counts.sold}/{vm.counts.playersTotal} SOLD
            </span>
            <span className="text-[#ffafb4] font-bold">{vm.counts.unsold} UNSOLD</span>
            <span
              className="px-2 py-0.5 rounded bg-[#00a572]/15 border border-[#4edea3]/40 text-[#4edea3] font-bold flex items-center gap-1"
              data-testid="arena-overseas-counter"
            >
              <Globe2 className="w-3 h-3" />
              <span>OS {remainingOverseasSlots}/{totalOverseasCapacity}</span>
            </span>
          </div>

          <div className="flex items-center bg-[#141026] p-0.5 rounded-lg border border-[#504533]">
            <button
              type="button"
              onClick={() => setDashTab('teams')}
              data-testid="dash-subtab-teams"
              className={`px-2.5 py-1 rounded font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 transition-colors ${
                dashTab === 'teams'
                  ? 'bg-[#fdb813] text-[#271900]'
                  : 'text-[#d5c4ac] hover:text-[#e6defe]'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>{vm.teams.length} Teams &amp; Decks</span>
            </button>
            <button
              type="button"
              onClick={() => setDashTab('players')}
              data-testid="dash-subtab-players"
              className={`px-2.5 py-1 rounded font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 transition-colors ${
                dashTab === 'players'
                  ? 'bg-[#fdb813] text-[#271900]'
                  : 'text-[#d5c4ac] hover:text-[#e6defe]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>All Players Data ({players.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Decks 0–7 Summary + On-Deck Strip */}
      <div
        className="w-full bg-[#141026] border-b border-[#504533]/70 px-4 py-1.5 flex items-center justify-between gap-3 overflow-x-auto shrink-0"
        data-testid="dashboard-decks-strip"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] font-bold uppercase mr-1">
            DECKS:
          </span>
          {vm.decks.map((d) => (
            <button
              key={d.deck}
              type="button"
              onClick={() => {
                setDashTab('players');
                setDashDeckFilter(d.deck);
              }}
              className={`px-2 py-0.5 rounded border font-[JetBrains_Mono] text-[10px] transition-colors whitespace-nowrap ${
                dashTab === 'players' && dashDeckFilter === d.deck
                  ? 'bg-[#fdb813] text-[#271900] border-[#fdb813] font-bold'
                  : 'bg-[#1c192f] border-[#504533] text-[#d5c4ac] hover:border-[#fdb813]'
              }`}
            >
              <span>D{d.deck} {d.name.split(' ')[0]}</span>
              <span className="ml-1 text-[#4edea3] font-bold">
                {d.sold}/{d.total}
              </span>
            </button>
          ))}
        </div>

        {upcomingStrip.length > 0 && (
          <div className="hidden xl:flex items-center gap-1.5 font-[JetBrains_Mono] text-[10px] shrink-0">
            <span className="text-[#9d8f79] font-bold">ON DECK:</span>
            {upcomingStrip.slice(0, 3).map((q, idx) => (
              <span
                key={q.id}
                className="px-2 py-0.5 rounded bg-[#1c192f] border border-[#504533] text-[#e6defe]"
              >
                <strong className="text-[#fdb813]">#{idx + 1}</strong> {q.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {dashTab === 'teams' ? (
        /* 11-TEAM ROSTERS GRID (NO PURSE / NO BUDGET DISPLAY) */
        <main className="flex-1 overflow-y-auto custom-scroll p-2.5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6 gap-2.5 content-start">
          {vm.teams.map((t) => (
            <section
              key={t.id}
              data-testid={`dashboard-team-${t.id}`}
              className="bg-[#0e0b21] border border-[#504533] rounded-lg flex flex-col overflow-hidden h-[234px]"
            >
              <div className="p-2 bg-[#1c192f] border-b border-[#504533] relative shrink-0">
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: t.c }}
                />
                <div className="flex items-center justify-between gap-1.5 pl-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <TeamLogoBadge team={t} size="xs" />
                    <div className="min-w-0">
                      <h2 className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] truncate leading-tight">
                        {t.name}
                      </h2>
                      <div className="font-[JetBrains_Mono] text-[9px] text-[#9d8f79] flex items-center gap-1 truncate">
                        <span>{t.paddle}</span>
                        {t.titleSubFranchise ? (
                          <span className="text-[#4edea3] font-bold truncate">
                            · Sub: {t.titleSubFranchise.split(' · ')[0]}
                          </span>
                        ) : t.titleId ? (
                          <span className="text-[#fdb813] font-bold flex items-center gap-0.5">
                            · <Crown className="w-2.5 h-2.5" /> {t.short}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-[JetBrains_Mono] text-[11px] font-bold text-[#4edea3]">
                      {t.n}/{vm.cfg.max}
                    </div>
                    <div className="font-[JetBrains_Mono] text-[9px] text-[#ffdb9f]">
                      OS {t.os}/{vm.cfg.os}
                    </div>
                  </div>
                </div>
                <div className="mt-1 pl-1 flex items-center gap-1 font-[JetBrains_Mono] text-[9px]">
                  <span
                    className={`px-1.5 py-0.2 rounded border ${
                      t.bowlersNeeded === 0
                        ? 'bg-[#00a572]/20 border-[#4edea3]/50 text-[#4edea3]'
                        : 'bg-[#141026] border-[#504533] text-[#ffdb9f]'
                    }`}
                  >
                    BOWL {t.bowlers}/{vm.cfg.minBowlers}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded border ${
                      t.wicketkeepersNeeded === 0
                        ? 'bg-[#00a572]/20 border-[#4edea3]/50 text-[#4edea3]'
                        : 'bg-[#141026] border-[#504533] text-[#ffdb9f]'
                    }`}
                  >
                    WK {t.wicketkeepers}/{vm.cfg.minWicketkeepers}
                  </span>
                  {t.compositionOk && <CheckCircle2 className="w-3 h-3 text-[#4edea3] ml-auto" />}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1.5">
                {t.squad.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-3 font-[JetBrains_Mono] text-[11px] text-[#9d8f79]">
                    <span>No players acquired yet</span>
                    <span className="text-[10px] opacity-75 mt-0.5">
                      {t.titleId
                        ? `Franchise: ${t.name}${t.titleSubFranchise ? ` (${t.titleSubFranchise.split(' · ')[0]})` : ''}`
                        : 'Awaiting Franchise & Player signings'}
                    </span>
                  </div>
                ) : (
                  t.squad.map((p) => (
                    <div
                      key={p.id}
                      className="bg-[#1c192f]/80 border border-[#36324a] rounded px-2.5 py-1.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <PlayerTeamLogoPill teamShort={t.short} teamName={t.name} size="sm" />
                        <div className="min-w-0">
                          <div className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] truncate">
                            {p.name}
                          </div>
                          <div className="font-[JetBrains_Mono] text-[10px] text-[#4edea3] truncate">
                            {formatPlayerCardMeta(p)}
                          </div>
                        </div>
                      </div>
                      <span className="font-[JetBrains_Mono] text-[11px] font-bold text-[#fdb813] shrink-0">
                        {formatCurrency(p.price)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </main>
      ) : (
        /* ALL PLAYERS & DECKS DATA TABLE */
        <main
          className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 gap-2.5"
          data-testid="dashboard-all-players"
        >
          <div className="bg-[#0e0b21] border border-[#504533] rounded-lg px-3 py-2 flex items-center justify-between gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setDashDeckFilter('ALL')}
                className={`px-2 py-1 rounded font-[JetBrains_Mono] text-[10px] font-bold border ${
                  dashDeckFilter === 'ALL'
                    ? 'bg-[#fdb813] text-[#271900] border-[#fdb813]'
                    : 'bg-[#1c192f] text-[#d5c4ac] border-[#504533]'
                }`}
              >
                All ({players.length})
              </button>
              {vm.decks.map((d) => (
                <button
                  key={d.deck}
                  type="button"
                  onClick={() => setDashDeckFilter(d.deck)}
                  className={`px-2 py-1 rounded font-[JetBrains_Mono] text-[10px] font-bold border ${
                    dashDeckFilter === d.deck
                      ? 'bg-[#fdb813] text-[#271900] border-[#fdb813]'
                      : 'bg-[#1c192f] text-[#d5c4ac] border-[#504533]'
                  }`}
                >
                  D{d.deck}: {d.name} ({d.sold}/{d.total})
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-[#9d8f79] absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={dashQuery}
                onChange={(e) => setDashQuery(e.target.value)}
                placeholder="Search player, role, deck, team..."
                aria-label="Filter all players data"
                className="w-full bg-[#141026] border border-[#504533] rounded pl-8 pr-2.5 py-1 text-xs text-[#e6defe] placeholder:text-[#9d8f79] font-[JetBrains_Mono] focus:outline-none focus:border-[#fdb813]"
              />
            </div>
          </div>

          <div className="flex-1 bg-[#0e0b21] border border-[#504533] rounded-lg overflow-auto custom-scroll">
            <table className="w-full text-left border-collapse font-[JetBrains_Mono] text-xs">
              <thead className="sticky top-0 bg-[#201d33] border-b border-[#504533] text-[10px] text-[#9d8f79] z-10">
                <tr>
                  <th className="py-2 px-3">LOT</th>
                  <th className="py-2 px-3">PLAYER / FRANCHISE</th>
                  <th className="py-2 px-3">DECK</th>
                  <th className="py-2 px-3">ROLE</th>
                  <th className="py-2 px-3">ORIGIN</th>
                  <th className="py-2 px-3 text-center">OVR</th>
                  <th className="py-2 px-3 text-right">BASE</th>
                  <th className="py-2 px-3 text-center">STATUS</th>
                  <th className="py-2 px-3 text-right">TEAM / PRICE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#504533]/50">
                {filteredDashboardPlayers.map((p) => {
                  const st = vm.status[p.id];
                  const isLiveLot = lot?.p.id === p.id;
                  const owner = ownershipByLotId.get(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-[#1c192f] transition-colors">
                      <td className="py-1.5 px-3 text-[#9d8f79]">{p.id}</td>
                      <td className="py-1.5 px-3">
                        <span className="font-[Space_Grotesk] font-bold text-[#e6defe]">
                          {p.name}
                        </span>
                        {p.titleTheme?.subFranchise && (
                          <span className="ml-1.5 text-[10px] text-[#4edea3]">
                            ({p.titleTheme.subFranchise})
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-[#d5c4ac]">
                        D{p.deck} · {p.deckName}
                      </td>
                      <td className="py-1.5 px-3 text-[#d5c4ac]">
                        {p.isTitle ? 'Franchise Title' : formatRole(p.role)}
                      </td>
                      <td className="py-1.5 px-3">
                        <span
                          className={`px-1.5 py-0.2 rounded border text-[10px] ${
                            p.os
                              ? 'bg-[#00a572]/15 border-[#4edea3]/50 text-[#4edea3]'
                              : 'bg-[#201d33] border-[#504533] text-[#ffdb9f]'
                          }`}
                        >
                          {p.os ? `OS (${p.cc})` : p.cc}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center text-[#fdb813] font-bold">{p.ovr}</td>
                      <td className="py-1.5 px-3 text-right text-[#d5c4ac]">
                        {formatCurrency(p.base)}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {isLiveLot ? (
                          <span className="px-2 py-0.5 rounded bg-[#fdb813]/20 border border-[#fdb813] text-[#fdb813] text-[10px] font-bold">
                            LIVE
                          </span>
                        ) : st === 'sold' ? (
                          <span className="px-2 py-0.5 rounded bg-[#00a572]/20 border border-[#4edea3]/50 text-[#4edea3] text-[10px] font-bold">
                            SOLD
                          </span>
                        ) : st === 'unsold' ? (
                          <span className="px-2 py-0.5 rounded bg-[#93000a]/30 border border-[#ffb4ab]/50 text-[#ffb4ab] text-[10px] font-bold">
                            UNSOLD
                          </span>
                        ) : (
                          <span className="text-[#9d8f79] text-[10px]">PENDING</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        {owner ? (
                          <span className="font-bold text-[#fdb813]">
                            {owner.teamShort} · {formatCurrency(owner.price)}
                          </span>
                        ) : (
                          <span className="text-[#9d8f79]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      )}

      <footer className="h-9 bg-[#0e0b21] border-t border-[#504533] px-5 flex items-center justify-between shrink-0 font-[JetBrains_Mono] text-[11px] text-[#d5c4ac]">
        <div className="flex items-center gap-2">
          <Verified className="w-3.5 h-3.5 text-[#4edea3]" />
          <span className="text-[#e6defe] font-semibold">
            {connected ? 'ARENA DASHBOARD LIVE' : 'RECONNECTING'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#9d8f79] font-bold">
            MANUAL FUNDS MODE · DASHBOARD &amp; STAGE SEPARATED
          </span>
          <span className="bg-[#201d33] px-2 py-0.5 rounded border border-[#504533] text-[#ffdb9f] font-bold">
            CLUB EVENT EDITION
          </span>
        </div>
      </footer>
    </div>
  );
}
