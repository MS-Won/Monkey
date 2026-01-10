import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigator';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<NavProp>();

  useEffect(() => {
    // ✅ 3초 뒤 Profile로 이동
    const timer = setTimeout(() => {
      navigation.replace('Profile');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={[Typography.title, styles.logo]}>MONKEY</Text>

      {/* 최하단 Beta Version */}
      <Text style={styles.beta}>Beta Version</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    letterSpacing: 3,
  },
  beta: {
    position: 'absolute',
    bottom: 28,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
