// frontend/src/components/symbols/icons/HouseIcon.tsx
import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function HouseIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* roof */}
      <Path
        d="M4 11 L12 4 L20 11"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* body */}
      <Path
        d="M6 10.5 V19.5 H18 V10.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* door */}
      <Rect x="10.3" y="14" width="3.4" height="5.5" rx="0.4" fill={color} opacity={0.9} />
    </Svg>
  );
}
