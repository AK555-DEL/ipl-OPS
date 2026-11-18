import { useState } from 'react';
import {
  BookOpen,
  Code2,
  Crown,
  Gavel,
  KeyRound,
  Lock,
  LogIn,
  Rocket,
  Share2,
  ShieldCheck,
  Sparkles,
  Tv,
  Users,
  Wifi,
} from 'lucide-react';
import type { AuctionViewModel } from '../auction/types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { GlobalSoundControl } from './GlobalSoundControl.tsx';
import { HostLoginPanel } from './HostLoginPanel.tsx';
import { DeployPanel } from './DeployPanel.tsx';

export type LandingTab = 'overview' | 'host';
export type HostSubTab = 'login' | 'deploy';

interface LandingPageProps {
  vm: AuctionViewModel;
  connected: boolean;
  initialTab?: LandingTab;
  onOpenJoinRoom: () => void;
  onOpenSubOpPin: () => void;
  onNavigateOperator: () => void;
  onNavigateArena: () => void;
  onNavigateBidsOp: () => void;
  onNavigateBid: () => void;
  onOpenShare: () => void;
  onToast: (msg: string) => void;
}

const PROJECT_RULE_CODE = `// src/auction/engine.ts — Deterministic Club Auction Rules
export const CFG = {
  teams: 11,              // 11 Club Teams, Manual Funds Mode
  titles: 11,             // Includes LSG (Lucknow Super Giants) & Deccan Chargers
  min: 18, max: 25,       // Squad bounds + Max 8 Overseas (11x8 = 88)
  minBowlers: 4,          // Mandatory >= 4 Bowlers per team
  minWicketkeepers: 1,    // Mandatory >= 1 Wicketkeeper per team
};

// Server verifies Host-issued Token before every remote bid:
const teamId = resolveTeamIdByToken(tokenStore.teamTokens, req.headers['x-team-token']);
if (!teamId || teamId !== body.team) return res.status(403).end();`;

export function LandingPage({
  vm,
  connected,
  initialTab = 'overview',
  onOpenJoinRoom,
  onOpenSubOpPin,
  onNavigateOperator,
  onNavigateArena,
  onNavigateBidsOp,
  onNavigateBid,
  onOpenShare,
  onToast,
}: LandingPageProps) {
  const { hostStatus, hostToken, subOpRole, bidderTeamId, bidderToken } = useAuth();
  const [tab, setTab] = useState<LandingTab>(initialTab);
  const [hostSubTab, setHostSubTab] = useState<HostSubTab>('login');

  const isHostAuthenticated = Boolean(hostToken && hostStatus.hostLoggedIn);
  const joinedTeam = bidderTeamId ? vm.teams.find((t) => t.id === bidderTeamId) : null;

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col bg-[#141026] text-[#e6defe]"
      data-testid="landing-page"
    >
      {/* Compact Laptop-First Navigation Header (No Dashboard or Unauthenticated Operator bypass) */}
      <header className="h-12 bg-[#0e0b21] border-b border-[#504533] px-3.5 flex items-center justify-between gap-2 shrink-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded border border-[#fdb813]/70 bg-[#201d33] flex items-center justify-center shrink-0">
              <Gavel className="w-4 h-4 text-[#fdb813]" />
            </div>
            <span className="font-[Space_Grotesk] text-sm font-extrabold uppercase tracking-wider text-[#ffdb9f] whitespace-nowrap">
              IPL Auction Ops
            </span>
          </div>
          <div
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded border font-[JetBrains_Mono] text-[10px] whitespace-nowrap ${
              connected
                ? 'bg-[#00a572]/15 border-[#4edea3]/40 text-[#4edea3]'
                : 'bg-[#93000a]/30 border-[#ffb4ab]/50 text-[#ffb4ab]'
            }`}
          >
            <Wifi className="w-3 h-3" />
            <span>{connected ? `${vm.preset} · LIVE` : 'SYNCING'}</span>
          </div>
        </div>

        {/* Clean 2-Section Nav: About Project | Host (Login & Deploy kept inside Host) */}
        <nav
          className="flex items-center bg-[#1c192f] p-0.5 rounded-lg border border-[#504533] gap-0.5 shrink-0"
          aria-label="Landing sections"
        >
          <button
            type="button"
            onClick={() => setTab('overview')}
            data-testid="landing-tab-overview"
            className={`px-3 py-1 rounded font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              tab === 'overview'
                ? 'bg-[#fdb813] text-[#271900]'
                : 'text-[#d5c4ac] hover:text-[#e6defe]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>About Project</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('host')}
            data-testid="landing-tab-host"
            className={`px-3 py-1 rounded font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              tab === 'host'
                ? 'bg-[#fdb813] text-[#271900]'
                : 'text-[#d5c4ac] hover:text-[#e6defe]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Host</span>
          </button>
        </nav>

        {/* Right Actions: Sound, Sub-Op PIN, Join Room (Token Entry), Share */}
        <div className="flex items-center gap-1.5 shrink-0">
          <GlobalSoundControl compact />

          {subOpRole ? (
            <button
              type="button"
              onClick={() => (subOpRole === 'bids' ? onNavigateBidsOp() : onNavigateArena())}
              data-testid="resume-subop-btn"
              className="px-2.5 py-1 rounded bg-[#201d33] hover:border-[#fdb813] text-[#fdb813] border border-[#fdb813]/60 font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"
            >
              {subOpRole === 'bids' ? <Gavel className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
              <span>{subOpRole === 'bids' ? 'Bids Desk' : 'Arena 1'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSubOpPin}
              data-testid="subop-pin-btn"
              className="px-2.5 py-1 rounded bg-[#201d33] hover:border-[#fdb813] text-[#ffdb9f] border border-[#fdb813]/50 font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 text-[#fdb813]" />
              <span>Sub-Op PIN</span>
            </button>
          )}

          {bidderToken && joinedTeam ? (
            <button
              type="button"
              onClick={onNavigateBid}
              data-testid="resume-bid-btn"
              className="px-2.5 py-1 rounded bg-[#00a572] hover:bg-[#00a572]/90 text-[#002113] border border-[#4edea3] font-[JetBrains_Mono] text-[11px] font-extrabold flex items-center gap-1 whitespace-nowrap"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Bid ({joinedTeam.short})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenJoinRoom}
              data-testid="join-room-btn"
              className="px-2.5 py-1 rounded bg-[#00a572] hover:bg-[#00a572]/90 text-[#002113] border border-[#4edea3] font-[JetBrains_Mono] text-[11px] font-extrabold flex items-center gap-1 whitespace-nowrap"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Join a Room</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenShare}
            className="hidden md:flex px-2 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#4edea3] font-[JetBrains_Mono] text-[11px] items-center gap-1 whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* Scrollable Body sized cleanly for 1280x720 & 1366x768 laptops */}
      <main className="flex-1 min-h-0 overflow-y-auto custom-scroll p-2.5">
        {tab === 'overview' && (
          <div className="max-w-6xl mx-auto space-y-2.5" data-testid="landing-overview-panel">
            {/* 1. WELCOME & TOKEN ENTRY HERO */}
            <section className="bg-[#0e0b21] border-2 border-[#fdb813]/50 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-[#fdb813]/20 border border-[#fdb813]/50 font-[JetBrains_Mono] text-[9px] font-bold text-[#fdb813] uppercase">
                    WELCOME TO IPL CLUB AUCTION OPS
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#00a572]/20 border border-[#4edea3]/40 font-[JetBrains_Mono] text-[9px] font-bold text-[#4edea3]">
                    11 TEAMS · 11 TITLES · TOKEN-GATED BIDDING
                  </span>
                </div>
                <h1 className="font-[Space_Grotesk] text-xl font-extrabold text-[#e6defe] leading-tight">
                  Real-Time Club Cricket Auction Platform
                </h1>
                <p className="font-[Inter] text-[11px] text-[#d5c4ac] leading-snug">
                  Enter your team&rsquo;s room token to unlock your private bidding console, or head
                  to the Host section to sign in as Auctioneer and generate tokens for Team 1
                  through Team 11.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0 w-full md:w-64">
                <button
                  type="button"
                  onClick={onOpenJoinRoom}
                  data-testid="hero-join-bid-btn"
                  className="w-full py-1.5 px-3 rounded-lg bg-[#00a572] hover:bg-[#00a572]/90 text-[#002113] border border-[#4edea3] font-[JetBrains_Mono] text-xs font-extrabold flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Join the Bid (Team Token)</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenSubOpPin}
                  data-testid="hero-subop-pin-btn"
                  className="w-full py-1.5 px-3 rounded-lg border border-[#4edea3]/50 bg-[#201d33] hover:border-[#fdb813] text-[#e6defe] font-[JetBrains_Mono] text-[11px] font-bold flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#fdb813]" />
                  <span>Sub-Operator PIN (Arena / Bids)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('host');
                    setHostSubTab('login');
                  }}
                  data-testid="hero-host-btn"
                  className="w-full py-1.5 px-3 rounded-lg border border-[#fdb813]/60 bg-[#fdb813]/15 hover:bg-[#fdb813]/25 text-[#fdb813] font-[JetBrains_Mono] text-[11px] font-bold flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isHostAuthenticated ? 'Host Desk & PINs' : 'Main Operator Login'}</span>
                </button>
              </div>
            </section>

            {/* 2. WHY WE DO THIS PROJECT & WHAT IT IS ABOUT */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="bg-[#0e0b21] border border-[#504533] rounded-xl p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[#fdb813] font-[Space_Grotesk] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Why We Built This Project</span>
                </div>
                <p className="font-[Inter] text-[11px] text-[#d5c4ac] leading-snug">
                  Live college &amp; club IPL auctions break down when run on spreadsheets: missed
                  bids, role-quota mistakes, and unauthorized tabs. This app gives every table a
                  deterministic, sub-50ms synchronized auction room while clubs handle funds manually.
                </p>
              </div>

              <div className="bg-[#0e0b21] border border-[#504533] rounded-xl p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[#4edea3] font-[Space_Grotesk] text-xs font-bold">
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <span>Multi-Laptop Event Split</span>
                </div>
                <p className="font-[Inter] text-[11px] text-[#d5c4ac] leading-snug">
                  Runs cleanly across 3 operator laptops + 11 team consoles: Main Operator queues
                  &amp; releases lots, Display Operator PIN opens Arena 1, and Bids Operator PIN
                  enters incoming live bids into Arena 1.
                </p>
              </div>

              <div className="bg-[#0e0b21] border border-[#fdb813]/40 rounded-xl p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[#ffdb9f] font-[Space_Grotesk] text-xs font-bold">
                  <Users className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
                  <span>PIN &amp; Token Squad Rules</span>
                </div>
                <ul className="font-[JetBrains_Mono] text-[10px] text-[#e6defe] space-y-0.5">
                  <li className="text-[#4edea3] font-bold">• Sub-Op PINs: Display (/arena) &amp; Bids (/bids-op)</li>
                  <li className="text-[#4edea3] font-bold">• Team Tokens: Private /bid for T01–T11</li>
                  <li>• Min 4 Bowlers · Min 1 WK · 88/88 OS Cap (8/team)</li>
                </ul>
              </div>
            </section>

            {/* 3. PROJECT ARCHITECTURE & ENGINE CODE */}
            <section className="bg-[#0e0b21] border border-[#504533] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#2b273e] pb-1.5">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#4edea3]" />
                  <h2 className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe]">
                    Inside the Auction Engine (Event-Sourced Code &amp; Security)
                  </h2>
                </div>
                <span className="font-[JetBrains_Mono] text-[9px] text-[#fdb813]">
                  TYPESCRIPT · NODE SSE · DETERMINISTIC LEDGER
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                <div className="lg:col-span-7 bg-[#141026] border border-[#504533] rounded-lg p-2.5">
                  <pre className="font-[JetBrains_Mono] text-[10px] leading-snug text-[#4edea3] overflow-x-auto">
                    {PROJECT_RULE_CODE}
                  </pre>
                </div>

                <div className="lg:col-span-5 space-y-1.5 font-[Inter] text-[11px] text-[#d5c4ac] leading-snug">
                  <p>
                    <strong className="text-[#ffdb9f]">Automatic Quota Reservation:</strong> Every
                    bid preserves mandatory squad slots for minimum{' '}
                    <strong className="text-[#4edea3]">4 Bowlers</strong>, minimum{' '}
                    <strong className="text-[#4edea3]">1 Wicketkeeper</strong>, and max 8 Overseas
                    players per franchise, with manual fund tracking.
                  </p>
                  <p>
                    <strong className="text-[#ffdb9f]">Strict Role Isolation:</strong> Public users
                    can only join a team bidding console via a valid Host-issued token. Operator
                    controls and deployment tools stay isolated inside the{' '}
                    <button
                      type="button"
                      onClick={() => setTab('host')}
                      className="text-[#fdb813] underline font-semibold"
                    >
                      Host section
                    </button>
                    .
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === 'host' && (
          <div className="max-w-6xl mx-auto space-y-2.5" data-testid="landing-host-section">
            {/* Separate Sub-Tabs inside Host Section: Host Login & Tokens vs Deployment */}
            <div className="bg-[#0e0b21] border border-[#504533] rounded-xl px-3.5 py-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#fdb813]" />
                <span className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe]">
                  Host Command &amp; Deployment Area
                </span>
                <span className="hidden md:inline font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                  Host Auth &amp; Deployment Runbooks are kept in separate tabs
                </span>
              </div>

              <div
                className="flex items-center bg-[#1c192f] p-0.5 rounded-lg border border-[#504533] gap-1"
                role="tablist"
                aria-label="Host section tabs"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={hostSubTab === 'login'}
                  onClick={() => setHostSubTab('login')}
                  data-testid="host-subtab-login"
                  className={`px-3 py-1 rounded font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                    hostSubTab === 'login'
                      ? 'bg-[#fdb813] text-[#271900]'
                      : 'text-[#d5c4ac] hover:text-[#e6defe]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Host Login &amp; Tokens</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={hostSubTab === 'deploy'}
                  onClick={() => setHostSubTab('deploy')}
                  data-testid="host-subtab-deploy"
                  className={`px-3 py-1 rounded font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                    hostSubTab === 'deploy'
                      ? 'bg-[#fdb813] text-[#271900]'
                      : 'text-[#d5c4ac] hover:text-[#e6defe]'
                  }`}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Deployment</span>
                </button>
              </div>
            </div>

            {hostSubTab === 'login' ? (
              <div data-testid="landing-login-panel">
                <HostLoginPanel
                  vm={vm}
                  onNavigateOperator={onNavigateOperator}
                  onNavigateDeploy={() => setHostSubTab('deploy')}
                  onToast={onToast}
                />
              </div>
            ) : (
              <div data-testid="landing-deploy-panel">
                <DeployPanel
                  vm={vm}
                  onNavigateLogin={() => setHostSubTab('login')}
                  onToast={onToast}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="h-8 bg-[#0e0b21] border-t border-[#504533] px-4 flex items-center justify-between shrink-0 font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
        <span>
          {isHostAuthenticated
            ? `Host Active (${hostStatus.hostName}) · 11 Room Tokens Issued`
            : 'Participants: Click "Join a Room" & Enter Your Team Token'}
        </span>
        <span className="text-[#4edea3]">
          MIN {vm.cfg.minBowlers} BOWLERS · MIN {vm.cfg.minWicketkeepers} WICKETKEEPER
        </span>
      </footer>
    </div>
  );
}
