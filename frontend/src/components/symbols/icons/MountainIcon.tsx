// frontend/src/components/symbols/icons/MountainIcon.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function MountainIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18 L9 8 L13 14 L15.5 10.5 L21 18 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* snow cap accent */}
      <Path d="M9 8 L10.6 10.3 H7.4 Z" fill={color} opacity={0.9} />
    </Svg>
  );
}
