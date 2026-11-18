import { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Gavel,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Tv,
  UserCheck,
} from 'lucide-react';
import type { AuctionViewModel } from '../auction/types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { FIREBASE_PROJECT_ID, registerAuctionRoom } from '../firebase.ts';

interface HostLoginPanelProps {
  vm: AuctionViewModel;
  onNavigateOperator: () => void;
  onNavigateDeploy?: () => void;
  onToast: (msg: string) => void;
}

export function HostLoginPanel({
  vm,
  onNavigateOperator,
  onNavigateDeploy,
  onToast,
}: HostLoginPanelProps) {
  const {
    user,
    authReady,
    signingIn,
    authError,
    firestoreStatus,
    hostToken,
    hostStatus,
    hostTeamTokens,
    subOpPins,
    loginHostWithGoogle,
    loginHostChair,
    regenerateHostTokens,
    regenerateSubOpPins,
    updateSubOpPins,
    logoutHost,
    clearAuthError,
  } = useAuth();

  const [hostPin, setHostPin] = useState('');
  const [hostChairName, setHostChairName] = useState('Auction Host Chair');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenSubOp, setRegenSubOp] = useState(false);
  const [editingSubOp, setEditingSubOp] = useState(false);
  const [editDisplayPin, setEditDisplayPin] = useState('');
  const [editBidsPin, setEditBidsPin] = useState('');
  const [savingPins, setSavingPins] = useState(false);
  const [roomTitle, setRoomTitle] = useState('IPL Club Auction Night');
  const [syncingRoom, setSyncingRoom] = useState(false);

  const isLoggedIn = Boolean(hostToken && hostStatus.hostLoggedIn);

  const handleGoogleHostSignIn = async () => {
    clearAuthError();
    const ok = await loginHostWithGoogle();
    if (ok) {
      onToast('Host authenticated — 11 team room tokens generated!');
    }
  };

  const handleLocalChairLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    const res = await loginHostChair(hostPin, hostChairName);
    if (res.ok) {
      onToast('Host signed in to server — 11 unique team tokens ready!');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const ok = await regenerateHostTokens();
    setRegenerating(false);
    if (ok) {
      onToast('Regenerated fresh tokens for Team 1 – Team 11');
    } else {
      onToast('Could not regenerate tokens — re-authenticate as host');
    }
  };

  const handleRegenerateSubOp = async () => {
    setRegenSubOp(true);
    const ok = await regenerateSubOpPins();
    setRegenSubOp(false);
    if (ok) {
      setEditingSubOp(false);
      onToast('Regenerated fresh Display Operator (Arena 1) & Bids Operator PINs');
    } else {
      onToast('Could not regenerate sub-operator PINs');
    }
  };

  const handleSaveCustomSubOpPins = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPins(true);
    const res = await updateSubOpPins(editDisplayPin, editBidsPin);
    setSavingPins(false);
    if (!res.ok) {
      onToast(res.error || 'Could not update sub-operator PINs');
      return;
    }
    setEditingSubOp(false);
    onToast('Updated Display Operator & Bids Operator PINs');
  };

  const handleCopy = async (id: string, value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      onToast(`Copied ${label}: ${value}`);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1600);
    } catch {
      onToast(`${label}: ${value}`);
    }
  };

  const handleSyncFirestore = async () => {
    if (!user) return;
    setSyncingRoom(true);
    try {
      await registerAuctionRoom(user, 'club-main-room', roomTitle, vm.preset);
      onToast('Host room synced to Firestore');
    } catch {
      onToast('Could not sync room to Firestore');
    } finally {
      setSyncingRoom(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3">
      {/* LEFT (5 cols): Host-Only Auth Card */}
      <section className="lg:col-span-5 bg-[#0e0b21] border-2 border-[#504533] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded bg-[#201d33] border border-[#fdb813]/40 font-[JetBrains_Mono] text-[10px] font-bold text-[#fdb813] uppercase">
              HOST-ONLY LOGIN
            </span>
            <span
              className={`px-2 py-0.5 rounded border font-[JetBrains_Mono] text-[10px] font-bold ${
                firestoreStatus === 'connected'
                  ? 'bg-[#00a572]/20 border-[#4edea3]/50 text-[#4edea3]'
                  : 'bg-[#201d33] border-[#504533] text-[#9d8f79]'
              }`}
            >
              FB: {firestoreStatus.toUpperCase()}
            </span>
          </div>

          <h1 className="font-[Space_Grotesk] text-xl font-extrabold text-[#e6defe] leading-tight">
            {isLoggedIn ? 'Host Authenticated' : 'Sign In As Auction Host'}
          </h1>
          <p className="font-[Inter] text-xs text-[#d5c4ac] leading-relaxed">
            Login is strictly for the <strong className="text-[#ffdb9f]">Host / Auctioneer</strong>{' '}
            (not for bidders). Once logged in, distribute the 11 generated team tokens so
            participants can click <strong className="text-[#4edea3]">Join a Room</strong>.
          </p>
        </div>

        {authError && (
          <div
            role="alert"
            className="bg-[#93000a]/35 border border-[#ffb4ab]/60 rounded-lg p-2.5 flex items-start gap-2 font-[JetBrains_Mono] text-[11px] text-[#ffb4ab]"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="break-words">{authError}</span>
          </div>
        )}

        {!authReady ? (
          <div className="py-4 text-center font-[JetBrains_Mono] text-xs text-[#9d8f79]">
            Checking host authentication...
          </div>
        ) : isLoggedIn ? (
          <div className="space-y-3">
            <div className="bg-[#1c192f] border border-[#4edea3]/50 rounded-lg p-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={hostStatus.hostName || 'Host'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border-2 border-[#fdb813] object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#2b273e] border-2 border-[#fdb813] flex items-center justify-center font-[Space_Grotesk] text-sm font-bold text-[#fdb813] shrink-0">
                    {(hostStatus.hostName || 'H').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe] truncate">
                    {hostStatus.hostName || user?.displayName || 'Auction Host Chair'}
                  </div>
                  <div className="font-[JetBrains_Mono] text-[11px] text-[#4edea3] truncate">
                    {hostStatus.hostEmail || user?.email || 'host@club-auction.local'}
                  </div>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#4edea3] shrink-0" />
            </div>

            {user && (
              <div className="bg-[#1c192f] border border-[#504533] rounded-lg p-2.5 flex items-center gap-2">
                <input
                  type="text"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  maxLength={120}
                  aria-label="Firestore auction room label"
                  className="flex-1 bg-[#141026] border border-[#504533] rounded px-2.5 py-1 text-[11px] text-[#e6defe] font-[JetBrains_Mono] focus:outline-none focus:border-[#fdb813]"
                />
                <button
                  type="button"
                  disabled={syncingRoom}
                  onClick={handleSyncFirestore}
                  className="px-2.5 py-1 rounded bg-[#00a572] text-[#002113] font-[JetBrains_Mono] text-[10px] font-extrabold whitespace-nowrap"
                >
                  {syncingRoom ? 'Syncing...' : 'Sync Cloud'}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => void logoutHost()}
                data-testid="host-logout-btn"
                className="px-3 py-1.5 rounded border border-[#ffb4ab]/50 text-[#ffb4ab] hover:bg-[#93000a]/30 font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Host</span>
              </button>
              <button
                type="button"
                onClick={onNavigateOperator}
                data-testid="open-operator-after-login"
                className="px-3.5 py-1.5 rounded bg-[#fdb813] hover:bg-[#ffbb1e] text-[#271900] font-[JetBrains_Mono] text-[11px] font-extrabold flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Open Operator Desk</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              disabled={signingIn}
              onClick={handleGoogleHostSignIn}
              data-testid="google-signin-btn"
              className="w-full py-2.5 px-3 rounded-lg bg-[#ffffff] hover:bg-[#f2f2f2] text-[#141026] font-[Space_Grotesk] text-sm font-bold flex items-center justify-center gap-2.5 shadow transition-transform active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>{signingIn ? 'Opening Google Sign-In...' : 'Host Sign In with Google'}</span>
            </button>

            <div className="relative flex items-center py-0.5">
              <div className="flex-1 border-t border-[#2b273e]" />
              <span className="px-2 font-[JetBrains_Mono] text-[10px] text-[#9d8f79] uppercase">
                Or Local Club Host Unlock
              </span>
              <div className="flex-1 border-t border-[#2b273e]" />
            </div>

            <form onSubmit={handleLocalChairLogin} className="space-y-2 bg-[#1c192f] border border-[#504533] rounded-lg p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="host-chair-name"
                    className="block font-[JetBrains_Mono] text-[9px] text-[#9d8f79] uppercase mb-1"
                  >
                    Host Name
                  </label>
                  <input
                    id="host-chair-name"
                    type="text"
                    value={hostChairName}
                    onChange={(e) => setHostChairName(e.target.value)}
                    placeholder="Auction Host Chair"
                    className="w-full bg-[#141026] border border-[#504533] rounded px-2.5 py-1.5 text-xs text-[#e6defe] font-[JetBrains_Mono] focus:outline-none focus:border-[#fdb813]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="host-chair-pin"
                    className="block font-[JetBrains_Mono] text-[9px] text-[#9d8f79] uppercase mb-1"
                  >
                    {hostStatus.pinRequired ? 'Server PIN (Required)' : 'Host PIN (Optional)'}
                  </label>
                  <input
                    id="host-chair-pin"
                    type="password"
                    value={hostPin}
                    onChange={(e) => setHostPin(e.target.value)}
                    placeholder={hostStatus.pinRequired ? 'Enter PIN' : 'Optional'}
                    className="w-full bg-[#141026] border border-[#504533] rounded px-2.5 py-1.5 text-xs text-[#e6defe] font-[JetBrains_Mono] focus:outline-none focus:border-[#fdb813]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={signingIn}
                data-testid="host-chair-login-btn"
                className="w-full py-2 px-3 rounded bg-[#fdb813] hover:bg-[#ffbb1e] text-[#271900] font-[JetBrains_Mono] text-xs font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Log In as Host &amp; Generate 11 Team Tokens</span>
              </button>
            </form>
          </div>
        )}

        <div className="pt-2 border-t border-[#2b273e] flex items-center justify-between font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
          <span>Firebase: {FIREBASE_PROJECT_ID}</span>
          {onNavigateDeploy && (
            <button
              type="button"
              onClick={onNavigateDeploy}
              className="text-[#4edea3] hover:underline font-bold"
            >
              Deployment Guide →
            </button>
          )}
        </div>
      </section>

      {/* RIGHT (7 cols): Generated 10 Team Access Tokens Table */}
      <section className="lg:col-span-7 bg-[#0e0b21] border border-[#504533] rounded-xl p-3 flex flex-col justify-between gap-2">
        <div className="flex items-center justify-between gap-2 border-b border-[#2b273e] pb-2">
          <div>
            <h2 className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#fdb813]" />
              <span>Generated Team Room Tokens (Team 1 – Team 11)</span>
            </h2>
            <p className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
              Give each team their separate token so they can click &ldquo;Join a Room&rdquo;
            </p>
          </div>
          {isLoggedIn && (
            <button
              type="button"
              disabled={regenerating}
              onClick={handleRegenerate}
              data-testid="regenerate-tokens-btn"
              className="px-2.5 py-1 rounded bg-[#201d33] border border-[#504533] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate All</span>
            </button>
          )}
        </div>

        {isLoggedIn && hostTeamTokens.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5" data-testid="host-tokens-grid">
            {hostTeamTokens.map((item) => {
              const tv = vm.teams.find((t) => t.id === item.teamId);
              const inviteUrl = `${window.location.origin}/bid?token=${encodeURIComponent(item.token)}`;
              return (
                <div
                  key={item.teamId}
                  data-testid={`host-token-${item.teamId}`}
                  className="bg-[#1c192f] border border-[#504533] rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-[Space_Grotesk] text-[11px] font-bold text-[#e6defe] truncate leading-tight">
                      {tv?.name || item.slotLabel}
                    </div>
                    <div className="font-[JetBrains_Mono] text-[11px] font-extrabold text-[#fdb813] tracking-wider leading-tight">
                      {item.token}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleCopy(`tok-${item.teamId}`, item.token, item.slotLabel)}
                      className="px-2 py-0.5 rounded bg-[#141026] border border-[#504533] hover:border-[#4edea3] text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1"
                    >
                      {copiedId === `tok-${item.teamId}` ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === `tok-${item.teamId}` ? 'Copied' : 'Token'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCopy(`url-${item.teamId}`, inviteUrl, `${item.slotLabel} Link`)}
                      className="px-2 py-0.5 rounded bg-[#141026] border border-[#504533] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] font-bold"
                    >
                      {copiedId === `url-${item.teamId}` ? 'Done' : 'Link'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-[#1c192f]/60 border border-dashed border-[#504533] rounded-lg p-6 gap-2">
            <ShieldCheck className="w-8 h-8 text-[#fdb813]" />
            <div className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe]">
              Log In as Host to Issue Team 1 – Team 11 Tokens
            </div>
            <p className="font-[JetBrains_Mono] text-[11px] text-[#9d8f79] max-w-md">
              Team 1 gets a separate token, Team 2 gets a separate token, Team 3 gets a separate
              token, up to Team 11. Participants enter their token via &ldquo;Join a Room&rdquo;.
            </p>
          </div>
        )}

        {isLoggedIn && subOpPins && (
          <div
            className="bg-[#1c192f] border border-[#fdb813]/45 rounded-lg p-3 space-y-2"
            data-testid="host-subop-pins-card"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#fdb813]" />
                <span className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe]">
                  Event Sub-Operator PINs (Separate Laptops · Restricted Access)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditDisplayPin(subOpPins.displayPin);
                    setEditBidsPin(subOpPins.bidsPin);
                    setEditingSubOp((prev) => !prev);
                  }}
                  data-testid="edit-subop-pins-btn"
                  className="px-2 py-0.5 rounded bg-[#141026] border border-[#504533] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] font-bold"
                >
                  {editingSubOp ? 'Cancel Edit' : 'Custom PINs'}
                </button>
                <button
                  type="button"
                  disabled={regenSubOp}
                  onClick={handleRegenerateSubOp}
                  data-testid="regen-subop-pins-btn"
                  className="px-2 py-0.5 rounded bg-[#201d33] border border-[#504533] hover:border-[#4edea3] text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${regenSubOp ? 'animate-spin' : ''}`} />
                  <span>New PINs</span>
                </button>
              </div>
            </div>

            {editingSubOp ? (
              <form onSubmit={handleSaveCustomSubOpPins} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div>
                  <label className="block font-[JetBrains_Mono] text-[9px] text-[#4edea3] uppercase mb-0.5">
                    Display PIN (Arena 1)
                  </label>
                  <input
                    type="text"
                    value={editDisplayPin}
                    onChange={(e) => setEditDisplayPin(e.target.value)}
                    minLength={4}
                    maxLength={12}
                    data-testid="custom-display-pin-input"
                    className="w-full bg-[#141026] border border-[#504533] rounded px-2 py-1 text-xs font-[JetBrains_Mono] text-[#e6defe]"
                  />
                </div>
                <div>
                  <label className="block font-[JetBrains_Mono] text-[9px] text-[#fdb813] uppercase mb-0.5">
                    Bids Op PIN (Bids+Arena)
                  </label>
                  <input
                    type="text"
                    value={editBidsPin}
                    onChange={(e) => setEditBidsPin(e.target.value)}
                    minLength={4}
                    maxLength={12}
                    data-testid="custom-bids-pin-input"
                    className="w-full bg-[#141026] border border-[#504533] rounded px-2 py-1 text-xs font-[JetBrains_Mono] text-[#e6defe]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingPins}
                  data-testid="save-custom-pins-btn"
                  className="px-3 py-1 rounded bg-[#fdb813] text-[#271900] font-[JetBrains_Mono] text-[10px] font-extrabold"
                >
                  {savingPins ? 'Saving...' : 'Save PINs'}
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-[#141026] border border-[#4edea3]/40 rounded px-2.5 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 font-[JetBrains_Mono] text-[9px] text-[#4edea3] font-bold">
                      <Tv className="w-3 h-3" />
                      <span>DISPLAY OP (ARENA 1 ONLY)</span>
                    </div>
                    <div
                      className="font-[JetBrains_Mono] text-sm font-black tracking-widest text-[#e6defe]"
                      data-testid="host-display-pin-value"
                    >
                      {subOpPins.displayPin}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleCopy('pin-disp', subOpPins.displayPin, 'Display Operator PIN')}
                      className="px-2 py-1 rounded bg-[#201d33] border border-[#504533] text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold"
                    >
                      {copiedId === 'pin-disp' ? 'Copied' : 'PIN'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy('url-disp', `${window.location.origin}/arena`, 'Arena 1 URL')
                      }
                      className="px-2 py-1 rounded bg-[#201d33] border border-[#504533] text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] font-bold"
                    >
                      {copiedId === 'url-disp' ? 'Done' : '/arena'}
                    </button>
                  </div>
                </div>

                <div className="bg-[#141026] border border-[#fdb813]/40 rounded px-2.5 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 font-[JetBrains_Mono] text-[9px] text-[#fdb813] font-bold">
                      <Gavel className="w-3 h-3" />
                      <span>BIDS OP (BIDS + ARENA 1)</span>
                    </div>
                    <div
                      className="font-[JetBrains_Mono] text-sm font-black tracking-widest text-[#e6defe]"
                      data-testid="host-bids-pin-value"
                    >
                      {subOpPins.bidsPin}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleCopy('pin-bids', subOpPins.bidsPin, 'Bids Operator PIN')}
                      className="px-2 py-1 rounded bg-[#201d33] border border-[#504533] text-[#fdb813] font-[JetBrains_Mono] text-[10px] font-bold"
                    >
                      {copiedId === 'pin-bids' ? 'Copied' : 'PIN'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy('url-bids', `${window.location.origin}/bids-op`, 'Bids Operator URL')
                      }
                      className="px-2 py-1 rounded bg-[#201d33] border border-[#504533] text-[#ffdb9f] font-[JetBrains_Mono] text-[10px] font-bold"
                    >
                      {copiedId === 'url-bids' ? 'Done' : '/bids-op'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-[#1c192f] border border-[#504533] rounded-lg px-3 py-2 flex items-center justify-between gap-2 font-[JetBrains_Mono] text-[10px] text-[#d5c4ac]">
          <span>
            Main Op: Queues &amp; Releases · Display Op: Arena 1 · Bids Op: Bids + Arena 1
          </span>
          <span className="text-[#4edea3] font-bold shrink-0">11 TEAMS · 11 FRANCHISE TITLES</span>
        </div>
      </section>
    </div>
  );
}
