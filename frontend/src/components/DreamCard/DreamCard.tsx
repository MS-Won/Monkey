// frontend/src/components/DreamCard/DreamCard.tsx
// Dream Goddess 아키타입 카드. 앞면=일러스트(full-bleed)+아르누보 톤 텍스트 오버레이, 뒷면=해몽.
import React, { useEffect } from 'react';
import {
  Pressable,
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import type { ArchetypeCard } from '../../data/archetypeCards';
import { getCardArt } from '../../data/cardArt';

type DreamCardProps = {
  card: ArchetypeCard;
  flipped: boolean;
  onToggleFlip: () => void;
  renderBack: () => React.ReactNode;
  size?: 'compact' | 'full';
  entrance?: boolean;
  style?: StyleProp<ViewStyle>;
};

// 카드 종횡비를 일러스트(832×1248 = 정확히 2:3)와 동일하게 맞춰 cover 크롭이 없게 한다.
const CARD_RATIO = 2 / 3;

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 텍스트 가독성용 상/하단 스크림(어두운 그라디언트). react-native-svg로 구현. */
function Scrim({ position }: { position: 'top' | 'bottom' }) {
  const top = position === 'top';
  return (
    <Svg style={[styles.scrim, top ? styles.scrimTop : styles.scrimBottom]} pointerEvents="none">
      <Defs>
        <LinearGradient id={`scrim-${position}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#050310" stopOpacity={top ? 0.72 : 0} />
          <Stop offset="1" stopColor="#050310" stopOpacity={top ? 0 : 0.86} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#scrim-${position})`} />
    </Svg>
  );
}

export default function DreamCard({
  card,
  flipped,
  onToggleFlip,
  renderBack,
  size = 'full',
  entrance = false,
  style,
}: DreamCardProps) {
  const rotate = useSharedValue(0);
  const enter = useSharedValue(entrance ? 0 : 1);

  useEffect(() => {
    rotate.value = withTiming(flipped ? 1 : 0, {
      duration: 480,
      easing: Easing.inOut(Easing.quad),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped]);

  useEffect(() => {
    if (entrance) {
      enter.value = withSpring(1, { damping: 14, stiffness: 120 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const frontStyle = useAnimatedStyle(() => {
    const flipDeg = interpolate(rotate.value, [0, 1], [0, 180]);
    const enterDeg = interpolate(enter.value, [0, 1], [90, 0]);
    const scale = interpolate(enter.value, [0, 1], [0.6, 1]);
    return {
      opacity: interpolate(rotate.value, [0, 0.5, 0.5, 1], [1, 1, 0, 0]),
      transform: [{ perspective: 1200 }, { rotateY: `${flipDeg + enterDeg}deg` }, { scale }],
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const flipDeg = interpolate(rotate.value, [0, 1], [180, 360]);
    const scale = interpolate(enter.value, [0, 1], [0.6, 1]);
    return {
      opacity: interpolate(rotate.value, [0, 0.5, 0.5, 1], [0, 0, 1, 1]),
      transform: [{ perspective: 1200 }, { rotateY: `${flipDeg}deg` }, { scale }],
    };
  });

  const compact = size === 'compact';
  const art = getCardArt(card.id);

  return (
    <Pressable
      onPress={onToggleFlip}
      style={[compact ? styles.cardCompact : styles.cardFull, style]}>

      {/* 앞면 — 카드 일러스트 (id·영문명/의미·한글명/의미가 이미지에 이미 구워져 있어 앱 오버레이 없음) */}
      <Animated.View style={[styles.face, styles.frontFace, frontStyle]}>
        {art ? (
          // contain: 일러스트(프레임 포함) 전체를 잘림 없이 카드에 맞춘다.
          <Image source={art} style={styles.artImage} resizeMode="contain" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.artFallback]} />
        )}
      </Animated.View>

      {/* 뒷면 — 해몽(가독성 위해 어두운 표면 + 골드 보더) */}
      <Animated.View style={[styles.face, styles.back, backStyle]}>
        <ScrollView style={styles.backScroll} contentContainerStyle={styles.backContent}>
          {renderBack()}
        </ScrollView>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 2:3 종횡비로 고정 → 일러스트(2:3)와 정확히 일치, cover 크롭 없음
  cardCompact: {
    width: 178,
    aspectRatio: CARD_RATIO,
  },
  cardFull: {
    width: '100%',
    aspectRatio: CARD_RATIO,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.xl,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  frontFace: {
    borderWidth: 1,
    borderColor: Colors.accentGold,
    backgroundColor: Colors.backgroundPrimary,
  },
  // 명시적 width/height 필수: absoluteFill(inset만)로는 Android에서 resizeMode="contain"이
  // 박스를 제대로 못 잡아 이미지가 확대·우측 치우침으로 잘려 렌더된다.
  artImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  artFallback: {
    backgroundColor: Colors.backgroundElevated,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  scrimTop: {
    top: 0,
    height: '30%',
  },
  scrimBottom: {
    bottom: 0,
    height: '42%',
  },
  frontOverlay: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  topBlock: {
    alignItems: 'center',
    gap: 2,
  },
  cardNo: {
    ...Typography.overline,
    color: Colors.accentGold,
    letterSpacing: 2,
  },
  symbol: {
    color: '#FDF6E3',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  symbolCompact: {
    fontSize: 16,
    letterSpacing: 1.5,
    lineHeight: 22,
  },
  bottomBlock: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: '100%',
  },
  holoRule: {
    width: 40,
    height: 1,
    backgroundColor: Colors.accentGold,
    opacity: 0.7,
    marginBottom: 2,
  },
  nameKo: {
    ...Typography.h2,
    color: Colors.textPrimary,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  nameKoCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  meaning: {
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  hint: {
    ...Typography.overline,
    color: Colors.textMuted,
    marginTop: 2,
  },
  back: {
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.accentGold,
  },
  backScroll: { flex: 1 },
  backContent: { padding: Spacing.lg },
});
