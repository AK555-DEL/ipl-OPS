import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Clock,
  Crown,
  Flame,
  Gavel,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import type {
  AuctionViewModel,
  BriefPlayer,
  LastOutcome,
  LotCategory,
  Player,
  TeamView,
} from '../auction/types.ts';
import { formatCurrency, formatLakhs, formatPlayerCardMeta } from '../auction/engine.ts';
import { buildTeamPurseRows, computeBiddingRateInfo, type TeamPurseRow } from '../utils/stageCard.ts';
import { PlayerPortrait } from './PlayerPortrait.tsx';
import { TeamLogoBadge } from './TeamLogoBadge.tsx';

interface ArenaLivePriceProps {
  vm: AuctionViewModel;
  players: Player[];
  remainingSec: number;
  nowMs: number;
  upcomingStrip: BriefPlayer[];
}

const CATEGORY_LABEL: Record<LotCategory, string> = {
  TITLE: 'FRANCHISE TITLE · 3:00',
  MAVERICK: 'MAVERICK · 5:00',
  CAPPED: 'CAPPED · 3:00',
  UNCAPPED: 'UNCAPPED · 2:00',
};

function formatClock(sec: number): string {
  const clamped = Math.max(0, Math.floor(sec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface HeatTier {
  label: string;
  sublabel: string;
  level: number; // 1..5
  accentText: string;
  barGradient: string;
  borderColor: string;
}

function resolveHeatTier(bidCount: number, multiplierNum: number): HeatTier {
  if (bidCount <= 0) {
    return {
      label: 'OPENING FLOOR',
      sublabel: 'Awaiting first paddle',
      level: 1,
      accentText: 'text-[#9ec5ff]',
      barGradient: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
      borderColor: 'border-[#3a4d74]',
    };
  }
  if (bidCount >= 10 || multiplierNum >= 3) {
    return {
      label: 'FRENZY OVERDRIVE',
      sublabel: 'Maximum arena escalation',
      level: 5,
      accentText: 'text-[#ffb4ab]',
      barGradient: 'linear-gradient(90deg, #fdb813 0%, #f97316 55%, #ef4444 100%)',
      borderColor: 'border-[#ef4444]/70',
    };
  }
  if (bidCount >= 6 || multiplierNum >= 2) {
    return {
      label: 'BIDDING WAR',
      sublabel: 'Rapid multi-paddle duel',
      level: 4,
      accentText: 'text-[#fb923c]',
      barGradient: 'linear-gradient(90deg, #4edea3 0%, #fdb813 60%, #f97316 100%)',
      borderColor: 'border-[#f97316]/70',
    };
  }
  if (bidCount >= 3 || multiplierNum >= 1.4) {
    return {
      label: 'HEATING UP',
      sublabel: 'Active competitive bidding',
      level: 3,
      accentText: 'text-[#fdb813]',
      barGradient: 'linear-gradient(90deg, #4edea3 0%, #fdb813 100%)',
      borderColor: 'border-[#fdb813]/70',
    };
  }
  return {
    label: 'ACTION LIVE',
    sublabel: 'Opening paddle on the board',
    level: 2,
    accentText: 'text-[#4edea3]',
    barGradient: 'linear-gradient(90deg, #00a572 0%, #4edea3 100%)',
    borderColor: 'border-[#4edea3]/60',
  };
}

function purseAccentClasses(row: TeamPurseRow): { amountText: string; barColor: string } {
  if (row.isLeading) {
    return { amountText: 'text-[#fdb813]', barColor: '#fdb813' };
  }
  if (row.remainingPct <= 15 || row.team.solvency === 'CRITICAL') {
    return { amountText: 'text-[#ffb4ab]', barColor: '#ef4444' };
  }
  if (row.remainingPct <= 35 || row.team.solvency === 'CAUTION') {
    return { amountText: 'text-[#fbbf24]', barColor: '#f59e0b' };
  }
  return { amountText: 'text-[#4edea3]', barColor: '#4edea3' };
}

function TeamRemainingPurseList({
  rows,
  maxSquad,
}: {
  rows: TeamPurseRow[];
  maxSquad: number;
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-2 font-[JetBrains_Mono] text-[10px] font-bold uppercase tracking-wider text-[#8ea5ce] shrink-0">
        <span>TEAM</span>
        <span>REMAINING</span>
      </div>
      <div
        className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-rows-11 gap-1.5 pr-0.5"
        data-testid="live-price-team-purses"
      >
        {rows.map((row) => {
          const { team } = row;
          const accent = purseAccentClasses(row);
          return (
            <div
              key={team.id}
              data-testid={`live-price-purse-${team.id}`}
              className={`rounded-lg px-2.5 py-1.5 border flex flex-col justify-center gap-1 min-h-0 transition-colors ${
                row.isLeading
                  ? 'bg-[#172647] border-[#fdb813] shadow-[0_0_14px_rgba(253,184,19,0.16)]'
                  : 'bg-[#121a32] border-[#253256]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <TeamLogoBadge team={team} size="xs" />
                  <div className="min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-[Chakra_Petch] text-xs font-bold text-white truncate">
                        {team.name}
                      </span>
                      {row.isLeading && (
                        <Crown className="w-3 h-3 text-[#fdb813] shrink-0" aria-label="Leading bidder" />
                      )}
                    </div>
                    <div className="font-[JetBrains_Mono] text-[10px] text-[#9ec5ff] truncate tabular-nums">
                      {row.isLeading && row.projectedAfterBidLakhs !== null
                        ? `After bid: ${formatCurrency(row.projectedAfterBidLakhs)}`
                        : `${team.paddle} · ${team.n}/${maxSquad} players`}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 leading-tight">
                  <div
                    className={`font-[Antonio] font-bold text-base sm:text-lg tabular-nums leading-none whitespace-nowrap ${accent.amountText}`}
                    data-testid={`live-price-purse-amount-${team.id}`}
                  >
                    {formatCurrency(row.remainingLakhs)}
                  </div>
                </div>
              </div>

              <div className="w-full h-1 rounded-full bg-[#1a2442] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${row.remainingPct}%`,
                    backgroundColor: accent.barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ArenaLivePrice({
  vm,
  players,
  remainingSec,
  nowMs,
  upcomingStrip,
}: ArenaLivePriceProps) {
  const lot = vm.lot;
  const lastOutcome: LastOutcome | null = vm.last;

  const [bidPulse, setBidPulse] = useState(false);
  const [lastDeltaLakhs, setLastDeltaLakhs] = useState<number>(0);
  const prevPriceRef = useRef<number>(lot?.price ?? 0);
  const prevBidCountRef = useRef<number>(lot?.bidCount ?? 0);
  const prevLotIdRef = useRef<string | null>(lot?.p.id ?? null);

  useEffect(() => {
    const currentLotId = lot?.p.id ?? null;
    if (currentLotId !== prevLotIdRef.current) {
      prevLotIdRef.current = currentLotId;
      prevPriceRef.current = lot?.price ?? 0;
      prevBidCountRef.current = lot?.bidCount ?? 0;
      setLastDeltaLakhs(0);
      setBidPulse(false);
      return;
    }

    if (!lot) return;
    if (lot.price > prevPriceRef.current || lot.bidCount > prevBidCountRef.current) {
      const delta = Math.max(0, lot.price - prevPriceRef.current);
      setLastDeltaLakhs(delta);
      setBidPulse(true);
      prevPriceRef.current = lot.price;
      prevBidCountRef.current = lot.bidCount;
      const t = window.setTimeout(() => setBidPulse(false), 950);
      return () => window.clearTimeout(t);
    }
    prevPriceRef.current = lot.price;
    prevBidCountRef.current = lot.bidCount;
  }, [lot?.p.id, lot?.price, lot?.bidCount, lot]);

  const teamMap = useMemo(() => {
    const map = new Map<string, TeamView>();
    for (const t of vm.teams) map.set(t.id, t);
    return map;
  }, [vm.teams]);

  const rateInfo = useMemo(
    () => (lot ? computeBiddingRateInfo(lot, vm.teams, nowMs) : null),
    [lot, vm.teams, nowMs]
  );

  // Reverse chronological bid ladder for live lot
  const reverseTrail = useMemo(() => {
    if (!lot || lot.trail.length === 0) return [];
    return lot.trail
      .map((entry, idx) => {
        const prevAmount = idx === 0 ? lot.p.base : lot.trail[idx - 1].price;
        const delta = Math.max(0, entry.price - prevAmount);
        return {
          ...entry,
          bidNumber: idx + 1,
          delta,
          teamView: teamMap.get(entry.team) ?? null,
        };
      })
      .reverse();
  }, [lot, teamMap]);

  // Unique contenders that have placed bids on current lot
  const contenders = useMemo(() => {
    if (!lot) return [];
    const seen = new Set<string>();
    const list: TeamView[] = [];
    for (let i = lot.trail.length - 1; i >= 0; i--) {
      const tid = lot.trail[i].team;
      if (!seen.has(tid)) {
        seen.add(tid);
        const tv = teamMap.get(tid);
        if (tv) list.push(tv);
      }
    }
    return list;
  }, [lot, teamMap]);

  const teamPurseRows = useMemo(
    () => buildTeamPurseRows(vm.teams, lot),
    [vm.teams, lot]
  );

  // =========================================================================
  // LIVE LOT VIEW: 3-Column Broadcast — Bid Ladder | Live Price | Team Purses
  // =========================================================================
  if (lot && rateInfo) {
    const totalDuration = Math.max(1, lot.durationSec);
    const timerPct = Math.max(0, Math.min(100, (remainingSec / totalDuration) * 100));
    const isUrgent = remainingSec <= 15;
    const isWarning = !isUrgent && remainingSec <= 35;

    const leader = rateInfo.leaderTeam;
    const multiplierNum = Number(rateInfo.multiplier) || 1;
    const heat = resolveHeatTier(lot.bidCount, multiplierNum);
    const surgeLakhs = Math.max(0, lot.price - lot.p.base);
    // Escalation meter caps at 5.0x visually while showing true multiplier text
    const escalationMeterPct = Math.max(
      8,
      Math.min(100, ((multiplierNum - 1) / 4) * 100 + (lot.bidCount > 0 ? 14 : 8))
    );

    return (
      <main
        className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden bg-[#090d1b] px-4 py-3 lg:px-5 lg:py-3.5 grid grid-cols-12 gap-3.5 items-stretch"
        data-testid="arena-live-price"
      >
        {/* LEFT COLUMN (3 cols): LIVE BID LADDER */}
        <aside className="order-3 lg:order-1 col-span-12 lg:col-span-3 bg-[#0f162b] border border-[#2a385e] rounded-2xl p-3 flex flex-col gap-2.5 min-h-0">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#253256] shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <TrendingUp className="w-4 h-4 text-[#fdb813] shrink-0" />
              <h2 className="font-[Chakra_Petch] text-xs font-extrabold uppercase tracking-wider text-white truncate">
                LIVE BID LADDER
              </h2>
            </div>
            <span className="font-[JetBrains_Mono] text-[11px] font-bold text-[#4edea3] tabular-nums whitespace-nowrap shrink-0">
              {lot.bidCount} {lot.bidCount === 1 ? 'Bid' : 'Bids'}
            </span>
          </div>

          {/* Contending Teams Strip */}
          <div className="shrink-0 flex items-center justify-between gap-2 bg-[#141d38] border border-[#27365e] rounded-lg px-2.5 py-1.5">
            <div className="flex items-center gap-1.5 font-[JetBrains_Mono] text-[10px] text-[#9ec5ff] whitespace-nowrap">
              <Users className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
              <span>CONTENDERS ({contenders.length})</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {contenders.length === 0 ? (
                <span className="font-[JetBrains_Mono] text-[10px] text-[#7f92b8]">
                  None yet
                </span>
              ) : (
                contenders.slice(0, 4).map((ct) => (
                  <TeamLogoBadge key={ct.id} team={ct} size="xs" />
                ))
              )}
              {contenders.length > 4 && (
                <span className="font-[JetBrains_Mono] text-[10px] font-bold text-[#fdb813] pl-0.5">
                  +{contenders.length - 4}
                </span>
              )}
            </div>
          </div>

          {/* Chronological Bid Ladder */}
          <div
            className="flex-1 min-h-0 overflow-y-auto custom-scroll space-y-2 pr-0.5"
            data-testid="live-price-trail"
          >
            {reverseTrail.length === 0 ? (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center px-3">
                <Zap className="w-7 h-7 text-[#fdb813]/70 mb-2" />
                <div className="font-[Chakra_Petch] text-xs font-bold text-[#e6defe] uppercase">
                  Waiting for Opening Bid
                </div>
                <p className="font-[JetBrains_Mono] text-[11px] text-[#9ec5ff] mt-1 leading-relaxed">
                  Live bids from team paddles or the Bids Desk climb here in real time.
                </p>
              </div>
            ) : (
              reverseTrail.map((entry, idx) => {
                const isLatest = idx === 0;
                const tv = entry.teamView;
                return (
                  <div
                    key={`${entry.team}-${entry.price}-${entry.bidNumber}`}
                    className={`rounded-xl px-2.5 py-2 border flex items-center justify-between gap-2 transition-colors ${
                      isLatest
                        ? 'bg-[#172647] border-[#fdb813] shadow-[0_0_16px_rgba(253,184,19,0.16)]'
                        : 'bg-[#121a32] border-[#253256]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`font-[JetBrains_Mono] text-[10px] font-black w-5 text-center shrink-0 tabular-nums ${
                          isLatest ? 'text-[#fdb813]' : 'text-[#8ea5ce]'
                        }`}
                      >
                        #{entry.bidNumber}
                      </span>
                      {tv ? (
                        <TeamLogoBadge team={tv} size="xs" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-[#1d2a4d] flex items-center justify-center font-[JetBrains_Mono] text-[10px] font-bold text-white shrink-0">
                          {entry.team.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-[Chakra_Petch] text-xs font-bold text-white truncate flex items-center gap-1">
                          <span className="truncate">{tv?.name ?? entry.team}</span>
                          {isLatest && (
                            <Crown className="w-3 h-3 text-[#fdb813] shrink-0" />
                          )}
                        </div>
                        <div className="font-[JetBrains_Mono] text-[10px] text-[#9ec5ff] flex items-center gap-1 truncate">
                          <span>{tv?.paddle ?? entry.team.toUpperCase()}</span>
                          {entry.delta > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#4edea3] font-bold inline-flex items-center">
                                <ArrowUpRight className="w-2.5 h-2.5" />+₹{formatLakhs(entry.delta)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-[Antonio] font-bold text-lg tabular-nums leading-none whitespace-nowrap ${
                          isLatest ? 'text-[#fdb813]' : 'text-[#e6defe]'
                        }`}
                      >
                        ₹{formatLakhs(entry.price)}
                      </div>
                      {isLatest && (
                        <div className="font-[JetBrains_Mono] text-[9px] font-bold text-[#4edea3] uppercase mt-0.5">
                          LEADING
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* CENTER HERO COLUMN (6 cols): Subject Header + Giant Live Price + Highest Bidder Spotlight */}
        <section className="order-1 lg:order-2 col-span-12 lg:col-span-6 flex flex-col justify-between gap-3.5 min-h-0">
          {/* 1. Subject Bar + Live Countdown Progress */}
          <div className="bg-[#0f162b] border border-[#2a385e] rounded-xl px-4 py-3 flex flex-col gap-2.5 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-lg border-2 border-[#fdb813]/70 overflow-hidden shrink-0 bg-[#141e38]">
                  <PlayerPortrait
                    player={lot.p}
                    teamShort={leader?.short}
                    size="sm"
                    className="w-14 h-14"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-[JetBrains_Mono] text-[11px] text-[#9ec5ff] truncate">
                    <span className="font-bold text-[#fdb813]">{lot.p.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{CATEGORY_LABEL[lot.category]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lot.p.country}</span>
                  </div>
                  <h1
                    className="font-[Antonio] italic font-bold text-2xl sm:text-3xl text-white uppercase tracking-wide truncate leading-none mt-1 pr-2"
                    data-testid="live-price-player-name"
                  >
                    {lot.p.name}
                  </h1>
                  <div className="font-[JetBrains_Mono] text-[11px] text-[#b4cbe9] mt-1 truncate">
                    {formatPlayerCardMeta(lot.p)}
                    {lot.p.titleTheme?.subFranchise
                      ? ` · Sub-Franchise: ${lot.p.titleTheme.subFranchise}`
                      : ''}
                  </div>
                </div>
              </div>

              {/* Giant Countdown Clock */}
              <div className="shrink-0 text-right">
                <div className="font-[JetBrains_Mono] text-[10px] font-bold uppercase tracking-widest text-[#9ec5ff]">
                  HAMMER TIMER
                </div>
                <div
                  className={`font-[JetBrains_Mono] text-2xl sm:text-3xl xl:text-4xl font-black tabular-nums leading-none mt-0.5 flex items-center justify-end gap-1.5 whitespace-nowrap ${
                    isUrgent
                      ? 'text-[#ffb4ab] animate-pulse'
                      : isWarning
                        ? 'text-[#fdb813]'
                        : 'text-[#4edea3]'
                  }`}
                  data-testid="live-price-countdown"
                >
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  <span>{formatClock(remainingSec)}</span>
                </div>
              </div>
            </div>

            {/* Smooth Timer Progress Track */}
            <div className="w-full h-2 rounded-full bg-[#1a2442] overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-200 ease-linear"
                style={{
                  width: `${timerPct}%`,
                  background: isUrgent
                    ? 'linear-gradient(90deg, #ef4444 0%, #ffb4ab 100%)'
                    : isWarning
                      ? 'linear-gradient(90deg, #d97706 0%, #fdb813 100%)'
                      : 'linear-gradient(90deg, #00a572 0%, #4edea3 100%)',
                }}
              />
            </div>
          </div>

          {/* 2. HERO LIVE PRICE DISPLAY + GAMIFIED ESCALATION METER */}
          <div
            className={`relative flex-1 min-h-0 rounded-2xl border-2 ${heat.borderColor} bg-gradient-to-br from-[#101830] via-[#0b1124] to-[#080d1c] px-5 py-5 flex flex-col justify-between overflow-hidden`}
          >
            {/* Subtle Radial Arena Spotlight */}
            <div
              aria-hidden="true"
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-[78%] h-56 rounded-full blur-[90px] pointer-events-none opacity-35"
              style={{
                background: leader
                  ? `radial-gradient(circle, ${leader.c} 0%, transparent 70%)`
                  : 'radial-gradient(circle, #fdb813 0%, transparent 70%)',
              }}
            />

            {/* Top Row: Price Mode Header + Gamified Heat Level */}
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-[Chakra_Petch] text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#9ec5ff] truncate">
                  {lot.bidCount > 0 ? 'CURRENT LIVE AUCTION PRICE' : 'OPENING BASE PRICE'}
                </div>
                <div className="font-[JetBrains_Mono] text-xs text-[#b4cbe9] mt-0.5 tabular-nums">
                  Base {formatCurrency(lot.p.base)} · Step +{formatLakhs(rateInfo.incrementLakhs)}
                </div>
              </div>

              <div className="text-right shrink-0" data-testid="live-price-heat">
                <div className={`flex items-center justify-end gap-1.5 font-[Chakra_Petch] text-xs sm:text-sm font-extrabold uppercase tracking-wider whitespace-nowrap ${heat.accentText}`}>
                  <Flame className="w-4 h-4 shrink-0" />
                  <span>{heat.label}</span>
                </div>
                <div className="flex items-center justify-end gap-1 mt-1" aria-label={`Momentum level ${heat.level} of 5`}>
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <span
                      key={bar}
                      className={`h-2 w-5 rounded-sm transition-colors ${
                        bar <= heat.level
                          ? heat.level >= 5
                            ? 'bg-[#ef4444]'
                            : heat.level >= 4
                              ? 'bg-[#f97316]'
                              : heat.level >= 3
                                ? 'bg-[#fdb813]'
                                : heat.level === 2
                                  ? 'bg-[#4edea3]'
                                  : 'bg-[#60a5fa]'
                          : 'bg-[#1c2848]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Center Giant Live Price Readout */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-2">
              <div className="flex items-baseline justify-center gap-3 flex-wrap">
                <span
                  className={`font-[Antonio] italic font-bold tabular-nums leading-none tracking-tight text-[#fdb813] pr-2 whitespace-nowrap transition-transform duration-200 ${
                    bidPulse ? 'scale-[1.05]' : 'scale-100'
                  }`}
                  style={{
                    fontSize: 'clamp(3.25rem, 6.2vw, 6.25rem)',
                    textShadow: bidPulse
                      ? '0 0 42px rgba(253, 184, 19, 0.72)'
                      : '0 0 26px rgba(253, 184, 19, 0.35)',
                  }}
                  data-testid="live-price-amount"
                >
                  ₹ {formatLakhs(lot.price)}
                </span>

                {bidPulse && lastDeltaLakhs > 0 && (
                  <span
                    className="font-[JetBrains_Mono] text-lg sm:text-xl font-black text-[#4edea3] bg-[#00a572]/20 border border-[#4edea3]/60 px-2.5 py-1 rounded-lg animate-bounce whitespace-nowrap"
                    data-testid="live-price-delta"
                  >
                    +₹{formatLakhs(lastDeltaLakhs)}
                  </span>
                )}
              </div>

              {/* Next Bid + Multiplier Strip */}
              <div className="mt-4 w-full max-w-xl flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 font-[JetBrains_Mono] text-[11px] sm:text-xs font-bold tabular-nums">
                  <span className="text-[#9ec5ff] whitespace-nowrap">
                    BASE: ₹{formatLakhs(lot.p.base)}
                  </span>
                  <span className="text-[#4edea3] whitespace-nowrap">
                    {surgeLakhs > 0 ? `+₹${formatLakhs(surgeLakhs)} SURGE` : 'AT BASE'} · {rateInfo.multiplier}x
                  </span>
                  <span className="text-[#ffdb9f] whitespace-nowrap">
                    NEXT: ₹{formatLakhs(lot.next)}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#172240] overflow-hidden border border-white/10">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${escalationMeterPct}%`,
                      background: heat.barGradient,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Sub-Metrics inside Hero Panel */}
            <div className="relative z-10 grid grid-cols-3 gap-3 pt-3 border-t border-[#263357] font-[JetBrains_Mono]">
              <div className="flex flex-col">
                <span className="text-[11px] text-[#9ec5ff] uppercase">BIDS PLACED</span>
                <span className="text-xl sm:text-2xl font-black text-white tabular-nums">
                  {lot.bidCount}
                </span>
              </div>
              <div className="flex flex-col text-center">
                <span className="text-[11px] text-[#9ec5ff] uppercase">BID PACE</span>
                <span className="text-xl sm:text-2xl font-black text-[#4edea3] tabular-nums">
                  {rateInfo.bidsPerMinute}/min
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[11px] text-[#9ec5ff] uppercase">NEXT STEP</span>
                <span className="text-xl sm:text-2xl font-black text-[#fdb813] tabular-nums">
                  +₹{formatLakhs(rateInfo.incrementLakhs)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. HIGHEST BIDDER SPOTLIGHT BAR */}
          <div
            className="bg-[#0f162b] border rounded-xl px-4 py-3 flex items-center justify-between gap-3 shrink-0 relative overflow-hidden"
            style={{ borderColor: leader ? `${leader.c}aa` : '#2a385e' }}
            data-testid="live-price-leader"
          >
            {leader ? (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <TeamLogoBadge team={leader} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-[Chakra_Petch] text-[11px] font-bold uppercase tracking-[0.16em] text-[#4edea3]">
                      <Trophy className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">HIGHEST BIDDER HOLDING THE FLOOR</span>
                    </div>
                    <div className="font-[Antonio] font-bold text-xl sm:text-2xl text-white uppercase tracking-wide truncate leading-tight">
                      {leader.name}
                    </div>
                    <div className="font-[JetBrains_Mono] text-[11px] text-[#b4cbe9] truncate">
                      {leader.slotLabel} · Paddle {leader.paddle} · Code {leader.short}
                      {leader.titleSubFranchise ? ` · ${leader.titleSubFranchise}` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-[JetBrains_Mono] text-[10px] text-[#9ec5ff] uppercase whitespace-nowrap">
                    WINNING AT HAMMER
                  </div>
                  <div className="font-[Antonio] font-bold text-2xl sm:text-3xl text-[#fdb813] tabular-nums whitespace-nowrap">
                    ₹ {formatLakhs(lot.price)}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#16213f] border border-[#324372] flex items-center justify-center shrink-0">
                    <Gavel className="w-5 h-5 text-[#fdb813]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-[Chakra_Petch] text-[11px] font-bold uppercase tracking-[0.16em] text-[#9ec5ff]">
                      OPENING FLOOR
                    </div>
                    <div className="font-[Antonio] font-bold text-lg sm:text-xl text-white uppercase tracking-wide truncate">
                      NO BIDS PLACED YET — READY FOR FIRST PADDLE
                    </div>
                  </div>
                </div>
                <div className="font-[JetBrains_Mono] text-xs sm:text-sm font-bold text-[#fdb813] shrink-0 tabular-nums whitespace-nowrap">
                  OPEN AT ₹{formatLakhs(lot.p.base)}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN (3 cols): REMAINING AMOUNT FOR EACH TEAM (ALWAYS VISIBLE) */}
        <aside className="order-2 lg:order-3 col-span-12 lg:col-span-3 bg-[#0f162b] border border-[#2a385e] rounded-2xl p-3 flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#253256] shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Wallet className="w-4 h-4 text-[#fdb813] shrink-0" />
              <h2 className="font-[Chakra_Petch] text-xs font-extrabold uppercase tracking-wider text-white truncate">
                TEAM REMAINING PURSE
              </h2>
            </div>
            <span className="font-[JetBrains_Mono] text-[11px] font-bold text-[#4edea3] tabular-nums whitespace-nowrap shrink-0">
              {formatCurrency(vm.totals.remaining)} Left
            </span>
          </div>

          <TeamRemainingPurseList rows={teamPurseRows} maxSquad={vm.cfg.max} />
        </aside>
      </main>
    );
  }

  // =========================================================================
  // IDLE / LAST HAMMER HOLD STATE (No lot currently on floor)
  // =========================================================================
  const lastTeam =
    lastOutcome?.t === 'SOLD' && lastOutcome.team
      ? teamMap.get(lastOutcome.team) ?? null
      : null;
  const lastPrice = lastOutcome ? lastOutcome.price ?? lastOutcome.p.base : 0;
  const nextPreview = upcomingStrip[0] ?? players[0] ?? null;

  return (
    <main
      className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden bg-[#090d1b] px-4 py-3 lg:px-6 lg:py-4 grid grid-cols-12 gap-4 items-stretch"
      data-testid="arena-live-price"
    >
      {/* LEFT HERO COLUMN (8 cols): Last Hammer / Standby Live Price Board */}
      <section className="col-span-12 lg:col-span-8 flex flex-col justify-center min-h-0">
        <div className="w-full h-full bg-[#0f162b] border border-[#2a385e] rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between gap-4 border-b border-[#253256] pb-4 flex-wrap">
            <div>
              <div className="font-[Chakra_Petch] text-xs font-bold uppercase tracking-[0.2em] text-[#4edea3]">
                LIVE PRICE BROADCAST
              </div>
              <h1 className="font-[Antonio] font-bold text-3xl sm:text-4xl text-white uppercase tracking-wide mt-1">
                {lastOutcome
                  ? lastOutcome.t === 'SOLD'
                    ? 'LAST HAMMER CONFIRMED'
                    : 'LAST LOT PASSED TO UNSOLD'
                  : 'AWAITING NEXT LOT ON STAGE'}
              </h1>
            </div>

            <div className="font-[JetBrains_Mono] text-xs text-[#9ec5ff] text-right tabular-nums">
              <div>
                {vm.counts.sold}/{vm.counts.playersTotal} PLAYERS SOLD · {vm.counts.titlesSold}/
                {vm.counts.titlesTotal} TITLES
              </div>
              <div className="text-[#fdb813] font-bold mt-0.5">
                READY FOR LIVE BIDS
              </div>
            </div>
          </div>

          {lastOutcome ? (
            <div className="grid grid-cols-12 gap-5 items-center my-auto">
              <div className="col-span-12 md:col-span-7 flex items-center gap-4 min-w-0">
                <div className="w-20 h-20 rounded-xl border-2 border-[#fdb813]/70 overflow-hidden shrink-0 bg-[#141e38]">
                  <PlayerPortrait
                    player={lastOutcome.p}
                    teamShort={lastTeam?.short}
                    size="lg"
                    className="w-20 h-20"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-[JetBrains_Mono] text-xs text-[#9ec5ff]">
                    {lastOutcome.p.id} · {lastOutcome.p.deckName}
                  </div>
                  <div
                    className="font-[Antonio] italic font-bold text-3xl sm:text-4xl text-white uppercase truncate mt-0.5"
                    data-testid="live-price-player-name"
                  >
                    {lastOutcome.p.name}
                  </div>
                  {lastOutcome.t === 'SOLD' && lastTeam ? (
                    <div className="flex items-center gap-2 mt-2">
                      <TeamLogoBadge team={lastTeam} size="sm" />
                      <span className="font-[Chakra_Petch] text-sm font-bold text-[#4edea3] uppercase">
                        SOLD TO {lastTeam.name} ({lastTeam.short})
                      </span>
                    </div>
                  ) : (
                    <div className="font-[Chakra_Petch] text-sm font-bold text-[#ffb4ab] uppercase mt-2">
                      RETURNED TO UNSOLD POOL
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-12 md:col-span-5 text-left md:text-right">
                <div className="font-[Chakra_Petch] text-xs font-bold uppercase tracking-[0.18em] text-[#9ec5ff]">
                  {lastOutcome.t === 'SOLD' ? 'FINAL HAMMER PRICE' : 'RESERVE BASE PRICE'}
                </div>
                <div
                  className={`font-[Antonio] italic font-bold text-5xl sm:text-6xl tabular-nums leading-none mt-1 whitespace-nowrap ${
                    lastOutcome.t === 'SOLD' ? 'text-[#fdb813]' : 'text-[#ffb4ab]'
                  }`}
                  data-testid="live-price-amount"
                >
                  ₹ {formatLakhs(lastPrice)}
                </div>
                <div className="font-[JetBrains_Mono] text-xs text-[#b4cbe9] mt-2 tabular-nums">
                  Base {formatCurrency(lastOutcome.p.base)} ·{' '}
                  {lastOutcome.t === 'SOLD'
                    ? `${(lastPrice / Math.max(1, lastOutcome.p.base)).toFixed(2)}x Base`
                    : 'No opening bid placed'}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 my-auto flex flex-col items-center text-center gap-2">
              <Flame className="w-10 h-10 text-[#fdb813]" />
              <div
                className="font-[Antonio] font-bold text-5xl sm:text-6xl text-[#fdb813] tabular-nums whitespace-nowrap"
                data-testid="live-price-amount"
              >
                {nextPreview ? `₹ ${formatLakhs(nextPreview.base)}` : '₹ —'}
              </div>
              <div className="font-[JetBrains_Mono] text-xs sm:text-sm text-[#b4cbe9]">
                {nextPreview
                  ? `Next up: ${nextPreview.name} (${nextPreview.id}) · Live price climbs automatically as bids are placed`
                  : 'Waiting for Main Operator to send a player or franchise title to the floor'}
              </div>
            </div>
          )}

          {upcomingStrip.length > 0 && (
            <div className="border-t border-[#253256] pt-4 flex items-center justify-between gap-3 flex-wrap font-[JetBrains_Mono] text-xs">
              <span className="text-[#9ec5ff] font-bold uppercase">ON DECK NEXT:</span>
              <div className="flex items-center gap-3 flex-wrap">
                {upcomingStrip.slice(0, 3).map((q, idx) => (
                  <span key={q.id} className="text-[#e6defe]">
                    <strong className="text-[#fdb813]">#{idx + 1}</strong> {q.name} (
                    {formatCurrency(q.base)})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RIGHT COLUMN (4 cols): REMAINING AMOUNT FOR EACH TEAM */}
      <aside className="col-span-12 lg:col-span-4 bg-[#0f162b] border border-[#2a385e] rounded-2xl p-3.5 flex flex-col gap-2 min-h-0">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#253256] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Wallet className="w-4 h-4 text-[#fdb813] shrink-0" />
            <h2 className="font-[Chakra_Petch] text-sm font-extrabold uppercase tracking-wider text-white truncate">
              TEAM REMAINING PURSE
            </h2>
          </div>
          <span className="font-[JetBrains_Mono] text-[11px] font-bold text-[#4edea3] tabular-nums whitespace-nowrap shrink-0">
            {formatCurrency(vm.totals.remaining)} Left
          </span>
        </div>

        <TeamRemainingPurseList rows={teamPurseRows} maxSquad={vm.cfg.max} />
      </aside>
    </main>
  );
}
