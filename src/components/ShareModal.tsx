import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Laptop, QrCode, Radio, Share2, Smartphone, Tv, Users, X } from 'lucide-react';
import type { AuctionViewModel } from '../auction/types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface NetworkInfo {
  port: number;
  lanUrls: Array<{ name: string; address: string; url: string }>;
  appUrl: string | null;
}

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  vm: AuctionViewModel;
  onToast: (msg: string) => void;
}

export function ShareModal({ open, onClose, vm, onToast }: ShareModalProps) {
  const { hostTeamTokens } = useAuth();
  const [netInfo, setNetInfo] = useState<NetworkInfo | null>(null);
  const [selectedBase, setSelectedBase] = useState<string>(() => window.location.origin);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrPath, setQrPath] = useState<string>('/bid');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch('/api/network')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: NetworkInfo | null) => {
        if (!active || !data) return;
        setNetInfo(data);
        const currentIsLocal =
          window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (currentIsLocal && data.lanUrls.length > 0) {
          setSelectedBase(data.lanUrls[0].url);
        } else if (data.appUrl) {
          setSelectedBase(data.appUrl.replace(/\/$/, ''));
        } else {
          setSelectedBase(window.location.origin);
        }
      })
      .catch(() => {
        // Fallback to window.location.origin
      });
    return () => {
      active = false;
    };
  }, [open]);

  const baseOptions = useMemo(() => {
    const opts: Array<{ label: string; url: string }> = [];
    const seen = new Set<string>();
    const add = (label: string, url: string) => {
      const clean = url.replace(/\/$/, '');
      if (!clean || seen.has(clean)) return;
      seen.add(clean);
      opts.push({ label, url: clean });
    };
    if (netInfo?.lanUrls) {
      netInfo.lanUrls.forEach((l) => add(`Wi-Fi / LAN (${l.address})`, l.url));
    }
    if (netInfo?.appUrl) {
      add('Hosted App URL', netInfo.appUrl);
    }
    add('Current Browser Tab', window.location.origin);
    return opts;
  }, [netInfo]);

  const activeUrl = `${selectedBase}${qrPath}`;

  useEffect(() => {
    if (!open) return;
    let active = true;
    QRCode.toDataURL(activeUrl, {
      width: 196,
      margin: 2,
      color: { dark: '#0e0b21', light: '#ffdb9f' },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [open, activeUrl]);

  if (!open) return null;

  const copyLink = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      onToast(`Copied link: ${url}`);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      onToast(`Share URL: ${url}`);
    }
  };

  const roleLinks = [
    {
      key: 'arena',
      title: 'Arena Display (Projector / Stage)',
      desc: 'Read-only live stage + Team–Players Dashboard. Zero bidding buttons.',
      path: '/arena',
      icon: Tv,
      accent: 'text-[#fdb813] border-[#fdb813]/50',
    },
    {
      key: 'bid',
      title: 'User Bidder Console (Team Laptops / Phones)',
      desc: 'Club members select their team and place instant jump/custom bids.',
      path: '/bid',
      icon: Users,
      accent: 'text-[#4edea3] border-[#4edea3]/50',
    },
    {
      key: 'operator',
      title: 'Operator Host Desk (Auctioneer)',
      desc: 'Mix & match pool, stage Up Next 3 lots, extend clock, or hammer.',
      path: '/operator',
      icon: Laptop,
      accent: 'text-[#ffdb9f] border-[#504533]',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-[#0e0b21]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      data-testid="share-modal"
    >
      <div className="bg-[#1c192f] border-2 border-[#fdb813]/60 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-5 py-3 bg-[#0e0b21] border-b border-[#504533] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-[#fdb813]" />
            <div>
              <h2
                id="share-dialog-title"
                className="font-[Space_Grotesk] text-lg font-bold text-[#e6defe]"
              >
                Share Auction Across Laptops, Tabs &amp; Phones
              </h2>
              <p className="font-[JetBrains_Mono] text-[11px] text-[#9d8f79]">
                All connected devices sync live over SSE (&lt;50ms) to this local server
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share modal"
            className="p-1.5 rounded text-[#9d8f79] hover:text-[#e6defe] hover:bg-[#201d33]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-5 space-y-4">
          {/* Base Host Selector */}
          <div className="bg-[#141026] border border-[#504533] rounded p-3">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="font-[JetBrains_Mono] text-[11px] font-bold text-[#ffdb9f] flex items-center gap-1.5 uppercase">
                <Radio className="w-3.5 h-3.5 text-[#4edea3]" />
                <span>Select Network Address For Other Devices</span>
              </span>
              <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                Same Wi-Fi? Pick your LAN IPv4 address (not localhost)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {baseOptions.map((opt) => (
                <button
                  key={opt.url}
                  type="button"
                  onClick={() => setSelectedBase(opt.url)}
                  className={`px-3 py-1.5 rounded border font-[JetBrains_Mono] text-xs transition-colors ${
                    selectedBase === opt.url
                      ? 'bg-[#fdb813] text-[#271900] border-[#fdb813] font-bold'
                      : 'bg-[#201d33] text-[#d5c4ac] border-[#504533] hover:border-[#fdb813]'
                  }`}
                >
                  {opt.label}: <span className="underline">{opt.url}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Role Links & Team Quick-Join Links */}
            <div className="lg:col-span-8 space-y-3">
              <div className="space-y-2">
                {roleLinks.map((item) => {
                  const Icon = item.icon;
                  const fullUrl = `${selectedBase}${item.path}`;
                  const isQrTarget = qrPath === item.path;
                  return (
                    <div
                      key={item.key}
                      className={`p-3 rounded bg-[#141026] border ${item.accent} flex items-center justify-between gap-3`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="font-[Space_Grotesk] text-sm font-bold text-[#e6defe]">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-[#9d8f79] mt-0.5">{item.desc}</p>
                        <div className="font-[JetBrains_Mono] text-[11px] text-[#ffdb9f] mt-1 truncate">
                          {fullUrl}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setQrPath(item.path)}
                          className={`px-2.5 py-1.5 rounded border font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1 ${
                            isQrTarget
                              ? 'bg-[#fdb813] text-[#271900] border-[#fdb813]'
                              : 'bg-[#201d33] text-[#d5c4ac] border-[#504533] hover:border-[#fdb813]'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => copyLink(item.key, fullUrl)}
                          className="px-2.5 py-1.5 rounded bg-[#201d33] border border-[#504533] hover:border-[#4edea3] text-[#4edea3] font-[JetBrains_Mono] text-[10px] font-bold flex items-center gap-1"
                        >
                          {copiedKey === item.key ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedKey === item.key ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Per-Team Direct Bidder Links */}
              <div className="bg-[#141026] border border-[#504533] rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-[JetBrains_Mono] text-[11px] font-bold text-[#4edea3] uppercase">
                    {hostTeamTokens.length > 0
                      ? 'Per-Team Token Invite Links (1 Click Room Entry)'
                      : 'Direct Bidder Console Links (Log In As Host To Issue Tokens)'}
                  </span>
                  <span className="font-[JetBrains_Mono] text-[10px] text-[#9d8f79]">
                    Click to preview QR or Copy
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
                  {vm.teams.map((t) => {
                    const tokEntry = hostTeamTokens.find((x) => x.teamId === t.id);
                    const teamPath = tokEntry?.token
                      ? `/bid?token=${encodeURIComponent(tokEntry.token)}`
                      : '/bid';
                    const teamUrl = `${selectedBase}${teamPath}`;
                    return (
                      <div
                        key={t.id}
                        className={`p-2 rounded border flex flex-col gap-1 ${
                          qrPath === teamPath
                            ? 'bg-[#201d33] border-[#fdb813]'
                            : 'bg-[#1c192f] border-[#504533]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="px-1.5 py-0.5 rounded font-[Space_Grotesk] text-[10px] font-black"
                            style={{ backgroundColor: t.badgeBg, color: t.badgeText }}
                          >
                            {t.short}
                          </span>
                          <span className="font-[JetBrains_Mono] text-[9px] text-[#fdb813] truncate ml-1">
                            {tokEntry?.token || t.paddle}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => setQrPath(teamPath)}
                            className="flex-1 py-1 rounded bg-[#141026] border border-[#504533] hover:border-[#fdb813] text-[#ffdb9f] font-[JetBrains_Mono] text-[9px] font-bold"
                          >
                            QR
                          </button>
                          <button
                            type="button"
                            onClick={() => copyLink(`team-${t.id}`, teamUrl)}
                            className="flex-1 py-1 rounded bg-[#141026] border border-[#504533] hover:border-[#4edea3] text-[#4edea3] font-[JetBrains_Mono] text-[9px] font-bold"
                          >
                            {copiedKey === `team-${t.id}` ? 'Done' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scannable QR Code + Local Run Instructions */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div className="bg-[#141026] border border-[#fdb813]/50 rounded p-4 flex flex-col items-center text-center">
                <div className="flex items-center gap-1.5 font-[JetBrains_Mono] text-[11px] font-bold text-[#fdb813] mb-2">
                  <Smartphone className="w-4 h-4" />
                  <span>SCAN TO OPEN ON PHONE / TABLET</span>
                </div>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${activeUrl}`}
                    className="w-44 h-44 rounded border-2 border-[#fdb813] bg-[#ffdb9f]"
                  />
                ) : (
                  <div className="w-44 h-44 rounded border border-[#504533] flex items-center justify-center font-[JetBrains_Mono] text-xs text-[#9d8f79]">
                    Generating QR...
                  </div>
                )}
                <div className="mt-2 font-[JetBrains_Mono] text-[10px] text-[#d5c4ac] break-all">
                  {activeUrl}
                </div>
              </div>

              <div className="bg-[#141026] border border-[#504533] rounded p-3 font-[JetBrains_Mono] text-[11px] text-[#d5c4ac] space-y-1.5">
                <div className="text-[#ffdb9f] font-bold uppercase text-[10px]">
                  3-Step Local Club Event Setup
                </div>
                <p>1. Connect the host laptop and all team laptops/phones to the same Wi-Fi hotspot.</p>
                <p>2. Open <span className="text-[#fdb813]">/arena</span> on the main projector screen (display-only Team–Players Dashboard).</p>
                <p>3. Share <span className="text-[#4edea3]">/bid?team=t1..t11</span> (or scan the QR) on each team&apos;s laptop/phone for live bidding.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
