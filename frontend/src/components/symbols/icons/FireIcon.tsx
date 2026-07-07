// frontend/src/components/symbols/icons/FireIcon.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function FireIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* outer flame */}
      <Path
        d="M12 3 C13.5 6 17 8.5 17 13 C17 17 14.5 20 12 20 C9.5 20 7 17.5 7 13.8 C7 12 7.8 10.8 8.6 10 C8.6 12 9.6 13 10.6 12.8 C9.8 10.5 10.4 7.8 12 3 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* inner flame accent */}
      <Path
        d="M12 11 C13 13 13.6 14.4 12.8 16 C12.2 17.2 10.6 17.2 10.2 15.8 C9.8 14.4 10.6 12.8 12 11 Z"
        fill={color}
        opacity={0.9}
      />
    </Svg>
  );
}
