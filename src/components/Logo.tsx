export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { width: 120, height: 40, fontSize: 16, subSize: 8 },
    md: { width: 180, height: 60, fontSize: 24, subSize: 11 },
    lg: { width: 260, height: 80, fontSize: 34, subSize: 15 },
  };
  const s = sizes[size];

  return (
    <svg width={s.width} height={s.height} viewBox="0 0 260 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tree/Leaf icon */}
      <circle cx="30" cy="30" r="22" fill="#1B5E20" opacity="0.1" />
      <path d="M30 10 C30 10, 18 22, 18 34 C18 42, 23 48, 30 48 C37 48, 42 42, 42 34 C42 22, 30 10, 30 10Z" fill="#1B5E20" />
      <path d="M30 18 C30 18, 22 26, 22 34 C22 39, 25 43, 30 43 C35 43, 38 39, 38 34 C38 26, 30 18, 30 18Z" fill="#2E7D32" />
      <line x1="30" y1="48" x2="30" y2="60" stroke="#5D4037" strokeWidth="3" strokeLinecap="round" />
      {/* Geological layers */}
      <path d="M12 62 Q20 58, 30 62 Q40 66, 48 62" stroke="#FF8F00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M14 67 Q22 63, 30 67 Q38 71, 46 67" stroke="#FFA726" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Text */}
      <text x="60" y="38" fontFamily="Inter, sans-serif" fontWeight="800" fontSize={s.fontSize} fill="#1B5E20">
        AGRAGEO
      </text>
      <text x="60" y="55" fontFamily="Inter, sans-serif" fontWeight="500" fontSize={s.subSize} fill="#FF8F00" letterSpacing="3">
        CONSULTORIA
      </text>
    </svg>
  );
}
