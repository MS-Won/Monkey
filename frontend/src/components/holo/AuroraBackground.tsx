// frontend/src/components/holo/AuroraBackground.tsx
// ------------------------------------------------------------
// 전체 화면 앰비언트 오로라 배경 (iridescent). react-native-svg RadialGradient
// 3블롭(violet/magenta/cyan)을 딥 캔버스 위에 은은히 깔아 홀로그래픽 무드를 만든다.
// 퍼센트 좌표 기반이라 onLayout 측정 불필요. 배경 레이어로만 쓰이므로 터치 통과.
// ------------------------------------------------------------
import React from 'react';
import { StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Colors } from '../../theme';

type Props = {
  /** 블롭 세기(0~1). 은은하게=0.55 기본 */
  intensity?: number;
  style?: StyleProp<ViewStyle>;
};

let uid = 0;

export default function AuroraBackground({ intensity = 0.55, style }: Props) {
  const [ids] = React.useState(() => {
    uid += 1;
    return {
      v: `aurV${uid}`,
      m: `aurM${uid}`,
      c: `aurC${uid}`,
    };
  });

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {/* 상단-좌측 바이올렛 오로라 */}
          <RadialGradient id={ids.v} cx="22%" cy="14%" r="60%">
            <Stop offset="0" stopColor={Colors.holoViolet} stopOpacity={intensity} />
            <Stop offset="1" stopColor={Colors.holoViolet} stopOpacity={0} />
          </RadialGradient>
          {/* 우측 마젠타 오로라 */}
          <RadialGradient id={ids.m} cx="92%" cy="34%" r="55%">
            <Stop offset="0" stopColor={Colors.holoMagenta} stopOpacity={intensity * 0.85} />
            <Stop offset="1" stopColor={Colors.holoMagenta} stopOpacity={0} />
          </RadialGradient>
          {/* 하단 시안 오로라 */}
          <RadialGradient id={ids.c} cx="40%" cy="98%" r="65%">
            <Stop offset="0" stopColor={Colors.holoCyan} stopOpacity={intensity * 0.7} />
            <Stop offset="1" stopColor={Colors.holoCyan} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* 딥 캔버스 베이스 */}
        <Rect x="0" y="0" width="100%" height="100%" fill={Colors.backgroundPrimary} />
        {/* 오로라 블롭들(스크린 블렌드처럼 겹쳐 발광) */}
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${ids.v})`} />
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${ids.m})`} />
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${ids.c})`} />
      </Svg>
    </View>
  );
}
