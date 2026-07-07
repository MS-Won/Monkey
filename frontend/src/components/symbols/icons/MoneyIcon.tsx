// frontend/src/components/symbols/icons/MoneyIcon.tsx
import React from 'react';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function MoneyIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={strokeWidth} />
      <SvgText
        x="12"
        y="16.2"
        fontSize="10"
        fontWeight="700"
        fill={color}
        textAnchor="middle"
      >
        ₩
      </SvgText>
    </Svg>
  );
}
