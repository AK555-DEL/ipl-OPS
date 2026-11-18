import { useState } from 'react';
import type { TeamView } from '../auction/types.ts';

export const DELHI_CAPITALS_LOGO_URL = '/logos/delhi_captails.png';

export function isDelhiCapitalsTeam(
  team?: Pick<TeamView, 'short' | 'titleId'> | null
): boolean {
  if (!team) return false;
  return team.short === 'DC' || team.titleId === 'IPL-T03';
}

interface TeamLogoBadgeProps {
  team: Pick<TeamView, 'short' | 'name' | 'titleId' | 'badgeBg' | 'badgeText'>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  logoVersion?: number;
}

const SIZE_CLASSES: Record<NonNullable<TeamLogoBadgeProps['size']>, string> = {
  xs: 'w-6 h-6 text-[9px] rounded',
  sm: 'w-9 h-7 text-[11px] rounded',
  md: 'w-10 h-10 text-xs rounded',
  lg: 'w-12 h-12 text-sm rounded-lg',
};

export function TeamLogoBadge({
  team,
  size = 'sm',
  className = '',
  logoVersion,
}: TeamLogoBadgeProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showDcLogo = isDelhiCapitalsTeam(team) && !imgFailed;
  const sizeCls = SIZE_CLASSES[size];
  const src = logoVersion
    ? `${DELHI_CAPITALS_LOGO_URL}?v=${logoVersion}`
    : DELHI_CAPITALS_LOGO_URL;

  if (showDcLogo) {
    return (
      <div
        className={`relative overflow-hidden border border-[#fdb813]/70 bg-[#004C97] flex items-center justify-center shrink-0 ${sizeCls} ${className}`}
        title={`${team.name} — Daily Captains Logo (delhi_captails.png)`}
        data-testid={`dc-team-logo-${team.short}`}
      >
        <img
          src={src}
          alt={`${team.name} logo`}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center font-[Space_Grotesk] font-black border border-white/15 shrink-0 ${sizeCls} ${className}`}
      style={{ backgroundColor: team.badgeBg, color: team.badgeText }}
    >
      {team.short}
    </div>
  );
}

interface PlayerTeamLogoPillProps {
  teamShort?: string | null;
  teamName?: string | null;
  size?: 'sm' | 'md';
}

export function PlayerTeamLogoPill({
  teamShort,
  teamName,
  size = 'sm',
}: PlayerTeamLogoPillProps) {
  const [imgFailed, setImgFailed] = useState(false);
  if (teamShort !== 'DC' || imgFailed) return null;

  const dim = size === 'md' ? 'w-7 h-7' : 'w-6 h-6';
  return (
    <img
      src={DELHI_CAPITALS_LOGO_URL}
      alt={`${teamName || 'Delhi Capitals'} player crest`}
      title="Delhi Capitals / Daily Captains (delhi_captails.png)"
      onError={() => setImgFailed(true)}
      data-testid="dc-player-logo"
      className={`${dim} rounded border border-[#fdb813]/70 object-cover bg-[#004C97] shrink-0`}
    />
  );
}
