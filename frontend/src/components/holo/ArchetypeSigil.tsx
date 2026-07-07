// frontend/src/components/holo/ArchetypeSigil.tsx
// ------------------------------------------------------------
// 아키타입 카드 중앙의 신비 문양(sigil). 30장 개별 일러스트 없이,
// polarity(정서 극성)로 중심 글리프를 정하고 id로 별 배치를 변주해
// "한 벌의 타로 덱"처럼 보이되 카드마다 미묘히 다른 문양을 만든다.
// 전부 로컬 SVG → 렌더 비용 0, AI 이미지 호출 없음.
// ------------------------------------------------------------
import React from 'react';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle,
  Path,
  G,
  Line,
} from 'react-native-svg';
import type { ArchetypeCard } from '../../data/archetypeCards';
import { Colors } from '../../theme';

type Props = {
  card: ArchetypeCard;
  size?: number;
};

// polarity별 중심 글리프 색/모티프
const POLARITY = {
  light: { tint: Colors.holoCyan, glow: '#FFE9A8' },
  neutral: { tint: Colors.holoViolet, glow: '#D9C6FF' },
  shadow: { tint: Colors.holoMagenta, glow: '#FFC2E6' },
} as const;

// 중심 글리프 경로 (viewBox 100x100 기준, 중심 50,50)
function CenterGlyph({ polarity, color }: { polarity: ArchetypeCard['polarity']; color: string }) {
  if (polarity === 'light') {
    // 8방향 광선(태양/새벽)
    const rays = Array.from({ length: 8 }).map((_, i) => {
      const a = (Math.PI / 4) * i;
      const x1 = 50 + Math.cos(a) * 9;
      const y1 = 50 + Math.sin(a) * 9;
      const x2 = 50 + Math.cos(a) * 20;
      const y2 = 50 + Math.sin(a) * 20;
      return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.6} strokeLinecap="round" />;
    });
    return (
      <G>
        {rays}
        <Circle cx={50} cy={50} r={7} fill="none" stroke={color} strokeWidth={1.8} />
      </G>
    );
  }
  if (polarity === 'shadow') {
    // 하강 삼각 + 내부 눈(무의식/그림자)
    return (
      <G>
        <Path d="M36 40 L64 40 L50 64 Z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        <Circle cx={50} cy={48} r={3.2} fill={color} />
      </G>
    );
  }
  // neutral: 초승달
  return (
    <Path
      d="M58 38 A15 15 0 1 0 58 62 A11 11 0 1 1 58 38 Z"
      fill={color}
      opacity={0.9}
    />
  );
}

export default function ArchetypeSigil({ card, size = 120 }: Props) {
  const pal = POLARITY[card.polarity];
  // id 기반 12개 궤도 별 중 켜질 별 선택(카드마다 다른 별자리)
  const stars = Array.from({ length: 12 }).map((_, i) => {
    const on = ((card.id * 7 + i * 5) % 3 === 0) || i === card.id % 12;
    const a = (Math.PI / 6) * i - Math.PI / 2;
    const r = 40;
    return {
      x: 50 + Math.cos(a) * r,
      y: 50 + Math.sin(a) * r,
      on,
      big: (card.id + i) % 4 === 0,
    };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="sigilGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={pal.glow} stopOpacity={0.35} />
          <Stop offset="0.6" stopColor={pal.tint} stopOpacity={0.12} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="sigilRing" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={Colors.holoViolet} />
          <Stop offset="0.5" stopColor={pal.tint} />
          <Stop offset="1" stopColor={Colors.holoMagenta} />
        </LinearGradient>
      </Defs>

      {/* 중심 헤일로 */}
      <Circle cx={50} cy={50} r={48} fill="url(#sigilGlow)" />

      {/* 이중 궤도 링 */}
      <Circle cx={50} cy={50} r={44} fill="none" stroke="url(#sigilRing)" strokeWidth={0.8} opacity={0.7} />
      <Circle cx={50} cy={50} r={30} fill="none" stroke={pal.tint} strokeWidth={0.6} opacity={0.5} strokeDasharray="1.5 3" />

      {/* 별자리 점 */}
      {stars.map((s, i) =>
        s.on ? (
          <Circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.big ? 1.7 : 1}
            fill={i % 2 === 0 ? pal.glow : Colors.textPrimary}
            opacity={0.9}
          />
        ) : null,
      )}

      {/* 중심 글리프 */}
      <CenterGlyph polarity={card.polarity} color={pal.glow} />
    </Svg>
  );
}
