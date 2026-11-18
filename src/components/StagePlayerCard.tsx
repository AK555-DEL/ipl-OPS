import { useEffect, useState } from 'react';
import type { Player } from '../auction/types.ts';
import { formatLakhs } from '../auction/engine.ts';
import { getPlayerImageSrc } from '../utils/playerMedia.ts';
import { formatStageCardFields } from '../utils/stageCard.ts';
import { CountryFlagSvg } from './CountryFlagSvg.tsx';
import silverBackdropImg from '../assets/images/silver_card_backdrop_1794933568579.jpg';
import silverPlayerIconImg from '../assets/images/silver_player_icon_1794933568207.jpg';

interface StagePlayerCardProps {
  player: Player;
  leaderShort?: string | null;
  holdMode?: 'live' | 'sold' | 'unsold' | 'preview';
  outcomeTeamShort?: string;
  outcomePrice?: number;
}

const METAL_SHELL_BG =
  'linear-gradient(135deg, #fff5cf 0%, #c99d3e 28%, #f8e59d 54%, #9e7521 82%, #f4da88 100%)';

const OBSIDIAN_WELL_BG =
  'linear-gradient(170deg, #102546 0%, #09172e 52%, #050d1d 100%)';

function clampRating(val: number): number {
  if (!Number.isFinite(val)) return 65;
  return Math.max(12, Math.min(100, val));
}

export function StagePlayerCard({
  player,
  leaderShort,
  holdMode = 'live',
  outcomeTeamShort,
  outcomePrice,
}: StagePlayerCardProps) {
  const fields = formatStageCardFields(player);
  const src = getPlayerImageSrc(player);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [silverIconFailed, setSilverIconFailed] = useState(false);

  useEffect(() => {
    setPhotoFailed(false);
  }, [player.id, src]);

  const isKeeper =
    !player.isTitle &&
    (Boolean(player.wk) || fields.secondaryHeader === 'KEEPING');
  const batPct = clampRating(player.bat);
  const secPct = clampRating(isKeeper ? player.keep : player.bowl);

  return (
    <div
      className="@container relative w-full h-full rounded-[18px] p-[2.5px] shadow-[0_22px_56px_rgba(0,0,0,0.72)] select-none"
      style={{ background: METAL_SHELL_BG }}
      data-testid="stage-player-card"
    >
      {/* Inner Brushed Liquid-Silver Card Body */}
      <div
        className="relative w-full h-full rounded-[15.5px] overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #eef2f7 0%, #cfd8e4 38%, #a6b4c6 72%, #e1e7f0 100%)',
        }}
      >
        {/* Studio Brushed Liquid-Silver Backdrop Asset */}
        {!backdropFailed && (
          <img
            src={silverBackdropImg}
            alt=""
            aria-hidden="true"
            onError={() => setBackdropFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none"
          />
        )}

        {/* Crisp Satin Sheen & Edge Contrast Vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 22% 35%, rgba(255,255,255,0.28) 0%, transparent 55%), linear-gradient(120deg, rgba(255,255,255,0.22) 0%, transparent 48%, rgba(8,18,38,0.12) 100%)',
            boxShadow: 'inset 0 0 26px rgba(8, 18, 38, 0.22)',
          }}
        />

        {/* Subtle Architectural Corner Index Marks (Zero Clutter) */}
        <div
          aria-hidden="true"
          className="absolute inset-[clamp(6px,1cqw,10px)] rounded-[11px] border border-white/45 pointer-events-none"
        />

        {/* MAIN PARTITIONED CARD GRID */}
        <div className="relative z-10 w-full h-full grid grid-cols-12 gap-[clamp(10px,1.6cqw,26px)] p-[clamp(14px,2.1cqw,34px)] items-stretch">
          {/* LEFT COLUMN (5 cols): Sculpted Chrome-Gold Halo + Kinetic Name Ribbon + Chamfered Role & Country */}
          <div className="col-span-5 flex flex-col justify-between gap-[clamp(8px,1.15cqw,18px)] min-h-0">
            {/* Circular Portrait Halo */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <div
                className="h-full max-h-full max-w-full aspect-square rounded-full p-[clamp(4px,0.6cqw,9px)] shadow-[0_14px_32px_rgba(7,17,34,0.48)]"
                style={{
                  background:
                    'conic-gradient(from 135deg, #8e6419 0deg, #fff1ba 55deg, #b8872b 120deg, #ffffff 175deg, #986c1c 235deg, #f8da7c 295deg, #fff4ca 335deg, #8e6419 360deg)',
                }}
              >
                <div
                  className="w-full h-full rounded-full bg-[#071122] p-[2px] shadow-[inset_0_0_16px_rgba(0,0,0,0.85)] overflow-hidden relative flex items-center justify-center"
                  data-testid="stage-card-portrait-ring"
                >
                  {player.isTitle && player.titleTheme ? (
                    src && !photoFailed ? (
                      <div
                        className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                        style={{
                          background: `radial-gradient(circle at 50% 34%, ${player.titleTheme.c}4d, #071122 82%)`,
                        }}
                      >
                        <img
                          src={src}
                          alt={`${player.name} franchise banner`}
                          onError={() => setPhotoFailed(true)}
                          className="w-full h-full rounded-full object-cover object-center"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex flex-col items-center justify-center p-3 text-center"
                        style={{
                          background: `radial-gradient(circle at 50% 34%, ${player.titleTheme.c}4d, #071122 80%)`,
                        }}
                      >
                        <div
                          className="px-[clamp(14px,2cqw,32px)] py-[clamp(6px,1cqw,16px)] rounded-xl font-[Antonio] font-bold tracking-wider shadow-lg border border-white/25"
                          style={{
                            backgroundColor: player.titleTheme.badgeBg,
                            color: player.titleTheme.badgeText,
                            fontSize: 'clamp(22px, 4.8cqw, 72px)',
                          }}
                        >
                          {player.titleTheme.short}
                        </div>
                        <span
                          className="mt-2 font-[Chakra_Petch] text-[#f5d588] uppercase font-bold tracking-[0.18em]"
                          style={{ fontSize: 'clamp(10px, 1.3cqw, 20px)' }}
                        >
                          FRANCHISE TITLE
                        </span>
                      </div>
                    )
                  ) : src && !photoFailed ? (
                    <div
                      className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                      style={{
                        background:
                          'radial-gradient(circle at 50% 34%, rgba(255,255,255,0.16), #081326 82%)',
                      }}
                    >
                      <img
                        src={src}
                        alt={player.name}
                        referrerPolicy="no-referrer"
                        onError={() => setPhotoFailed(true)}
                        className="w-full h-full rounded-full object-cover object-top"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-[#081226] flex items-center justify-center">
                      {!silverIconFailed ? (
                        <img
                          src={silverPlayerIconImg}
                          alt={`${player.name} silver crest`}
                          onError={() => setSilverIconFailed(true)}
                          className="w-full h-full object-cover object-center scale-[1.06]"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#172f54] via-[#0a182e] to-[#050c19]">
                          <span
                            className="font-[Antonio] font-bold text-[#e2e8f0] tracking-wider"
                            style={{ fontSize: 'clamp(28px, 5cqw, 76px)' }}
                          >
                            {fields.initialsBadge}
                          </span>
                        </div>
                      )}
                      {/* Lower subtle gradient + crisp athlete monogram stamp */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-[#040a16]/95 via-[#071122]/60 to-transparent pointer-events-none"
                      />
                      <span
                        className="absolute bottom-[7%] font-[Chakra_Petch] font-bold text-[#f7dca0] tracking-[0.16em] uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
                        style={{ fontSize: 'clamp(12px, 1.9cqw, 28px)' }}
                      >
                        {fields.initialsBadge}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chamfered Kinetic Name Plaque */}
            <div className="shrink-0 flex flex-col gap-1.5">
              <div
                className="w-full p-[2px] shadow-[0_8px_18px_rgba(7,17,34,0.35)]"
                style={{
                  clipPath: 'polygon(4.5% 0%, 95.5% 0%, 100% 50%, 95.5% 100%, 4.5% 100%, 0% 50%)',
                  background:
                    'linear-gradient(180deg, #9f7520 0%, #fff1b8 45%, #7e5912 100%)',
                }}
              >
                <div
                  className="w-full py-[clamp(6px,0.95cqw,16px)] px-[6.5%] flex items-center justify-center"
                  style={{
                    clipPath:
                      'polygon(4.3% 0%, 95.7% 0%, 100% 50%, 95.7% 100%, 4.3% 100%, 0% 50%)',
                    background:
                      'linear-gradient(90deg, #d7b157 0%, #f9e6a8 26%, #fff3ca 50%, #f5da87 74%, #cea346 100%)',
                  }}
                >
                  <span
                    className="font-[Antonio] italic font-bold text-[#081326] uppercase tracking-[0.04em] truncate leading-none"
                    style={{ fontSize: 'clamp(18px, 3.25cqw, 56px)' }}
                    data-testid="stage-card-name"
                    title={fields.displayName}
                  >
                    {fields.displayName}
                  </span>
                </div>
              </div>
              {fields.subFranchiseLabel && (
                <div
                  className="mx-auto px-[clamp(10px,1.2cqw,18px)] py-[clamp(2px,0.3cqw,5px)] rounded bg-[#08152b] border border-[#d4af57]/80 font-[Chakra_Petch] text-[#f5d588] font-bold uppercase tracking-wider truncate max-w-full"
                  style={{ fontSize: 'clamp(10px, 1.25cqw, 20px)' }}
                  data-testid="stage-card-subfranchise"
                >
                  {fields.subFranchiseLabel}
                </div>
              )}
            </div>

            {/* Bottom-Left Sub-Row: Angled Chamfered ROLE & COUNTRY Shields */}
            <div className="grid grid-cols-2 gap-[clamp(8px,1.1cqw,18px)] shrink-0">
              {/* ROLE Shield */}
              <div
                className="p-[2px] shadow-[0_8px_18px_rgba(7,17,34,0.38)]"
                style={{
                  clipPath: 'polygon(0 0, 91% 0, 100% 18%, 100% 100%, 9% 100%, 0 82%)',
                  background: METAL_SHELL_BG,
                }}
              >
                <div
                  className="w-full h-full flex flex-col justify-between px-[clamp(8px,1.1cqw,18px)] py-[clamp(6px,0.9cqw,15px)] text-center"
                  style={{
                    clipPath: 'polygon(0 0, 91% 0, 100% 18%, 100% 100%, 9% 100%, 0 82%)',
                    background: OBSIDIAN_WELL_BG,
                  }}
                >
                  <div>
                    <div
                      className="font-[Chakra_Petch] font-bold text-white/95 tracking-[0.16em] uppercase leading-none"
                      style={{ fontSize: 'clamp(12px, 1.55cqw, 26px)' }}
                    >
                      ROLE
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-[1.5px] w-[82%] mx-auto mt-[clamp(3px,0.4cqw,6px)]"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(244,218,136,0.75) 50%, transparent 100%)',
                      }}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center py-0.5 min-h-[clamp(40px,5.8cqw,92px)]">
                    <span
                      className="font-[Chakra_Petch] font-bold text-[#f7db8e] uppercase leading-tight truncate max-w-full"
                      style={{ fontSize: 'clamp(15px, 2.2cqw, 36px)' }}
                      data-testid="stage-card-role"
                    >
                      {fields.roleLabel}
                    </span>
                    <span
                      className="font-[JetBrains_Mono] text-[#b4cbe9] font-medium truncate max-w-full mt-[clamp(2px,0.35cqw,6px)] leading-none"
                      style={{ fontSize: 'clamp(10px, 1.25cqw, 20px)' }}
                    >
                      {fields.deckLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* COUNTRY Shield */}
              <div
                className="p-[2px] shadow-[0_8px_18px_rgba(7,17,34,0.38)]"
                style={{
                  clipPath: 'polygon(9% 0, 100% 0, 100% 82%, 91% 100%, 0 100%, 0 18%)',
                  background: METAL_SHELL_BG,
                }}
              >
                <div
                  className="w-full h-full flex flex-col justify-between px-[clamp(8px,1.1cqw,18px)] py-[clamp(6px,0.9cqw,15px)] text-center"
                  style={{
                    clipPath: 'polygon(9% 0, 100% 0, 100% 82%, 91% 100%, 0 100%, 0 18%)',
                    background: OBSIDIAN_WELL_BG,
                  }}
                >
                  <div>
                    <div
                      className="font-[Chakra_Petch] font-bold text-white/95 tracking-[0.16em] uppercase leading-none"
                      style={{ fontSize: 'clamp(12px, 1.55cqw, 26px)' }}
                    >
                      COUNTRY
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-[1.5px] w-[82%] mx-auto mt-[clamp(3px,0.4cqw,6px)]"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(244,218,136,0.75) 50%, transparent 100%)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-center py-0.5 min-h-[clamp(40px,5.8cqw,92px)]">
                    <div
                      className="w-[74%] max-w-[144px] aspect-[3/2] rounded-[5px] overflow-hidden shadow-md border border-white/30 flex items-center justify-center"
                      data-testid="stage-card-flag"
                      title={`${fields.countryName} (${fields.countryCode})`}
                    >
                      <CountryFlagSvg
                        countryCode={fields.countryCode}
                        countryName={fields.countryName}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (7 cols): Hex Crown Jersey + Visor Popularity | Telemetry Stat Shields | Hold Status + Slanted Base Price */}
          <div className="col-span-7 flex flex-col justify-between gap-[clamp(10px,1.4cqw,22px)] min-h-0">
            {/* TOP ROW: Two-Part Hex Jersey Shield + Chamfered Visor Popularity */}
            <div className="grid grid-cols-12 gap-[clamp(10px,1.3cqw,22px)] items-stretch shrink-0">
              {/* JERSEY NUMBER: Reference-faithful Two-Tier Hex Crown + Value Shield */}
              <div className="col-span-5 flex flex-col items-center justify-center">
                {/* Hexagonal Crown */}
                <div
                  className="w-full p-[2px] shadow-md z-10"
                  style={{
                    clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
                    background: METAL_SHELL_BG,
                  }}
                >
                  <div
                    className="w-full py-[clamp(5px,0.7cqw,12px)] px-[clamp(10px,1.4cqw,22px)] text-center"
                    style={{
                      clipPath:
                        'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
                      background: 'linear-gradient(180deg, #163460 0%, #091933 100%)',
                    }}
                  >
                    <span
                      className="block font-[Chakra_Petch] font-bold text-white uppercase tracking-[0.12em] leading-[1.05]"
                      style={{ fontSize: 'clamp(10px, 1.35cqw, 22px)' }}
                    >
                      JERSEY
                      <br />
                      NUMBER
                    </span>
                  </div>
                </div>

                {/* Nested Value Plate */}
                <div
                  className="w-[88%] -mt-[2px] p-[2px] shadow-[0_8px_16px_rgba(7,17,34,0.38)]"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 93% 100%, 7% 100%)',
                    background: METAL_SHELL_BG,
                  }}
                >
                  <div
                    className="w-full py-[clamp(6px,0.95cqw,16px)] px-3 flex items-center justify-center"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 93% 100%, 7% 100%)',
                      background: OBSIDIAN_WELL_BG,
                    }}
                  >
                    <span
                      className="font-[Antonio] font-bold text-[#f8dd91] tabular-nums tracking-wide leading-none"
                      style={{ fontSize: 'clamp(22px, 3.9cqw, 64px)' }}
                      data-testid="stage-card-jersey"
                    >
                      {fields.jerseyLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* POPULARITY: Chamfered Stadium Visor */}
              <div
                className="col-span-7 p-[2px] shadow-[0_8px_18px_rgba(7,17,34,0.38)] flex"
                style={{
                  clipPath:
                    'polygon(4% 0%, 96% 0%, 100% 18%, 100% 82%, 96% 100%, 4% 100%, 0% 82%, 0% 18%)',
                  background: METAL_SHELL_BG,
                }}
              >
                <div
                  className="w-full h-full flex flex-col justify-between px-[clamp(12px,1.5cqw,24px)] py-[clamp(6px,0.95cqw,16px)]"
                  style={{
                    clipPath:
                      'polygon(4% 0%, 96% 0%, 100% 18%, 100% 82%, 96% 100%, 4% 100%, 0% 82%, 0% 18%)',
                    background: OBSIDIAN_WELL_BG,
                  }}
                >
                  <div>
                    <div
                      className="text-center font-[Chakra_Petch] font-bold text-white tracking-[0.18em] uppercase leading-none"
                      style={{ fontSize: 'clamp(11px, 1.5cqw, 25px)' }}
                    >
                      POPULARITY
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-[1.5px] w-[86%] mx-auto mt-[clamp(4px,0.5cqw,8px)]"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(244,218,136,0.8) 50%, transparent 100%)',
                      }}
                    />
                  </div>
                  <div
                    className="flex-1 flex items-center justify-center gap-[clamp(6px,1.1cqw,18px)] py-1"
                    data-testid="stage-card-stars"
                    aria-label={`Popularity ${fields.stars} of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((idx) => {
                      const filled = idx <= fields.stars;
                      return (
                        <svg
                          key={idx}
                          className="w-[15%] max-w-[54px] aspect-square"
                          style={
                            filled
                              ? { filter: 'drop-shadow(0 0 8px rgba(245, 206, 98, 0.6))' }
                              : undefined
                          }
                          viewBox="0 0 24 24"
                          fill={filled ? '#f6cf6c' : 'none'}
                          stroke="#e7bf63"
                          strokeWidth="1.9"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* MIDDLE ROW: BATTING & BOWLING/KEEPING Tech-Bevel Telemetry Shields */}
            <div className="grid grid-cols-2 gap-[clamp(10px,1.3cqw,22px)] flex-1 min-h-0">
              {/* BATTING Shield */}
              <div
                className="p-[2px] shadow-[0_10px_22px_rgba(7,17,34,0.42)] h-full"
                style={{
                  clipPath: 'polygon(0 0, 91% 0, 100% 15%, 100% 100%, 9% 100%, 0 85%)',
                  background: METAL_SHELL_BG,
                }}
              >
                <div
                  className="w-full h-full flex flex-col justify-between px-[clamp(12px,1.6cqw,26px)] py-[clamp(10px,1.4cqw,22px)]"
                  style={{
                    clipPath: 'polygon(0 0, 91% 0, 100% 15%, 100% 100%, 9% 100%, 0 85%)',
                    background: OBSIDIAN_WELL_BG,
                  }}
                >
                  <div>
                    <div
                      className="text-center font-[Chakra_Petch] font-bold text-white tracking-[0.18em] uppercase leading-none"
                      style={{ fontSize: 'clamp(13px, 1.95cqw, 32px)' }}
                    >
                      BATTING
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-[1.5px] w-[88%] mx-auto mt-[clamp(4px,0.55cqw,9px)]"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(244,218,136,0.78) 50%, transparent 100%)',
                      }}
                    />
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center py-[clamp(6px,1cqw,16px)] text-center">
                    <span
                      className="font-[Antonio] italic font-bold text-[#f8dd91] tabular-nums leading-none tracking-wide"
                      style={{ fontSize: 'clamp(30px, 5.2cqw, 86px)' }}
                      data-testid="stage-card-batting"
                    >
                      {fields.battingValue}
                    </span>

                    {/* Gen Z Telemetry Rating Bar */}
                    <div className="w-[84%] h-[clamp(6px,0.7cqw,12px)] rounded-full bg-[#172f54] overflow-hidden mt-[clamp(8px,1.2cqw,20px)] border border-white/15">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${batPct}%`,
                          background:
                            'linear-gradient(90deg, #4edea3 0%, #f5cf6e 100%)',
                        }}
                      />
                    </div>

                    <span
                      className="font-[JetBrains_Mono] text-[#cbe0fb] font-semibold truncate max-w-full mt-[clamp(7px,1cqw,16px)] leading-none"
                      style={{ fontSize: 'clamp(11px, 1.5cqw, 24px)' }}
                    >
                      {fields.battingSub}
                    </span>
                  </div>
                </div>
              </div>

              {/* BOWLING / KEEPING Shield */}
              <div
                className="p-[2px] shadow-[0_10px_22px_rgba(7,17,34,0.42)] h-full"
                style={{
                  clipPath: 'polygon(9% 0, 100% 0, 100% 85%, 91% 100%, 0 100%, 0 15%)',
                  background: METAL_SHELL_BG,
                }}
              >
                <div
                  className="w-full h-full flex flex-col justify-between px-[clamp(12px,1.6cqw,26px)] py-[clamp(10px,1.4cqw,22px)]"
                  style={{
                    clipPath: 'polygon(9% 0, 100% 0, 100% 85%, 91% 100%, 0 100%, 0 15%)',
                    background: OBSIDIAN_WELL_BG,
                  }}
                >
                  <div>
                    <div
                      className="text-center font-[Chakra_Petch] font-bold text-white tracking-[0.18em] uppercase leading-none"
                      style={{ fontSize: 'clamp(13px, 1.95cqw, 32px)' }}
                    >
                      {fields.secondaryHeader}
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-[1.5px] w-[88%] mx-auto mt-[clamp(4px,0.55cqw,9px)]"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(244,218,136,0.78) 50%, transparent 100%)',
                      }}
                    />
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center py-[clamp(6px,1cqw,16px)] text-center">
                    <span
                      className="font-[Antonio] italic font-bold text-[#f8dd91] tabular-nums leading-none tracking-wide"
                      style={{ fontSize: 'clamp(30px, 5.2cqw, 86px)' }}
                      data-testid="stage-card-bowling"
                    >
                      {fields.secondaryValue}
                    </span>

                    {/* Gen Z Telemetry Rating Bar */}
                    <div className="w-[84%] h-[clamp(6px,0.7cqw,12px)] rounded-full bg-[#172f54] overflow-hidden mt-[clamp(8px,1.2cqw,20px)] border border-white/15">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${secPct}%`,
                          background:
                            'linear-gradient(90deg, #60a5fa 0%, #f5cf6e 100%)',
                        }}
                      />
                    </div>

                    <span
                      className="font-[JetBrains_Mono] text-[#cbe0fb] font-semibold truncate max-w-full mt-[clamp(7px,1cqw,16px)] leading-none"
                      style={{ fontSize: 'clamp(11px, 1.5cqw, 24px)' }}
                    >
                      {fields.secondarySub}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: Angled Lot/Hold Status Shield + Iconic Slanted BASE PRICE Plaque */}
            <div className="grid grid-cols-12 gap-[clamp(10px,1.3cqw,22px)] items-stretch shrink-0">
              {/* Left Bottom Status Emblem */}
              <div className="col-span-6 flex items-stretch min-h-[clamp(56px,8.2cqw,132px)]">
                {holdMode === 'live' && leaderShort ? (
                  <div
                    className="w-full p-[2px] shadow-md flex"
                    style={{
                      clipPath: 'polygon(0 0, 94% 0, 100% 24%, 100% 100%, 6% 100%, 0 76%)',
                      background: 'linear-gradient(135deg, #4edea3 0%, #f5d588 100%)',
                    }}
                  >
                    <div
                      className="w-full px-[7%] py-[clamp(8px,1.2cqw,18px)] flex items-center justify-between gap-2"
                      style={{
                        clipPath: 'polygon(0 0, 94% 0, 100% 24%, 100% 100%, 6% 100%, 0 76%)',
                        background: OBSIDIAN_WELL_BG,
                      }}
                    >
                      <span
                        className="font-[Chakra_Petch] font-bold text-[#4edea3] tracking-[0.14em] uppercase leading-tight"
                        style={{ fontSize: 'clamp(11px, 1.4cqw, 22px)' }}
                      >
                        HIGHEST PADDLE
                      </span>
                      <span
                        className="font-[Antonio] font-bold text-[#f8dd91] tracking-wider uppercase leading-none"
                        style={{ fontSize: 'clamp(22px, 3.2cqw, 52px)' }}
                      >
                        {leaderShort}
                      </span>
                    </div>
                  </div>
                ) : holdMode === 'sold' ? (
                  <div
                    className="w-full p-[2px] shadow-md flex"
                    style={{
                      clipPath: 'polygon(0 0, 94% 0, 100% 24%, 100% 100%, 6% 100%, 0 76%)',
                      background: 'linear-gradient(135deg, #4edea3 0%, #059669 100%)',
                    }}
                    data-testid="stage-card-hold-status"
                  >
                    <div
                      className="w-full px-[7%] py-[clamp(8px,1.1cqw,18px)] flex flex-col justify-center"
                      style={{
                        clipPath: 'polygon(0 0, 94% 0, 100% 24%, 100% 100%, 6% 100%, 0 76%)',
                        background: OBSIDIAN_WELL_BG,
                      }}
                    >
                      <span
                        className="block font-[Chakra_Petch] font-bold text-[#4edea3] uppercase tracking-[0.14em] leading-tight"
                        style={{ fontSize: 'clamp(10px, 1.2cqw, 19px)' }}
                      >
                        LAST PLAYER HOLD · SOLD
                      </span>
                      <span
                        className="block font-[Antonio] font-bold text-white leading-tight tracking-wide mt-0.5 truncate"
                        style={{ fontSize: 'clamp(14px, 2.15cqw, 35px)' }}
                      >
                        {outcomeTeamShort || 'TEAM'} ·{' '}
                        {outcomePrice ? `₹${formatLakhs(outcomePrice)}` : fields.basePriceLabel}
                      </span>
                    </div>
                  </div>
                ) : holdMode === 'unsold' ? (
                  <div
                    className="w-full p-[2px] shadow-md flex"
                    style={{
                      clipPath: 'polygon(0 0, 94% 0, 100% 24%, 100% 100%, 6% 100%, 0 76%)',
                      background: 'linear-gradient(135deg, #ffb4ab 0%, #dc2626 100%)',
                    }}
                    data-testid="stage-card-hold-status"
                  >
                    <div
                      className="w-full px-[7%] py-[clamp(8px,1.1cqw,18px)] flex flex-col justify-center"
                      style={{
                        clipPath: 'polygon(0 0, 94% 0, 100% 24%, 100% 100%, 6% 100%, 0 76%)',
                        background: OBSIDIAN_WELL_BG,
                      }}
                    >
                      <span
                        className="block font-[Chakra_Petch] font-bold text-[#ffb4ab] uppercase tracking-[0.14em] leading-tight"
                        style={{ fontSize: 'clamp(10px, 1.2cqw, 19px)' }}
                      >
                        LAST PLAYER HOLD · UNSOLD
                      </span>
                      <span
                        className="block font-[Chakra_Petch] font-bold text-white leading-tight mt-0.5 truncate"
                        style={{ fontSize: 'clamp(13px, 1.65cqw, 26px)' }}
                      >
                        Returned to Unsold Pool
                      </span>
                    </div>
                  </div>
                ) : holdMode === 'preview' ? (
                  <div
                    className="w-full p-[2px] shadow-md flex"
                    style={{
                      clipPath: 'polygon(0 0, 94% 0, 100% 24%, 100% 100%, 6% 100%, 0 76%)',
                      background: METAL_SHELL_BG,
                    }}
                    data-testid="stage-card-hold-status"
                  >
                    <div
                      className="w-full px-[7%] py-[clamp(8px,1.1cqw,18px)] flex flex-col justify-center"
                      style={{
                        clipPath: 'polygon(0 0, 94% 0, 100% 24%, 100% 100%, 6% 100%, 0 76%)',
                        background: OBSIDIAN_WELL_BG,
                      }}
                    >
                      <span
                        className="block font-[Chakra_Petch] font-bold text-[#f8dd91] uppercase tracking-[0.14em] leading-tight"
                        style={{ fontSize: 'clamp(10px, 1.2cqw, 19px)' }}
                      >
                        ON DECK PREVIEW
                      </span>
                      <span
                        className="block font-[JetBrains_Mono] text-[#cbe0fb] font-semibold leading-tight mt-0.5 truncate"
                        style={{ fontSize: 'clamp(12px, 1.65cqw, 26px)' }}
                      >
                        {player.id} · Awaiting Call
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full p-[2px] shadow-md flex"
                    style={{
                      clipPath: 'polygon(0 0, 94% 0, 100% 24%, 100% 100%, 6% 100%, 0 76%)',
                      background: METAL_SHELL_BG,
                    }}
                  >
                    <div
                      className="w-full px-[7%] py-[clamp(8px,1.1cqw,18px)] flex flex-col justify-center"
                      style={{
                        clipPath: 'polygon(0 0, 94% 0, 100% 24%, 100% 100%, 6% 100%, 0 76%)',
                        background: OBSIDIAN_WELL_BG,
                      }}
                    >
                      <span
                        className="block font-[JetBrains_Mono] text-[#9eb6d8] font-bold uppercase tracking-[0.14em] leading-tight"
                        style={{ fontSize: 'clamp(10px, 1.15cqw, 18px)' }}
                      >
                        LOT {player.id}
                      </span>
                      <span
                        className="block font-[Chakra_Petch] font-bold text-[#f8dd91] uppercase tracking-[0.1em] leading-tight mt-0.5 truncate"
                        style={{ fontSize: 'clamp(13px, 1.7cqw, 27px)' }}
                      >
                        AWAITING OPENING BID
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Bottom: Iconic Slanted Trapezoid BASE PRICE Plaque (Exact Reference Silhouette) */}
              <div className="col-span-6 flex justify-end">
                <div
                  className="w-full p-[2px] shadow-[0_12px_24px_rgba(7,17,34,0.48)] flex"
                  style={{
                    clipPath: 'polygon(14% 0%, 96% 0%, 100% 14%, 100% 84%, 93% 100%, 0% 100%, 9% 18%)',
                    background: METAL_SHELL_BG,
                  }}
                >
                  <div
                    className="w-full pl-[12%] pr-[6%] py-[clamp(7px,1.1cqw,18px)] flex flex-col items-center justify-center text-center"
                    style={{
                      clipPath:
                        'polygon(14% 0%, 96% 0%, 100% 14%, 100% 84%, 93% 100%, 0% 100%, 9% 18%)',
                      background: OBSIDIAN_WELL_BG,
                    }}
                  >
                    <span
                      className="font-[Chakra_Petch] font-bold text-white/95 uppercase tracking-[0.18em] leading-none"
                      style={{ fontSize: 'clamp(11px, 1.45cqw, 24px)' }}
                    >
                      BASE PRICE
                    </span>
                    <div
                      aria-hidden="true"
                      className="h-[1.5px] w-[72%] my-[clamp(3px,0.45cqw,7px)]"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(244,218,136,0.75) 50%, transparent 100%)',
                      }}
                    />
                    <span
                      className="font-[Antonio] italic font-bold text-[#f8dd91] tabular-nums leading-none tracking-wide"
                      style={{ fontSize: 'clamp(26px, 4.7cqw, 76px)' }}
                      data-testid="stage-card-base-price"
                    >
                      {fields.basePriceLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
