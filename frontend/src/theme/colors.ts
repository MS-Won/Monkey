// frontend/src/theme/colors.ts
// ------------------------------------------------------------
// Holographic / iridescent (mystic tarot) 팔레트.
// image_sample.png(ANTIGRVTY Tarot) 방향: 딥 인디고-바이올렛 캔버스 위
// iridescent(violet→magenta→cyan) 발광 + 따뜻한 골드 포인트.
// 토큰 "키"는 구버전과 동일하게 유지 → 전 화면이 값만 바꿔 새 톤으로 전환됨.
// ------------------------------------------------------------
export const Colors = {
  // Background — 딥 바이올렛-인디고 캔버스
  backgroundPrimary: '#0D0A1F', // Deep violet-black canvas
  backgroundSecondary: '#171233', // Card / Section
  backgroundElevated: '#221A45', // Modal / BottomSheet / DreamCard back panel

  // Text (바이올렛 틴트 화이트)
  textPrimary: '#F3EEFF',
  textSecondary: '#B9ACD9',
  textMuted: '#7E71A6',

  // Accent — 홀로그래픽 바이올렛(활성/링크/틴트)
  accentPrimary: '#B98BFF',
  accentPrimaryPressed: '#A374F0',
  accentPrimaryFaint: 'rgba(185,139,255,0.14)', // tinted selected state

  // Warm accent — 골드(따뜻한 CTA 포인트, 절제 사용)
  accentGold: '#F4C15A',
  accentGoldPressed: '#E0A93F',

  // UI lines
  borderSubtle: '#2E2456',
  divider: '#241C45',
  // 아르누보 골드 라인(패널 보더/디바이더 등 은은한 금선 강조)
  borderGold: 'rgba(244,193,90,0.30)',
  dividerGold: 'rgba(244,193,90,0.22)',

  // Status
  danger: '#FF6B8A',
  dangerFaint: 'rgba(255,107,138,0.14)',

  // Overlay / scrim
  overlayScrim: 'rgba(6,4,16,0.55)',

  // Decorative
  stardust: 'rgba(243,238,255,0.06)',

  // ── Holographic gradient stops (SVG LinearGradient/RadialGradient용) ──
  holoViolet: '#8B5CF6',
  holoMagenta: '#E763C6',
  holoCyan: '#54D6E8',
  holoBlue: '#5C8CF6',
  holoPink: '#FF8AD1',
};

// iridescent 스윕(카드 프레임/보더/CTA 그라디언트에 사용).
// SVG <Stop> 배열로 그대로 매핑하기 쉬운 형태.
export const HoloGradient = {
  // 카드 표면 발광(대각선 스윕)
  card: ['#3A2A6E', '#6B3FA0', '#B94FA6', '#5C79C9', '#3A2A6E'],
  // 보더 iridescent 링
  border: ['#8B5CF6', '#E763C6', '#54D6E8', '#8B5CF6'],
  // 따뜻한 CTA(샘플의 골드→마젠타 버튼)
  cta: ['#F4C15A', '#F08A5D', '#E763C6'],
  // 오로라 배경 헤일로
  aurora: ['#1B1140', '#3A1E63', '#12203F'],
};
