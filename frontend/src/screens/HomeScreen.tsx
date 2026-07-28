import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { loadUserProfile } from '../storage/userProfile';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import TextField from '../components/TextField';
import Button from '../components/Button';
import Chip from '../components/Chip';
import AuroraBackground from '../components/holo/AuroraBackground';
import HolographicButton from '../components/holo/HolographicButton';
import Ornament from '../components/holo/Ornament';

// 장면이 여러 개로 이어지는 꿈. 한 문장짜리 예시를 쓰면 "짧게 적는 곳"으로
// 읽혀서, 긴 꿈을 통째로 받는다는 이 앱의 특징이 드러나지 않는다.
const LONG_DREAM_PLACEHOLDER =
  '예) 낯선 골목을 한참 걷다가 누군가에게 쫓겼다. 겨우 낡은 집에 들어가 문을 잠갔는데, ' +
  '마당에는 커다란 구렁이가 유유히 지나갔다. 그때 돌아가신 할머니가 환하게 웃으며 ' +
  '금반지를 건네주셨고, 잠에서 깨니 손이 따뜻했다.';

// 이 길이를 넘으면 "장면이 여러 개인 꿈"으로 보고 안내 문구를 바꾼다.
const LONG_DREAM_CHARS = 100;

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

  const charCount = dreamText.trim().length;
  const lengthHint =
    charCount === 0
      ? '한 줄이어도, 아주 길어도 괜찮아요'
      : charCount < LONG_DREAM_CHARS
      ? '길게 적을수록 더 깊이 풀어드려요'
      : '장면이 여러 개네요 · 하나씩 짚어드릴게요';

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
            label="꿈 내용 — 길어도 괜찮아요"
            value={dreamText}
            onChangeText={setDreamText}
            multiline
            minHeight={220}
            placeholder={LONG_DREAM_PLACEHOLDER}
          />

          <View style={styles.metaRow}>
            <Text style={styles.counter}>{charCount}자</Text>
            <Text style={styles.counterHint}>{lengthHint}</Text>
          </View>

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

        <View style={styles.chipRow}>
          <Chip text="긴 꿈도 통째로" tone="accent" />
          <Chip text="6가지 관점" />
          <Chip text="전통 해몽 사전" />
        </View>

        <Text style={[Typography.caption, styles.hint]}>
          장면이 여러 개로 이어지는 꿈도 자르지 말고 그대로 적어주세요.
          종합 해몽에 더해 인간관계 · 재물운 · 직장·학업운 · 건강운 · 주의운까지
          나눠서 풀어드립니다.
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -Spacing.xs,
  },
  counter: {
    ...Typography.caption,
    color: Colors.accentPrimary,
    fontWeight: '700',
  },
  counterHint: {
    ...Typography.caption,
    flexShrink: 1,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  flexBtn: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  hint: {
    marginTop: Spacing.xs,
  },
});
