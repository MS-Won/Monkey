import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Keyboard, // ✅ 추가: 키보드 닫기
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigator';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

import type { Gender, AgeGroup, JobGroup } from '../storage/userProfile';
import { saveUserProfile } from '../storage/userProfile';

import BottomSheetSelect, { SelectItem } from '../components/BottomSheetSelect';

// ✅ 안드로이드에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingProfile'>;
type OpenSheet = 'gender' | 'age' | 'job' | null;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  // ✅ 입력값들
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [jobGroup, setJobGroup] = useState<JobGroup | null>(null);

  // ✅ 어떤 바텀시트를 열지
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  // ✅ 유효성
  const nameOk = useMemo(() => name.trim().length >= 1, [name]);
  const genderOk = useMemo(() => gender !== null, [gender]);
  const ageOk = useMemo(() => ageGroup !== null, [ageGroup]);
  const jobOk = useMemo(() => jobGroup !== null, [jobGroup]);

  // ✅ “아래로 누적 공개” 조건
  const showGender = nameOk;
  const showAge = nameOk && genderOk;
  const showJob = nameOk && genderOk && ageOk;
  const canFinish = nameOk && genderOk && ageOk && jobOk;

  // ✅ 선택 목록(대분류)
  const genderItems: SelectItem<Gender>[] = [
    { key: 'MALE', label: '남성' },
    { key: 'FEMALE', label: '여성' },
    { key: 'OTHER', label: '기타' },
  ];

  const ageItems: SelectItem<AgeGroup>[] = [
    { key: 'TEENS', label: '10대' },
    { key: 'TWENTIES', label: '20대' },
    { key: 'THIRTIES', label: '30대' },
    { key: 'FORTIES', label: '40대' },
    { key: 'FIFTIES', label: '50대' },
    { key: 'SIXTY_PLUS', label: '60대+' },
  ];

  const jobItems: SelectItem<JobGroup>[] = [
    { key: 'STUDENT', label: '학생' },
    { key: 'EMPLOYEE', label: '직장인' },
    { key: 'SELF_EMPLOYED', label: '자영업/프리랜서' },
    { key: 'HOMEMAKER', label: '전업(가사/돌봄)' },
    { key: 'JOB_SEEKER', label: '구직 중' },
    { key: 'RETIRED', label: '은퇴' },
    { key: 'OTHER', label: '기타' },
  ];

  const finish = async () => {
    if (!canFinish || !gender || !ageGroup || !jobGroup) return;

    await saveUserProfile({
      name: name.trim(),
      gender,
      ageGroup,
      jobGroup,
    });

    navigation.replace('Main');
  };

  // ✅ 작은 애니메이션
  const animate = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const open = (k: OpenSheet) => {
    // ✅ 핵심: 이름 입력 후 키보드가 떠 있으면, ScrollView가 탭을 먹고 키보드만 닫는 경우가 많음
    // -> 바텀시트를 확실히 열기 위해 먼저 키보드를 닫고 openSheet를 세팅
    Keyboard.dismiss();
    animate();
    setOpenSheet(k);
  };

  const close = () => {
    animate();
    setOpenSheet(null);
  };

  const getLabel = <T extends string>(items: SelectItem<T>[], v: T | null) => {
    if (!v) return '';
    return items.find((x) => x.key === v)?.label ?? '';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          // ✅ 핵심: 키보드 떠 있어도 탭을 Pressable에 전달
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.header}>
            <Text style={Typography.h2}>프로필</Text>
            <Text style={[Typography.muted, { marginTop: 6 }]}>
              입력한 정보는 “조언” 표현을 조정하는 참고용입니다.
            </Text>
          </View>

          {/* 1) 이름 */}
          <View style={styles.card}>
            <Text style={styles.label}>이름</Text>

            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (v.trim().length === 0) {
                  animate();
                  setGender(null);
                  setAgeGroup(null);
                  setJobGroup(null);
                }
              }}
              placeholder=""
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </View>

          {/* 2) 성별 */}
          {showGender && (
            <View style={styles.card}>
              <Text style={styles.label}>성별</Text>
              <Pressable
                onPress={() => open('gender')}
                hitSlop={8} // ✅ 누르기 판정 조금 넓혀줌(체감 개선)
                style={({ pressed }) => [styles.field, pressed && styles.pressed]}
              >
                <Text style={styles.fieldText}>
                  {genderOk ? getLabel(genderItems, gender) : '선택해주세요'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* 3) 나이대 */}
          {showAge && (
            <View style={styles.card}>
              <Text style={styles.label}>나이대</Text>
              <Pressable
                onPress={() => open('age')}
                hitSlop={8}
                style={({ pressed }) => [styles.field, pressed && styles.pressed]}
              >
                <Text style={styles.fieldText}>
                  {ageOk ? getLabel(ageItems, ageGroup) : '선택해주세요'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* 4) 직업 */}
          {showJob && (
            <View style={styles.card}>
              <Text style={styles.label}>직업(대분류)</Text>
              <Pressable
                onPress={() => open('job')}
                hitSlop={8}
                style={({ pressed }) => [styles.field, pressed && styles.pressed]}
              >
                <Text style={styles.fieldText}>
                  {jobOk ? getLabel(jobItems, jobGroup) : '선택해주세요'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* 완료 버튼 */}
          <Pressable
            onPress={finish}
            disabled={!canFinish}
            style={({ pressed }) => [
              styles.primaryBtn,
              !canFinish && styles.btnDisabled,
              pressed && canFinish && styles.btnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>저장</Text>
          </Pressable>

          <Text style={[Typography.muted, styles.footer]}>
            * 나이/직업은 선택 정보이며, 프로필 미작성이어도 해몽은 정상 작동합니다.
          </Text>
        </ScrollView>

        {/* Bottom Sheets */}
        {openSheet === 'gender' && (
          <BottomSheetSelect<Gender>
            title="성별 선택"
            items={genderItems}
            value={gender}
            onSelect={(v) => {
              animate();
              setGender(v);
              close();
            }}
            onClose={close}
          />
        )}

        {openSheet === 'age' && (
          <BottomSheetSelect<AgeGroup>
            title="나이대 선택"
            items={ageItems}
            value={ageGroup}
            onSelect={(v) => {
              animate();
              setAgeGroup(v);
              close();
            }}
            onClose={close}
          />
        )}

        {openSheet === 'job' && (
          <BottomSheetSelect<JobGroup>
            title="직업 선택"
            items={jobItems}
            value={jobGroup}
            onSelect={(v) => {
              animate();
              setJobGroup(v);
              close();
            }}
            onClose={close}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },

  header: {
    marginTop: 6,
    marginBottom: 12,
  },

  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginTop: 12,
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

  field: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  fieldText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.85,
  },

  primaryBtn: {
    marginTop: 16,
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
