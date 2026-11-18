import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  Gavel,
  Home,
  KeyRound,
  LogIn,
  LogOut,
  Rocket,
  Share2,
  Shield,
  SlidersHorizontal,
  Tv,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';
import type { AuctionViewModel, CommandBody, LotCategory } from '../auction/types.ts';
import { formatCurrency, formatLakhs, formatPlayerCardMeta } from '../auction/engine.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudioSettings } from '../contexts/AudioSettingsContext.tsx';
import { GlobalSoundControl } from './GlobalSoundControl.tsx';
import { PlayerPortrait } from './PlayerPortrait.tsx';
import { PlayerTeamLogoPill, TeamLogoBadge } from './TeamLogoBadge.tsx';
import { useAuctionAudioCues } from '../hooks/useAuctionAudioCues.ts';

interface BidderConsoleProps {
  vm: AuctionViewModel;
  connected: boolean;
  busy: boolean;
  initialTeamId: string | null;
  onSend: (cmd: CommandBody) => Promise<boolean>;
  onNavigateLanding: () => void;
  onNavigateArena: () => void;
  onNavigateOperator: () => void;
  onNavigateDeploy: () => void;
  onNavigateLogin: () => void;
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

export function BidderConsole({
  vm,
  connected,
  busy,
  initialTeamId,
  onSend,
  onNavigateLanding,
  onNavigateArena,
  onNavigateOperator,
  onNavigateDeploy,
  onNavigateLogin,
  onOpenShare,
  onToast,
}: BidderConsoleProps) {
  const {
    bidderToken,
    bidderTeamId,
    hostToken,
    redeemBidderToken,
    leaveBidderRoom,
  } = useAuth();
  const { muted } = useAudioSettings();

  const [myTeamId, setMyTeamId] = useState<string>(() => {
    if (bidderTeamId && vm.teams.some((t) => t.id === bidderTeamId)) {
      return bidderTeamId;
    }
    if (initialTeamId && vm.teams.some((t) => t.id === initialTeamId)) {
      return initialTeamId;
    }
    return vm.teams[0]?.id ?? 't1';
  });
  const [customCr, setCustomCr] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const isLockedBidder = Boolean(bidderToken && bidderTeamId);
  const isHostOverride = Boolean(hostToken && !isLockedBidder);
  const hasRoomAccess = isLockedBidder || isHostOverride;

  // Auto-redeem ?token=XXXX if opened via invite link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (!urlToken) return;
    let active = true;
    setRedeeming(true);
    void redeemBidderToken(urlToken).then((res) => {
      if (!active) return;
      setRedeeming(false);
      if (res.ok && res.teamId) {
        setMyTeamId(res.teamId);
        onToast(`Joined room as ${res.name || res.short}`);
        window.history.replaceState({}, '', '/bid');
      } else {
        setTokenError(res.error || 'Invalid room invite token');
      }
    });
    return () => {
      active = false;
    };
  }, [redeemBidderToken, onToast]);

  useEffect(() => {
    if (bidderTeamId && vm.teams.some((t) => t.id === bidderTeamId)) {
      setMyTeamId(bidderTeamId);
      return;
    }
    if (isHostOverride && initialTeamId && vm.teams.some((t) => t.id === initialTeamId)) {
      setMyTeamId(initialTeamId);
    }
  }, [bidderTeamId, initialTeamId, isHostOverride, vm.teams]);

  useEffect(() => {
    const offset = vm.serverNow ? Date.now() - vm.serverNow : 0;
    setNowMs(Date.now() - offset);
    const id = window.setInterval(() => {
      setNowMs(Date.now() - offset);
    }, 200);
    return () => window.clearInterval(id);
  }, [vm.serverNow, vm.seq]);

  const myTeam = useMemo(
    () => vm.teams.find((t) => t.id === (isLockedBidder && bidderTeamId ? bidderTeamId : myTeamId)) ?? vm.teams[0],
    [vm.teams, myTeamId, isLockedBidder, bidderTeamId]
  );

  const lot = vm.lot;
  const remainingSec = lot ? Math.max(0, Math.ceil((lot.expiresAt - nowMs) / 1000)) : 0;
  const leader = lot?.team ? vm.teams.find((t) => t.id === lot.team) ?? null : null;

  useAuctionAudioCues(vm, remainingSec, !muted);

  const handleSelectTeam = (teamId: string) => {
    if (isLockedBidder) return;
    setMyTeamId(teamId);
    const nextUrl = `/bid?team=${encodeURIComponent(teamId)}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState({}, '', nextUrl);
    }
  };

  const handleTokenJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tokenInput.trim();
    if (!cleaned) {
      setTokenError('Enter the team token assigned by the host (e.g. T01-XXXX).');
      return;
    }
    setRedeeming(true);
    setTokenError(null);
    const res = await redeemBidderToken(cleaned);
    setRedeeming(false);
    if (!res.ok || !res.teamId) {
      setTokenError(res.error || 'Invalid room token');
      return;
    }
    setMyTeamId(res.teamId);
    setTokenInput('');
    onToast(`Joined room as ${res.name || res.short}`);
  };

  const handleJumpBid = async (deltaLakhs: number) => {
    if (!lot || busy || !myTeam || !hasRoomAccess) return;
    if (myTeam.lead) {
      onToast(`${myTeam.short} already holds the highest bid`);
      return;
    }
    if (myTeam.block) {
      onToast(`${myTeam.short}: ${myTeam.block}`);
      return;
    }
    await onSend({ type: 'jump', team: myTeam.id, delta: deltaLakhs });
  };

  const handleCustomBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lot || busy || !myTeam || !hasRoomAccess) return;
    if (myTeam.lead) {
      onToast(`${myTeam.short} already holds the highest bid`);
      return;
    }
    if (myTeam.block) {
      onToast(`${myTeam.short}: ${myTeam.block}`);
      return;
    }
    const raw = customCr.trim();
    if (!raw || raw.includes(',') || !/^\d+(\.\d+)?$/.test(raw)) {
      onToast('Enter bid in Cr (e.g. 4.50)');
      return;
    }
    const lakhs = Math.round(Number(raw) * 100);
    const ok = await onSend({ type: 'custom', team: myTeam.id, price: lakhs });
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
          title="Landing Hub (/)"
          className="p-1.5 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#4edea3] shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5 bg-[#201d33] px-2 py-1 rounded border border-[#4edea3]/40">
          <Users className="w-3.5 h-3.5 text-[#4edea3]" />
          <span className="font-[Space_Grotesk] text-xs font-bold uppercase tracking-wider text-[#ffdb9f] whitespace-nowrap">
            BIDDER CONSOLE
          </span>
        </div>

        <div
          className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded border font-[JetBrains_Mono] text-[10px] ${
            connected
              ? 'bg-[#00a572]/20 border-[#00a572] text-[#4edea3]'
              : 'bg-[#93000a]/30 border-[#ffb4ab] text-[#ffb4ab]'
          }`}
        >
          <Wifi className="w-3 h-3" />
          <span>{connected ? 'LIVE' : 'SYNCING'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <GlobalSoundControl compact />

        <button
          type="button"
          onClick={onOpenShare}
          className="px-2 py-1 rounded border border-[#4edea3]/50 bg-[#00a572]/15 hover:bg-[#00a572]/25 text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        <a
          href="/arena"
          onClick={(e) => {
            e.preventDefault();
            onNavigateArena();
          }}
          className="px-2 py-1 rounded border border-[#fdb813]/60 bg-[#fdb813]/15 hover:bg-[#fdb813]/25 text-[#fdb813] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1"
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Arena</span>
        </a>

        {hostToken && (
          <>
            <a
              href="/deploy"
              onClick={(e) => {
                e.preventDefault();
                onNavigateDeploy();
              }}
              className="hidden sm:flex px-2 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#d5c4ac] hover:text-[#4edea3] font-[JetBrains_Mono] text-[10px] items-center gap-1"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Deploy</span>
            </a>

            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                onNavigateLogin();
              }}
              className="hidden sm:flex px-2 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#fdb813] text-[#d5c4ac] hover:text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] items-center gap-1"
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
              className="px-2 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#fdb813]" />
              <span>Operator</span>
            </a>
          </>
        )}
      </div>
    </header>
  );

  // =========================================================================
  // TOKEN-GATED ROOM ENTRY (If user hasn't redeemed a Team Token or Host session)
  // =========================================================================
  if (!hasRoomAccess) {
    return (
      <div
        className="w-screen h-screen overflow-hidden flex flex-col bg-[#141026] text-[#e6defe]"
        data-testid="bidder-token-gate"
      >
        {headerBar}
        <main className="flex-1 min-h-0 flex items-center justify-center p-4">
          <form
            onSubmit={handleTokenJoin}
            className="bg-[#0e0b21] border-2 border-[#4edea3]/70 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#00a572]/20 border border-[#4edea3]/50 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 text-[#4edea3]" />
              </div>
              <div>
                <h1 className="font-[Space_Grotesk] text-lg font-extrabold text-[#e6defe]">
                  Join a Room · Enter Team Token
                </h1>
                <p className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                  No bidder login required · Token locks you to your team
                </p>
              </div>
            </div>

            <p className="font-[Inter] text-xs text-[#d5c4ac] leading-relaxed">
              Ask the auction host for your franchise&apos;s unique token (Team 1, Team 2, Team 3…
              Team 11 each receive a separate token after host login).
            </p>

            {tokenError && (
              <div
                role="alert"
                className="bg-[#93000a]/35 border border-[#ffb4ab]/60 rounded px-3 py-2 flex items-start gap-2 font-[JetBrains_Mono] text-[11px] text-[#ffb4ab]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{tokenError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="bidder-gate-token-input"
                className="block font-[JetBrains_Mono] text-[10px] text-[#ffdb9f] uppercase font-bold mb-1"
              >
                Assigned Team Token
              </label>
              <input
                id="bidder-gate-token-input"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="e.g. T02-A7K9"
                autoFocus
                data-testid="bidder-gate-token-input"
                className="w-full bg-[#141026] border border-[#504533] rounded-lg px-3 py-2.5 text-sm text-[#fdb813] font-[JetBrains_Mono] font-bold tracking-wider uppercase focus:outline-none focus:border-[#4edea3]"
              />
            </div>

            <button
              type="submit"
              disabled={redeeming}
              data-testid="bidder-gate-submit-btn"
              className="w-full py-2.5 px-4 rounded-lg bg-[#00a572] hover:bg-[#00a572]/90 text-[#002113] border border-[#4edea3] font-[JetBrains_Mono] text-xs font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{redeeming ? 'Verifying Token...' : 'Join the Bid'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 border-t border-[#2b273e] flex items-center justify-between font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
              <span>Are you the Auction Host?</span>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="text-[#fdb813] hover:underline font-bold"
              >
                Go to Host Login →
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col bg-[#141026] text-[#e6defe]"
      data-testid="bidder-console"
    >
      {headerBar}

      {/* Room Identity Bar: Locked Team Token Badge (for Bidders) OR Host Team Switcher (for Host) */}
      {isLockedBidder ? (
        <section
          className="bg-[#1c192f] border-b border-[#504533] px-3.5 py-1.5 flex items-center justify-between gap-2 shrink-0 flex-wrap"
          data-testid="locked-team-banner"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamLogoBadge team={myTeam} size="xs" />
            <span className="font-[Space_Grotesk] text-sm font-extrabold text-[#ffdb9f] truncate">
              {myTeam.name} ({myTeam.short})
            </span>
            {myTeam.titleSubFranchise && (
              <span className="hidden xl:inline px-1.5 py-0.5 rounded bg-[#fdb813]/15 border border-[#fdb813]/40 font-[JetBrains_Mono] text-[9px] font-bold text-[#fdb813]">
                Sub: {myTeam.titleSubFranchise}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-[#00a572]/20 border border-[#4edea3]/50 font-[JetBrains_Mono] text-[10px] font-bold text-[#4edea3]">
              TOKEN: {bidderToken}
            </span>
            <span className="hidden md:inline font-[JetBrains_Mono] text-[10px] text-[#d5c4ac]">
              Slots: <strong className="text-[#4edea3]">{myTeam.n}/{vm.cfg.max}</strong> · OS:{' '}
              <strong className="text-[#fdb813]">{myTeam.os}/{vm.cfg.os}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-[JetBrains_Mono] text-[10px]">
            <span
              className={`px-2 py-0.5 rounded border font-bold ${
                myTeam.bowlersNeeded === 0
                  ? 'bg-[#00a572]/20 border-[#4edea3]/50 text-[#4edea3]'
                  : 'bg-[#141026] border-[#fdb813]/40 text-[#fdb813]'
              }`}
            >
              BOWL {myTeam.bowlers}/{vm.cfg.minBowlers}
            </span>
            <span
              className={`px-2 py-0.5 rounded border font-bold ${
                myTeam.wicketkeepersNeeded === 0
                  ? 'bg-[#00a572]/20 border-[#4edea3]/50 text-[#4edea3]'
                  : 'bg-[#141026] border-[#fdb813]/40 text-[#fdb813]'
              }`}
            >
              WK {myTeam.wicketkeepers}/{vm.cfg.minWicketkeepers}
            </span>
            <button
              type="button"
              onClick={() => {
                leaveBidderRoom();
                onToast('Left team room — enter a new token to switch teams');
              }}
              data-testid="leave-room-btn"
              className="px-2 py-0.5 rounded border border-[#ffb4ab]/40 text-[#ffb4ab] hover:bg-[#93000a]/30 flex items-center gap-1 font-bold"
            >
              <LogOut className="w-3 h-3" />
              <span>Leave Room</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-[#1c192f] border-b border-[#504533] px-3.5 py-1.5 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-[JetBrains_Mono] text-[10px] text-[#fdb813] font-bold uppercase tracking-wider">
              HOST OVERRIDE TEST MODE · SELECT CLUB SLOT (KEYS 1–0, - BID)
            </span>
            <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
              Bidders with tokens are locked to their assigned team
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-11 gap-1">
            {vm.teams.map((t) => {
              const active = t.id === myTeam.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTeam(t.id)}
                  data-testid={`bidder-select-${t.id}`}
                  className={`px-1.5 py-1 rounded border text-left transition-all flex items-center justify-between gap-1 ${
                    active
                      ? 'bg-[#2b273e] border-2 border-[#fdb813] text-[#fdb813] bidder-active-ring'
                      : 'bg-[#141026] border-[#504533] hover:border-[#9d8f79] text-[#d5c4ac]'
                  }`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    {t.short === 'DC' || t.titleId === 'IPL-T03' ? (
                      <TeamLogoBadge team={t} size="xs" className="w-3.5 h-3.5 rounded-sm" />
                    ) : (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.c }} />
                    )}
                    <span className="font-[JetBrains_Mono] text-[11px] font-bold text-[#e6defe] truncate">
                      {t.short}
                    </span>
                  </div>
                  <span className="font-[JetBrains_Mono] text-[9px] text-[#4edea3] shrink-0">
                    {t.n}/{vm.cfg.max}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Split sized cleanly for 1280x720 laptops */}
      <main className="flex-1 grid grid-cols-12 gap-2.5 p-2.5 overflow-y-auto lg:overflow-hidden min-h-0">
        {/* LEFT: ACTIVE LOT BIDDING PAD */}
        <section className="col-span-12 lg:col-span-8 flex flex-col justify-between bg-[#0e0b21] border-2 border-[#504533] rounded-lg p-3 min-h-0">
          {lot ? (
            <>
              <div className="flex items-center justify-between gap-2.5 flex-wrap border-b border-[#504533] pb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-14 h-14 rounded border border-[#504533] overflow-hidden shrink-0 bg-[#1c192f]">
                    <PlayerPortrait player={lot.p} size="md" className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-[#201d33] border border-[#504533] font-[JetBrains_Mono] text-[10px] text-[#fdb813] font-bold">
                        {lot.p.id} · {CATEGORY_LABEL[lot.category]}
                      </span>
                      {lot.bidCount >= 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-[#93000a]/50 border border-[#ffb4ab] font-[JetBrains_Mono] text-[10px] text-[#ffdb9f] font-black flex items-center gap-1 animate-pulse">
                          <Flame className="w-3 h-3 text-[#fdb813]" />
                          <span>BIDDING WAR</span>
                        </span>
                      )}
                    </div>
                    <h1 className="font-[Space_Grotesk] text-xl xl:text-2xl font-extrabold text-[#e6defe] uppercase leading-tight mt-0.5 truncate">
                      {lot.p.name}
                    </h1>
                    <p className="font-[JetBrains_Mono] text-[11px] text-[#4edea3] font-bold">
                      {formatPlayerCardMeta(lot.p)} · Base {formatCurrency(lot.p.base)} · OVR {lot.p.ovr}
                    </p>
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded border font-[JetBrains_Mono] text-base font-black flex items-center gap-1.5 shrink-0 ${
                    remainingSec <= 15
                      ? 'bg-[#93000a]/60 border-[#ffb4ab] text-[#ffb4ab] animate-pulse'
                      : 'bg-[#201d33] border-[#4edea3]/50 text-[#4edea3]'
                  }`}
                  data-testid="bidder-countdown"
                >
                  <Clock className="w-4 h-4" />
                  <span>{formatClock(remainingSec)}</span>
                </div>
              </div>

              <div className="my-2 grid grid-cols-1 md:grid-cols-2 gap-2.5 items-center bg-[#1c192f] border border-[#504533] rounded-lg p-3">
                <div>
                  <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] uppercase block">
                    {leader ? 'CURRENT HIGHEST BID ON FLOOR' : 'OPENING BASE PRICE'}
                  </span>
                  <div
                    className="font-[JetBrains_Mono] text-3xl xl:text-4xl font-extrabold text-[#fdb813] tracking-tight leading-none mt-1"
                    data-testid="bidder-price"
                  >
                    ₹ {formatLakhs(lot.price)}
                  </div>
                </div>

                <div className="bg-[#0e0b21] border border-[#504533] rounded p-2.5 flex items-center justify-between gap-2">
                  {leader ? (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <TeamLogoBadge team={leader} size="sm" />
                        <div className="min-w-0">
                          <span className="font-[JetBrains_Mono] text-[9px] text-[#fdb813] font-bold uppercase block">
                            {leader.id === myTeam.id ? '★ YOUR TEAM LEADS!' : 'HIGHEST BIDDER'}
                          </span>
                          <span className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe] truncate block">
                            {leader.name}
                          </span>
                        </div>
                      </div>
                      {leader.id === myTeam.id && (
                        <CheckCircle2 className="w-5 h-5 text-[#4edea3] shrink-0" />
                      )}
                    </>
                  ) : (
                    <div className="font-[JetBrains_Mono] text-[11px] text-[#d5c4ac] flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-[#fdb813] shrink-0" />
                      <span>Tap &ldquo;OPEN AT BASE&rdquo; or any jump as {myTeam.short}!</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center bg-[#1c192f]/90 border border-[#504533] rounded-lg p-3 min-h-0">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2 font-[JetBrains_Mono] text-[11px]">
                    <span className="text-[#9d8f79] uppercase">BIDDING AS:</span>
                    <span
                      className="px-2 py-0.5 rounded font-bold border border-[#fdb813]/40"
                      style={{ backgroundColor: myTeam.badgeBg, color: myTeam.badgeText }}
                    >
                      {myTeam.name} ({myTeam.short})
                    </span>
                  </div>
                  {myTeam.lead ? (
                    <span className="font-[JetBrains_Mono] text-[11px] font-bold text-[#4edea3]">
                      You hold the highest bid — wait for a challenger
                    </span>
                  ) : myTeam.block ? (
                    <span className="font-[JetBrains_Mono] text-[11px] font-bold text-[#ffb4ab]">
                      Blocked: {myTeam.block}
                    </span>
                  ) : (
                    <span className="font-[JetBrains_Mono] text-[10px] text-[#4edea3]">
                      CLICK ANY JUMP = INSTANT BID
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" data-testid="bidder-jump-grid">
                  {jumpOptions.map((opt) => (
                    <button
                      key={opt.delta}
                      type="button"
                      disabled={busy || myTeam.lead || Boolean(myTeam.block)}
                      onClick={() => handleJumpBid(opt.delta)}
                      className={`min-h-[68px] rounded-lg border-2 px-2.5 py-2 flex flex-col items-center justify-center transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                        opt.accent
                          ? 'bg-[#fdb813] hover:bg-[#ffbb1e] border-[#ffdb9f] text-[#271900] shadow-lg'
                          : 'bg-[#201d33] hover:bg-[#2b273e] border-[#fdb813]/60 hover:border-[#fdb813] text-[#e6defe]'
                      }`}
                    >
                      <span className="font-[JetBrains_Mono] text-lg font-black leading-none">
                        {opt.label}
                      </span>
                      <span
                        className={`font-[JetBrains_Mono] text-[11px] font-bold mt-1 ${
                          opt.accent ? 'text-[#271900]/85' : 'text-[#4edea3]'
                        }`}
                      >
                        {opt.sub}
                      </span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleCustomBid} className="flex items-center gap-2 mt-2.5">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customCr}
                    onChange={(e) => setCustomCr(e.target.value)}
                    placeholder={`Custom bid in Cr for ${myTeam.short} (e.g. 6.50)`}
                    aria-label="Custom bid in crore"
                    className="flex-1 bg-[#141026] border border-[#504533] rounded px-3 py-2 text-xs text-[#e6defe] placeholder:text-[#9d8f79] font-[JetBrains_Mono] focus:outline-none focus:border-[#fdb813]"
                  />
                  <button
                    type="submit"
                    disabled={busy || myTeam.lead || Boolean(myTeam.block)}
                    className="px-3.5 py-2 rounded bg-[#00a572] hover:bg-[#00a572]/90 text-[#002113] border border-[#4edea3] font-[JetBrains_Mono] text-xs font-extrabold disabled:opacity-40 whitespace-nowrap"
                  >
                    PLACE CUSTOM BID
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="my-auto text-center space-y-3 py-4">
              <Gavel className="w-10 h-10 text-[#fdb813] mx-auto" />
              <h1 className="font-[Space_Grotesk] text-2xl font-extrabold text-[#ffdb9f]">
                Waiting For Host To Release Next Lot
              </h1>
              <p className="font-[JetBrains_Mono] text-xs text-[#d5c4ac] max-w-md mx-auto">
                Keep this console open as <strong className="text-[#fdb813]">{myTeam.name}</strong>.
                Jump buttons unlock the moment a lot enters the Arena.
              </p>
              {vm.upNext.length > 0 && (
                <div className="max-w-2xl mx-auto pt-2">
                  <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] uppercase mb-1.5">
                    UP NEXT QUEUE
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                    {vm.upNext.map((q, idx) => (
                      <div key={q.id} className="bg-[#1c192f] border border-[#504533] rounded p-2">
                        <div className="font-[JetBrains_Mono] text-[10px] text-[#fdb813] font-bold">
                          NEXT #{idx + 1} · {formatCurrency(q.base)}
                        </div>
                        <div className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] truncate">
                          {q.name}
                        </div>
                        <div className="font-[JetBrains_Mono] text-[10px] text-[#d5c4ac] truncate">
                          {formatPlayerCardMeta(q)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* RIGHT: TEAM SQUAD & COMPLIANCE */}
        <aside className="col-span-12 lg:col-span-4 bg-[#0e0b21] border border-[#504533] rounded-lg flex flex-col overflow-hidden min-h-0">
          <div className="p-3 bg-[#1c192f] border-b border-[#504533] shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamLogoBadge team={myTeam} size="sm" />
                <div className="min-w-0">
                  <h2 className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe] truncate">
                    {myTeam.name}
                  </h2>
                  <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] flex items-center gap-1.5 flex-wrap">
                    <span>{myTeam.paddle}</span>
                    <span>·</span>
                    <span className={myTeam.titleId ? 'text-[#fdb813] font-bold' : ''}>
                      {myTeam.titleId
                        ? myTeam.titleSubFranchise
                          ? `${myTeam.short} · Sub: ${myTeam.titleSubFranchise}`
                          : `${myTeam.short} LOCKED`
                        : 'NO TITLE YET'}
                    </span>
                  </div>
                </div>
              </div>
              <Shield className="w-4 h-4 text-[#fdb813] shrink-0" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2.5 font-[JetBrains_Mono]">
              <div className="bg-[#141026] border border-[#504533] rounded p-1.5">
                <span className="text-[9px] text-[#9d8f79] block">FRANCHISE</span>
                <span className="text-[11px] font-bold text-[#fdb813] truncate block">
                  {myTeam.titleId ? myTeam.short : 'PENDING'}
                </span>
              </div>
              <div className="bg-[#141026] border border-[#504533] rounded p-1.5">
                <span className="text-[9px] text-[#9d8f79] block">SQUAD SLOTS</span>
                <span className="text-[11px] font-bold text-[#e6defe]">
                  {myTeam.n}/{vm.cfg.max}
                </span>
              </div>
              <div className="bg-[#141026] border border-[#504533] rounded p-1.5">
                <span className="text-[9px] text-[#9d8f79] block">OVERSEAS</span>
                <span className="text-[11px] font-bold text-[#4edea3]">
                  {myTeam.os}/{vm.cfg.os}
                </span>
              </div>
              <div className="bg-[#141026] border border-[#504533] rounded p-1.5">
                <span className="text-[9px] text-[#9d8f79] block">MIN QUOTA</span>
                <span className={`text-[11px] font-bold ${myTeam.compositionOk ? 'text-[#4edea3]' : 'text-[#ffdb9f]'}`}>
                  {myTeam.bowlers}/{vm.cfg.minBowlers}B · {myTeam.wicketkeepers}/{vm.cfg.minWicketkeepers}W
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-[#201d33] border-b border-[#504533] flex items-center justify-between shrink-0">
            <span className="font-[JetBrains_Mono] text-[10px] font-bold text-[#ffdb9f] flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-[#fdb813]" />
              <span>SIGNED PLAYERS ({myTeam.squad.length})</span>
            </span>
            <span className="font-[JetBrains_Mono] text-[9px] text-[#9d8f79]">
              Min 4 Bowlers · 1 WK
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1.5">
            {myTeam.squad.length === 0 ? (
              <div className="p-6 text-center font-[JetBrains_Mono] text-xs text-[#9d8f79]">
                No players signed by {myTeam.short} yet.
              </div>
            ) : (
              myTeam.squad.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#141026] border border-[#504533] rounded px-2.5 py-1.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PlayerTeamLogoPill teamShort={myTeam.short} teamName={myTeam.name} size="sm" />
                    <div className="min-w-0">
                      <div className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] truncate">
                        {p.name}
                      </div>
                      <div className="font-[JetBrains_Mono] text-[10px] text-[#4edea3]">
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
        </aside>
      </main>
    </div>
  );
}
