import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Delete,
  Download,
  HelpCircle,
  Home,
  KeyRound,
  LogIn,
  Rocket,
  RotateCcw,
  Search,
  Share2,
  Tv,
  Undo2,
  Users,
} from 'lucide-react';
import type { AuctionViewModel, CommandBody, Player } from '../auction/types.ts';
import { formatCurrency, formatPlayerCardMeta } from '../auction/engine.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

export type OperatorTab = 'stage' | 'squads' | 'stats';

interface OperatorHeaderProps {
  vm: AuctionViewModel;
  players: Player[];
  activeTab: OperatorTab;
  onTabChange: (tab: OperatorTab) => void;
  busy: boolean;
  onSend: (cmd: CommandBody) => Promise<boolean>;
  onResetAuction: () => Promise<boolean>;
  onOpenPin: () => void;
  onOpenGuide: () => void;
  onOpenShare: () => void;
  hasPin: boolean;
  onNavigateLanding: () => void;
  onNavigateArena: () => void;
  onNavigateBid: () => void;
  onNavigateDeploy: () => void;
  onNavigateLogin: () => void;
}

export function OperatorHeader({
  vm,
  players,
  activeTab,
  onTabChange,
  busy,
  onSend,
  onResetAuction,
  onOpenPin,
  onOpenGuide,
  onOpenShare,
  hasPin,
  onNavigateLanding,
  onNavigateArena,
  onNavigateBid,
  onNavigateDeploy,
  onNavigateLogin,
}: OperatorHeaderProps) {
  const { hostStatus } = useAuth();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
      if (e.key === '/' && !inInput) {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return players
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [players, query]);

  const handleCallPlayer = async (pid: string) => {
    const ok = await onSend({ type: 'next', pid });
    if (ok) {
      setQuery('');
      setSearchOpen(false);
      onTabChange('stage');
    }
  };

  return (
    <header className="h-12 flex justify-between items-center w-full px-3 border-b border-[#504533] bg-[#0e0b21] shrink-0 z-40 gap-2">
      {/* Left: Home + Brand + Live Status + Section Tabs */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onNavigateLanding}
          data-testid="operator-home-btn"
          aria-label="Back to Landing Hub"
          title="Back to Landing Hub (/)"
          className="p-1.5 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#4edea3] transition-colors shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center shrink-0">
          <span className="font-[Space_Grotesk] text-xs xl:text-sm font-bold uppercase tracking-wider text-[#ffdb9f] whitespace-nowrap">
            Auction Ops
          </span>
        </div>

        <nav className="flex items-center gap-2.5 shrink-0 pl-1" aria-label="Operator sections">
          {(
            [
              ['stage', 'Floor'],
              ['squads', 'Squads'],
              ['stats', 'Stats'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`font-[JetBrains_Mono] text-[11px] pb-0.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === id
                  ? 'text-[#fdb813] border-[#fdb813] font-semibold'
                  : 'text-[#d5c4ac] border-transparent hover:text-[#e6defe]'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Center: Quick Call-by-Name Search (sized for 1280px) */}
      <div className="relative flex-1 min-w-[140px] max-w-[230px] xl:max-w-[260px]" ref={boxRef}>
        <div className="relative flex items-center">
          <Search className="w-3 h-3 text-[#d5c4ac] absolute left-2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            placeholder="Call player / ID..."
            aria-label="Search or call player by name"
            className="w-full bg-[#1c192f] border border-[#504533] rounded pl-7 pr-7 py-1 text-[#e6defe] placeholder:text-[#9d8f79] text-[11px] font-[Inter] focus:outline-none focus:border-[#fdb813]"
          />
          <kbd className="absolute right-1.5 px-1 py-0.2 rounded bg-[#36324a] border border-[#504533] text-[#9d8f79] font-[JetBrains_Mono] text-[9px]">
            /
          </kbd>
        </div>

        {searchOpen && query.trim() && (
          <div className="absolute left-0 right-0 top-full mt-1 w-80 bg-[#1c192f] border border-[#fdb813]/60 rounded shadow-2xl z-50 max-h-80 overflow-y-auto custom-scroll">
            {results.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-[#9d8f79]">
                No players match &ldquo;{query.trim()}&rdquo;
              </div>
            ) : (
              results.map((p) => {
                const st = vm.status[p.id];
                const onFloor = vm.lot?.p.id === p.id;
                const canCall = !st && !onFloor && !vm.lot;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 border-b border-[#504533]/50 last:border-b-0 hover:bg-[#2b273e]/70"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-[#e6defe] truncate">
                        {p.name}{' '}
                        <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                          · {p.id}
                        </span>
                      </div>
                      <div className="font-[JetBrains_Mono] text-[10px] text-[#4edea3]">
                        {formatPlayerCardMeta(p)} · {p.cc} · Base {formatCurrency(p.base)}
                      </div>
                    </div>
                    {onFloor ? (
                      <span className="font-[JetBrains_Mono] text-[10px] px-2 py-0.5 rounded bg-[#fdb813]/20 text-[#fdb813] border border-[#fdb813]/40 shrink-0">
                        LIVE IN ARENA
                      </span>
                    ) : st ? (
                      <span
                        className={`font-[JetBrains_Mono] text-[10px] px-2 py-0.5 rounded border uppercase shrink-0 ${
                          st === 'sold'
                            ? 'bg-[#00a572]/20 text-[#4edea3] border-[#4edea3]/40'
                            : 'bg-[#93000a]/30 text-[#ffb4ab] border-[#ffb4ab]/40'
                        }`}
                      >
                        {st}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {vm.upNext.length < 3 && !vm.upNext.some((u) => u.id === p.id) && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={async () => {
                              const ok = await onSend({ type: 'queue_add', pid: p.id });
                              if (ok) {
                                setQuery('');
                                setSearchOpen(false);
                              }
                            }}
                            className="px-2 py-1 rounded bg-[#201d33] border border-[#504533] hover:border-[#4edea3] text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold disabled:opacity-40 whitespace-nowrap"
                          >
                            + Queue
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!canCall || busy}
                          onClick={() => handleCallPlayer(p.id)}
                          className="px-2.5 py-1 rounded bg-[#fdb813] text-[#271900] font-[JetBrains_Mono] text-[10px] font-bold hover:bg-[#ffbb1e] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {vm.lot ? 'Arena Busy' : 'Send Now'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Right: Operational Actions, Global Sound Control & Screen Switchers */}
      <div className="flex items-center gap-1 shrink-0">
        <a
          href="/arena"
          onClick={(e) => {
            e.preventDefault();
            onNavigateArena();
          }}
          className="px-2 py-1 rounded border border-[#fdb813]/60 bg-[#fdb813]/15 hover:bg-[#fdb813]/25 text-[#fdb813] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
          title="Open Read-Only Arena Team-Players Dashboard"
        >
          <Tv className="w-3.5 h-3.5 text-[#fdb813]" />
          <span>Arena</span>
        </a>

        <a
          href="/bid"
          onClick={(e) => {
            e.preventDefault();
            onNavigateBid();
          }}
          className="px-2 py-1 rounded border border-[#4edea3]/60 bg-[#00a572]/15 hover:bg-[#00a572]/25 text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
          title="Open User Bidding Console"
        >
          <Users className="w-3.5 h-3.5 text-[#4edea3]" />
          <span>Bid</span>
        </a>

        <button
          type="button"
          onClick={onOpenShare}
          data-testid="share-devices-btn"
          className="px-2 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
          title="Share local Wi-Fi URLs & QR codes across laptops, tabs & phones"
        >
          <Share2 className="w-3.5 h-3.5 text-[#4edea3]" />
          <span>Share</span>
        </button>

        <a
          href="/deploy"
          onClick={(e) => {
            e.preventDefault();
            onNavigateDeploy();
          }}
          data-testid="nav-deploy-btn"
          className="p-1.5 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#d5c4ac] hover:text-[#4edea3] transition-colors"
          title="Host Deployment Guide"
          aria-label="Deployment Guide"
        >
          <Rocket className="w-3.5 h-3.5 text-[#4edea3]" />
        </a>

        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            onNavigateLogin();
          }}
          data-testid="nav-login-btn"
          className="px-2 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
          title="Host Login & Team Tokens"
        >
          <LogIn className="w-3.5 h-3.5 text-[#fdb813]" />
          <span>{hostStatus.hostLoggedIn ? 'Tokens' : 'Host'}</span>
        </a>

        <a
          href="/api/export.csv"
          download="auction-results.csv"
          className="p-1.5 rounded border border-[#504533] bg-[#201d33] hover:bg-[#2b273e] text-[#e6defe] transition-colors"
          title="Export Auction Results CSV"
          aria-label="Export CSV"
        >
          <Download className="w-3.5 h-3.5" />
        </a>

        <button
          type="button"
          disabled={!vm.canUndo || busy}
          onClick={() => onSend({ type: 'undo' })}
          className="px-2 py-1 rounded border border-[#504533] text-[#d5c4ac] hover:text-[#e6defe] hover:bg-[#201d33] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-[JetBrains_Mono] text-[10px] flex items-center gap-1 whitespace-nowrap"
          title="Undo last auction event (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>

        <button
          type="button"
          disabled={!vm.lot || vm.lot.trail.length === 0 || busy}
          onClick={() => onSend({ type: 'resetbid' })}
          className="px-2 py-1 rounded border border-[#fdb813]/40 text-[#fdb813] hover:bg-[#fdb813]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-[JetBrains_Mono] text-[10px] flex items-center gap-1 whitespace-nowrap"
          title="Clear current lot bids"
        >
          <Delete className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          disabled={busy || resetting}
          onClick={() => setResetConfirmOpen(true)}
          data-testid="operator-reset-btn"
          className="px-2 py-1 rounded border border-[#ffb4ab]/45 bg-[#93000a]/25 hover:bg-[#93000a]/45 text-[#ffb4ab] disabled:opacity-40 transition-colors font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 whitespace-nowrap"
          title="Reset entire auction ledger (creates backup first)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={onOpenPin}
          className={`p-1.5 rounded border transition-colors ${
            hasPin
              ? 'border-[#4edea3]/40 text-[#4edea3] bg-[#00a572]/15'
              : 'border-[#504533] text-[#d5c4ac] hover:text-[#e6defe] hover:bg-[#201d33]'
          }`}
          aria-label="Configure Operator PIN"
          title="Operator PIN"
        >
          <KeyRound className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onOpenGuide}
          className="p-1.5 rounded border border-[#504533] text-[#d5c4ac] hover:text-[#e6defe] hover:bg-[#201d33] transition-colors"
          aria-label="Operator Hotkey Guide"
          title="Hotkey Guide"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {resetConfirmOpen && (
        <div
          className="fixed inset-0 bg-[#0e0b21]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
          data-testid="reset-confirm-dialog"
        >
          <div className="bg-[#1c192f] border-2 border-[#ffb4ab]/65 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <h3
              id="reset-dialog-title"
              className="font-[Space_Grotesk] text-lg font-bold text-[#ffb4ab] flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Entire Auction?</span>
            </h3>
            <p className="font-[Inter] text-xs text-[#d5c4ac] leading-relaxed">
              This will clear all sold players, franchise title assignments, active bids, and
              queues back to a fresh start. A snapshot of the current ledger will be saved in{' '}
              <code className="text-[#ffdb9f]">data/backups/</code> before clearing.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setResetConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded border border-[#504533] text-[#d5c4ac] hover:text-[#e6defe] font-[JetBrains_Mono] text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                data-testid="confirm-reset-auction-btn"
                onClick={async () => {
                  setResetting(true);
                  const ok = await onResetAuction();
                  setResetting(false);
                  if (ok) {
                    setResetConfirmOpen(false);
                  }
                }}
                className="px-4 py-1.5 rounded bg-[#93000a] hover:bg-[#a50031] text-[#ffdad6] border border-[#ffb4ab]/50 font-[JetBrains_Mono] text-xs font-extrabold disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset Auction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
