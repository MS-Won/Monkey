// frontend/src/components/symbols/icons/SchoolIcon.tsx
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function SchoolIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* mortarboard */}
      <Path
        d="M12 6 L21 10 L12 14 L3 10 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M7 12 V16 C7 17.7 9.2 19 12 19 C14.8 19 17 17.7 17 16 V12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* tassel */}
      <Path d="M21 10 V14.5" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" />
      <Circle cx="21" cy="15.3" r="0.7" fill={color} />
    </Svg>
  );
}
