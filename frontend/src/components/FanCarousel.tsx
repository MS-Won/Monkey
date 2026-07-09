// frontend/src/components/FanCarousel.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  clamp,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import DreamCard from './DreamCard/DreamCard';
import { Spacing, Typography } from '../theme';
import { resolveArchetypeCard } from '../data/archetypeCards';

const CARD_WIDTH = 168;
const FAN_SPACING = 52;
const ARC_DROOP = 12;

type FanCarouselProps<T> = {
  items: T[];
  keyExtractor: (item: T) => string;
  getKeyword: (item: T) => string;
  onOpenFocused: (item: T) => void;
  /** 포커스된(가운데) 카드가 바뀔 때마다 호출 — 상단 날짜 표시 등에 사용 */
  onFocusChange?: (item: T) => void;
};

export default function FanCarousel<T>({
  items,
  keyExtractor,
  getKeyword,
  onOpenFocused,
  onFocusChange,
}: FanCarouselProps<T>) {
  const activeIndex = useSharedValue(0);
  const dragX = useSharedValue(0);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    if (onFocusChange && items[index] !== undefined) {
      onFocusChange(items[index]);
    }
  };

  // 최초 마운트 시 첫 카드로 1회 통지
  useEffect(() => {
    if (items.length > 0 && onFocusChange) {
      onFocusChange(items[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const panGesture = Gesture.Pan()
    .onChange(e => {
      dragX.value += e.changeX;
    })
    .onEnd(e => {
      const threshold = CARD_WIDTH * 0.3;
      let next = activeIndex.value;
      if (dragX.value < -threshold || e.velocityX < -800) {
        next = Math.min(activeIndex.value + 1, items.length - 1);
      } else if (dragX.value > threshold || e.velocityX > 800) {
        next = Math.max(activeIndex.value - 1, 0);
      }
      activeIndex.value = next;
      dragX.value = withSpring(0, { damping: 18, stiffness: 160 });
      runOnJS(handleFocus)(next);
    });

  const focusOn = (index: number) => {
    activeIndex.value = withSpring(index, { damping: 18, stiffness: 160 });
    handleFocus(index);
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.stage}>
          {items.map((item, index) => (
            <CarouselCard
              key={keyExtractor(item)}
              index={index}
              activeIndex={activeIndex}
              dragX={dragX}
              keyword={getKeyword(item)}
              isFocused={index === focusedIndex}
              onPress={() => {
                if (index === focusedIndex) {
                  onOpenFocused(item);
                } else {
                  focusOn(index);
                }
              }}
            />
          ))}
        </View>
      </GestureDetector>
      <Text style={styles.hint}>카드를 옆으로 넘겨보세요 · 가운데 카드를 탭하면 펼쳐져요</Text>
    </View>
  );
}

function CarouselCard({
  index,
  activeIndex,
  dragX,
  keyword,
  isFocused,
  onPress,
}: {
  index: number;
  activeIndex: SharedValue<number>;
  dragX: SharedValue<number>;
  keyword: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const offset = index - activeIndex.value - dragX.value / CARD_WIDTH;
    const translateX = offset * FAN_SPACING;
    const translateY = Math.abs(offset) * ARC_DROOP;
    const rotateZ = clamp(offset * 8, -24, 24);
    // 가운데(포커스) 카드를 가장 크게, 양옆으로 갈수록 확실히 작게
    const scale = interpolate(
      Math.abs(offset),
      [0, 1, 2, 3],
      [1, 0.76, 0.68, 0.6],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(Math.abs(offset), [0, 2.5, 3], [1, 1, 0], Extrapolation.CLAMP);

    return {
      transform: [{ translateX }, { translateY }, { rotateZ: `${rotateZ}deg` }, { scale }],
      opacity,
      zIndex: Math.round(100 - Math.abs(offset) * 10),
    };
  });

  return (
    <Animated.View style={[styles.cardSlot, animatedStyle]}>
      <DreamCard
        card={resolveArchetypeCard(keyword)}
        flipped={false}
        onToggleFlip={onPress}
        renderBack={() => null}
        size="compact"
        style={isFocused ? styles.focusedCard : undefined}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  stage: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSlot: {
    position: 'absolute',
  },
  focusedCard: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  hint: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
