// frontend/src/components/symbols/icons/GenericIcon.tsx
import React from 'react';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

// Tier-3 fallback: a quiet ring with a "?" mark, used for any keyword that
// doesn't yet have a hand-crafted icon in the registry.
export default function GenericIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.2" stroke={color} strokeWidth={strokeWidth} />
      <SvgText x="12" y="16" fontSize="10" fontWeight="700" fill={color} textAnchor="middle">
        ?
      </SvgText>
    </Svg>
  );
}
