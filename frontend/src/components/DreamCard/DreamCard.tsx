// frontend/src/components/DreamCard/DreamCard.tsx
// Dream Goddess 아키타입 카드. 앞면=일러스트 원본 그대로, 뒷면=해몽.
// 한글 이름/뜻은 이 컴포넌트가 아니라 CardLabel이 카드 바깥 위쪽에 그린다.
import React, { useEffect } from 'react';
import {
  Pressable,
  View,
  Image,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius } from '../../theme';
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
  /**
   * 뒤집었을 때 뒷면이 내용만큼 세로로 늘어나게 한다.
   *
   * 기본값(false)은 카드가 2:3 비율로 고정되고 뒷면이 내부 스크롤을 갖는다.
   * 해몽 전문을 한 프레임에 담으면 그 작은 상자 안에서 중첩 스크롤이 생겨
   * 읽기 어려우므로, 해몽 화면에서는 이 값을 켜서 페이지 단위로 읽히게 한다.
   */
  growBack?: boolean;
};

// 카드 종횡비를 일러스트(1024×1536 = 정확히 2:3)와 동일하게 맞춰 cover 크롭이 없게 한다.
const CARD_RATIO = 2 / 3;

export default function DreamCard({
  card,
  flipped,
  onToggleFlip,
  renderBack,
  size = 'full',
  entrance = false,
  style,
  growBack = false,
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

  // 뒤집힌 뒤에만 높이 제약을 푼다. 앞면일 때는 일러스트 비율(2:3)을 지켜야 한다.
  const expanded = growBack && flipped;

  return (
    <Pressable
      onPress={onToggleFlip}
      style={[
        compact ? styles.cardCompact : expanded ? styles.cardFullGrow : styles.cardFull,
        style,
      ]}>

      {/* 앞면 — 카드 일러스트 원본. id 메달리온과 영문 이름판이 원본에 그려져 있고
          둘 다 그림과 겹치지 않으므로 앱에서 얹는 오버레이는 없다. */}
      <Animated.View style={[styles.face, styles.frontFace, frontStyle]}>
        {art ? (
          // contain: 일러스트(프레임 포함) 전체를 잘림 없이 카드에 맞춘다.
          <Image source={art} style={styles.artImage} resizeMode="contain" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.artFallback]} />
        )}
      </Animated.View>

      {/* 뒷면 — 해몽(가독성 위해 어두운 표면 + 골드 보더) */}
      <Animated.View
        style={[styles.face, styles.back, expanded && styles.backGrow, backStyle]}>
        {expanded ? (
          // 내용이 높이를 결정한다. 스크롤은 화면(페이지)이 담당한다.
          <View style={styles.backContent}>{renderBack()}</View>
        ) : (
          <ScrollView style={styles.backScroll} contentContainerStyle={styles.backContent}>
            {renderBack()}
          </ScrollView>
        )}
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
  // 뒤집힌 뒤: 비율 고정을 풀고 뒷면 내용이 높이를 정하게 한다.
  cardFullGrow: {
    width: '100%',
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
  back: {
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.accentGold,
  },
  // position을 relative로 되돌려 이 면이 카드 높이를 만들게 한다.
  // (face가 absolute라 그대로 두면 높이가 0이 된다)
  backGrow: {
    position: 'relative',
  },
  backScroll: { flex: 1 },
  backContent: { padding: Spacing.lg },
});
