// frontend/src/components/symbols/icons/RiverIcon.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function RiverIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 3 C10 6 6 8 8 11 C10 14 6 16 8 19 C9 20.5 10.5 21 12 21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* tributary */}
      <Path
        d="M14 10 C16 12 15 15 17 17"
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
