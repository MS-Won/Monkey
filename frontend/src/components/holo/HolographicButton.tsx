// frontend/src/components/holo/HolographicButton.tsx
// ------------------------------------------------------------
// 시그니처 CTA. 샘플(image_sample.png)의 골드→마젠타 그라디언트 버튼을
// react-native-svg LinearGradient로 재현. onLayout 실측으로 유동 폭 대응.
// ------------------------------------------------------------
import React, { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Colors, Typography, Radius, HoloGradient } from '../../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

let uid = 0;

export default function HolographicButton({ label, onPress, disabled, style }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [id] = useState(() => {
    uid += 1;
    return `holoBtn${uid}`;
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.btn,
        { opacity: disabled ? 0.45 : pressed ? 0.9 : 1 },
        style,
      ]}>
      {size.w > 0 && (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
              {HoloGradient.cta.map((c, i) => (
                <Stop key={i} offset={i / (HoloGradient.cta.length - 1)} stopColor={c} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={size.w}
            height={size.h}
            rx={Radius.pill}
            ry={Radius.pill}
            fill={`url(#${id})`}
          />
        </Svg>
      )}
      <View style={styles.inner}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    ...Typography.h3,
    color: '#1A0E22', // 밝은 그라디언트 위 고대비 다크 텍스트
    letterSpacing: 0.5,
  },
});
