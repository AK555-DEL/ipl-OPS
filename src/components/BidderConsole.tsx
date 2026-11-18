import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Gavel,
  History,
  Home,
  KeyRound,
  Lock,
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
  X,
} from 'lucide-react';
import type { AuctionViewModel, CommandBody, LotCategory, Player } from '../auction/types.ts';
import {
  formatCurrency,
  formatPlayerCardMeta,
} from '../auction/engine.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudioSettings } from '../contexts/AudioSettingsContext.tsx';
import { GlobalSoundControl } from './GlobalSoundControl.tsx';
import { PlayerPortrait } from './PlayerPortrait.tsx';
import { TeamLogoBadge } from './TeamLogoBadge.tsx';
import { useAuctionAudioCues } from '../hooks/useAuctionAudioCues.ts';
import {
  buildBidderHistoryFeed,
  buildBidderPlayerRows,
  filterBidderPlayerRows,
  formatHistoryPrice,
  getUndoPreview,
  type BidderPlayerFilter,
} from '../utils/bidderPanel.ts';

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

type SidePanelMode = 'both' | 'players' | 'history';

const CATEGORY_LABEL: Record<LotCategory, string> = {
  TITLE: 'Franchise Title · 3:00',
  MAVERICK: 'Maverick · 5:00',
  CAPPED: 'Capped · 3:00',
  UNCAPPED: 'Uncapped · 2:00',
};

function formatClock(sec: number): string {
  const clamped = Math.max(0, Math.floor(sec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTime(ts: number): string {
  if (!ts) return '--:--';
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--:--';
  }
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
    subOpRole,
    redeemBidderToken,
    leaveBidderRoom,
  } = useAuth();
  const { muted } = useAudioSettings();

  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [sideMode, setSideMode] = useState<SidePanelMode>('both');
  const [playerQuery, setPlayerQuery] = useState('');
  const [playerFilter, setPlayerFilter] = useState<BidderPlayerFilter>('all');

  const isLockedBidder = Boolean(bidderToken && bidderTeamId);
  const isMultiTeamBidder = (Boolean(hostToken) || subOpRole === 'bids') && !isLockedBidder;
  const hasRoomAccess = isLockedBidder || isMultiTeamBidder;

  const lockedTeam = useMemo(() => {
    const fallbackId = bidderTeamId ?? initialTeamId ?? vm.teams[0]?.id;
    return vm.teams.find((t) => t.id === fallbackId) ?? vm.teams[0];
  }, [vm.teams, bidderTeamId, initialTeamId]);

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
    const offset = vm.serverNow ? Date.now() - vm.serverNow : 0;
    setNowMs(Date.now() - offset);
    const id = window.setInterval(() => {
      setNowMs(Date.now() - offset);
    }, 200);
    return () => window.clearInterval(id);
  }, [vm.serverNow, vm.seq]);

  const lot = vm.lot;
  const remainingSec = lot ? Math.max(0, Math.ceil((lot.expiresAt - nowMs) / 1000)) : 0;

  useAuctionAudioCues(vm, remainingSec, !muted);

  const allPlayerRows = useMemo(() => buildBidderPlayerRows(players, vm), [players, vm]);
  const filteredPlayers = useMemo(
    () => filterBidderPlayerRows(allPlayerRows, playerQuery, playerFilter),
    [allPlayerRows, playerQuery, playerFilter]
  );
  const historyFeed = useMemo(() => buildBidderHistoryFeed(vm), [vm]);
  const undoPreview = useMemo(() => getUndoPreview(vm), [vm]);

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
    setTokenInput('');
    onToast(`Joined room as ${res.name || res.short}`);
  };

  const handleDirectTeamBid = async (teamId: string) => {
    if (busy || !hasRoomAccess) return;
    if (!lot) {
      onToast('No lot is live in the arena right now');
      return;
    }
    if (isLockedBidder && lockedTeam && teamId !== lockedTeam.id) {
      onToast(`Your token is locked to ${lockedTeam.short}`);
      return;
    }
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

  const handleUndo = async () => {
    if (busy || !undoPreview.canUndo) return;
    const ok = await onSend({ type: 'undo' });
    if (ok) {
      onToast('Last action undone');
    }
  };

  const headerBar = (
    <header className="h-12 bg-[#0e0b21] border-b border-[#504533] px-3.5 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onNavigateLanding}
          aria-label="Back to Landing Hub"
          title="Landing Hub (/)"
          className="p-1.5 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#4edea3] shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5 min-w-0">
          <Users className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
          <span className="font-[Space_Grotesk] text-sm font-bold uppercase tracking-wider text-[#ffdb9f] whitespace-nowrap shrink-0">
            Bidder Console
          </span>
        </div>

        <div
          className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded border font-[JetBrains_Mono] text-[10px] whitespace-nowrap shrink-0 ${
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
          className="px-2.5 py-1 rounded border border-[#4edea3]/50 bg-[#00a572]/15 hover:bg-[#00a572]/25 text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0"
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
          className="px-2.5 py-1 rounded border border-[#fdb813]/60 bg-[#fdb813]/15 hover:bg-[#fdb813]/25 text-[#fdb813] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0"
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
              className="hidden sm:flex px-2.5 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#d5c4ac] hover:text-[#4edea3] font-[JetBrains_Mono] text-[10px] items-center gap-1 whitespace-nowrap shrink-0"
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
              className="hidden sm:flex px-2.5 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#fdb813] text-[#d5c4ac] hover:text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] items-center gap-1 whitespace-nowrap shrink-0"
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
              className="px-2.5 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] flex items-center gap-1 whitespace-nowrap shrink-0"
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

            <p className="text-xs text-[#d5c4ac] leading-relaxed">
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

      {isLockedBidder && lockedTeam && (
        <section
          className="bg-[#1c192f] border-b border-[#504533] px-3.5 py-1.5 flex items-center justify-between gap-2 shrink-0 flex-wrap"
          data-testid="locked-team-banner"
        >
          <div className="flex items-center gap-2.5 min-w-0 font-[JetBrains_Mono] text-[11px]">
            <TeamLogoBadge team={lockedTeam} size="xs" />
            <span className="font-[Space_Grotesk] text-sm font-extrabold text-[#ffdb9f] truncate">
              {lockedTeam.name} ({lockedTeam.short})
            </span>
            <span className="text-[#9d8f79]" aria-hidden="true">·</span>
            <span className="text-[#4edea3] font-bold">Token {bidderToken}</span>
            <span className="hidden md:inline text-[#9d8f79]" aria-hidden="true">·</span>
            <span className="hidden md:inline text-[#d5c4ac] tabular-nums">
              Slots {lockedTeam.n}/{vm.cfg.max} · OS {lockedTeam.os}/{vm.cfg.os}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              leaveBidderRoom();
              onToast('Left team room — enter a new token to switch teams');
            }}
            data-testid="leave-room-btn"
            className="px-2.5 py-1 rounded border border-[#ffb4ab]/40 text-[#ffb4ab] hover:bg-[#93000a]/30 flex items-center gap-1 font-[JetBrains_Mono] text-[10px] font-bold whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3 h-3" />
            <span>Leave Room</span>
          </button>
        </section>
      )}

      {/* Main Workspace: Left = 1-Click Team Number / Franchise Pad; Right = Undo + Bidding History + All Players */}
      <main className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-y-auto lg:overflow-hidden min-h-0">
        {/* LEFT: LOT IDENTITY + DIRECT 1-CLICK TEAM NUMBER PAD */}
        <section className="col-span-12 lg:col-span-7 flex flex-col gap-3 bg-[#0e0b21] border border-[#504533] rounded-lg p-3.5 min-h-0">
          {lot ? (
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#504533] pb-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-16 rounded-lg border border-[#504533] overflow-hidden shrink-0 bg-[#1c192f]">
                  <PlayerPortrait player={lot.p} size="md" className="w-full h-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-[JetBrains_Mono] text-[11px] text-[#fdb813]">
                    <span>{lot.p.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{CATEGORY_LABEL[lot.category]}</span>
                    {lot.p.os && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#4edea3]">Overseas</span>
                      </>
                    )}
                  </div>
                  <h1 className="font-[Space_Grotesk] text-2xl font-extrabold text-[#e6defe] leading-tight mt-0.5 truncate">
                    {lot.p.name}
                  </h1>
                  <p className="font-[JetBrains_Mono] text-xs text-[#d5c4ac] tabular-nums mt-0.5">
                    {formatPlayerCardMeta(lot.p)} · Base {formatCurrency(lot.p.base)} · OVR {lot.p.ovr}
                  </p>
                </div>
              </div>

              <div
                className={`px-3.5 py-2 rounded-lg border font-[JetBrains_Mono] text-lg font-black flex items-center gap-2 tabular-nums shrink-0 ${
                  remainingSec <= 15
                    ? 'bg-[#93000a]/60 border-[#ffb4ab] text-[#ffb4ab]'
                    : 'bg-[#1c192f] border-[#4edea3]/50 text-[#4edea3]'
                }`}
                data-testid="bidder-countdown"
              >
                <Clock className="w-4 h-4" />
                <span>{formatClock(remainingSec)}</span>
              </div>
            </div>
          ) : (
            <div className="border-b border-[#504533] pb-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#1c192f] border border-[#504533] flex items-center justify-center shrink-0">
                  <Gavel className="w-5 h-5 text-[#fdb813]" />
                </div>
                <div>
                  <h1 className="font-[Space_Grotesk] text-lg font-extrabold text-[#ffdb9f]">
                    Waiting For Host To Release Next Lot
                  </h1>
                  <p className="font-[JetBrains_Mono] text-[11px] text-[#9d8f79]">
                    Direct team bidding unlocks automatically as soon as the next lot goes live.
                  </p>
                </div>
              </div>
              {vm.upNext.length > 0 && (
                <div className="font-[JetBrains_Mono] text-[10px] text-[#d5c4ac] truncate max-w-full">
                  Next: <strong className="text-[#fdb813]">{vm.upNext[0].name}</strong>
                </div>
              )}
            </div>
          )}

          {/* Direct 1-Click Team / Franchise Number Buttons */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between gap-2 mb-2 shrink-0 flex-wrap">
              <h2 className="font-[Space_Grotesk] text-sm font-bold text-[#ffdb9f]">
                Click Team Number or Franchise to Bid Instantly
              </h2>
              <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                Keys 1–9, 0 (10), - (11)
              </span>
            </div>

            <div
              data-testid="bidder-team-pad"
              className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-rows-4 gap-2.5 overflow-y-auto pr-0.5"
            >
              {vm.teams.map((t, index) => {
                const teamNumber = index + 1;
                const lockedOut = isLockedBidder && lockedTeam?.id !== t.id;
                const disabled = !lot || busy || t.lead || Boolean(t.block) || lockedOut;

                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => void handleDirectTeamBid(t.id)}
                    data-testid={`bidder-team-btn-${t.id}`}
                    aria-label={`Bid for Team ${teamNumber} ${t.name} (${t.short})`}
                    className={`group relative rounded-lg border p-3.5 text-left transition-all flex flex-col justify-between gap-2 min-h-[88px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdb813] ${
                      t.lead
                        ? 'bg-[#00a572]/15 border-[#4edea3] text-[#e6defe] cursor-default'
                        : lockedOut || t.block || !lot
                          ? 'bg-[#141026]/70 border-[#504533]/60 text-[#9d8f79] opacity-55 cursor-not-allowed'
                          : 'bg-[#1c192f] border-[#504533] hover:border-[#fdb813] hover:bg-[#24203b] active:scale-[0.98] text-[#e6defe]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-8 h-8 rounded-md font-[JetBrains_Mono] text-base font-black flex items-center justify-center tabular-nums shrink-0 border border-white/15"
                          style={{
                            backgroundColor: t.lead ? '#4edea3' : t.badgeBg,
                            color: t.lead ? '#002113' : t.badgeText,
                          }}
                        >
                          {teamNumber}
                        </span>
                        <TeamLogoBadge team={t} size="xs" />
                        <span className="font-[Space_Grotesk] text-base font-extrabold tracking-tight text-[#e6defe] truncate">
                          {t.short}
                        </span>
                      </div>

                      <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] tabular-nums shrink-0">
                        Key {t.hotkey}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#d5c4ac] truncate">
                        {t.name}
                      </span>
                      <span className="font-[JetBrains_Mono] text-[10px] tabular-nums shrink-0">
                        {lockedOut ? (
                          <span className="text-[#9d8f79] inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        ) : t.lead ? (
                          <span className="text-[#4edea3] font-bold">Leading</span>
                        ) : t.block ? (
                          <span className="text-[#ffb4ab] font-bold truncate max-w-[110px] inline-block align-bottom">
                            Blocked
                          </span>
                        ) : (
                          <span className="text-[#9d8f79]">
                            {t.n}/{vm.cfg.max}
                          </span>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* RIGHT SIDE PANEL: UNDO + BIDDING HISTORY + ALL PLAYERS */}
        <aside
          className="col-span-12 lg:col-span-5 bg-[#0e0b21] border border-[#504533] rounded-lg flex flex-col overflow-hidden min-h-[420px] lg:min-h-0"
          data-testid="bidder-side-panel"
        >
          {/* Undo Action Bar */}
          <div className="p-3 bg-[#1c192f] border-b border-[#504533] shrink-0 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-[Space_Grotesk] text-xs font-bold uppercase tracking-wider text-[#ffdb9f] block">
                  Quick Undo
                </span>
                <span
                  className="font-[JetBrains_Mono] text-[11px] text-[#d5c4ac] truncate block"
                  data-testid="bidder-undo-preview"
                >
                  {undoPreview.label}
                </span>
              </div>

              <button
                type="button"
                disabled={busy || !undoPreview.canUndo}
                onClick={() => void handleUndo()}
                data-testid="bidder-undo-btn"
                aria-label="Undo last action"
                className="px-3.5 py-2 rounded-lg bg-[#fdb813] hover:bg-[#ffbb1e] text-[#271900] border border-[#ffdb9f] font-[JetBrains_Mono] text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-transform active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            </div>

            {/* Side Panel Layout Switcher */}
            <div
              className="grid grid-cols-3 gap-1 p-1 bg-[#141026] rounded-lg border border-[#504533]"
              role="tablist"
              aria-label="Side panel view"
            >
              <button
                type="button"
                role="tab"
                aria-selected={sideMode === 'both'}
                onClick={() => setSideMode('both')}
                data-testid="bidder-view-both"
                className={`px-2 py-1.5 rounded text-[11px] font-[JetBrains_Mono] font-bold whitespace-nowrap transition-colors ${
                  sideMode === 'both'
                    ? 'bg-[#2b273e] text-[#fdb813]'
                    : 'text-[#9d8f79] hover:text-[#e6defe]'
                }`}
              >
                All + History
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sideMode === 'players'}
                onClick={() => setSideMode('players')}
                data-testid="bidder-view-players"
                className={`px-2 py-1.5 rounded text-[11px] font-[JetBrains_Mono] font-bold whitespace-nowrap transition-colors tabular-nums ${
                  sideMode === 'players'
                    ? 'bg-[#2b273e] text-[#fdb813]'
                    : 'text-[#9d8f79] hover:text-[#e6defe]'
                }`}
              >
                Players ({allPlayerRows.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sideMode === 'history'}
                onClick={() => setSideMode('history')}
                data-testid="bidder-view-history"
                className={`px-2 py-1.5 rounded text-[11px] font-[JetBrains_Mono] font-bold whitespace-nowrap transition-colors tabular-nums ${
                  sideMode === 'history'
                    ? 'bg-[#2b273e] text-[#fdb813]'
                    : 'text-[#9d8f79] hover:text-[#e6defe]'
                }`}
              >
                History ({historyFeed.length})
              </button>
            </div>
          </div>

          {/* Bidding History Panel */}
          {sideMode !== 'players' && (
            <section
              className={`flex flex-col overflow-hidden min-h-0 ${
                sideMode === 'both' ? 'flex-1 border-b border-[#504533]' : 'flex-1'
              }`}
              data-testid="bidder-history-panel"
            >
              <div className="px-3 py-2 bg-[#141026] border-b border-[#504533]/70 flex items-center justify-between shrink-0">
                <h2 className="font-[Space_Grotesk] text-xs font-bold uppercase tracking-wider text-[#ffdb9f] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>Bidding History</span>
                </h2>
                <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] tabular-nums">
                  {historyFeed.length} {historyFeed.length === 1 ? 'bid' : 'bids'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1.5">
                {historyFeed.length === 0 ? (
                  <div className="p-4 text-center font-[JetBrains_Mono] text-xs text-[#9d8f79]">
                    No bids recorded yet. Click any team number to place a bid.
                  </div>
                ) : (
                  historyFeed.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded border px-2.5 py-1.5 flex items-center justify-between gap-2 ${
                        item.isCurrentLot
                          ? 'bg-[#1c192f] border-[#4edea3]/45'
                          : 'bg-[#141026] border-[#504533]/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.teamColor }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#e6defe] truncate">
                            <span className="font-[JetBrains_Mono] text-[#fdb813]">
                              {item.teamShort}
                            </span>
                            <span className="text-[#9d8f79]" aria-hidden="true">·</span>
                            <span className="truncate">{item.lotName}</span>
                          </div>
                          <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] tabular-nums">
                            {formatTime(item.ts)}
                            {item.isCurrentLot ? ' · Current Lot' : ''}
                          </div>
                        </div>
                      </div>

                      <span className="font-[JetBrains_Mono] text-xs font-bold text-[#4edea3] tabular-nums shrink-0">
                        {formatHistoryPrice(item.price)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* All Players Directory Panel */}
          {sideMode !== 'history' && (
            <section
              className={`flex flex-col overflow-hidden min-h-0 ${
                sideMode === 'both' ? 'flex-[1.25]' : 'flex-1'
              }`}
              data-testid="bidder-players-panel"
            >
              <div className="px-3 py-2 bg-[#141026] border-b border-[#504533]/70 space-y-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-[Space_Grotesk] text-xs font-bold uppercase tracking-wider text-[#ffdb9f]">
                    All Players ({filteredPlayers.length})
                  </h2>
                  <div className="flex items-center gap-1 font-[JetBrains_Mono] text-[10px]">
                    {(
                      [
                        ['all', 'All'],
                        ['live', 'Live'],
                        ['sold', 'Sold'],
                        ['unsold', 'Unsold'],
                        ['pending', 'Pool'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPlayerFilter(key)}
                        data-testid={`bidder-player-filter-${key}`}
                        className={`px-1.5 py-0.5 rounded border whitespace-nowrap ${
                          playerFilter === key
                            ? 'bg-[#fdb813]/20 border-[#fdb813] text-[#fdb813] font-bold'
                            : 'border-[#504533]/70 text-[#9d8f79] hover:text-[#e6defe]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#9d8f79] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={playerQuery}
                    onChange={(e) => setPlayerQuery(e.target.value)}
                    placeholder="Search player, ID, role, or team..."
                    aria-label="Search all players"
                    data-testid="bidder-players-search"
                    className="w-full bg-[#1c192f] border border-[#504533] rounded pl-8 pr-7 py-1.5 text-xs text-[#e6defe] placeholder:text-[#9d8f79] font-[JetBrains_Mono] focus:outline-none focus:border-[#fdb813]"
                  />
                  {playerQuery && (
                    <button
                      type="button"
                      onClick={() => setPlayerQuery('')}
                      aria-label="Clear player search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9d8f79] hover:text-[#e6defe]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
                {filteredPlayers.length === 0 ? (
                  <div className="p-4 text-center font-[JetBrains_Mono] text-xs text-[#9d8f79]">
                    No players match &ldquo;{playerQuery || playerFilter}&rdquo;.
                  </div>
                ) : (
                  filteredPlayers.map((row) => (
                    <div
                      key={row.id}
                      className={`rounded border px-2.5 py-1.5 flex items-center justify-between gap-2 ${
                        row.status === 'live'
                          ? 'bg-[#fdb813]/10 border-[#fdb813]/70'
                          : 'bg-[#141026] border-[#504533]/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#e6defe] truncate">
                          <span className="truncate">{row.name}</span>
                          {row.isTitle && (
                            <span className="font-[JetBrains_Mono] text-[9px] text-[#fdb813] shrink-0">
                              Title
                            </span>
                          )}
                        </div>
                        <div className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] truncate tabular-nums">
                          {row.id} · {row.meta} · Base {formatCurrency(row.base)}
                        </div>
                      </div>

                      <div className="text-right font-[JetBrains_Mono] text-[10px] tabular-nums shrink-0">
                        {row.status === 'live' ? (
                          <span className="text-[#fdb813] font-extrabold">LIVE</span>
                        ) : row.status === 'sold' ? (
                          <div>
                            <div className="text-[#4edea3] font-bold">
                              SOLD · {row.ownerShort ?? 'TEAM'}
                            </div>
                            {row.soldPrice !== null && (
                              <div className="text-[#d5c4ac]">
                                {formatCurrency(row.soldPrice)}
                              </div>
                            )}
                          </div>
                        ) : row.status === 'unsold' ? (
                          <span className="text-[#ffb4ab] font-bold">UNSOLD</span>
                        ) : row.status === 'queued' ? (
                          <span className="text-[#4edea3]">UP NEXT</span>
                        ) : (
                          <span className="text-[#9d8f79]">POOL</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </aside>
      </main>
    </div>
  );
}
