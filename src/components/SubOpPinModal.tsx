import { useState } from 'react';
import { AlertCircle, Gavel, Lock, ShieldAlert, Tv, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import type { SubOperatorRole } from '../auction/tokens.ts';

interface SubOpPinModalProps {
  open: boolean;
  onClose: () => void;
  onUnlocked: (role: SubOperatorRole) => void;
  onToast: (msg: string) => void;
}

export function SubOpPinModal({ open, onClose, onUnlocked, onToast }: SubOpPinModalProps) {
  const { redeemSubOpPin } = useAuth();
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = pinInput.trim();
    if (!cleaned) {
      setError('Enter the Display Operator PIN or Bids Operator PIN issued by the Main Operator.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await redeemSubOpPin(cleaned);
    setSubmitting(false);
    if (!res.ok || !res.role) {
      setError(res.error || 'Invalid Sub-Operator PIN');
      return;
    }
    setPinInput('');
    onToast(
      res.role === 'bids'
        ? 'Sub-Operator Unlocked: Bids Operator + Arena 1 Access'
        : 'Sub-Operator Unlocked: Arena 1 Display Access (Read-Only)'
    );
    onClose();
    onUnlocked(res.role);
  };

  return (
    <div
      className="fixed inset-0 bg-[#0e0b21]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subop-pin-dialog-title"
      data-testid="subop-pin-modal"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#1c192f] border-2 border-[#fdb813]/70 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#fdb813]/15 border border-[#fdb813]/50 flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#fdb813]" />
            </div>
            <div>
              <h3
                id="subop-pin-dialog-title"
                className="font-[Space_Grotesk] text-lg font-bold text-[#e6defe] leading-tight"
              >
                Sub-Operator PIN Entry
              </h3>
              <p className="font-[JetBrains_Mono] text-[10px] text-[#fdb813]">
                EVENT ACCESS · NO MAIN OPERATOR CONTROLS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Sub-Operator PIN modal"
            className="text-[#9d8f79] hover:text-[#e6defe]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-[#141026] border border-[#504533] rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 font-[JetBrains_Mono] text-[10px] font-bold text-[#4edea3]">
              <Tv className="w-3.5 h-3.5" />
              <span>DISPLAY PIN</span>
            </div>
            <p className="font-[Inter] text-[11px] text-[#d5c4ac] leading-snug">
              Opens <strong className="text-[#e6defe]">Arena 1</strong> (/arena) read-only stage &amp; leader display.
            </p>
          </div>
          <div className="bg-[#141026] border border-[#504533] rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 font-[JetBrains_Mono] text-[10px] font-bold text-[#fdb813]">
              <Gavel className="w-3.5 h-3.5" />
              <span>BIDS OP PIN</span>
            </div>
            <p className="font-[Inter] text-[11px] text-[#d5c4ac] leading-snug">
              Opens <strong className="text-[#e6defe]">Bids Desk</strong> + <strong className="text-[#e6defe]">Arena 1</strong> to enter live bids.
            </p>
          </div>
        </div>

        <div className="bg-[#201d33] border border-[#504533] rounded-lg px-3 py-2 flex items-start gap-2 font-[JetBrains_Mono] text-[10px] text-[#d5c4ac]">
          <ShieldAlert className="w-3.5 h-3.5 text-[#fdb813] shrink-0 mt-0.5" />
          <span>
            Sub-Operator PINs never grant Main Operator actions (releasing lots, Up Next queue, Mix &amp; Match, or Undo).
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-[#93000a]/35 border border-[#ffb4ab]/60 rounded-lg p-2.5 flex items-start gap-2 font-[JetBrains_Mono] text-[11px] text-[#ffb4ab]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="subop-pin-input"
            className="block font-[JetBrains_Mono] text-[10px] text-[#9d8f79] uppercase mb-1"
          >
            Enter 6-Digit Sub-Operator PIN
          </label>
          <input
            id="subop-pin-input"
            type="text"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="e.g. 482910"
            autoFocus
            data-testid="subop-pin-input"
            className="w-full bg-[#141026] border-2 border-[#504533] focus:border-[#fdb813] rounded-lg px-3 py-2 text-base font-[JetBrains_Mono] font-bold tracking-widest text-[#e6defe] focus:outline-none uppercase"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-[#504533] text-[#d5c4ac] font-[JetBrains_Mono] text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            data-testid="subop-pin-submit"
            className="px-4 py-2 rounded-lg bg-[#fdb813] hover:bg-[#ffbb1e] text-[#271900] font-[JetBrains_Mono] text-xs font-extrabold disabled:opacity-50"
          >
            {submitting ? 'Verifying...' : 'Unlock Sub-Operator'}
          </button>
        </div>
      </form>
    </div>
  );
}
