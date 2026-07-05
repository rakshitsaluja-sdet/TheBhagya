export default function LogoMark({ size = 56 }) {
  /*
    100×100 viewBox. Center = (50,50). Arm width = 12. Arm extension = 24.
    Each rect connects at edges — zero overlap, clean lines.
    Shirorekha top bar = Devanagari भ.
    Clockwise swastik = auspicious (स्वस्तिक).
  */
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* Outer ring */}
      <circle cx="50" cy="50" r="47" stroke="#C9933A" strokeWidth="1.5"/>

      {/* Shirorekha — Devanagari headline bar → makes this भ */}
      <rect x="20" y="12" width="60" height="5" rx="2.5" fill="#C9933A"/>

      {/* ── CLOCKWISE SWASTIK ──
          Center square: x=44–56, y=44–56
          Arms and hooks connect at edges, never overlap              */}

      {/* Center */}
      <rect x="44" y="44" width="12" height="12" fill="#C9933A"/>

      {/* Top arm ↑ */}
      <rect x="44" y="19" width="12" height="25" fill="#C9933A"/>
      {/* Top hook → */}
      <rect x="56" y="19" width="22" height="12" fill="#C9933A"/>

      {/* Right arm → */}
      <rect x="56" y="44" width="24" height="12" fill="#C9933A"/>
      {/* Right hook ↓ */}
      <rect x="68" y="56" width="12" height="22" fill="#C9933A"/>

      {/* Bottom arm ↓ */}
      <rect x="44" y="56" width="12" height="24" fill="#C9933A"/>
      {/* Bottom hook ← */}
      <rect x="22" y="68" width="22" height="12" fill="#C9933A"/>

      {/* Left arm ← */}
      <rect x="20" y="44" width="24" height="12" fill="#C9933A"/>
      {/* Left hook ↑ */}
      <rect x="20" y="19" width="12" height="25" fill="#C9933A"/>

      {/* Bindu — center jewel */}
      <circle cx="50" cy="50" r="5" fill="#0D0B14"/>
      <circle cx="50" cy="50" r="2.5" fill="#C9933A"/>

    </svg>
  )
}
