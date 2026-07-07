import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { loadUserProfile } from '../storage/userProfile';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import TextField from '../components/TextField';
import Button from '../components/Button';
import AuroraBackground from '../components/holo/AuroraBackground';
import HolographicButton from '../components/holo/HolographicButton';
import Ornament from '../components/holo/Ornament';

export default function HomeScreen() {
  const [name, setName] = useState<string | null>(null);
  const [dreamText, setDreamText] = useState<string>(''); // ✅ Home에 입력 UI

  // ✅ Tab 화면에서 Root Stack(Input)으로 이동해야 하므로 any 사용(기존 구조 유지용)
  const navigation = useNavigation<any>();

  // ✅ Profile 탭에서 이름을 바꾸고 돌아와도 반영되도록 포커스 시마다 재로드
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const profile = await loadUserProfile();
          setName(profile?.name ?? null);
        } catch {
          setName(null);
        }
      })();
    }, []),
  );

  const onPressInterpretText = () => {
    const trimmed = dreamText.trim();
    if (!trimmed) {
      Alert.alert('알림', '꿈 내용을 입력해주세요.');
      return;
    }

    // ✅ 기존 흐름 유지: Home(탭) → Input(컨트롤러) → Result
    navigation.navigate('Input', { dreamText: trimmed, mode: 'text' });
  };

  const onPressVoice = () => {
    // ✅ STT는 InputScreen에서 처리(기존 기능 복구)
    navigation.navigate('Input', { mode: 'voice' });
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* 1) 히어로 */}
        <Text style={styles.overline}>MONKEY · 꿈을 풀다</Text>
        <Text style={styles.greeting}>
          {name ? `${name}님,\n오늘 밤 어떤 꿈을 꾸셨나요?` : '오늘 밤,\n어떤 꿈을 꾸셨나요?'}
        </Text>

        <Ornament width={160} style={styles.ornament} />

        {/* 2) 입력 글래스 패널 */}
        <View style={styles.panel}>
          <TextField
            label="꿈 내용"
            value={dreamText}
            onChangeText={setDreamText}
            multiline
            minHeight={150}
            placeholder="예) 낯선 골목을 걷다가 누군가에게 쫓겼고, 결국 문을 잠그고 숨었다."
          />

          <View style={styles.buttonRow}>
            <Button
              label="음성 입력"
              variant="secondary"
              onPress={onPressVoice}
              style={styles.flexBtn}
            />
            <HolographicButton
              label="해몽하기"
              onPress={onPressInterpretText}
              style={styles.flexBtn}
            />
          </View>
        </View>

        <Text style={[Typography.caption, styles.hint]}>
          텍스트로 적거나 음성으로 들려주세요. 오래된 해몽의 시선으로 풀어드립니다.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
    gap: Spacing.md,
  },
  overline: {
    ...Typography.overline,
    color: Colors.accentPrimary,
  },
  greeting: {
    ...Typography.h1,
    fontSize: 27,
    lineHeight: 36,
    marginBottom: Spacing.sm,
  },
  ornament: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  panel: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  flexBtn: {
    flex: 1,
  },
  hint: {
    marginTop: Spacing.sm,
  },
});
