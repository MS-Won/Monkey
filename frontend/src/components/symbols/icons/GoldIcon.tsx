// frontend/src/components/symbols/icons/GoldIcon.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function GoldIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* gem outline */}
      <Path
        d="M6 9 L9 4.5 H15 L18 9 L12 19.5 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* facet lines */}
      <Path
        d="M6 9 H18 M9 4.5 L12 9 L15 4.5 M12 9 L12 19.5"
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
