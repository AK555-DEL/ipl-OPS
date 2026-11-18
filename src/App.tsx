import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, KeyRound, Keyboard, X } from 'lucide-react';
import type { AuctionViewModel, CommandBody, Player } from './auction/types.ts';
import { OperatorHeader, type OperatorTab } from './components/OperatorHeader.tsx';
import { OperatorStage } from './components/OperatorStage.tsx';
import { OperatorSquads } from './components/OperatorSquads.tsx';
import { OperatorTeamStats } from './components/OperatorTeamStats.tsx';
import { ArenaDisplay } from './components/ArenaDisplay.tsx';
import { BidderConsole } from './components/BidderConsole.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { DeployPage } from './components/DeployPage.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { JoinRoomModal } from './components/JoinRoomModal.tsx';
import { SubOpPinModal } from './components/SubOpPinModal.tsx';
import { BidsOperatorConsole } from './components/BidsOperatorConsole.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { AudioSettingsProvider } from './contexts/AudioSettingsContext.tsx';

type AppRoute = 'landing' | 'operator' | 'arena' | 'bid' | 'bids-op' | 'login' | 'deploy';

function resolveRoute(pathname: string): AppRoute {
  if (pathname.startsWith('/operator')) return 'operator';
  if (pathname.startsWith('/arena')) return 'arena';
  if (pathname.startsWith('/bids-op') || pathname.startsWith('/subop')) return 'bids-op';
  if (pathname.startsWith('/bid')) return 'bid';
  if (pathname.startsWith('/login')) return 'login';
  if (pathname.startsWith('/deploy')) return 'deploy';
  return 'landing';
}

function resolveTeamParam(search: string): string | null {
  try {
    const params = new URLSearchParams(search);
    return params.get('team');
  } catch {
    return null;
  }
}

const PIN_STORAGE_KEY = 'auction_pin';

export default function App() {
  return (
    <AuthProvider>
      <AudioSettingsProvider>
        <AuctionAppShell />
      </AudioSettingsProvider>
    </AuthProvider>
  );
}

function AuctionAppShell() {
  const {
    preferredTeamId,
    hostToken,
    hostStatus,
    subOpToken,
    subOpRole,
    bidderToken,
    bidderTeamId,
  } = useAuth();
  const isHostAuthenticated = Boolean(hostToken && hostStatus.hostLoggedIn);
  const [route, setRoute] = useState<AppRoute>(() => resolveRoute(window.location.pathname));
  const [initialBidderTeam, setInitialBidderTeam] = useState<string | null>(() =>
    resolveTeamParam(window.location.search)
  );
  const [bidsOpTeamId, setBidsOpTeamId] = useState<string>('t1');
  const [activeTab, setActiveTab] = useState<OperatorTab>('stage');
  const [vm, setVm] = useState<AuctionViewModel | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [joinRoomModalOpen, setJoinRoomModalOpen] = useState(false);
  const [subOpModalOpen, setSubOpModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState(() => {
    try {
      return window.localStorage.getItem(PIN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [savedPin, setSavedPin] = useState(() => {
    try {
      return window.localStorage.getItem(PIN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const toastTimerRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(resolveRoute(window.location.pathname));
      setInitialBidderTeam(resolveTeamParam(window.location.search));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = useCallback((nextRoute: AppRoute, searchSuffix = '') => {
    const basePath =
      nextRoute === 'landing'
        ? '/'
        : nextRoute === 'arena'
          ? '/arena'
          : nextRoute === 'bids-op'
            ? '/bids-op'
            : nextRoute === 'bid'
              ? '/bid'
              : nextRoute === 'login'
                ? '/login'
                : nextRoute === 'deploy'
                  ? '/deploy'
                  : '/operator';
    const targetUrl = `${basePath}${searchSuffix}`;
    if (`${window.location.pathname}${window.location.search}` !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }
    setRoute(nextRoute);
    setInitialBidderTeam(resolveTeamParam(window.location.search));
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/players')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Player[]) => {
        if (active && Array.isArray(data)) setPlayers(data);
      })
      .catch(() => {
        // Non-fatal; SSE & state remain primary
      });

    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AuctionViewModel | null) => {
        if (active && data) setVm(data);
      })
      .catch(() => {
        // Handled by SSE retry
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const source = new EventSource('/api/stream');

    source.onopen = () => {
      setConnected(true);
    };

    source.onmessage = (event) => {
      try {
        const nextVm = JSON.parse(event.data) as AuctionViewModel;
        setVm(nextVm);
        setConnected(true);
      } catch {
        // Ignore malformed frame
      }
    };

    source.onerror = () => {
      setConnected(false);
    };

    return () => {
      source.close();
    };
  }, []);

  useEffect(() => {
    if (connected) return;
    const id = window.setInterval(() => {
      fetch('/api/state')
        .then((res) => (res.ok ? res.json() : null))
        .then((data: AuctionViewModel | null) => {
          if (data) setVm(data);
        })
        .catch(() => {
          // Retry next tick
        });
    }, 2000);
    return () => window.clearInterval(id);
  }, [connected]);

  const sendCommand = useCallback(
    async (cmd: CommandBody): Promise<boolean> => {
      if (busyRef.current) return false;
      busyRef.current = true;
      setBusy(true);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (savedPin) {
          headers['x-pin'] = savedPin;
        }
        if (hostToken) {
          headers['x-host-token'] = hostToken;
        }
        if (subOpToken) {
          headers['x-subop-token'] = subOpToken;
        }
        if (bidderToken) {
          headers['x-team-token'] = bidderToken;
        }
        const res = await fetch('/api/cmd', {
          method: 'POST',
          headers,
          body: JSON.stringify(cmd),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          vm?: AuctionViewModel;
        };
        if (res.status === 401 || res.status === 403) {
          const isBid = cmd.type === 'bid' || cmd.type === 'custom' || cmd.type === 'jump';
          if (isBid) {
            showToast(data.error || 'Enter a Team Token or Bids Operator PIN to place bids');
          } else if (!isHostAuthenticated) {
            showToast(data.error || 'Main Operator authentication required for this command');
          } else {
            setPinModalOpen(true);
            showToast(data.error || 'Operator PIN required — enter PIN and retry');
          }
          return false;
        }
        if (!res.ok) {
          showToast(data.error || `Command failed (${res.status})`);
          return false;
        }
        if (data.vm) {
          setVm(data.vm);
        }
        return true;
      } catch {
        showToast('Server unreachable. Action not saved.');
        return false;
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [savedPin, hostToken, subOpToken, isHostAuthenticated, bidderToken, showToast]
  );

  const handleResetAuction = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try {
      const headers: Record<string, string> = {};
      if (savedPin) headers['x-pin'] = savedPin;
      if (hostToken) headers['x-host-token'] = hostToken;
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        vm?: AuctionViewModel;
      };
      if (!res.ok) {
        showToast(data.error || `Reset failed (${res.status})`);
        return false;
      }
      if (data.vm) {
        setVm(data.vm);
      }
      setActiveTab('stage');
      showToast('Auction reset to fresh state (backup archived)');
      return true;
    } catch {
      showToast('Server unreachable. Reset failed.');
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [savedPin, hostToken, showToast]);

  // Global keyboard shortcuts (Operator queue/next/undo + User Bidder Console 1-0 team bidding)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === 'Escape') {
        if (subOpModalOpen) {
          setSubOpModalOpen(false);
          return;
        }
        if (joinRoomModalOpen) {
          setJoinRoomModalOpen(false);
          return;
        }
        if (shareModalOpen) {
          setShareModalOpen(false);
          return;
        }
        if (pinModalOpen) {
          setPinModalOpen(false);
          return;
        }
        if (guideModalOpen) {
          setGuideModalOpen(false);
          return;
        }
        return;
      }

      if (pinModalOpen || guideModalOpen || shareModalOpen || joinRoomModalOpen || subOpModalOpen) return;

      const target = e.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (inInput || !vm) return;

      if (
        (route === 'operator' && isHostAuthenticated) ||
        (route === 'bid' && (isHostAuthenticated || subOpRole === 'bids' || Boolean(bidderToken)))
      ) {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (vm.canUndo) {
            void sendCommand({ type: 'undo' });
          }
          return;
        }
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (route === 'operator' && isHostAuthenticated) {
        if (activeTab !== 'stage') return;
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          if (!vm.lot) void sendCommand({ type: 'next' });
        }
        return;
      }

      // Bids Operator Console shortcuts: keys 1-9, 0, and - place an instant IPL slab bid for Team 1-11
      if (route === 'bids-op' && (isHostAuthenticated || subOpRole === 'bids') && /^([0-9]|-)$/.test(e.key)) {
        const idx = e.key === '-' ? 10 : e.key === '0' ? 9 : Number(e.key) - 1;
        const team = vm.teams[idx];
        if (!team) return;
        e.preventDefault();
        setBidsOpTeamId(team.id);
        if (vm.lot && !team.lead && !team.block) {
          void sendCommand({ type: 'bid', team: team.id });
        }
        return;
      }

      // User Bidder Console shortcuts: keys 1-9, 0, and - place an instant bid (locked to bidderTeamId if using a token)
      if (route === 'bid' && vm.lot && /^([0-9]|-)$/.test(e.key)) {
        if (!bidderToken && !hostToken && subOpRole !== 'bids') return;
        const idx = e.key === '-' ? 10 : e.key === '0' ? 9 : Number(e.key) - 1;
        const team = vm.teams[idx];
        if (!team) return;
        if (bidderTeamId && !hostToken && subOpRole !== 'bids' && team.id !== bidderTeamId) return;
        if (team.lead || team.block) return;
        e.preventDefault();
        void sendCommand({ type: 'bid', team: team.id });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    route,
    activeTab,
    vm,
    pinModalOpen,
    guideModalOpen,
    shareModalOpen,
    joinRoomModalOpen,
    subOpModalOpen,
    bidderToken,
    bidderTeamId,
    hostToken,
    subOpRole,
    isHostAuthenticated,
    sendCommand,
  ]);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = pinInput.trim();
    try {
      if (cleaned) {
        window.localStorage.setItem(PIN_STORAGE_KEY, cleaned);
      } else {
        window.localStorage.removeItem(PIN_STORAGE_KEY);
      }
    } catch {
      // Ignore storage error
    }
    setSavedPin(cleaned);
    setPinModalOpen(false);
    showToast(cleaned ? 'Operator PIN saved locally' : 'Operator PIN cleared');
  };

  if (!vm) {
    return (
      <div className="w-screen h-screen bg-[#141026] text-[#e6defe] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#fdb813] border-t-transparent animate-spin" />
        <div className="font-[JetBrains_Mono] text-xs text-[#ffdb9f] tracking-widest uppercase">
          Connecting to IPL Auction Engine...
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-[#141026] text-[#e6defe] relative">
      {route === 'landing' ? (
        <LandingPage
          vm={vm}
          connected={connected}
          onOpenJoinRoom={() => setJoinRoomModalOpen(true)}
          onOpenSubOpPin={() => setSubOpModalOpen(true)}
          onNavigateOperator={() => navigateTo('operator')}
          onNavigateArena={() => navigateTo('arena')}
          onNavigateBidsOp={() => navigateTo('bids-op')}
          onNavigateBid={() => navigateTo('bid')}
          onOpenShare={() => setShareModalOpen(true)}
          onToast={showToast}
        />
      ) : route === 'login' || (route === 'operator' && !isHostAuthenticated) ? (
        <LoginPage
          vm={vm}
          requireAuthNotice={
            route === 'operator' && !isHostAuthenticated
              ? 'Host authentication is required before accessing the Operator Desk. Log in as Host first.'
              : undefined
          }
          onNavigateLanding={() => navigateTo('landing')}
          onNavigateOperator={() => navigateTo('operator')}
          onNavigateArena={() => navigateTo('arena')}
          onNavigateDeploy={() => navigateTo('deploy')}
          onToast={showToast}
        />
      ) : route === 'deploy' ? (
        <DeployPage
          vm={vm}
          onNavigateLanding={() => navigateTo('landing')}
          onNavigateOperator={() => navigateTo('operator')}
          onNavigateArena={() => navigateTo('arena')}
          onNavigateLogin={() => navigateTo('login')}
          onToast={showToast}
        />
      ) : route === 'arena' ? (
        <ArenaDisplay
          vm={vm}
          players={players}
          connected={connected}
          onNavigateLanding={() => navigateTo('landing')}
          onNavigateOperator={() => navigateTo('operator')}
          onNavigateBidsOp={() => navigateTo('bids-op')}
          onNavigateBid={() => navigateTo('bid')}
          onNavigateDeploy={() => navigateTo('deploy')}
          onNavigateLogin={() => navigateTo('login')}
          onOpenShare={() => setShareModalOpen(true)}
          onToast={showToast}
        />
      ) : route === 'bids-op' ? (
        <BidsOperatorConsole
          vm={vm}
          players={players}
          connected={connected}
          busy={busy}
          selectedTeamId={bidsOpTeamId}
          onSelectTeamId={setBidsOpTeamId}
          onSend={sendCommand}
          onNavigateLanding={() => navigateTo('landing')}
          onNavigateArena={() => navigateTo('arena')}
          onNavigateOperator={() => navigateTo('operator')}
          onOpenShare={() => setShareModalOpen(true)}
          onToast={showToast}
        />
      ) : route === 'bid' ? (
        <BidderConsole
          vm={vm}
          players={players}
          connected={connected}
          busy={busy}
          initialTeamId={initialBidderTeam ?? preferredTeamId}
          onSend={sendCommand}
          onNavigateLanding={() => navigateTo('landing')}
          onNavigateArena={() => navigateTo('arena')}
          onNavigateOperator={() => navigateTo('operator')}
          onNavigateDeploy={() => navigateTo('deploy')}
          onNavigateLogin={() => navigateTo('login')}
          onOpenShare={() => setShareModalOpen(true)}
          onToast={showToast}
        />
      ) : (
        <>
          <OperatorHeader
            vm={vm}
            players={players}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            busy={busy}
            onSend={sendCommand}
            onResetAuction={handleResetAuction}
            onOpenPin={() => {
              setPinInput(savedPin);
              setPinModalOpen(true);
            }}
            onOpenGuide={() => setGuideModalOpen(true)}
            onOpenShare={() => setShareModalOpen(true)}
            hasPin={Boolean(savedPin)}
            onNavigateLanding={() => navigateTo('landing')}
            onNavigateArena={() => navigateTo('arena')}
            onNavigateBid={() => navigateTo('bid')}
            onNavigateDeploy={() => navigateTo('deploy')}
            onNavigateLogin={() => navigateTo('login')}
          />

          {activeTab === 'stage' && (
            <OperatorStage
              vm={vm}
              players={players}
              busy={busy}
              onSend={sendCommand}
              onNavigateArena={() => navigateTo('arena')}
            />
          )}

          {activeTab === 'squads' && (
            <OperatorSquads vm={vm} busy={busy} onSend={sendCommand} />
          )}

          {activeTab === 'stats' && <OperatorTeamStats vm={vm} />}
        </>
      )}

      {/* Sub-Operator PIN Entry Modal (Display / Bids Operator) */}
      <SubOpPinModal
        open={subOpModalOpen}
        onClose={() => setSubOpModalOpen(false)}
        onUnlocked={(role) => navigateTo(role === 'bids' ? 'bids-op' : 'arena')}
        onToast={showToast}
      />

      {/* Token-Gated Join Room Modal */}
      <JoinRoomModal
        open={joinRoomModalOpen}
        onClose={() => setJoinRoomModalOpen(false)}
        onJoined={() => navigateTo('bid')}
        onToast={showToast}
      />

      {/* Multi-Device Network & QR Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        vm={vm}
        onToast={showToast}
      />

      {/* Non-blocking Toast Banner */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="operator-toast"
          className="fixed bottom-12 right-4 z-50 max-w-md bg-[#1c192f] border border-[#fdb813] text-[#ffdb9f] px-3.5 py-2.5 rounded shadow-2xl flex items-center gap-2.5 font-[JetBrains_Mono] text-xs"
        >
          <AlertCircle className="w-4 h-4 text-[#fdb813] shrink-0" />
          <span className="flex-1">{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="text-[#9d8f79] hover:text-[#e6defe]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Operator PIN Modal */}
      {pinModalOpen && (
        <div
          className="fixed inset-0 bg-[#0e0b21]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-dialog-title"
        >
          <form
            onSubmit={handleSavePin}
            className="bg-[#1c192f] border border-[#fdb813]/70 rounded-lg max-w-sm w-full p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <h3
                id="pin-dialog-title"
                className="font-[Space_Grotesk] text-lg font-bold text-[#e6defe] flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-[#fdb813]" />
                <span>Operator PIN</span>
              </h3>
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                aria-label="Close PIN modal"
                className="text-[#9d8f79] hover:text-[#e6defe]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#d5c4ac] mb-3">
              Enter the server operator PIN if PIN protection is active. Stored locally in this browser.
            </p>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter operator PIN"
              autoFocus
              className="w-full bg-[#141026] border border-[#504533] rounded px-3 py-2 text-sm text-[#e6defe] font-[JetBrains_Mono] focus:outline-none focus:border-[#fdb813]"
            />
            <div className="flex justify-end gap-2 mt-4">
              {savedPin && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.localStorage.removeItem(PIN_STORAGE_KEY);
                    } catch {
                      // Ignore
                    }
                    setPinInput('');
                    setSavedPin('');
                    setPinModalOpen(false);
                    showToast('Operator PIN cleared');
                  }}
                  className="px-3 py-1.5 rounded border border-[#ffb4ab]/40 text-[#ffb4ab] font-[JetBrains_Mono] text-xs mr-auto"
                >
                  Clear PIN
                </button>
              )}
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="px-3 py-1.5 rounded border border-[#504533] text-[#d5c4ac] font-[JetBrains_Mono] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#fdb813] text-[#271900] font-[JetBrains_Mono] text-xs font-bold"
              >
                Save PIN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hotkey Guide Modal */}
      {guideModalOpen && (
        <div
          className="fixed inset-0 bg-[#0e0b21]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-dialog-title"
        >
          <div className="bg-[#1c192f] border border-[#504533] rounded-lg max-w-lg w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3
                id="guide-dialog-title"
                className="font-[Space_Grotesk] text-lg font-bold text-[#e6defe] flex items-center gap-2"
              >
                <Keyboard className="w-4 h-4 text-[#fdb813]" />
                <span>Club Auction Screens &amp; Shortcuts</span>
              </h3>
              <button
                type="button"
                onClick={() => setGuideModalOpen(false)}
                aria-label="Close hotkey guide"
                className="text-[#9d8f79] hover:text-[#e6defe]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-[JetBrains_Mono] text-xs">
              {[
                ['N (Operator)', 'Send next lot from Up Next queue to Arena'],
                ['/ (Operator)', 'Focus player/title search & queue picker'],
                ['Ctrl/Cmd + Z', 'Undo last auction event (Operator)'],
                ['1 – 9, 0, - (/bids-op & /bid)', 'Click/press team key for instant IPL slab auto-bid'],
                ['/arena Screen', 'Display-only Team–Players Dashboard & Stage'],
                ['/bids-op Screen', '1-click team pad with automatic IPL increment slabs'],
              ].map(([key, desc]) => (
                <div
                  key={key}
                  className="bg-[#201d33] border border-[#504533] rounded px-3 py-2 flex flex-col gap-0.5"
                >
                  <span className="text-[#fdb813] font-bold">{key}</span>
                  <span className="text-[#d5c4ac] text-[11px]">{desc}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setGuideModalOpen(false)}
                className="px-4 py-1.5 rounded bg-[#fdb813] text-[#271900] font-[JetBrains_Mono] text-xs font-bold"
              >
                Done (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
