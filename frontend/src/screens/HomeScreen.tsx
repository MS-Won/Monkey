import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { loadUserProfile } from '../storage/userProfile';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [name, setName] = useState<string | null>(null);
  const [dreamText, setDreamText] = useState<string>(''); // ✅ Home에 입력 UI

  // ✅ Tab 화면에서 Root Stack(Input)으로 이동해야 하므로 any 사용(기존 구조 유지용)
  const navigation = useNavigation<any>();

  useEffect(() => {
    (async () => {
      try {
        const profile = await loadUserProfile();
        setName(profile?.name ?? null);
      } catch {
        setName(null);
      }
    })();
  }, []);

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
    <View style={styles.container}>
      {/* 1) 상단 인사 문구 (기존 유지) */}
      <Text style={styles.greeting}>
        {name ? `${name}님, 오늘 꿈을 기록해볼까요?` : '오늘 꿈을 기록해볼까요?'}
      </Text>

      {/* 2) 메인: 꿈 입력창 */}
      <View style={styles.card}>
        <Text style={styles.label}>꿈 내용</Text>
        <TextInput
          multiline
          value={dreamText}
          onChangeText={setDreamText}
          style={styles.input}
          placeholder="예) 낯선 골목을 걷다가 누군가에게 쫓겼고, 결국 문을 잠그고 숨었다."
          placeholderTextColor={Colors.textMuted}
          textAlignVertical="top"
        />
      </View>

      {/* 3) 버튼들 */}
      <View style={styles.buttonRow}>
        <Pressable
          onPress={onPressVoice}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.secondaryBtnText}>음성 입력</Text>
        </Pressable>

        <Pressable
          onPress={onPressInterpretText}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.primaryBtnText}>해몽</Text>
        </Pressable>
      </View>

      {/* 기존 문구가 남아있다면 UX가 헷갈려서, 안내 문구만 자연스럽게 교체 */}
      <Text style={Typography.muted}>텍스트로 입력하거나, 음성 입력을 사용할 수 있습니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: 20,  
    gap: 12,
  },
  greeting: {
    ...Typography.h2,
    fontSize: 18,
    marginBottom: 8,
  },

  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  label: {
    ...Typography.muted,
    marginBottom: 10,
  },
  input: {
    minHeight: 160,
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.accentPrimary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.backgroundPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },

  btnPressed: {
    opacity: 0.85,
  },
});
