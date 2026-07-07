// frontend/src/components/holo/Ornament.tsx
// 아르누보(무하풍) 골드 플러리시 — 대칭 휘프래시 곡선 + 중앙 로젠지.
// 섹션 구분/타이틀 하단 장식으로 재사용해 앱 전반에 아르누보 톤을 얹는다.
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { Colors } from '../../theme';

type Props = {
  width?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export default function Ornament({ width = 180, color = Colors.accentGold, style }: Props) {
  const height = (width * 24) / 200;
  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 200 24">
        <G stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round">
          {/* 좌측 휘프래시 곡선 */}
          <Path d="M100 12 C 80 3, 62 21, 42 12 C 32 7, 24 13, 16 12" />
          {/* 우측(대칭) */}
          <Path d="M100 12 C 120 3, 138 21, 158 12 C 168 7, 176 13, 184 12" />
          {/* 곁가지 잎사귀 */}
          <Path d="M62 12 C 60 6, 66 4, 70 6" />
          <Path d="M138 12 C 140 6, 134 4, 130 6" />
        </G>
        {/* 종단 점 */}
        <Circle cx="16" cy="12" r="2.2" fill={color} />
        <Circle cx="184" cy="12" r="2.2" fill={color} />
        {/* 중앙 로젠지 */}
        <Path d="M100 3 L105 12 L100 21 L95 12 Z" fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
