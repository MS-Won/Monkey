// frontend/src/components/holo/HolographicFrame.tsx
// ------------------------------------------------------------
// iridescent 홀로그래픽 표면 + 보더 글로우 (react-native-svg 기반).
// 네이티브 그래디언트 라이브러리 없이 SVG로 구현 → 추가 네이티브 의존성 0.
// 유동 크기(부모 100% 등)에도 대응하기 위해 onLayout으로 실측 후 렌더.
// children은 표면 위에 절대배치되어 렌더된다.
// ------------------------------------------------------------
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { HoloGradient, Colors } from '../../theme';

type Props = {
  radius?: number;
  /** 보더 iridescent 링 표시 */
  border?: boolean;
  /** 상단 하이라이트 글로우 표시 */
  glow?: boolean;
  /** 카드 표면 스윕 세기(0~1) — 잔잔하게=0.7 기본 */
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

let uid = 0;

export default function HolographicFrame({
  radius = 18,
  border = true,
  glow = true,
  intensity = 0.85,
  style,
  children,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  // 인스턴스별 gradient id 충돌 방지
  const [ids] = useState(() => {
    uid += 1;
    return { g: `holoG${uid}`, glow: `holoGlow${uid}`, b: `holoB${uid}` };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) {
      setSize({ w: width, h: height });
    }
  };

  const stroke = 1.5;
  const inset = stroke / 2;

  return (
    <View style={[styles.wrap, { borderRadius: radius }, style]} onLayout={onLayout}>
      {size.w > 0 && size.h > 0 && (
        <Svg
          width={size.w}
          height={size.h}
          style={StyleSheet.absoluteFill}
          pointerEvents="none">
          <Defs>
            {/* 대각선 iridescent 스윕 */}
            <LinearGradient id={ids.g} x1="0%" y1="0%" x2="100%" y2="100%">
              {HoloGradient.card.map((c, i) => (
                <Stop
                  key={i}
                  offset={i / (HoloGradient.card.length - 1)}
                  stopColor={c}
                  stopOpacity={intensity}
                />
              ))}
            </LinearGradient>
            {/* 상단-좌측 하이라이트 글로우 */}
            <RadialGradient id={ids.glow} cx="28%" cy="18%" r="75%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.28} />
              <Stop offset="0.45" stopColor={Colors.holoCyan} stopOpacity={0.1} />
              <Stop offset="1" stopColor="#000000" stopOpacity={0} />
            </RadialGradient>
            {/* 보더 iridescent 링 */}
            <LinearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
              {HoloGradient.border.map((c, i) => (
                <Stop
                  key={i}
                  offset={i / (HoloGradient.border.length - 1)}
                  stopColor={c}
                  stopOpacity={0.9}
                />
              ))}
            </LinearGradient>
          </Defs>

          <Rect
            x={0}
            y={0}
            width={size.w}
            height={size.h}
            rx={radius}
            ry={radius}
            fill={`url(#${ids.g})`}
          />
          {glow && (
            <Rect
              x={0}
              y={0}
              width={size.w}
              height={size.h}
              rx={radius}
              ry={radius}
              fill={`url(#${ids.glow})`}
            />
          )}
          {border && (
            <Rect
              x={inset}
              y={inset}
              width={size.w - stroke}
              height={size.h - stroke}
              rx={radius - inset}
              ry={radius - inset}
              fill="none"
              stroke={`url(#${ids.b})`}
              strokeWidth={stroke}
            />
          )}
        </Svg>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: Colors.backgroundSecondary, // SVG 로드 전 폴백
  },
});
