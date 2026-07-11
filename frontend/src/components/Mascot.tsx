// frontend/src/components/Mascot.tsx
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Colors } from '../theme';

// 원숭이 점술가 캐릭터(앱 아이콘과 동일 일러스트). 정적 에셋.
const MASCOT = require('../../assets/images/mascot.png');

type MascotProps = {
  size?: number;
  color?: string;
  pose?: 'default';
  // holo=true면 보라 발광(glow)을 둘러 스플래시 등에서 강조.
  holo?: boolean;
};

export default function Mascot({ size = 96, holo = false }: MascotProps) {
  const radius = size * 0.22;
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: radius },
        holo && {
          shadowColor: Colors.holoViolet,
          shadowOpacity: 0.7,
          shadowRadius: size * 0.16,
          shadowOffset: { width: 0, height: 0 },
          elevation: 10,
        },
      ]}>
      <Image
        source={MASCOT}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201,162,255,0.35)',
  },
});
