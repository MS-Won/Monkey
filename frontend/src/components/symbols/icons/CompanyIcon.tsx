// frontend/src/components/symbols/icons/CompanyIcon.tsx
import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function CompanyIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4.5" y="4" width="15" height="16" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M8 8 H10.5 M13.5 8 H16 M8 11.5 H10.5 M13.5 11.5 H16 M8 15 H10.5 M13.5 15 H16"
        stroke={color}
        strokeWidth={strokeWidth * 0.85}
        strokeLinecap="round"
      />
      <Rect x="10" y="17.3" width="4" height="2.7" fill={color} opacity={0.9} />
    </Svg>
  );
}
