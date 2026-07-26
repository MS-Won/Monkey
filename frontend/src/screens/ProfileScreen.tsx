import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigator';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

import type { AgeGroup, JobGroup } from '../storage/userProfile';
import { saveUserProfile, loadUserProfile } from '../storage/userProfile';
import Card from '../components/Card';
import TextField from '../components/TextField';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import AuroraBackground from '../components/holo/AuroraBackground';

// ✅ 안드로이드에서 LayoutAnimation 사용 가능하도록 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingProfile'>;

// ✅ 현재 어떤 선택창을 열지 구분하는 타입
type OpenSheet = 'age' | 'job' | null;

// ✅ 공용 선택 아이템 타입
type SelectItem<T extends string> = {
  key: T;
  label: string;
};

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();

  // ✅ 온보딩(최초 1회) 라우트인지, Profile 탭(수정) 라우트인지 구분
  const isOnboarding = route.name === 'OnboardingProfile';

  // ✅ 사용자 입력 상태
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [jobGroup, setJobGroup] = useState<JobGroup | null>(null);

  // ✅ Profile 탭으로 들어온 경우 기존 저장값을 불러와 미리 채움(수정 폼으로 동작)
  useEffect(() => {
    if (isOnboarding) return;

    (async () => {
      const saved = await loadUserProfile();
      if (saved.name) setName(saved.name);
      if (saved.ageGroup) setAgeGroup(saved.ageGroup);
      if (saved.jobGroup) setJobGroup(saved.jobGroup);
    })();
  }, [isOnboarding]);

  // ✅ 어떤 선택창이 열려 있는지
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  // ✅ 선택창 실제 표시 여부
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ 입력 완료 여부 계산
  const nameOk = useMemo(() => name.trim().length >= 1, [name]);
  const ageOk = useMemo(() => ageGroup !== null, [ageGroup]);
  const jobOk = useMemo(() => jobGroup !== null, [jobGroup]);

  // ✅ Toss 스타일 누적 공개 조건
  const showAge = nameOk;
  const showJob = nameOk && ageOk;
  const canFinish = nameOk && ageOk && jobOk;

  // ✅ 선택 목록
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

  // ✅ 카드가 부드럽게 나타나도록 하는 애니메이션
  const animate = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  // ✅ 선택값을 한글 라벨로 변환
  const getLabel = <T extends string>(items: SelectItem<T>[], value: T | null) => {
    if (!value) return '';
    return items.find((item) => item.key === value)?.label ?? '';
  };

  // ✅ 선택창 열기
  const openPicker = (type: OpenSheet) => {
    if (!type) return;

    animate();
    setOpenSheet(type);
    setModalVisible(true);
  };

  // ✅ 선택창 닫기
  const closePicker = () => {
    setModalVisible(false);
    setOpenSheet(null);
  };

  // ✅ 현재 열려 있는 선택창 제목
  const modalTitle = useMemo(() => {
    if (openSheet === 'age') return '나이대 선택';
    if (openSheet === 'job') return '직업 선택';
    return '';
  }, [openSheet]);

  // ✅ 현재 열려 있는 선택창 목록
  const modalItems = useMemo(() => {
    if (openSheet === 'age') return ageItems;
    if (openSheet === 'job') return jobItems;
    return [];
  }, [openSheet]);

  // ✅ 현재 선택된 값
  const selectedValue = useMemo(() => {
    if (openSheet === 'age') return ageGroup;
    if (openSheet === 'job') return jobGroup;
    return null;
  }, [openSheet, ageGroup, jobGroup]);

  // ✅ 선택 처리
  const onSelectItem = (key: string) => {
    animate();

    // 1) 나이대 선택
    if (openSheet === 'age') {
      setAgeGroup(key as AgeGroup);

      // ✅ 나이 바뀌면 직업 다시 선택하게 초기화
      setJobGroup(null);

      closePicker();
      return;
    }

    // 2) 직업 선택
    if (openSheet === 'job') {
      setJobGroup(key as JobGroup);
      closePicker();
      return;
    }
  };

  // ✅ 저장 버튼
  const finish = async () => {
    if (!canFinish || !ageGroup || !jobGroup) return;

    try {
      await saveUserProfile({
        name: name.trim(),
        ageGroup,
        jobGroup,
      });

      if (isOnboarding) {
        navigation.replace('Main');
      } else {
        Alert.alert('저장 완료', '프로필이 저장되었습니다.');
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AuroraBackground intensity={0.4} />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* ✅ 상단 설명 */}
          <View style={styles.header}>
            <Text style={Typography.h1}>프로필</Text>
            <Text style={[Typography.caption, styles.headerDesc]}>
              프로필은 기기에만 저장되고 서버로 전송되지 않아요. 해몽 결과에서 어떤 항목을
              먼저 보여줄지 정하는 데만 쓰입니다.
            </Text>
          </View>

          {/* 1. 이름 */}
          <TextField
            label="이름"
            value={name}
            onChangeText={(value) => {
              setName(value);

              // ✅ 이름을 다시 지우면 아래 선택들도 초기화
              if (value.trim().length === 0) {
                animate();
                setAgeGroup(null);
                setJobGroup(null);
              }
            }}
            placeholder="이름을 입력해주세요"
            variant="bordered"
          />

          {/* 2. 나이대 */}
          {showAge && (
            <Card style={styles.card}>
              <Text style={styles.label}>나이대</Text>

              <Pressable
                onPress={() => openPicker('age')}
                style={({ pressed }) => [styles.field, pressed && styles.pressed]}
              >
                <Text style={styles.fieldText}>
                  {ageOk ? getLabel(ageItems, ageGroup) : '선택해주세요'}
                </Text>
              </Pressable>
            </Card>
          )}

          {/* 3. 직업 */}
          {showJob && (
            <Card style={styles.card}>
              <Text style={styles.label}>직업</Text>

              <Pressable
                onPress={() => openPicker('job')}
                style={({ pressed }) => [styles.field, pressed && styles.pressed]}
              >
                <Text style={styles.fieldText}>
                  {jobOk ? getLabel(jobItems, jobGroup) : '선택해주세요'}
                </Text>
              </Pressable>
            </Card>
          )}

          {/* 저장 버튼 */}
          <Button
            label="저장"
            variant="primary"
            onPress={finish}
            disabled={!canFinish}
            style={styles.saveBtn}
          />

          <Text style={[Typography.caption, styles.footer]}>
            * 해몽 내용 자체는 프로필과 무관하게 꿈 내용만으로 만들어집니다.
          </Text>
        </ScrollView>

        {/* ✅ 아래에서 올라오는 선택 모달 */}
        <BottomSheet
          visible={modalVisible}
          title={modalTitle}
          items={modalItems.map((item) => ({ label: item.label, value: item.key }))}
          selectedValue={selectedValue}
          onSelect={(value) => onSelectItem(value)}
          onClose={closePicker}
        />
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 28,
  },

  header: {
    marginTop: 6,
    marginBottom: Spacing.md,
  },
  headerDesc: {
    marginTop: 6,
  },

  card: {
    marginTop: Spacing.md,
  },

  label: {
    ...Typography.caption,
    marginBottom: 10,
  },

  field: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
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

  saveBtn: {
    marginTop: 16,
  },

  footer: {
    marginTop: 14,
  },
});