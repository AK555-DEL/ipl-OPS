import { Home, LogIn, Rocket, SlidersHorizontal, Tv } from 'lucide-react';
import type { AuctionViewModel } from '../auction/types.ts';
import { FIREBASE_PROJECT_ID } from '../firebase.ts';
import { DeployPanel } from './DeployPanel.tsx';

interface DeployPageProps {
  vm: AuctionViewModel;
  onNavigateLanding: () => void;
  onNavigateOperator: () => void;
  onNavigateArena: () => void;
  onNavigateLogin: () => void;
  onToast: (msg: string) => void;
}

export function DeployPage({
  vm,
  onNavigateLanding,
  onNavigateOperator,
  onNavigateArena,
  onNavigateLogin,
  onToast,
}: DeployPageProps) {
  return (
    <div
      className="w-screen h-screen overflow-hidden bg-[#141026] text-[#e6defe] flex flex-col"
      data-testid="deploy-page"
    >
      <header className="h-12 bg-[#0e0b21] border-b border-[#504533] px-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded bg-[#4edea3]/15 border border-[#4edea3]/50 flex items-center justify-center shrink-0">
            <Rocket className="w-4 h-4 text-[#4edea3]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-[Space_Grotesk] text-sm font-bold uppercase tracking-wider text-[#ffdb9f] truncate">
              HOST DEPLOYMENT RUNBOOKS &amp; DIAGNOSTICS
            </h1>
            <span className="font-[JetBrains_Mono] text-[9px] text-[#9d8f79] hidden sm:block">
              Local LAN · Firebase ({FIREBASE_PROJECT_ID}) · Vercel
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
            onClick={onNavigateLogin}
            className="px-2.5 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#fdb813] text-[#e6defe] font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1"
          >
            <LogIn className="w-3.5 h-3.5 text-[#fdb813]" />
            <span>Host Login</span>
          </button>
          <button
            type="button"
            onClick={onNavigateArena}
            className="px-2.5 py-1 rounded border border-[#fdb813]/60 bg-[#fdb813]/15 hover:bg-[#fdb813]/25 text-[#fdb813] font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Arena</span>
          </button>
          <button
            type="button"
            onClick={onNavigateOperator}
            className="px-2.5 py-1 rounded border border-[#504533] bg-[#201d33] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#fdb813]" />
            <span>Operator</span>
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3.5 flex items-start lg:items-center justify-center">
        <DeployPanel vm={vm} onNavigateLogin={onNavigateLogin} onToast={onToast} />
      </main>
    </div>
  );
}
