// frontend/src/components/symbols/icons/SnakeIcon.tsx
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function SnakeIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* winding body */}
      <Path
        d="M5 18 C5 14 11 16 11 12 C11 8 5 10 5 6 C5 4 7 3.2 9 3.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* head */}
      <Path
        d="M9 3.6 C11.5 4 12.5 6 11 7.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* tongue */}
      <Path
        d="M12.6 5 L14.2 4.4 M12.6 5 L14 5.8"
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
      />
      <Circle cx="10.2" cy="4.6" r="0.5" fill={color} />
    </Svg>
  );
}
