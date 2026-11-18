import { useState } from 'react';
import {
  Check,
  Cloud,
  Copy,
  FileCode2,
  Flame,
  FolderOpen,
  Laptop,
  LogIn,
  ShieldCheck,
  Terminal,
  Volume2,
} from 'lucide-react';
import type { AuctionViewModel } from '../auction/types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { FIREBASE_PROJECT_ID } from '../firebase.ts';
import { type AuctionAudioCue, triggerAuctionCue } from '../utils/soundFx.ts';

interface DeployPanelProps {
  vm: AuctionViewModel;
  onNavigateLogin: () => void;
  onToast: (msg: string) => void;
}

type DeployTarget = 'local' | 'firebase' | 'vercel';

const COMMAND_BLOCKS: Record<
  DeployTarget,
  {
    title: string;
    subtitle: string;
    badge: string;
    commands: string;
    notes: string[];
    files: string[];
  }
> = {
  local: {
    title: 'Local / Club Event LAN Run (Recommended)',
    subtitle:
      'Full SSE real-time sync, auto-hammer clock, and data/events.json ledger across laptops & phones.',
    badge: 'FULL REAL-TIME + DISK',
    commands: `npm install
npm run build
npm run start
# Development hot start:
npm run dev`,
    notes: [
      'Bind port 3000 on 0.0.0.0 so all laptops & phones on club Wi-Fi can join with their Team Token.',
      'Use the Share modal for auto-detected LAN IPv4 addresses and QR codes.',
      'Optional host PIN guard: PIN=1234 npm run start.',
    ],
    files: ['server.ts', 'package.json', 'data/events.json'],
  },
  firebase: {
    title: 'Firebase Hosting, Google Auth & Firestore Rules',
    subtitle: `Configured for ${FIREBASE_PROJECT_ID} via firebase.json, .firebaserc, and firestore.rules.`,
    badge: 'AUTH + SPA HOSTING',
    commands: `npx eslint firestore.rules
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting,firestore:rules --project ${FIREBASE_PROJECT_ID}`,
    notes: [
      'Enable Google Sign-In in Firebase Console → Authentication → Sign-in method (Host-only login).',
      'Add your Hosting domain to Authentication → Settings → Authorized domains.',
      'Always lint firestore.rules with ESLint before deploying updates.',
    ],
    files: ['firebase.json', '.firebaserc', 'firestore.rules'],
  },
  vercel: {
    title: 'Vercel Serverless Deployment',
    subtitle: 'Static Vite bundle served via Vercel CDN with /api/* routed to api/index.ts.',
    badge: 'SERVERLESS ADAPTER',
    commands: `npm install -g vercel
npm run build
vercel --prod`,
    notes: [
      'vercel.json rewrites /api/(.*) to api/index.ts (createApp from server.ts).',
      'Add your *.vercel.app domain to Firebase Authorized Domains for Host Sign-In.',
      'Use Local LAN or Cloud Run for persistent multi-device SSE auctions.',
    ],
    files: ['vercel.json', 'api/index.ts', 'server.ts'],
  },
};

const AUDIO_CUE_TESTS: Array<{ cue: AuctionAudioCue; label: string }> = [
  { cue: 'LOT_OPEN', label: 'Lot Open' },
  { cue: 'BID_ACCEPTED', label: 'Bid Accepted' },
  { cue: 'BIDDING_WAR', label: 'Bidding War' },
  { cue: 'TITLE_SOLD', label: 'Title Sold' },
  { cue: 'SOLD', label: 'Player Sold' },
  { cue: 'UNSOLD', label: 'Unsold' },
];

export function DeployPanel({ vm, onNavigateLogin, onToast }: DeployPanelProps) {
  const { hostStatus, firestoreStatus } = useAuth();
  const [target, setTarget] = useState<DeployTarget>('local');
  const [copied, setCopied] = useState<string | null>(null);

  const activeSpec = COMMAND_BLOCKS[target];

  const handleCopy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      onToast(`Copied ${label} commands`);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      onToast('Clipboard unavailable');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3">
      {/* LEFT (7 cols): Deployment Targets & Commands */}
      <section className="lg:col-span-7 bg-[#0e0b21] border border-[#504533] rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#2b273e] pb-2">
          <div>
            <h2 className="font-[Space_Grotesk] text-base font-bold text-[#e6defe]">
              Deployment Runbooks (Local · Firebase · Vercel)
            </h2>
            <p className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
              Full reference also documented in DEPLOYMENT.md
            </p>
          </div>
          <div className="flex items-center bg-[#1c192f] p-0.5 rounded-lg border border-[#504533] gap-1">
            {(
              [
                ['local', 'Local / LAN', Laptop],
                ['firebase', 'Firebase', Flame],
                ['vercel', 'Vercel', Cloud],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTarget(id)}
                data-testid={`deploy-tab-${id}`}
                className={`px-2.5 py-1 rounded font-[JetBrains_Mono] text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  target === id ? 'bg-[#fdb813] text-[#271900]' : 'text-[#d5c4ac] hover:text-[#e6defe]'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#1c192f] border border-[#504533] rounded-lg p-2.5 space-y-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-[Space_Grotesk] text-sm font-bold text-[#ffdb9f]">
                {activeSpec.title}
              </h3>
              <p className="font-[Inter] text-[11px] text-[#d5c4ac] mt-0.5">{activeSpec.subtitle}</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#00a572]/20 border border-[#4edea3]/50 font-[JetBrains_Mono] text-[9px] font-bold text-[#4edea3]">
              {activeSpec.badge}
            </span>
          </div>

          <div className="bg-[#0e0b21] border border-[#504533] rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] flex items-center gap-1 uppercase">
                <Terminal className="w-3 h-3 text-[#fdb813]" />
                <span>Terminal Commands</span>
              </span>
              <button
                type="button"
                onClick={() => void handleCopy(target, activeSpec.commands)}
                className="px-2 py-0.5 rounded bg-[#201d33] border border-[#504533] hover:border-[#fdb813] font-[JetBrains_Mono] text-[10px] font-bold text-[#ffdb9f] flex items-center gap-1"
              >
                {copied === target ? <Check className="w-3 h-3 text-[#4edea3]" /> : <Copy className="w-3 h-3" />}
                <span>{copied === target ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="font-[JetBrains_Mono] text-[11px] text-[#4edea3] overflow-x-auto leading-snug">
              {activeSpec.commands}
            </pre>
          </div>

          <ul className="space-y-1 font-[Inter] text-[11px] text-[#e6defe]">
            {activeSpec.notes.map((n) => (
              <li key={n} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fdb813] mt-1.5 shrink-0" />
                <span>{n}</span>
              </li>
            ))}
          </ul>

          <div className="pt-1.5 border-t border-[#2b273e] flex items-center gap-1.5 flex-wrap">
            <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79] flex items-center gap-1">
              <FileCode2 className="w-3 h-3 text-[#fdb813]" />
              <span>Files:</span>
            </span>
            {activeSpec.files.map((f) => (
              <code
                key={f}
                className="px-1.5 py-0.5 rounded bg-[#141026] border border-[#504533] font-[JetBrains_Mono] text-[10px] text-[#ffdb9f]"
              >
                {f}
              </code>
            ))}
          </div>
        </div>

        <div className="bg-[#1c192f] border border-[#504533] rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-[Space_Grotesk] text-xs font-bold text-[#e6defe] flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#4edea3]" />
              <span>Audio Cue Soundboard</span>
            </span>
            <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
              Governed by OperatorHeader global volume
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {AUDIO_CUE_TESTS.map((item) => (
              <button
                key={item.cue}
                type="button"
                onClick={() => triggerAuctionCue(item.cue, 3)}
                className="px-2 py-1 rounded bg-[#141026] border border-[#504533] hover:border-[#4edea3] text-[#e6defe] hover:text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-semibold"
              >
                ▶ {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RIGHT (5 cols): Server Paths, Quota Rules & Host Session */}
      <section className="lg:col-span-5 flex flex-col gap-3">
        <div className="bg-[#0e0b21] border-2 border-[#fdb813]/50 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-[Space_Grotesk] text-base font-bold text-[#e6defe] flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#fdb813]" />
              <span>Runtime Storage &amp; Static Assets</span>
            </h2>
            <span className="px-2 py-0.5 rounded bg-[#201d33] border border-[#504533] font-[JetBrains_Mono] text-[9px] text-[#4edea3] font-bold">
              HOST CONFIG
            </span>
          </div>

          <div className="space-y-2 font-[JetBrains_Mono] text-[10px]">
            <div className="bg-[#1c192f] border border-[#504533] rounded-lg p-2.5 space-y-0.5">
              <div className="text-[#9d8f79] text-[9px] uppercase">Event Ledger &amp; Tokens</div>
              <div className="text-[#fdb813] font-bold">data/events.json · data/tokens.json</div>
              <div className="text-[#d5c4ac]">
                Append-only auction log and Host-issued T01–T11 room tokens.
              </div>
            </div>

            <div className="bg-[#1c192f] border border-[#504533] rounded-lg p-2.5 space-y-0.5">
              <div className="text-[#9d8f79] text-[9px] uppercase">Static Logo &amp; Media Directory</div>
              <div className="text-[#4edea3] font-bold">public/logos/ → served at /logos/</div>
              <div className="text-[#d5c4ac]">
                Place custom team or player PNG crests in public/logos/ for automatic resolution.
              </div>
            </div>
          </div>

          <div className="bg-[#1c192f] border border-[#504533] rounded-lg p-2.5 flex items-center justify-between font-[JetBrains_Mono] text-[10px]">
            <span className="text-[#d5c4ac] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3]" />
              <span>Enforced Quotas:</span>
            </span>
            <span className="text-[#fdb813] font-bold">
              Min {vm.cfg.minBowlers} BOWL · Min {vm.cfg.minWicketkeepers} WK
            </span>
          </div>
        </div>

        <div className="bg-[#0e0b21] border border-[#504533] rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe]">
              Host Authentication Status
            </h2>
            <span className="font-[JetBrains_Mono] text-[10px] text-[#4edea3]">
              {firestoreStatus.toUpperCase()}
            </span>
          </div>
          <p className="font-[Inter] text-xs text-[#d5c4ac]">
            {hostStatus.hostLoggedIn
              ? `Host active (${hostStatus.hostName || hostStatus.hostEmail}) · ${vm.preset} preset`
              : 'Login is for the Auction Host only. Sign in on Host Login to generate Team 1 – Team 11 tokens.'}
          </p>
          <button
            type="button"
            onClick={onNavigateLogin}
            className="w-full py-2 px-3 rounded-lg bg-[#201d33] border border-[#fdb813]/60 hover:bg-[#2b273e] text-[#ffdb9f] font-[JetBrains_Mono] text-xs font-bold flex items-center justify-center gap-2"
          >
            <LogIn className="w-3.5 h-3.5 text-[#fdb813]" />
            <span>{hostStatus.hostLoggedIn ? 'Manage Host Tokens' : 'Open Host Login'}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
