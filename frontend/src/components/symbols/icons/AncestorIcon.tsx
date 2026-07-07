// frontend/src/components/symbols/icons/AncestorIcon.tsx
import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

// Ancestral memorial tablet (위패) with incense — traditional 제사 motif.
export default function AncestorIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 20 V8.5 C9 6 10.3 4.5 12 4.5 C13.7 4.5 15 6 15 8.5 V20 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path d="M9 20 H15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* incense stick + smoke */}
      <Path d="M5 20 V13" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" />
      <Path
        d="M5 13 C4.3 12 5.7 11 5 10"
        stroke={color}
        strokeWidth={strokeWidth * 0.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}
