import React from "react";

/**
 * Kalyo Brand Identity Logo Component
 * Plateforme Marocaine de Gestion de Projets & Trésorerie.
 * Features the signature faceted 3D crystal / prism monogram 'K'
 */
export const BrandLogo = ({
  size = "md",
  variant = "default", // "default" | "glow" | "squircle" | "monochrome"
  showText = true,
  showTagline = true,
  tagline = "GESTION DE PROJETS • MAROC",
  className = "",
  textClassName = "",
  isDark = null, // auto-detect or force boolean
}) => {
  // Sizing definitions for icon and text
  const sizeMap = {
    xs: { icon: "w-6 h-6", text: "text-sm", sub: "text-[8px]", gap: "gap-2" },
    sm: { icon: "w-8 h-8", text: "text-base", sub: "text-[9px]", gap: "gap-2.5" },
    md: { icon: "w-10 h-10", text: "text-lg", sub: "text-[10px]", gap: "gap-3" },
    lg: { icon: "w-12 h-12", text: "text-xl", sub: "text-[11px]", gap: "gap-3.5" },
    xl: { icon: "w-16 h-16", text: "text-3xl", sub: "text-xs", gap: "gap-4" },
    "2xl": { icon: "w-20 h-20", text: "text-4xl", sub: "text-sm", gap: "gap-5" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Render the faceted K vector glyph
  const renderGlyph = () => (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full transform transition-transform duration-300 group-hover:scale-105"
    >
      <defs>
        {/* Spine Left Pillar - Deep Royal / Midnight */}
        <linearGradient id="kanso-spine-l" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        {/* Spine Right Pillar - Electric Indigo Light */}
        <linearGradient id="kanso-spine-r" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="60%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>

        {/* Upper Arm - Top Light Facet (Cyan/Sky Aurora) */}
        <linearGradient id="kanso-arm-t-top" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="45%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>

        {/* Upper Arm - Bottom Facet (Cyan Reflection) */}
        <linearGradient id="kanso-arm-t-bot" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="70%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Lower Arm - Upper Facet (Teal Velocity) */}
        <linearGradient id="kanso-arm-b-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="60%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Lower Arm - Bottom Heavy Facet (Deep Emerald/Indigo) */}
        <linearGradient id="kanso-arm-b-bot" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="60%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Ambient Neon Backing Filter */}
        <filter id="kanso-backglow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="8" result="blur" />
        </filter>
      </defs>

      {/* Subtle Ambient Glow for Dark Mode */}
      <g opacity="0.3" filter="url(#kanso-backglow)" className="hidden dark:block">
        <polygon points="18,14 46,14 80,14 80,86 46,86 18,86" fill="#38BDF8" />
      </g>

      {/* Facet 1: Spine Left Pillar */}
      <polygon points="18,14 32,14 32,86 18,86" fill="url(#kanso-spine-l)" />

      {/* Facet 2: Spine Right Pillar (Top Section) */}
      <polygon points="32,14 46,14 46,50 32,50" fill="url(#kanso-spine-r)" />

      {/* Facet 3: Spine Right Pillar (Bottom Section) */}
      <polygon points="32,50 46,50 46,86 32,86" fill="url(#kanso-spine-l)" />

      {/* Facet 4: Upper Arm (Top Light Facet) */}
      <polygon points="46,14 80,14 80,33 46,50" fill="url(#kanso-arm-t-top)" />

      {/* Facet 5: Upper Arm (Bottom Facet / Underside) */}
      <polygon points="46,50 80,33 58,50" fill="url(#kanso-arm-t-bot)" />

      {/* Facet 6: Lower Arm (Top Facet) */}
      <polygon points="46,50 58,50 80,67" fill="url(#kanso-arm-b-top)" />

      {/* Facet 7: Lower Arm (Bottom Heavy Facet) */}
      <polygon points="46,50 80,67 80,86 46,86" fill="url(#kanso-arm-b-bot)" />

      {/* Precision Micro Ridge Lines (Faceted 3D Definition) */}
      <line x1="32" y1="14" x2="32" y2="86" stroke="#93C5FD" strokeWidth="0.8" opacity="0.85" />
      <line x1="46" y1="50" x2="80" y2="33" stroke="#BAE6FD" strokeWidth="0.8" opacity="0.9" />
      <line x1="46" y1="50" x2="80" y2="67" stroke="#67E8F9" strokeWidth="0.8" opacity="0.75" />
      <line x1="46" y1="14" x2="46" y2="86" stroke="#C7D2FE" strokeWidth="0.6" opacity="0.55" />
    </svg>
  );

  return (
    <div className={`inline-flex items-center ${currentSize.gap} group select-none ${className}`}>
      {/* Icon Container */}
      {variant === "squircle" ? (
        <div
          className={`${currentSize.icon} rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-1.5 shadow-lg shadow-indigo-500/10 border border-slate-800/80 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}
        >
          {renderGlyph()}
        </div>
      ) : (
        <div className={`${currentSize.icon} flex items-center justify-center flex-shrink-0`}>
          {renderGlyph()}
        </div>
      )}

      {/* Typography Block */}
      {showText && (
        <div className={`flex flex-col leading-none ${textClassName}`}>
          <div className="flex items-center gap-1.5">
            <span
              className={`${currentSize.text} font-black tracking-tight text-slate-900 dark:text-white uppercase`}
              style={{ letterSpacing: "-0.03em" }}
            >
              Kalyo
            </span>
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/50 hidden sm:inline">
              MA
            </span>
          </div>

          {showTagline && (
            <span
              className={`${currentSize.sub} font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5`}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
