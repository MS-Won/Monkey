// frontend/src/components/DreamCard/CardCreationLoader.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Mascot from '../Mascot';
import AuroraBackground from '../holo/AuroraBackground';

type CardCreationLoaderProps = {
  label?: string;
  sublabel?: string;
};

export default function CardCreationLoader({
  label = '카드를 만들고 있어요…',
  sublabel = '꿈의 의미를 차분히 정리하고 있습니다',
}: CardCreationLoaderProps) {
  const bob = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [bob, pulse]);

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(bob.value, [0, 1], [0, -8]) }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.96, 1]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.7, 1]),
  }));

  return (
    <View style={styles.container}>
      <AuroraBackground intensity={0.5} />
      <Animated.View style={mascotStyle}>
        <Mascot size={72} holo />
      </Animated.View>
      <Animated.View style={[styles.cardSilhouette, cardStyle]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.sublabel}>{sublabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  cardSilhouette: {
    width: 120,
    height: 168,
    borderRadius: Radius.lg,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.accentPrimary,
  },
  label: {
    ...Typography.h2,
    textAlign: 'center',
  },
  sublabel: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
