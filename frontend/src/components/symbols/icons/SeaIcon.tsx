// frontend/src/components/symbols/icons/SeaIcon.tsx
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function SeaIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="17" cy="7" r="2.4" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M3 12.5 C5 10.5 7 10.5 9 12.5 C11 14.5 13 14.5 15 12.5 C17 10.5 19 10.5 21 12.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M3 17.5 C5 15.5 7 15.5 9 17.5 C11 19.5 13 19.5 15 17.5 C17 15.5 19 15.5 21 17.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
