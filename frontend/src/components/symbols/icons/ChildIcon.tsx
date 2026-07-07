// frontend/src/components/symbols/icons/ChildIcon.tsx
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function ChildIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* head */}
      <Circle cx="12" cy="7.5" r="3.3" stroke={color} strokeWidth={strokeWidth} />
      {/* body / onesie */}
      <Path
        d="M7.5 20 C7.5 14.5 9 12.5 12 12.5 C15 12.5 16.5 14.5 16.5 20"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* cheek accent */}
      <Circle cx="10.2" cy="8.2" r="0.5" fill={color} />
    </Svg>
  );
}
