// frontend/src/components/symbols/icons/PigIcon.tsx
import React from 'react';
import Svg, { Ellipse, Path, Circle } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function PigIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* body */}
      <Ellipse cx="12" cy="14" rx="7.5" ry="5.5" stroke={color} strokeWidth={strokeWidth} />
      {/* ears */}
      <Path
        d="M6.5 9.5 L5 6.5 L8.5 8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.5 9.5 L19 6.5 L15.5 8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* tail curl */}
      <Path
        d="M19.3 15 C20.5 15 20.5 13 19.3 13"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* snout */}
      <Ellipse cx="12" cy="15" rx="2.6" ry="1.8" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="12" cy="15" r="0.5" fill={color} />
    </Svg>
  );
}
