import React from 'react';
import type { RoadmapMascot } from '@/domain/types';

interface MascotProps {
  size?: number;
  className?: string;
  isCurrent?: boolean;
}

export const RocketMascot: React.FC<MascotProps> = ({ size = 64, className = '', isCurrent = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mascot-svg ${isCurrent ? 'animate-bounce-gentle' : 'animate-float-slow'} ${className}`}
  >
    {/* Glow & Propulsion Stars */}
    <circle cx="50" cy="50" r="46" fill="url(#rocket_glow)" opacity="0.25" />
    <path d="M48 82 C48 88, 52 92, 50 96 C48 92, 52 88, 52 82 Z" fill="#F59E0B" />
    <path d="M49 83 C49 87, 51 90, 50 93 C49 90, 51 87, 51 83 Z" fill="#FCD34D" />
    
    {/* Body Rocket Capsule */}
    <rect x="36" y="38" width="28" height="42" rx="14" fill="#3B82F6" />
    <path d="M50 18 C38 28, 36 38, 36 44 L64 44 C64 38, 62 28, 50 18 Z" fill="#EF4444" />
    
    {/* Wings */}
    <path d="M36 60 L24 74 L36 72 Z" fill="#EF4444" />
    <path d="M64 60 L76 74 L64 72 Z" fill="#EF4444" />
    
    {/* Porthole Face Glass */}
    <circle cx="50" cy="46" r="13" fill="#0F172A" stroke="#93C5FD" strokeWidth="2.5" />
    <circle cx="50" cy="46" r="10" fill="#1E293B" />
    
    {/* Chibi Cute Face Inside Helmet */}
    <circle cx="46" cy="45" r="2" fill="#F8FAFC" />
    <circle cx="54" cy="45" r="2" fill="#F8FAFC" />
    {/* Cheerful Smile */}
    <path d="M47 48 Q50 51 53 48" stroke="#F8FAFC" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    {/* Pink Blush */}
    <ellipse cx="43" cy="48" rx="2" ry="1.2" fill="#F43F5E" opacity="0.65" />
    <ellipse cx="57" cy="48" rx="2" ry="1.2" fill="#F43F5E" opacity="0.65" />
    
    {/* Sparkle */}
    <path d="M74 26 L76 20 L78 26 L84 28 L78 30 L76 36 L74 30 L68 28 Z" fill="#FDE047" opacity="0.8" />
    
    <defs>
      <radialGradient id="rocket_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const CoderMascot: React.FC<MascotProps> = ({ size = 64, className = '', isCurrent = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mascot-svg ${isCurrent ? 'animate-bounce-gentle' : 'animate-float-slow'} ${className}`}
  >
    <circle cx="50" cy="50" r="46" fill="url(#coder_glow)" opacity="0.25" />
    
    {/* Chibi Head */}
    <circle cx="50" cy="42" r="22" fill="#FED7AA" />
    {/* Cute Hair */}
    <path d="M28 42 C28 26, 42 22, 50 22 C58 22, 72 26, 72 42 C68 34, 60 30, 50 30 C40 30, 32 34, 28 42 Z" fill="#475569" />
    <path d="M34 32 C38 28, 44 26, 48 30" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
    
    {/* Big Headphones */}
    <rect x="22" y="34" width="7" height="16" rx="3.5" fill="#3B82F6" />
    <rect x="71" y="34" width="7" height="16" rx="3.5" fill="#3B82F6" />
    <path d="M25 36 C25 18, 75 18, 75 36" stroke="#60A5FA" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    
    {/* Cute Face: Round Eyes */}
    <circle cx="43" cy="43" r="2.8" fill="#0F172A" />
    <circle cx="57" cy="43" r="2.8" fill="#0F172A" />
    <circle cx="44.2" cy="42" r="1" fill="#FFFFFF" />
    <circle cx="58.2" cy="42" r="1" fill="#FFFFFF" />
    
    {/* Soft Smile */}
    <path d="M47 48 Q50 51 53 48" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    {/* Pink Blush */}
    <ellipse cx="38" cy="47" rx="2.5" ry="1.5" fill="#F43F5E" opacity="0.55" />
    <ellipse cx="62" cy="47" rx="2.5" ry="1.5" fill="#F43F5E" opacity="0.55" />
    
    {/* Body / Hoodie */}
    <rect x="33" y="60" width="34" height="24" rx="8" fill="#10B981" />
    
    {/* Glowing Laptop */}
    <polygon points="30,76 70,76 65,86 35,86" fill="#334155" stroke="#64748B" strokeWidth="1" />
    <rect x="34" y="64" width="32" height="14" rx="2" fill="#0F172A" stroke="#10B981" strokeWidth="1.5" />
    {/* Screen Code Glow */}
    <line x1="38" y1="68" x2="48" y2="68" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="72" x2="56" y2="72" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
    
    <defs>
      <radialGradient id="coder_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const ScholarMascot: React.FC<MascotProps> = ({ size = 64, className = '', isCurrent = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mascot-svg ${isCurrent ? 'animate-bounce-gentle' : 'animate-float-slow'} ${className}`}
  >
    <circle cx="50" cy="50" r="46" fill="url(#scholar_glow)" opacity="0.25" />
    
    {/* Chibi Head */}
    <circle cx="50" cy="45" r="21" fill="#FDE68A" />
    {/* Brown Hair */}
    <path d="M29 45 C29 30, 40 24, 50 24 C60 24, 71 30, 71 45 C67 36, 58 32, 50 32 C42 32, 33 36, 29 45 Z" fill="#78350F" />
    
    {/* Graduation / Study Cap */}
    <polygon points="50,14 74,24 50,30 26,24" fill="#6366F1" />
    <rect x="42" y="27" width="16" height="6" rx="2" fill="#4F46E5" />
    <line x1="50" y1="22" x2="68" y2="34" stroke="#F59E0B" strokeWidth="1.5" />
    <circle cx="68" cy="34" r="2" fill="#F59E0B" />
    
    {/* Cute Round Glasses */}
    <circle cx="42" cy="46" r="6" stroke="#4F46E5" strokeWidth="1.5" fill="none" />
    <circle cx="58" cy="46" r="6" stroke="#4F46E5" strokeWidth="1.5" fill="none" />
    <line x1="48" y1="46" x2="52" y2="46" stroke="#4F46E5" strokeWidth="1.5" />
    
    {/* Happy Eyes inside glasses */}
    <path d="M40 46 Q42 43 44 46" stroke="#1E1B4B" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d="M56 46 Q58 43 60 46" stroke="#1E1B4B" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    
    {/* Smile */}
    <path d="M47 54 Q50 57 53 54" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <ellipse cx="37" cy="51" rx="2" ry="1.2" fill="#F43F5E" opacity="0.6" />
    <ellipse cx="63" cy="51" rx="2" ry="1.2" fill="#F43F5E" opacity="0.6" />
    
    {/* Open Book Held Up */}
    <path d="M30 70 Q50 66 50 78 Q50 66 70 70 L68 84 Q50 80 50 88 Q50 80 32 84 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
    <line x1="50" y1="72" x2="50" y2="86" stroke="#94A3B8" strokeWidth="1.2" />
    
    {/* Idea Lightbulb Sparkle */}
    <path d="M80 20 L82 15 L84 20 L89 22 L84 24 L82 29 L80 24 L75 22 Z" fill="#FBBF24" />
    
    <defs>
      <radialGradient id="scholar_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#818CF8" stopOpacity="1" />
        <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const WealthMascot: React.FC<MascotProps> = ({ size = 64, className = '', isCurrent = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mascot-svg ${isCurrent ? 'animate-bounce-gentle' : 'animate-float-slow'} ${className}`}
  >
    <circle cx="50" cy="50" r="46" fill="url(#wealth_glow)" opacity="0.25" />
    
    {/* Giant Golden Coin being hugged */}
    <circle cx="50" cy="52" r="28" fill="#F59E0B" stroke="#FBBF24" strokeWidth="3" />
    <circle cx="50" cy="52" r="22" fill="#FCD34D" stroke="#D97706" strokeWidth="1" strokeDasharray="2 3" />
    <text x="50" y="58" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#B45309" fontFamily="sans-serif">RM</text>
    
    {/* Chibi Peeking Over the Coin */}
    <circle cx="50" cy="28" r="16" fill="#FED7AA" />
    <path d="M34 28 C34 16, 44 14, 50 14 C56 14, 66 16, 66 28 C62 22, 56 19, 50 19 C44 19, 38 22, 34 28 Z" fill="#92400E" />
    
    {/* Sparkle Eyes (Star Eyes) */}
    <path d="M45 28 L46 25 L47 28 L50 29 L47 30 L46 33 L45 30 L42 29 Z" fill="#047857" />
    <path d="M55 28 L56 25 L57 28 L60 29 L57 30 L56 33 L55 30 L52 29 Z" fill="#047857" />
    
    {/* Happy Grin */}
    <path d="M48 34 Q50 37 52 34" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <ellipse cx="40" cy="32" rx="2" ry="1.2" fill="#F43F5E" opacity="0.6" />
    <ellipse cx="60" cy="32" rx="2" ry="1.2" fill="#F43F5E" opacity="0.6" />
    
    {/* Cute Little Hands hugging the coin */}
    <circle cx="30" cy="46" r="4.5" fill="#FED7AA" stroke="#F59E0B" strokeWidth="1" />
    <circle cx="70" cy="46" r="4.5" fill="#FED7AA" stroke="#F59E0B" strokeWidth="1" />
    
    {/* Sparkles around */}
    <path d="M22 22 L24 18 L26 22 L30 24 L26 26 L24 30 L22 26 L18 24 Z" fill="#FDE047" />
    <path d="M78 68 L79 65 L80 68 L83 69 L80 70 L79 73 L78 70 L75 69 Z" fill="#FDE047" />
    
    <defs>
      <radialGradient id="wealth_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const ArcherMascot: React.FC<MascotProps> = ({ size = 64, className = '', isCurrent = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mascot-svg ${isCurrent ? 'animate-bounce-gentle' : 'animate-float-slow'} ${className}`}
  >
    <circle cx="50" cy="50" r="46" fill="url(#archer_glow)" opacity="0.25" />
    
    {/* Target Bullseye in background */}
    <circle cx="74" cy="42" r="14" fill="#EF4444" />
    <circle cx="74" cy="42" r="9" fill="#FFFFFF" />
    <circle cx="74" cy="42" r="4" fill="#EF4444" />
    
    {/* Chibi Head */}
    <circle cx="44" cy="42" r="20" fill="#FED7AA" />
    {/* Archer Hood / Band */}
    <path d="M24 38 C26 22, 40 18, 48 18 C58 18, 64 24, 64 38 L24 38 Z" fill="#059669" />
    <path d="M48 18 L52 8 L46 12 Z" fill="#DC2626" /> {/* Feather */}
    
    {/* Focused Wink Face */}
    <circle cx="39" cy="42" r="2.8" fill="#0F172A" /> {/* Aiming eye */}
    <circle cx="40" cy="41" r="1" fill="#FFFFFF" />
    <path d="M48 42 L54 42" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" /> {/* Wink */}
    
    {/* Determined Smirk */}
    <path d="M41 49 Q45 52 48 48" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <ellipse cx="34" cy="46" rx="2" ry="1.2" fill="#F43F5E" opacity="0.5" />
    
    {/* Body with Tunic */}
    <rect x="30" y="60" width="28" height="24" rx="6" fill="#10B981" />
    
    {/* Bow & Arrow */}
    <path d="M22 40 Q32 58 22 76" stroke="#92400E" strokeWidth="3" strokeLinecap="round" fill="none" />
    <line x1="22" y1="40" x2="22" y2="76" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="1 2" />
    <line x1="20" y1="58" x2="65" y2="44" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <polygon points="65,44 60,42 61,48" fill="#F59E0B" />
    
    <defs>
      <radialGradient id="archer_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const ZenMascot: React.FC<MascotProps> = ({ size = 64, className = '', isCurrent = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mascot-svg ${isCurrent ? 'animate-bounce-gentle' : 'animate-float-slow'} ${className}`}
  >
    <circle cx="50" cy="50" r="46" fill="url(#zen_glow)" opacity="0.25" />
    
    {/* Lotus Petals Base */}
    <path d="M28 82 C34 76, 44 76, 50 82 C56 76, 66 76, 72 82 C64 88, 36 88, 28 82 Z" fill="#A7F3D0" opacity="0.7" />
    
    {/* Chibi Head */}
    <circle cx="50" cy="38" r="20" fill="#FED7AA" />
    {/* Calm Hair Bun */}
    <circle cx="50" cy="18" r="7" fill="#475569" />
    <path d="M30 38 C30 24, 40 22, 50 22 C60 22, 70 24, 70 38 C64 30, 56 28, 50 28 C44 28, 36 30, 30 38 Z" fill="#475569" />
    
    {/* Peaceful Closed Eyes (Arcs) */}
    <path d="M41 40 Q44 43 47 40" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M53 40 Q56 43 59 40" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
    
    {/* Gentle Serene Smile */}
    <path d="M47 47 Q50 50 53 47" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <ellipse cx="37" cy="44" rx="2.5" ry="1.5" fill="#F43F5E" opacity="0.6" />
    <ellipse cx="63" cy="44" rx="2.5" ry="1.5" fill="#F43F5E" opacity="0.6" />
    
    {/* Cozy Robe */}
    <path d="M34 56 C34 56, 44 54, 50 54 C56 54, 66 56, 66 56 L68 76 L32 76 Z" fill="#14B8A6" />
    
    {/* Warm Tea Bowl */}
    <path d="M43 66 C43 72, 57 72, 57 66 Z" fill="#0D9488" stroke="#CCFBF1" strokeWidth="1" />
    {/* Steam Swirl */}
    <path d="M48 62 Q50 58 48 55 Q50 52 48 49" stroke="#99F6E4" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />
    
    {/* Floating Leaf */}
    <path d="M72 26 C76 22, 82 24, 82 28 C78 30, 74 30, 72 26 Z" fill="#34D399" />
    
    <defs>
      <radialGradient id="zen_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#14B8A6" stopOpacity="1" />
        <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const SprinterMascot: React.FC<MascotProps> = ({ size = 64, className = '', isCurrent = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mascot-svg ${isCurrent ? 'animate-bounce-gentle' : 'animate-float-slow'} ${className}`}
  >
    <circle cx="50" cy="50" r="46" fill="url(#sprinter_glow)" opacity="0.25" />
    
    {/* Motion Dash Streaks */}
    <line x1="14" y1="46" x2="26" y2="46" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    <line x1="18" y1="54" x2="32" y2="54" stroke="#F97316" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <line x1="12" y1="62" x2="24" y2="62" stroke="#F97316" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    
    {/* Chibi Head */}
    <circle cx="52" cy="38" r="20" fill="#FED7AA" />
    {/* Energetic Hair & Headband */}
    <path d="M32 36 C32 20, 46 18, 54 18 C62 18, 72 22, 72 36 C66 28, 58 26, 52 26 C44 26, 36 28, 32 36 Z" fill="#1E293B" />
    <rect x="33" y="30" width="38" height="5" rx="2.5" fill="#EF4444" />
    <circle cx="52" cy="32.5" r="2" fill="#FFFFFF" />
    
    {/* Determined Shiny Eyes */}
    <circle cx="47" cy="40" r="2.8" fill="#0F172A" />
    <circle cx="61" cy="40" r="2.8" fill="#0F172A" />
    <circle cx="48" cy="39" r="1" fill="#FFFFFF" />
    <circle cx="62" cy="39" r="1" fill="#FFFFFF" />
    
    {/* Energetic Smile */}
    <path d="M51 46 Q54 50 57 46" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <ellipse cx="42" cy="43" rx="2.5" ry="1.5" fill="#F43F5E" opacity="0.6" />
    <ellipse cx="66" cy="43" rx="2.5" ry="1.5" fill="#F43F5E" opacity="0.6" />
    
    {/* Running Jersey Body */}
    <rect x="38" y="56" width="28" height="22" rx="6" fill="#F97316" />
    <text x="52" y="70" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#FFFFFF" fontFamily="sans-serif">01</text>
    
    {/* Thumbs Up Hand */}
    <circle cx="70" cy="58" r="4.5" fill="#FED7AA" />
    <path d="M70 54 L70 50 L73 50 L73 54" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
    
    <defs>
      <radialGradient id="sprinter_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F97316" stopOpacity="1" />
        <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const ChampionMascot: React.FC<MascotProps> = ({ size = 64, className = '', isCurrent = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mascot-svg ${isCurrent ? 'animate-bounce-gentle' : 'animate-float-slow'} ${className}`}
  >
    <circle cx="50" cy="50" r="46" fill="url(#champ_glow)" opacity="0.25" />
    
    {/* Golden Trophy held high */}
    <path d="M66 22 L78 22 C78 30, 72 34, 66 34 Z" stroke="#F59E0B" strokeWidth="2" fill="#FEF3C7" />
    <path d="M54 18 H78 V28 C78 34, 70 38, 66 38 C62 38, 54 34, 54 28 Z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5" />
    <rect x="63" y="38" width="6" height="8" fill="#D97706" />
    <rect x="58" y="46" width="16" height="5" rx="1.5" fill="#B45309" />
    
    {/* Chibi Winner Head */}
    <circle cx="40" cy="42" r="20" fill="#FED7AA" />
    {/* Royal Crown */}
    <polygon points="28,26 34,32 40,24 46,32 52,26 50,34 30,34" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
    
    {/* Joyful Happy Eyes (Arcs) */}
    <path d="M33 42 Q36 38 39 42" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <path d="M43 42 Q46 38 49 42" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    
    {/* Wide Cheerful Smile */}
    <path d="M37 48 Q41 54 45 48 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1" />
    <ellipse cx="30" cy="46" rx="2.5" ry="1.5" fill="#F43F5E" opacity="0.6" />
    <ellipse cx="50" cy="46" rx="2.5" ry="1.5" fill="#F43F5E" opacity="0.6" />
    
    {/* Suit / Tunic */}
    <rect x="26" y="60" width="28" height="24" rx="6" fill="#8B5CF6" />
    
    {/* Confetti Bursts */}
    <circle cx="20" cy="20" r="2" fill="#EC4899" />
    <circle cx="84" cy="26" r="2.5" fill="#3B82F6" />
    <polygon points="22,68 25,66 24,70" fill="#10B981" />
    <polygon points="82,62 85,60 84,64" fill="#F59E0B" />
    
    <defs>
      <radialGradient id="champ_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="1" />
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const getMascotComponent = (mascot: RoadmapMascot, size = 64, className = '', isCurrent = false) => {
  switch (mascot) {
    case 'rocket':
      return <RocketMascot size={size} className={className} isCurrent={isCurrent} />;
    case 'coder':
      return <CoderMascot size={size} className={className} isCurrent={isCurrent} />;
    case 'scholar':
      return <ScholarMascot size={size} className={className} isCurrent={isCurrent} />;
    case 'wealth':
      return <WealthMascot size={size} className={className} isCurrent={isCurrent} />;
    case 'archer':
      return <ArcherMascot size={size} className={className} isCurrent={isCurrent} />;
    case 'zen':
      return <ZenMascot size={size} className={className} isCurrent={isCurrent} />;
    case 'sprinter':
      return <SprinterMascot size={size} className={className} isCurrent={isCurrent} />;
    case 'champion':
      return <ChampionMascot size={size} className={className} isCurrent={isCurrent} />;
    default:
      return <RocketMascot size={size} className={className} isCurrent={isCurrent} />;
  }
};

export const MASCOT_META: Record<RoadmapMascot, { label: string; desc: string; color: string }> = {
  rocket: { label: 'Rocket Pioneer', desc: 'Big audacious leaps & launches', color: '#38BDF8' },
  coder: { label: 'Flow Coder', desc: 'Deep work, tech builds & focus', color: '#10B981' },
  scholar: { label: 'Epiphany Scholar', desc: 'Exams, studying & learning', color: '#818CF8' },
  wealth: { label: 'Wealth Builder', desc: 'Savings targets & financial discipline', color: '#F59E0B' },
  archer: { label: 'Precision Archer', desc: 'Sharp milestone focus & habits', color: '#10B981' },
  zen: { label: 'Zen Harmonizer', desc: 'Mindfulness, balance & restoration', color: '#14B8A6' },
  sprinter: { label: 'Habit Sprinter', desc: 'Fitness streaks & relentless energy', color: '#F97316' },
  champion: { label: 'Triumphant Champion', desc: 'Victory, celebrations & year-end wins', color: '#8B5CF6' },
};
