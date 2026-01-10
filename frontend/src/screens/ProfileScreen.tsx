import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigator';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Gender, saveUserProfile } from '../storage/userProfile';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

type Step = 1 | 2;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);

  const nameOk = useMemo(() => name.trim().length >= 1, [name]);
  const genderOk = useMemo(() => gender !== null, [gender]);

  const nextFromName = () => {
    if (!nameOk) return;
    setStep(2);
  };

  const finish = async () => {
    if (!nameOk || !genderOk || !gender) return;

    await saveUserProfile(name.trim(), gender);

    // ✅ InputScreen으로 이동
    navigation.replace('Input');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={Typography.h2}>시작하기</Text>
        <Text style={[Typography.muted, { marginTop: 6 }]}>
          {step === 1 ? '이름을 입력해주세요.' : '성별을 선택해주세요.'}
        </Text>
      </View>

      <View style={styles.card}>
        {step === 1 ? (
          <>
            <Text style={styles.label}>이름</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="예) 문섭"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={nextFromName}
            />

            <Pressable
              onPress={nextFromName}
              disabled={!nameOk}
              style={({ pressed }) => [
                styles.primaryBtn,
                !nameOk && styles.btnDisabled,
                pressed && nameOk && styles.btnPressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>다음</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>성별</Text>

            <View style={styles.genderRow}>
              <Pressable
                onPress={() => setGender('MALE')}
                style={({ pressed }) => [
                  styles.choiceBtn,
                  gender === 'MALE' && styles.choiceBtnActive,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={[styles.choiceText, gender === 'MALE' && styles.choiceTextActive]}>남성</Text>
              </Pressable>

              <Pressable
                onPress={() => setGender('FEMALE')}
                style={({ pressed }) => [
                  styles.choiceBtn,
                  gender === 'FEMALE' && styles.choiceBtnActive,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={[styles.choiceText, gender === 'FEMALE' && styles.choiceTextActive]}>여성</Text>
              </Pressable>

              <Pressable
                onPress={() => setGender('OTHER')}
                style={({ pressed }) => [
                  styles.choiceBtn,
                  gender === 'OTHER' && styles.choiceBtnActive,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={[styles.choiceText, gender === 'OTHER' && styles.choiceTextActive]}>기타</Text>
              </Pressable>
            </View>

            <View style={{ height: 10 }} />

            <Pressable
              onPress={finish}
              disabled={!genderOk}
              style={({ pressed }) => [
                styles.primaryBtn,
                !genderOk && styles.btnDisabled,
                pressed && genderOk && styles.btnPressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>시작하기</Text>
            </Pressable>

            <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
              <Text style={styles.backText}>이전</Text>
            </Pressable>
          </>
        )}
      </View>

      <Text style={[Typography.muted, styles.footer]}>
        * 나이/MBTI/직업은 추후 추가됩니다.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: 20,
  },
  header: {
    marginTop: 8,
    marginBottom: 16,
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
    color: Colors.textPrimary,
    fontSize: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },

  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  choiceBtnActive: {
    borderColor: Colors.accentPrimary,
  },
  choiceText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  choiceTextActive: {
    color: Colors.accentPrimary,
  },

  primaryBtn: {
    marginTop: 14,
    backgroundColor: Colors.accentPrimary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.backgroundPrimary,
    fontSize: 15,
    fontWeight: '700',
  },

  backBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },

  btnDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.85,
  },

  footer: {
    marginTop: 14,
  },
});
