import React from 'react';

interface LogoRMProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'horizontal' | 'compact' | 'badge' | 'card';
  withDarkFrame?: boolean;
}

export const LogoRM: React.FC<LogoRMProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'full',
  withDarkFrame = false
}) => {
  // Height map for sizing
  const heightMap = {
    xs: 36,
    sm: 52,
    md: 74,
    lg: 108,
    xl: 155,
    hero: 210
  };

  const currentHeight = heightMap[size] || 74;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${
        withDarkFrame
          ? 'p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-sky-950 via-sky-900 to-sky-950 border border-sky-700/70 shadow-2xl shadow-black/95 ring-1 ring-white/10'
          : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 700 340"
        className="w-auto max-w-full drop-shadow-[0_14px_32px_rgba(0,0,0,0.95)]"
        style={{
          height: currentHeight
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ================= 1. CHROME & SILVER GRADIENTS ================= */}
          <linearGradient id="rmHighChrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="15%" stopColor="#f8fafc" />
            <stop offset="30%" stopColor="#94a3b8" />
            <stop offset="48%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#334155" />
            <stop offset="82%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="rmChromeSpecular" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="22%" stopColor="#e2e8f0" />
            <stop offset="46%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="72%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="rmChromeBevel" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>

          {/* ================= 2. CANDY SCARLET RUBY GRADIENTS ================= */}
          <linearGradient id="rmRubyRed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff1744" />
            <stop offset="25%" stopColor="#e11d48" />
            <stop offset="55%" stopColor="#be123c" />
            <stop offset="80%" stopColor="#881337" />
            <stop offset="100%" stopColor="#3f0312" />
          </linearGradient>

          <linearGradient id="rmRubyGleam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="18%" stopColor="#ff4d6d" />
            <stop offset="58%" stopColor="#be123c" />
            <stop offset="90%" stopColor="#450a0a" />
            <stop offset="100%" stopColor="#1a0206" />
          </linearGradient>

          {/* ================= 3. DARK METALLIC TEXTURED PLATES ================= */}
          <linearGradient id="rmDarkPlate" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2c3545" />
            <stop offset="25%" stopColor="#18202c" />
            <stop offset="65%" stopColor="#0d121a" />
            <stop offset="100%" stopColor="#040609" />
          </linearGradient>

          {/* ================= 4. REFRIGERATION ICE CYAN ================= */}
          <linearGradient id="rmIceCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#bae6fd" />
            <stop offset="65%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Glow and Shadow Filters */}
          <filter id="rmGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="rmDeepShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000000" floodOpacity="0.95" />
          </filter>
        </defs>

        {/* ================= 1. LEFT TOP: MODERN CITY SKYSCRAPERS & TECH CIRCUITS ================= */}
        <g id="city-tech" opacity="0.98">
          {/* Circuit connection traces and terminal nodes */}
          <g stroke="url(#rmChromeSpecular)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 125,120 L 148,120 L 165,104 L 180,104" />
            <circle cx="125" cy="120" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="165" cy="104" r="3" fill="#ffffff" />

            <path d="M 138,138 L 160,138 L 174,124" />
            <circle cx="138" cy="138" r="3" fill="#38bdf8" />

            <path d="M 150,154 L 168,154 L 182,142" />
            <circle cx="150" cy="154" r="3" fill="#ffffff" />
          </g>

          {/* Building 1 (Left medium skyscraper) */}
          <path
            d="M 170,160 L 170,95 L 200,75 L 212,84 L 212,160 Z"
            fill="url(#rmHighChrome)"
            stroke="#0f172a"
            strokeWidth="2.2"
          />
          {/* Window dots */}
          <rect x="178" y="90" width="5" height="4" fill="#ffffff" opacity="0.95" />
          <rect x="188" y="90" width="5" height="4" fill="#ffffff" opacity="0.95" />
          <rect x="178" y="102" width="5" height="4" fill="#ffffff" opacity="0.95" />
          <rect x="188" y="102" width="5" height="4" fill="#ffffff" opacity="0.95" />
          <rect x="178" y="114" width="5" height="4" fill="#ffffff" opacity="0.95" />
          <rect x="188" y="114" width="5" height="4" fill="#ffffff" opacity="0.95" />
          <rect x="178" y="126" width="5" height="4" fill="#ffffff" opacity="0.95" />
          <rect x="188" y="126" width="5" height="4" fill="#ffffff" opacity="0.95" />

          {/* Building 2 (Tallest center skyscraper) */}
          <path
            d="M 214,160 L 214,44 L 238,24 L 260,44 L 260,160 Z"
            fill="url(#rmChromeSpecular)"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          <line x1="238" y1="24" x2="238" y2="152" stroke="#334155" strokeWidth="2" />
          <rect x="220" y="54" width="6" height="5" fill="#ffffff" opacity="0.95" />
          <rect x="246" y="54" width="6" height="5" fill="#ffffff" opacity="0.95" />
          <rect x="220" y="68" width="6" height="5" fill="#ffffff" opacity="0.95" />
          <rect x="246" y="68" width="6" height="5" fill="#ffffff" opacity="0.95" />
          <rect x="220" y="82" width="6" height="5" fill="#ffffff" opacity="0.95" />
          <rect x="246" y="82" width="6" height="5" fill="#ffffff" opacity="0.95" />
          <rect x="220" y="96" width="6" height="5" fill="#ffffff" opacity="0.95" />
          <rect x="246" y="96" width="6" height="5" fill="#ffffff" opacity="0.95" />

          {/* Building 3 (Mid-ground angled building) */}
          <path
            d="M 262,160 L 262,72 L 290,60 L 300,72 L 300,160 Z"
            fill="url(#rmHighChrome)"
            stroke="#0f172a"
            strokeWidth="2.2"
          />
        </g>

        {/* ================= 2. TOP CENTER: HEAVY 3D PRECISION GEAR ================= */}
        <g id="precision-gear">
          {/* Gear teeth outline */}
          <path
            d="M 302,126 
               A 110,110 0 0,1 506,126 
               L 496,98 L 518,89 L 510,70 L 486,77 
               A 110,110 0 0,0 455,58 L 463,35 L 442,30 L 432,50 
               A 110,110 0 0,0 401,44 L 401,20 L 379,20 L 378,44 
               A 110,110 0 0,0 347,54 L 336,31 L 317,38 L 326,61 
               A 110,110 0 0,0 300,82 Z"
            fill="url(#rmHighChrome)"
            stroke="#090d16"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Inner metallic beveled ring */}
          <circle cx="404" cy="110" r="66" fill="none" stroke="url(#rmChromeSpecular)" strokeWidth="13" />
          <circle cx="404" cy="110" r="59" fill="none" stroke="#090d16" strokeWidth="2.5" />
        </g>

        {/* ================= 3. TOP RIGHT: REFRIGERATION / AR CONDICIONADO (FAN & SNOWFLAKES) ================= */}
        <g id="ac-fan-snow" transform="translate(568, 138)">
          {/* Fan Housing Chrome Ring */}
          <circle cx="0" cy="0" r="40" fill="#0b0e14" stroke="url(#rmHighChrome)" strokeWidth="5" />
          <circle cx="0" cy="0" r="34" fill="#1e293b" stroke="#ffffff" strokeWidth="1.2" opacity="0.75" />

          {/* Ice Turbine Blades */}
          <g fill="url(#rmIceCyan)" stroke="#ffffff" strokeWidth="1.1">
            <path d="M 0,0 Q 13,-27 27,-22 Q 17,-6 0,0 Z" />
            <path d="M 0,0 Q 27,-13 22,13 Q 6,17 0,0 Z" />
            <path d="M 0,0 Q 13,27 -13,22 Q -6,17 0,0 Z" />
            <path d="M 0,0 Q -27,13 -22,-13 Q -17,-6 0,0 Z" />
            <path d="M 0,0 Q -13,-27 13,-27 Q 10,-10 0,0 Z" opacity="0.75" />
            <path d="M 0,0 Q 27,13 27,-13 Q 10,-10 0,0 Z" opacity="0.75" />
          </g>
          {/* Chrome Fan Center Cap */}
          <circle cx="0" cy="0" r="10" fill="url(#rmChromeSpecular)" stroke="#ffffff" strokeWidth="2" />

          {/* Snowflake Crystals Cluster (Climatização) */}
          <g stroke="url(#rmIceCyan)" strokeWidth="2.6" strokeLinecap="round" opacity="0.95" filter="url(#rmGlow)">
            {/* Crystal 1 (Top right) */}
            <line x1="24" y1="-30" x2="44" y2="-50" />
            <line x1="34" y1="-40" x2="42" y2="-36" />
            <line x1="34" y1="-40" x2="36" y2="-46" />

            {/* Crystal 2 (Right) */}
            <line x1="40" y1="-16" x2="60" y2="-16" />
            <line x1="50" y1="-16" x2="55" y2="-23" />
            <line x1="50" y1="-16" x2="55" y2="-9" />

            {/* Crystal 3 (Bottom Right) */}
            <line x1="31" y1="-2" x2="51" y2="16" />
            <line x1="41" y1="7" x2="49" y2="5" />
            <line x1="41" y1="7" x2="42" y2="15" />
          </g>
        </g>

        {/* Dynamic Red Swoosh / Wing (Curving from above M) */}
        <path
          d="M 445,96 Q 548,72 584,152 Q 554,124 468,118 Z"
          fill="url(#rmRubyRed)"
          stroke="#ffe4e6"
          strokeWidth="2.8"
          filter="url(#rmGlow)"
        />

        {/* ================= 4. RM 3D BOLD LETTERS (CENTERPIECE) ================= */}
        <g id="letters-rm" transform="translate(188, 52)">
          {/* === LETTER R (3D HEAVY CHROME POLISHED MIRROR) === */}
          {/* Deep Drop Shadow & Extrusion */}
          <path
            d="M 32,122 L 32,18 L 92,18 Q 132,18 132,54 Q 132,82 102,92 L 138,122 L 106,122 L 78,94 L 60,94 L 60,122 Z"
            fill="#020407"
            stroke="#0a0e17"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          {/* Chrome 3D Beveled Base */}
          <path
            d="M 32,122 L 32,18 L 92,18 Q 132,18 132,54 Q 132,82 102,92 L 138,122 L 106,122 L 78,94 L 60,94 L 60,122 Z"
            fill="url(#rmHighChrome)"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Inner Cutout Hole Base */}
          <path
            d="M 60,42 L 88,42 Q 106,42 106,56 Q 106,70 88,70 L 60,70 Z"
            fill="#0b0f17"
            stroke="url(#rmChromeSpecular)"
            strokeWidth="3.5"
          />
          {/* R High-Gloss Front Silver Facet */}
          <path
            d="M 35,120 L 35,20 L 90,20 Q 128,20 128,54 Q 128,80 100,89 L 134,120 L 108,120 L 79,92 L 58,92 L 58,120 Z"
            fill="url(#rmChromeSpecular)"
          />
          {/* Inner Cutout Front */}
          <path
            d="M 58,44 L 86,44 Q 102,44 102,56 Q 102,68 86,68 L 58,68 Z"
            fill="#0b0f17"
          />
          {/* Red Accent Trim on R's Inner Curve (Matching original logo) */}
          <path
            d="M 92,20 Q 128,20 128,54 Q 128,80 100,89 L 92,80 Q 112,74 112,54 Q 112,34 90,32 Z"
            fill="url(#rmRubyRed)"
            opacity="0.95"
          />

          {/* === LETTER M (3D BOLD ITALIC CANDY CRIMSON RED) === */}
          {/* Deep Drop Shadow & Extrusion */}
          <path
            d="M 148,122 L 148,18 L 188,18 L 226,82 L 264,18 L 304,18 L 304,122 L 272,122 L 272,55 L 240,106 L 212,106 L 180,55 L 180,122 Z"
            fill="#020305"
            stroke="#180408"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          {/* Red Ruby Candy Gloss Body */}
          <path
            d="M 148,122 L 148,18 L 188,18 L 226,82 L 264,18 L 304,18 L 304,122 L 272,122 L 272,55 L 240,106 L 212,106 L 180,55 L 180,122 Z"
            fill="url(#rmRubyRed)"
            stroke="url(#rmRubyGleam)"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Front High-Gloss Candy Reflection Layers */}
          <path
            d="M 150,120 L 150,20 L 186,20 L 224,82 L 212,90 L 178,50 L 178,120 Z"
            fill="url(#rmRubyGleam)"
            opacity="0.9"
          />
          <path
            d="M 270,50 L 270,120 L 302,120 L 302,20 L 268,20 Z"
            fill="url(#rmRubyRed)"
          />
          <path
            d="M 226,82 L 264,20 L 250,20 L 218,76 Z"
            fill="url(#rmRubyGleam)"
            opacity="0.85"
          />
        </g>

        {/* ================= 5. CENTRAL SHIELD BADGE & "MANUTEC" ================= */}
        <g id="manutec-badge" transform="translate(80, 168)">
          {/* Outer Black Textured Heavy Metallic Shield */}
          <polygon
            points="35,4 545,4 568,48 520,66 60,66 12,48"
            fill="url(#rmDarkPlate)"
            stroke="url(#rmHighChrome)"
            strokeWidth="4.2"
            strokeLinejoin="round"
            filter="url(#rmDeepShadow)"
          />

          {/* Left Wrench / Ferramenta Mecânica (Chave Fixa Dupla Cromada) */}
          <g transform="translate(18, 28) rotate(-16) scale(0.88)">
            <path
              d="M 20,6 C 30,2 40,7 43,16 L 32,24 C 29,21 23,22 21,25 C 19,30 20,34 23,37 L 13,44 C 4,41 0,31 3,22 C 7,15 12,9 20,6 Z M 21,42 L 62,84 L 54,92 L 13,50 Z"
              fill="url(#rmHighChrome)"
              stroke="#ffffff"
              strokeWidth="1.4"
            />
          </g>

          {/* Right Red Lightning Bolt / Raio Elétrico */}
          <g transform="translate(515, 10) scale(1.05)">
            <polygon
              points="22,0 0,28 16,28 10,54 38,22 20,22"
              fill="url(#rmRubyRed)"
              stroke="#ffffff"
              strokeWidth="1.9"
              filter="url(#rmGlow)"
            />
          </g>

          {/* Bold 3D Extruded "MANUTEC" Typography */}
          <text
            x="290"
            y="48"
            fontFamily="Arial Black, Impact, sans-serif"
            fontSize="48"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="4.2"
            textAnchor="middle"
            fill="url(#rmHighChrome)"
            stroke="#070a10"
            strokeWidth="3.8"
            style={{ paintOrder: 'stroke fill' }}
          >
            MANUTEC
          </text>
        </g>

        {/* ================= 6. BOTTOM RIBBON: CIVIL • ELÉTRICA • AR-CONDICIONADO ================= */}
        <g id="bottom-ribbon" transform="translate(90, 234)">
          {/* Red 3D Ribbon Shield Plate */}
          <polygon
            points="45,0 515,0 538,36 280,62 22,36"
            fill="url(#rmRubyRed)"
            stroke="url(#rmHighChrome)"
            strokeWidth="4.2"
            strokeLinejoin="round"
            filter="url(#rmDeepShadow)"
          />

          {/* Inner Highlight Line */}
          <polygon
            points="54,4 506,4 525,32 280,56 35,32"
            fill="none"
            stroke="#ff758f"
            strokeWidth="2"
            opacity="0.88"
          />

          {/* Specialty Subtitle Text with Accent */}
          <text
            x="280"
            y="29"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="18"
            fontWeight="900"
            letterSpacing="3.4"
            textAnchor="middle"
            fill="#ffffff"
            filter="drop-shadow(0 2px 3px rgba(0,0,0,0.95))"
          >
            CIVIL • ELÉTRICA • AR-CONDICIONADO
          </text>
        </g>

        {/* ================= 7. LOWER CHROME CHEVRON / APEX SHIELD BASE ================= */}
        <g id="bottom-chrome-apex" transform="translate(90, 282)">
          {/* Beveled Chrome V-Point Chevron */}
          <polygon
            points="70,0 490,0 514,16 280,44 46,16"
            fill="url(#rmHighChrome)"
            stroke="#090d16"
            strokeWidth="2"
            strokeLinejoin="round"
            filter="url(#rmDeepShadow)"
          />
          {/* Specular Ridge Line */}
          <line x1="280" y1="0" x2="280" y2="42" stroke="#ffffff" strokeWidth="2.5" />
        </g>
      </svg>
    </div>
  );
};
