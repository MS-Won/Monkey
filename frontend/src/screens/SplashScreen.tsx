import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigator';
import { loadUserProfile } from '../storage/userProfile';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import Mascot from '../components/Mascot';
import AuroraBackground from '../components/holo/AuroraBackground';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

// ✅ Splash가 "눈에 보일 정도"로 최소 표시되는 시간(ms)
const MIN_SPLASH_MS = 700;

export default function SplashScreen() {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const init = async () => {
      const start = Date.now();

      try {
        const profile = await loadUserProfile();
        const hasProfile = !!profile?.name && profile.name.trim().length >= 1;

        // ✅ 최소 표시 시간 보장
        const elapsed = Date.now() - start;
        if (elapsed < MIN_SPLASH_MS) {
          await sleep(MIN_SPLASH_MS - elapsed);
        }

        if (hasProfile) {
          navigation.replace('Main');
        } else {
          navigation.replace('OnboardingProfile');
        }
      } catch (e) {
        // ✅ 에러가 나도 최소 표시 시간은 보장
        const elapsed = Date.now() - start;
        if (elapsed < MIN_SPLASH_MS) {
          await sleep(MIN_SPLASH_MS - elapsed);
        }

        navigation.replace('OnboardingProfile');
      }
    };

    init();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <AuroraBackground intensity={0.62} />
      <View style={styles.halo}>
        <Mascot size={92} holo />
      </View>
      <Text style={styles.title}>Monkey</Text>
      <Text style={styles.tagline}>꿈을 풀다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  halo: {
    width: 148,
    height: 148,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.stardust,
    borderWidth: 1,
    borderColor: Colors.accentPrimaryFaint,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.display,
    marginTop: 6,
  },
  tagline: {
    ...Typography.overline,
    color: Colors.accentPrimary,
    letterSpacing: 4,
  },
});
