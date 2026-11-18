import { useState } from 'react';
import { AlertCircle, ArrowRight, KeyRound, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface JoinRoomModalProps {
  open: boolean;
  onClose: () => void;
  onJoined: (teamId: string) => void;
  onToast: (msg: string) => void;
}

export function JoinRoomModal({ open, onClose, onJoined, onToast }: JoinRoomModalProps) {
  const { redeemBidderToken } = useAuth();
  const [tokenInput, setTokenInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tokenInput.trim();
    if (!cleaned) {
      setErrorMsg('Enter the team token given to you by the auction host.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    const res = await redeemBidderToken(cleaned);
    setSubmitting(false);
    if (!res.ok || !res.teamId) {
      setErrorMsg(res.error || 'Invalid room token');
      return;
    }
    onToast(`Joined room as ${res.name || res.short} (${res.token})`);
    setTokenInput('');
    onClose();
    onJoined(res.teamId);
  };

  return (
    <div
      className="fixed inset-0 bg-[#0e0b21]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-room-title"
      data-testid="join-room-modal"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#1c192f] border-2 border-[#4edea3]/70 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#00a572]/20 border border-[#4edea3]/50 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-[#4edea3]" />
            </div>
            <div>
              <h2 id="join-room-title" className="font-[Space_Grotesk] text-lg font-bold text-[#e6defe]">
                Join Auction Room
              </h2>
              <p className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                Participant Bidders · Token-Verified Access
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close join room dialog"
            className="p-1 rounded text-[#9d8f79] hover:text-[#e6defe]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="font-[Inter] text-xs text-[#d5c4ac] leading-relaxed">
          Enter the unique room token assigned to your team by the host (e.g.{' '}
          <code className="text-[#fdb813] font-[JetBrains_Mono]">T01-XXXX</code> for Team 1,{' '}
          <code className="text-[#fdb813] font-[JetBrains_Mono]">T02-XXXX</code> for Team 2).
          No separate login account is needed for bidders.
        </p>

        {errorMsg && (
          <div
            role="alert"
            className="bg-[#93000a]/35 border border-[#ffb4ab]/60 rounded px-3 py-2 flex items-start gap-2 font-[JetBrains_Mono] text-[11px] text-[#ffb4ab]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="room-token-input"
            className="block font-[JetBrains_Mono] text-[10px] text-[#ffdb9f] uppercase font-bold mb-1"
          >
            Team Room Token
          </label>
          <input
            id="room-token-input"
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
            placeholder="e.g. T02-A7K9"
            autoFocus
            data-testid="room-token-input"
            className="w-full bg-[#141026] border border-[#504533] rounded-lg px-3 py-2.5 text-sm text-[#fdb813] font-[JetBrains_Mono] font-bold tracking-wider uppercase focus:outline-none focus:border-[#4edea3]"
          />
        </div>

        <div className="bg-[#141026] border border-[#504533] rounded p-2.5 flex items-center gap-2 font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
          <ShieldCheck className="w-4 h-4 text-[#4edea3] shrink-0" />
          <span>Squad Rule: Min 4 Bowlers &amp; 1 Wicketkeeper · 18–25 Players · Max 8 Overseas</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded border border-[#504533] text-[#d5c4ac] font-[JetBrains_Mono] text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            data-testid="submit-room-token-btn"
            className="px-4 py-2 rounded bg-[#00a572] hover:bg-[#00a572]/90 text-[#002113] border border-[#4edea3] font-[JetBrains_Mono] text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>{submitting ? 'Verifying...' : 'Join the Bid'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
