// frontend/src/components/symbols/icons/FamilyIcon.tsx
import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function FamilyIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8.5" cy="10" r="4" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="15.5" cy="10" r="4" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="12" cy="16.5" r="2.6" fill={color} opacity={0.9} />
    </Svg>
  );
}
