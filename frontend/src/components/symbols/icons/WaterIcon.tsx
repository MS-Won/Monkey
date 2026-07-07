// frontend/src/components/symbols/icons/WaterIcon.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function WaterIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* droplet */}
      <Path
        d="M12 3.5 C15.5 8 17.5 11 17.5 14 C17.5 17.6 15 20 12 20 C9 20 6.5 17.6 6.5 14 C6.5 11 8.5 8 12 3.5 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* ripple lines inside */}
      <Path
        d="M9 15 C10 16.2 14 16.2 15 15"
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
