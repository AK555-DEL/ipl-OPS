import { useState, useEffect } from 'react';
import type { BriefPlayer, Player } from '../auction/types.ts';
import { getDeckAccent, getInitials, getPlayerImageSrc } from '../utils/playerMedia.ts';
import { DELHI_CAPITALS_LOGO_URL } from './TeamLogoBadge.tsx';

interface PlayerPortraitProps {
  player: Pick<
    Player | BriefPlayer,
    'id' | 'name' | 'jersey' | 'deck' | 'deckName' | 'role' | 'cc' | 'os' | 'photo' | 'hasPhoto' | 'isTitle' | 'titleTheme'
  >;
  teamShort?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  grayscale?: boolean;
}

export function PlayerPortrait({
  player,
  teamShort,
  className = '',
  size = 'md',
  grayscale = false,
}: PlayerPortraitProps) {
  const src = getPlayerImageSrc(player);
  const [failed, setFailed] = useState(false);
  const [dcLogoFailed, setDcLogoFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setDcLogoFailed(false);
  }, [player.id, src]);

  const accent = getDeckAccent(player.deck);
  const initials = getInitials(player.name);
  const isDcTitle =
    player.isTitle &&
    (player.id === 'IPL-T03' || player.titleTheme?.short === 'DC');
  const showDcCornerCrest = !player.isTitle && teamShort === 'DC' && !dcLogoFailed;

  const initialsTextClass =
    size === 'xl'
      ? 'text-6xl'
      : size === 'lg'
        ? 'text-5xl'
        : size === 'sm'
          ? 'text-xl'
          : 'text-3xl';

  if (player.isTitle && player.titleTheme) {
    const isSmall = size === 'sm';
    if (src && !failed) {
      return (
        <div
          className={`relative overflow-hidden flex items-center justify-center select-none border-2 bg-[#0e0b21] ${className}`}
          style={{ borderColor: `${player.titleTheme.c}88` }}
          aria-label={`${player.name} franchise banner`}
        >
          <img
            src={src}
            alt={player.name}
            onError={() => setFailed(true)}
            className="w-full h-full object-cover object-center"
          />
        </div>
      );
    }
    return (
      <div
        className={`relative overflow-hidden flex flex-col items-center justify-center select-none border-2 ${className}`}
        style={{
          background: `radial-gradient(circle at 50% 30%, ${player.titleTheme.c}33, #0e0b21 80%)`,
          borderColor: `${player.titleTheme.c}88`,
        }}
        aria-label={`${player.name} franchise title crest`}
      >
        {isDcTitle && !dcLogoFailed ? (
          <img
            src={DELHI_CAPITALS_LOGO_URL}
            alt="Delhi Capitals Daily Captains logo"
            onError={() => setDcLogoFailed(true)}
            data-testid="dc-title-portrait-logo"
            className={`${
              isSmall ? 'w-9 h-9 rounded' : size === 'xl' ? 'w-28 h-28 rounded-xl' : 'w-20 h-20 rounded-xl'
            } object-cover border-2 border-[#fdb813]/80 shadow-lg bg-[#004C97]`}
          />
        ) : (
          <div
            className={`${isSmall ? 'px-1.5 py-0.5 rounded' : 'px-4 py-2 rounded-lg'} font-[Space_Grotesk] font-black tracking-wider shadow-lg border border-white/20`}
            style={{
              backgroundColor: player.titleTheme.badgeBg,
              color: player.titleTheme.badgeText,
              fontSize: size === 'xl' ? '2.75rem' : size === 'lg' ? '2rem' : isSmall ? '0.72rem' : '1.5rem',
            }}
          >
            {player.titleTheme.short}
          </div>
        )}
        {!isSmall && (
          <span className="mt-2 font-[JetBrains_Mono] text-[10px] tracking-widest text-[#ffdb9f] uppercase font-bold">
            FRANCHISE TITLE
          </span>
        )}
      </div>
    );
  }

  if (src && !failed) {
    return (
      <div className={`relative overflow-hidden bg-[#1c192f] ${className}`}>
        <img
          src={src}
          alt={player.name}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover object-top ${
            grayscale ? 'mix-blend-luminosity opacity-85 contrast-125' : 'contrast-115 brightness-95'
          }`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e0b21] via-transparent to-transparent" />
        {showDcCornerCrest && (
          <img
            src={DELHI_CAPITALS_LOGO_URL}
            alt="Delhi Capitals player crest"
            onError={() => setDcLogoFailed(true)}
            className="absolute top-1.5 right-1.5 w-7 h-7 rounded border border-[#fdb813] object-cover bg-[#004C97] shadow"
          />
        )}
      </div>
    );
  }

  const isSmallMonogram = size === 'sm';
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${accent.bg} border ${accent.ring} flex flex-col items-center justify-center select-none ${className}`}
      aria-label={`${player.name} monogram`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 28%, rgba(253,184,19,0.22), transparent 65%)',
        }}
      />
      {showDcCornerCrest && (
        <img
          src={DELHI_CAPITALS_LOGO_URL}
          alt="Delhi Capitals player crest"
          onError={() => setDcLogoFailed(true)}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded border border-[#fdb813] object-cover bg-[#004C97] shadow z-20"
        />
      )}
      <span
        className={`relative z-10 font-[Space_Grotesk] font-bold tracking-tight leading-none ${initialsTextClass} ${accent.text}`}
      >
        {initials}
      </span>
      <span className={`relative z-10 font-[JetBrains_Mono] text-[#d5c4ac]/80 truncate max-w-full px-1 ${
        isSmallMonogram ? 'mt-0.5 text-[8px] tracking-normal' : 'mt-1 text-[10px] tracking-widest'
      }`}>
        {isSmallMonogram
          ? `#${String(player.jersey).padStart(2, '0')}`
          : `#${String(player.jersey).padStart(2, '0')} · ${player.cc}`}
      </span>
    </div>
  );
}
