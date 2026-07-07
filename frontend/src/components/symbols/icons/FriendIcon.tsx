// frontend/src/components/symbols/icons/FriendIcon.tsx
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '../../../theme';
import { IconProps } from '../types';

export default function FriendIcon({ size = 40, color = Colors.accentPrimary, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8.5" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="15" cy="8.5" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M4.5 19 C4.5 15 6.5 13 9 13 C10 13 10.9 13.3 11.6 13.9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M19.5 19 C19.5 15 17.5 13 15 13 C14 13 13.1 13.3 12.4 13.9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
