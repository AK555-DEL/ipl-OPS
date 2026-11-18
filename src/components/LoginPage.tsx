import { AlertCircle, Home, Rocket, ShieldCheck, SlidersHorizontal, Tv } from 'lucide-react';
import type { AuctionViewModel } from '../auction/types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID } from '../firebase.ts';
import { HostLoginPanel } from './HostLoginPanel.tsx';

interface LoginPageProps {
  vm: AuctionViewModel;
  requireAuthNotice?: string;
  onNavigateLanding: () => void;
  onNavigateOperator: () => void;
  onNavigateArena: () => void;
  onNavigateDeploy: () => void;
  onToast: (msg: string) => void;
}

export function LoginPage({
  vm,
  requireAuthNotice,
  onNavigateLanding,
  onNavigateOperator,
  onNavigateArena,
  onNavigateDeploy,
  onToast,
}: LoginPageProps) {
  const { hostToken, hostStatus } = useAuth();
  const isHostAuthenticated = Boolean(hostToken && hostStatus.hostLoggedIn);

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-[#141026] text-[#e6defe] flex flex-col"
      data-testid="login-page"
    >
      <header className="h-12 bg-[#0e0b21] border-b border-[#504533] px-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded bg-[#fdb813]/15 border border-[#fdb813]/50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#fdb813]" />
          </div>
          <div className="min-w-0">
            <span className="font-[Space_Grotesk] text-sm font-bold uppercase tracking-wider text-[#ffdb9f] block leading-tight truncate">
              IPL AUCTION OPS // HOST-ONLY LOGIN
            </span>
            <span className="font-[JetBrains_Mono] text-[9px] text-[#9d8f79] hidden sm:block">
              Project: {FIREBASE_PROJECT_ID} · Auth: {FIREBASE_AUTH_DOMAIN}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onNavigateLanding}
            className="px-2.5 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#4edea3] text-[#e6defe] font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={onNavigateDeploy}
            className="px-2.5 py-1 rounded border border-[#4edea3]/50 bg-[#00a572]/15 hover:bg-[#00a572]/25 text-[#4edea3] font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Deploy</span>
          </button>
          <button
            type="button"
            onClick={onNavigateArena}
            className="px-2.5 py-1 rounded border border-[#fdb813]/50 bg-[#fdb813]/15 hover:bg-[#fdb813]/25 text-[#fdb813] font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Arena</span>
          </button>
          {isHostAuthenticated && (
            <button
              type="button"
              onClick={onNavigateOperator}
              className="px-2.5 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#fdb813]" />
              <span>Operator</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3.5 flex flex-col items-center justify-center gap-3">
        {requireAuthNotice && (
          <div
            data-testid="operator-auth-gate-banner"
            className="w-full max-w-5xl bg-[#93000a]/30 border border-[#ffb4ab]/60 rounded-xl px-4 py-2 flex items-center gap-2 font-[JetBrains_Mono] text-xs text-[#ffb4ab]"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{requireAuthNotice}</span>
          </div>
        )}
        <HostLoginPanel
          vm={vm}
          onNavigateOperator={onNavigateOperator}
          onNavigateDeploy={onNavigateDeploy}
          onToast={onToast}
        />
      </main>
    </div>
  );
}
