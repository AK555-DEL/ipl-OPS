import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Gavel,
  Home,
  KeyRound,
  LogIn,
  LogOut,
  Rocket,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  Tv,
  Users,
  Wifi,
} from 'lucide-react';
import type { AuctionViewModel, CommandBody, LotCategory, Player } from '../auction/types.ts';
import {
  formatCurrency,
  formatLakhs,
  formatPlayerCardMeta,
} from '../auction/engine.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudioSettings } from '../contexts/AudioSettingsContext.tsx';
import { GlobalSoundControl } from './GlobalSoundControl.tsx';
import { PlayerPortrait } from './PlayerPortrait.tsx';
import { TeamLogoBadge } from './TeamLogoBadge.tsx';
import { useAuctionAudioCues } from '../hooks/useAuctionAudioCues.ts';

interface BidderConsoleProps {
  vm: AuctionViewModel;
  players: Player[];
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

type PlayerFilter = 'ALL' | 'PENDING' | 'SOLD' | 'UNSOLD';

function formatClock(sec: number): string {
  const clamped = Math.max(0, Math.floor(sec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function BidderConsole({
  vm,
  players,
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
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [playerQuery, setPlayerQuery] = useState('');
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>('ALL');
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
    if (initialTeamId && vm.teams.some((t) => t.id === initialTeamId)) {
      setMyTeamId(initialTeamId);
    }
  }, [initialTeamId, bidderTeamId, vm.teams]);

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

  useAuctionAudioCues(vm, remainingSec, !muted);

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

  // One-click automatic bid placement by clicking a team number or franchise
  const handleDirectTeamBid = async (teamId: string) => {
    if (!lot || busy || !hasRoomAccess) return;
    if (isLockedBidder && bidderTeamId && teamId !== bidderTeamId) return;
    const targetTeam = vm.teams.find((t) => t.id === teamId);
    if (!targetTeam) return;
    if (!isLockedBidder) setMyTeamId(teamId);
    if (targetTeam.lead) {
      onToast(`${targetTeam.short} already leads this lot`);
      return;
    }
    if (targetTeam.block) {
      onToast(`${targetTeam.short}: ${targetTeam.block}`);
      return;
    }
    await onSend({ type: 'bid', team: targetTeam.id });
  };

  const canUndoLatestBid = Boolean(
    lot &&
      lot.trail.length > 0 &&
      !busy &&
      hasRoomAccess &&
      (!isLockedBidder || myTeam.lead)
  );
  const canRevertHistory = Boolean(lot && lot.trail.length > 0 && !busy && isHostOverride);
  const canUndoAction = Boolean(vm.canUndo && !busy && isHostOverride);

  const handleUndoBid = async () => {
    if (!canUndoLatestBid) return;
    await onSend({ type: 'undobid', count: 1 });
  };

  const handleRevertToBid = async (toIndex: number) => {
    if (!canRevertHistory) return;
    await onSend({ type: 'undobid', toIndex });
  };

  const handleUndoAction = async () => {
    if (!canUndoAction) return;
    await onSend({ type: 'undo' });
  };

  // Map sold players & sold franchise titles to their owning team & price
  const soldByPid = useMemo(() => {
    const map = new Map<string, { short: string; color: string; price: number }>();
    for (const t of vm.teams) {
      if (t.titleId) {
        map.set(t.titleId, { short: t.short, color: t.c, price: t.titlePrice });
      }
      for (const sp of t.squad) {
        map.set(sp.id, { short: t.short, color: t.c, price: sp.price });
      }
    }
    return map;
  }, [vm.teams]);

  const filteredPlayers = useMemo(() => {
    const q = playerQuery.trim().toLowerCase();
    return players.filter((p) => {
      const st = vm.status[p.id];
      if (playerFilter === 'PENDING' && (st || lot?.p.id === p.id)) return false;
      if (playerFilter === 'SOLD' && st !== 'sold') return false;
      if (playerFilter === 'UNSOLD' && st !== 'unsold') return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q)
      );
    });
  }, [players, vm.status, lot?.p.id, playerFilter, playerQuery]);

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

      {/* Room Identity Bar when locked to a single team token */}
      {isLockedBidder && (
        <section
          className="bg-[#1c192f] border-b border-[#504533] px-3.5 py-1.5 flex items-center justify-between gap-2 shrink-0 flex-wrap"
          data-testid="locked-team-banner"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamLogoBadge team={myTeam} size="xs" />
            <span className="font-[Space_Grotesk] text-sm font-extrabold text-[#ffdb9f] truncate">
              {myTeam.name} ({myTeam.short})
            </span>
            <span className="px-2 py-0.5 rounded bg-[#00a572]/20 border border-[#4edea3]/50 font-[JetBrains_Mono] text-[10px] font-bold text-[#4edea3]">
              TOKEN: {bidderToken}
            </span>
            <span className="hidden md:inline font-[JetBrains_Mono] text-[10px] text-[#d5c4ac]">
              Slots: <strong className="text-[#4edea3]">{myTeam.n}/{vm.cfg.max}</strong> · OS:{' '}
              <strong className="text-[#fdb813]">{myTeam.os}/{vm.cfg.os}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              leaveBidderRoom();
              onToast('Left team room — enter a new token to switch teams');
            }}
            data-testid="leave-room-btn"
            className="px-2 py-0.5 rounded border border-[#ffb4ab]/40 text-[#ffb4ab] hover:bg-[#93000a]/30 flex items-center gap-1 font-[JetBrains_Mono] text-[10px] font-bold"
          >
            <LogOut className="w-3 h-3" />
            <span>Leave Room</span>
          </button>
        </section>
      )}

      {/* Main Split: Left 1-Click Team/Franchise Pad + Right Side Panel (Undo Actions + Bidding History + All Players) */}
      <main className="flex-1 grid grid-cols-12 gap-2.5 p-2.5 overflow-y-auto lg:overflow-hidden min-h-0">
        {/* LEFT (7 cols): ACTIVE LOT & 1-CLICK TEAM NUMBER / FRANCHISE PAD */}
        <section className="col-span-12 lg:col-span-7 flex flex-col gap-2.5 bg-[#0e0b21] border-2 border-[#504533] rounded-lg p-3 min-h-0">
          {lot ? (
            <>
              {/* Active Lot Header (without "which team is bidding at what price" clutter) */}
              <div className="flex items-center justify-between gap-2.5 border-b border-[#504533] pb-2.5 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-14 h-14 rounded border border-[#504533] overflow-hidden shrink-0 bg-[#1c192f]">
                    <PlayerPortrait player={lot.p} size="md" className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-[#201d33] border border-[#504533] font-[JetBrains_Mono] text-[10px] text-[#fdb813] font-bold">
                        {lot.p.id} · {CATEGORY_LABEL[lot.category]}
                      </span>
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

              {/* Direct 1-Click Team Pad */}
              <div className="flex-1 min-h-0 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-[#fdb813]" />
                    <span className="font-[Space_Grotesk] text-sm font-extrabold uppercase tracking-wide text-[#e6defe]">
                      {isLockedBidder
                        ? 'Click Your Franchise to Bid'
                        : 'Click Team Number or Franchise to Place Bid'}
                    </span>
                  </div>
                  <span className="font-[JetBrains_Mono] text-[10px] text-[#4edea3] font-bold">
                    {isLockedBidder ? '1-CLICK BID' : 'KEYS 1–9, 0, - · 1-CLICK BID'}
                  </span>
                </div>

                {isLockedBidder ? (
                  <div className="flex-1 flex items-center justify-center" data-testid="bidder-team-pad">
                    <button
                      type="button"
                      disabled={busy || myTeam.lead || Boolean(myTeam.block)}
                      onClick={() => void handleDirectTeamBid(myTeam.id)}
                      data-testid={`bidder-team-${myTeam.id}`}
                      className="w-full max-w-md min-h-[140px] rounded-xl border-2 px-6 py-5 flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-[#fdb813] hover:bg-[#ffbb1e] border-[#ffdb9f] text-[#271900] shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <TeamLogoBadge team={myTeam} size="sm" />
                        <span className="font-[Space_Grotesk] text-2xl sm:text-3xl font-black tracking-tight">
                          {myTeam.paddle} · {myTeam.short}
                        </span>
                      </div>
                      <span className="font-[Space_Grotesk] text-sm font-bold text-[#271900]/90">
                        {myTeam.name}
                      </span>
                      <span className="font-[JetBrains_Mono] text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-[#271900]/15">
                        {myTeam.lead
                          ? 'Leading Lot'
                          : myTeam.block
                            ? `Blocked: ${myTeam.block}`
                            : 'Tap to Place Bid'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex-1 min-h-0 overflow-y-auto custom-scroll grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start pr-0.5"
                    data-testid="bidder-team-pad"
                  >
                    {vm.teams.map((t, index) => {
                      const hotkey = index === 9 ? '0' : index === 10 ? '-' : String(index + 1);
                      const teamNumber = index + 1;
                      const disabled = busy || t.lead || Boolean(t.block);

                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => void handleDirectTeamBid(t.id)}
                          data-testid={`bidder-team-${t.id}`}
                          aria-label={`Place bid for Team ${teamNumber} ${t.name} (${t.short})`}
                          className={`rounded-xl border-2 p-3 text-left flex flex-col justify-between gap-2.5 transition-all active:scale-[0.98] min-h-[108px] ${
                            t.lead
                              ? 'bg-[#00a572]/20 border-[#4edea3] text-[#e6defe] cursor-default'
                              : t.block
                                ? 'bg-[#1c192f]/40 border-[#93000a]/60 text-[#9d8f79] opacity-55 cursor-not-allowed'
                                : 'bg-[#1c192f] hover:bg-[#2b273e] border-[#504533] hover:border-[#fdb813] text-[#e6defe]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <TeamLogoBadge team={t} size="sm" />
                              <div className="min-w-0">
                                <div className="font-[JetBrains_Mono] text-xs font-extrabold text-[#fdb813] leading-none">
                                  #{teamNumber}{' '}
                                  <span className="text-[10px] text-[#9d8f79] font-normal">
                                    [{hotkey}]
                                  </span>
                                </div>
                                <div className="font-[Space_Grotesk] text-sm font-extrabold text-[#e6defe] truncate mt-0.5">
                                  {t.short}
                                </div>
                              </div>
                            </div>
                            <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] shrink-0">
                              {t.n}/{vm.cfg.max}
                            </span>
                          </div>

                          <div className="font-[Inter] text-xs font-medium text-[#d5c4ac] truncate">
                            {t.name}
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#2b273e] font-[JetBrains_Mono] text-[10px]">
                            <span className="text-[#9d8f79]">OS {t.os}/{vm.cfg.os}</span>
                            {t.lead ? (
                              <span className="px-2 py-0.5 rounded bg-[#00a572] text-[#002113] font-extrabold">
                                LEADING
                              </span>
                            ) : t.block ? (
                              <span className="text-[#ffb4ab] font-bold truncate max-w-[115px]">
                                {t.block}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-[#fdb813] text-[#271900] font-extrabold">
                                BID
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="my-auto text-center space-y-3 py-6">
              <Gavel className="w-10 h-10 text-[#fdb813] mx-auto" />
              <h1 className="font-[Space_Grotesk] text-2xl font-extrabold text-[#ffdb9f]">
                Waiting For Next Lot
              </h1>
              <p className="font-[JetBrains_Mono] text-xs text-[#d5c4ac] max-w-md mx-auto">
                Click any team number or franchise as soon as the next player or title enters the floor.
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

        {/* RIGHT SIDE PANEL (5 cols): UNDO ACTIONS + BIDDING HISTORY + ALL PLAYERS */}
        <aside className="col-span-12 lg:col-span-5 flex flex-col gap-2.5 min-h-0 overflow-hidden">
          {/* TOP PANEL: UNDO ACTIONS & BIDDING HISTORY */}
          <div
            className="bg-[#0e0b21] border border-[#504533] rounded-lg flex flex-col max-h-[45%] min-h-[200px] shrink-0 overflow-hidden"
            data-testid="bidder-bid-history"
          >
            <div className="px-3 py-2 bg-[#1c192f] border-b border-[#504533] flex items-center justify-between gap-2 flex-wrap shrink-0">
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#fdb813]" />
                <span className="font-[Space_Grotesk] text-xs font-extrabold uppercase tracking-wide text-[#ffdb9f]">
                  Bidding History {lot ? `(${lot.trail.length})` : ''}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!canUndoLatestBid}
                  onClick={() => void handleUndoBid()}
                  data-testid="bidder-undo-bid-btn"
                  title="Undo latest bid on current lot (Shortcut: Z)"
                  className="px-2.5 py-1 rounded bg-[#93000a]/55 hover:bg-[#93000a]/85 border border-[#ffb4ab]/60 text-[#ffb4ab] font-[JetBrains_Mono] text-[10px] font-extrabold flex items-center gap-1 disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo Bid</span>
                </button>

                {isHostOverride && (
                  <button
                    type="button"
                    disabled={!canUndoAction}
                    onClick={() => void handleUndoAction()}
                    data-testid="bidder-undo-action-btn"
                    title="Undo the last auction action (bid, hammer, or lot call)"
                    className="px-2.5 py-1 rounded bg-[#201d33] hover:bg-[#2b273e] border border-[#fdb813]/60 text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3 h-3 text-[#fdb813]" />
                    <span>Undo Action</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-2 space-y-1 font-[JetBrains_Mono] text-[10px]">
              {lot ? (
                lot.trail.length === 0 ? (
                  <div className="text-center text-[#9d8f79] py-6">
                    No bids placed yet on <strong className="text-[#e6defe]">{lot.p.name}</strong>.
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
                        const teamIdx = vm.teams.findIndex((x) => x.id === b.team);
                        const teamNum = teamIdx >= 0 ? `#${teamIdx + 1}` : '';
                        const isLatest = b.bidIdx === lot.trail.length - 1;
                        return (
                          <div
                            key={`${b.team}-${b.price}-${b.bidIdx}`}
                            data-testid={`bidder-history-row-${b.bidIdx}`}
                            className={`px-2.5 py-1.5 rounded flex items-center justify-between gap-2 ${
                              isLatest
                                ? 'bg-[#fdb813]/15 border border-[#fdb813]/50 text-[#fdb813] font-bold'
                                : 'bg-[#1c192f] border border-[#2b273e] text-[#d5c4ac]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[9px] text-[#9d8f79] whitespace-nowrap min-w-[2.25rem] shrink-0">
                                Bid {b.bidIdx + 1}
                              </span>
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: tm?.c ?? '#fdb813' }}
                              />
                              <span className="truncate">
                                {teamNum} {tm?.short || b.team} · {tm?.name || b.team}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] text-[#4edea3]">
                                {b.bidIdx === 0 ? 'BASE' : `+₹${formatLakhs(b.delta)}`}
                              </span>
                              <span className="font-bold">{formatCurrency(b.price)}</span>
                              {isLatest && canUndoLatestBid && (
                                <button
                                  type="button"
                                  onClick={() => void handleUndoBid()}
                                  data-testid={`bidder-undo-entry-${b.bidIdx}`}
                                  className="px-2 py-0.5 rounded bg-[#93000a]/70 hover:bg-[#93000a] text-[#ffb4ab] text-[9px] font-extrabold"
                                >
                                  Undo
                                </button>
                              )}
                              {!isLatest && canRevertHistory && (
                                <button
                                  type="button"
                                  onClick={() => void handleRevertToBid(b.bidIdx)}
                                  data-testid={`bidder-revert-${b.bidIdx}`}
                                  className="px-2 py-0.5 rounded bg-[#201d33] hover:bg-[#2b273e] border border-[#504533] hover:border-[#fdb813] text-[#ffdb9f] text-[9px] font-bold"
                                >
                                  Revert
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {canRevertHistory && (
                      <div className="pt-1 flex items-center justify-between px-2.5 py-1 rounded bg-[#141026] border border-[#2b273e] text-[#9d8f79]">
                        <span>Base · {formatCurrency(lot.p.base)}</span>
                        <button
                          type="button"
                          onClick={() => void handleRevertToBid(-1)}
                          data-testid="bidder-clear-bids-btn"
                          className="px-2 py-0.5 rounded bg-[#93000a]/50 hover:bg-[#93000a]/80 text-[#ffb4ab] text-[9px] font-bold"
                        >
                          Clear All Bids
                        </button>
                      </div>
                    )}
                  </>
                )
              ) : vm.recentBids.length === 0 ? (
                <div className="text-center text-[#9d8f79] py-6">
                  No bidding history recorded yet.
                </div>
              ) : (
                vm.recentBids.map((rb) => (
                  <div
                    key={rb.id}
                    className="px-2.5 py-1.5 rounded bg-[#1c192f] border border-[#2b273e] flex items-center justify-between gap-2 text-[#d5c4ac]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: rb.teamColor }}
                      />
                      <span className="font-bold text-[#e6defe] shrink-0">{rb.teamShort}</span>
                      <span className="truncate text-[#9d8f79]">· {rb.lotName}</span>
                    </div>
                    <span className="font-bold text-[#fdb813] shrink-0">
                      {formatCurrency(rb.price)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* BOTTOM PANEL: ALL PLAYERS */}
          <div
            className="flex-1 min-h-0 bg-[#0e0b21] border border-[#504533] rounded-lg flex flex-col overflow-hidden"
            data-testid="bidder-all-players"
          >
            <div className="px-3 py-2 bg-[#1c192f] border-b border-[#504533] space-y-1.5 shrink-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-[Space_Grotesk] text-xs font-extrabold uppercase tracking-wide text-[#ffdb9f]">
                  All Players ({filteredPlayers.length}/{players.length})
                </span>
                <div className="flex items-center gap-1 font-[JetBrains_Mono] text-[9px]">
                  {(['ALL', 'PENDING', 'SOLD', 'UNSOLD'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setPlayerFilter(tab)}
                      data-testid={`bidder-players-filter-${tab.toLowerCase()}`}
                      className={`px-2 py-0.5 rounded border font-bold transition-colors ${
                        playerFilter === tab
                          ? 'bg-[#fdb813]/20 border-[#fdb813] text-[#fdb813]'
                          : 'bg-[#141026] border-[#504533] text-[#9d8f79] hover:text-[#e6defe]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#9d8f79] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={playerQuery}
                  onChange={(e) => setPlayerQuery(e.target.value)}
                  placeholder="Search player, role, or country..."
                  aria-label="Search all players"
                  data-testid="bidder-players-search"
                  className="w-full bg-[#141026] border border-[#504533] rounded pl-8 pr-2.5 py-1 text-[11px] font-[JetBrains_Mono] text-[#e6defe] placeholder:text-[#9d8f79] focus:outline-none focus:border-[#fdb813]"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-2 space-y-1">
              {filteredPlayers.length === 0 ? (
                <div className="p-6 text-center font-[JetBrains_Mono] text-xs text-[#9d8f79]">
                  No players match your filter.
                </div>
              ) : (
                filteredPlayers.map((p) => {
                  const isLive = lot?.p.id === p.id;
                  const status = vm.status[p.id];
                  const soldInfo = soldByPid.get(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`rounded px-2.5 py-1.5 border flex items-center justify-between gap-2 ${
                        isLive
                          ? 'bg-[#fdb813]/15 border-[#fdb813]'
                          : 'bg-[#141026] border-[#2b273e]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] truncate">
                          {p.name}
                        </div>
                        <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] truncate">
                          {p.id} · {formatPlayerCardMeta(p)} · Base {formatCurrency(p.base)}
                        </div>
                      </div>

                      <div className="shrink-0 font-[JetBrains_Mono] text-[10px] font-bold">
                        {isLive ? (
                          <span className="px-2 py-0.5 rounded bg-[#fdb813] text-[#271900] font-extrabold">
                            LIVE
                          </span>
                        ) : status === 'sold' && soldInfo ? (
                          <span className="px-2 py-0.5 rounded bg-[#00a572]/20 border border-[#4edea3]/50 text-[#4edea3]">
                            {soldInfo.short} · {formatCurrency(soldInfo.price)}
                          </span>
                        ) : status === 'unsold' ? (
                          <span className="px-2 py-0.5 rounded bg-[#93000a]/30 border border-[#ffb4ab]/40 text-[#ffb4ab]">
                            UNSOLD
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-[#201d33] border border-[#504533] text-[#d5c4ac]">
                            PENDING
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
