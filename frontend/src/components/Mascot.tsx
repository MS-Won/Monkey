// frontend/src/components/Mascot.tsx
import React from 'react';
import Svg, { Circle, Ellipse, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme';

type MascotProps = {
  size?: number;
  color?: string;
  // v1 ships a single pose; more (e.g. "presenting", "peeking") can be added later
  // by branching on this prop without changing call sites.
  pose?: 'default';
  // holo=true면 단색 대신 iridescent(violet→cyan) 그라디언트 스트로크 사용(Splash 등).
  holo?: boolean;
};

let uid = 0;

export default function Mascot({ size = 96, color = Colors.accentPrimary, holo = false }: MascotProps) {
  const [gid] = React.useState(() => {
    uid += 1;
    return `mascotHolo${uid}`;
  });
  const paint = holo ? `url(#${gid})` : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {holo && (
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.holoViolet} />
            <Stop offset="0.5" stopColor={Colors.holoMagenta} />
            <Stop offset="1" stopColor={Colors.holoCyan} />
          </LinearGradient>
        </Defs>
      )}
      {/* ears */}
      <Circle cx="14" cy="25" r="7.5" stroke={paint} strokeWidth={2} />
      <Circle cx="50" cy="25" r="7.5" stroke={paint} strokeWidth={2} />
      {/* head */}
      <Circle cx="32" cy="36" r="19" stroke={paint} strokeWidth={2} />
      {/* face patch */}
      <Ellipse cx="32" cy="40" rx="11.5" ry="9.5" stroke={paint} strokeWidth={1.5} />
      {/* eyes */}
      <Circle cx="26.5" cy="35" r="1.7" fill={paint} />
      <Circle cx="37.5" cy="35" r="1.7" fill={paint} />
      {/* nose */}
      <Circle cx="32" cy="40.5" r="1" fill={paint} />
      {/* smile */}
      <Path
        d="M25.5 45 Q32 50 38.5 45"
        stroke={paint}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* hair tuft */}
      <Path
        d="M27 18 Q32 13 37 18"
        stroke={paint}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
