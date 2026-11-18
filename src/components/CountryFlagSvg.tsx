interface CountryFlagSvgProps {
  countryCode: string;
  countryName?: string;
  className?: string;
}

export function CountryFlagSvg({
  countryCode,
  countryName,
  className = 'w-full h-full',
}: CountryFlagSvgProps) {
  const code = countryCode.toUpperCase();

  switch (code) {
    case 'IND':
      return (
        <svg viewBox="0 0 90 60" className={className} role="img" aria-label={countryName || 'India flag'}>
          <rect width="90" height="20" fill="#FF9933" />
          <rect y="20" width="90" height="20" fill="#FFFFFF" />
          <rect y="40" width="90" height="20" fill="#138808" />
          <circle cx="45" cy="30" r="7.5" fill="none" stroke="#000080" strokeWidth="1.5" />
          <circle cx="45" cy="30" r="1.5" fill="#000080" />
          <g stroke="#000080" strokeWidth="0.8">
            <line x1="45" y1="22.5" x2="45" y2="37.5" />
            <line x1="37.5" y1="30" x2="52.5" y2="30" />
            <line x1="39.7" y1="24.7" x2="50.3" y2="35.3" />
            <line x1="50.3" y1="24.7" x2="39.7" y2="35.3" />
          </g>
        </svg>
      );

    case 'AUS':
      return (
        <svg viewBox="0 0 90 60" className={className} role="img" aria-label={countryName || 'Australia flag'}>
          <rect width="90" height="60" fill="#00008B" />
          <path d="M0,0 L45,30 M45,0 L0,30" stroke="#FFFFFF" strokeWidth="5" />
          <path d="M0,0 L45,30 M45,0 L0,30" stroke="#FF0000" strokeWidth="2.5" />
          <path d="M22.5,0 V30 M0,15 H45" stroke="#FFFFFF" strokeWidth="8" />
          <path d="M22.5,0 V30 M0,15 H45" stroke="#FF0000" strokeWidth="4.5" />
          <circle cx="22.5" cy="45" r="5" fill="#FFFFFF" />
          <circle cx="68" cy="14" r="3" fill="#FFFFFF" />
          <circle cx="58" cy="28" r="3" fill="#FFFFFF" />
          <circle cx="77" cy="25" r="3" fill="#FFFFFF" />
          <circle cx="68" cy="47" r="3.5" fill="#FFFFFF" />
        </svg>
      );

    case 'ENG':
      return (
        <svg viewBox="0 0 90 60" className={className} role="img" aria-label={countryName || 'England flag'}>
          <rect width="90" height="60" fill="#FFFFFF" />
          <rect x="39" width="12" height="60" fill="#CE1124" />
          <rect y="24" width="90" height="12" fill="#CE1124" />
        </svg>
      );

    case 'RSA':
      return (
        <svg viewBox="0 0 90 60" className={className} role="img" aria-label={countryName || 'South Africa flag'}>
          <rect width="90" height="30" fill="#E03C31" />
          <rect y="30" width="90" height="30" fill="#001489" />
          <polygon points="0,0 38,30 0,60" fill="#000000" />
          <path d="M0,6 L30,30 L0,54" fill="none" stroke="#FFB81C" strokeWidth="5" />
          <path d="M0,0 L38,30 L90,30 M0,60 L38,30" fill="none" stroke="#FFFFFF" strokeWidth="14" />
          <path d="M0,0 L38,30 L90,30 M0,60 L38,30" fill="none" stroke="#007749" strokeWidth="9" />
        </svg>
      );

    case 'NZ':
      return (
        <svg viewBox="0 0 90 60" className={className} role="img" aria-label={countryName || 'New Zealand flag'}>
          <rect width="90" height="60" fill="#00247D" />
          <path d="M0,0 L45,30 M45,0 L0,30" stroke="#FFFFFF" strokeWidth="5" />
          <path d="M22.5,0 V30 M0,15 H45" stroke="#FFFFFF" strokeWidth="8" />
          <path d="M22.5,0 V30 M0,15 H45" stroke="#CC142B" strokeWidth="4.5" />
          <circle cx="68" cy="14" r="3.2" fill="#CC142B" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="58" cy="28" r="3.2" fill="#CC142B" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="77" cy="26" r="3.2" fill="#CC142B" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="68" cy="46" r="3.6" fill="#CC142B" stroke="#FFFFFF" strokeWidth="1" />
        </svg>
      );

    case 'WI':
      return (
        <svg viewBox="0 0 90 60" className={className} role="img" aria-label={countryName || 'West Indies crest'}>
          <rect width="90" height="60" fill="#7B0041" />
          <circle cx="45" cy="30" r="18" fill="#F9D616" />
          <path d="M28,40 Q45,33 62,40 L62,46 L28,46 Z" fill="#009CDE" />
          <path d="M44,16 L46,38" stroke="#1B7339" strokeWidth="3" />
          <path
            d="M45,17 Q35,14 32,22 M45,17 Q55,14 58,22 M45,17 Q36,21 35,28 M45,17 Q54,21 55,28"
            fill="none"
            stroke="#1B7339"
            strokeWidth="2.5"
          />
        </svg>
      );

    case 'AFG':
      return (
        <svg viewBox="0 0 90 60" className={className} role="img" aria-label={countryName || 'Afghanistan flag'}>
          <rect width="30" height="60" fill="#000000" />
          <rect x="30" width="30" height="60" fill="#D32011" />
          <rect x="60" width="30" height="60" fill="#007A36" />
          <circle cx="45" cy="30" r="9" fill="none" stroke="#FFFFFF" strokeWidth="2" />
        </svg>
      );

    case 'SL':
      return (
        <svg viewBox="0 0 90 60" className={className} role="img" aria-label={countryName || 'Sri Lanka flag'}>
          <rect width="90" height="60" fill="#FFBE29" />
          <rect x="5" y="5" width="12" height="50" fill="#00534E" />
          <rect x="17" y="5" width="12" height="50" fill="#EB7400" />
          <rect x="33" y="5" width="52" height="50" fill="#8D153A" />
          <circle cx="59" cy="30" r="11" fill="#FFBE29" />
        </svg>
      );

    case 'USA':
      return (
        <svg viewBox="0 0 90 60" className={className} role="img" aria-label={countryName || 'United States flag'}>
          <rect width="90" height="60" fill="#FFFFFF" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} y={i * 8.57} width="90" height="4.4" fill="#B22234" />
          ))}
          <rect width="38" height="32" fill="#3C3B6E" />
          <g fill="#FFFFFF">
            <circle cx="8" cy="7" r="1.4" />
            <circle cx="19" cy="7" r="1.4" />
            <circle cx="30" cy="7" r="1.4" />
            <circle cx="13.5" cy="15.5" r="1.4" />
            <circle cx="24.5" cy="15.5" r="1.4" />
            <circle cx="8" cy="24" r="1.4" />
            <circle cx="19" cy="24" r="1.4" />
            <circle cx="30" cy="24" r="1.4" />
          </g>
        </svg>
      );

    case 'CAN':
      return (
        <svg viewBox="0 0 90 60" className={className} role="img" aria-label={countryName || 'Canada flag'}>
          <rect width="90" height="60" fill="#FFFFFF" />
          <rect width="22" height="60" fill="#D80621" />
          <rect x="68" width="22" height="60" fill="#D80621" />
          <polygon
            points="45,12 48,22 57,20 53,28 59,32 49,36 51,42 46,41 46,49 44,49 44,41 39,42 41,36 31,32 37,28 33,20 42,22"
            fill="#D80621"
          />
        </svg>
      );

    default:
      return (
        <div
          className={`${className} bg-[#0e2240] flex items-center justify-center font-[Space_Grotesk] font-black text-[#f4d27d] text-xs tracking-widest`}
          aria-label={countryName || code}
        >
          {code}
        </div>
      );
  }
}
