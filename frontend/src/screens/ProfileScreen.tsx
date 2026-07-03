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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigator';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

import type { Gender, AgeGroup, JobGroup } from '../storage/userProfile';
import { saveUserProfile } from '../storage/userProfile';

// ✅ 안드로이드에서 LayoutAnimation 사용 가능하도록 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingProfile'>;

// ✅ 현재 어떤 선택창을 열지 구분하는 타입
type OpenSheet = 'gender' | 'age' | 'job' | null;

// ✅ 공용 선택 아이템 타입
type SelectItem<T extends string> = {
  key: T;
  label: string;
};

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  // ✅ 사용자 입력 상태
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [jobGroup, setJobGroup] = useState<JobGroup | null>(null);

  // ✅ 어떤 선택창이 열려 있는지
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  // ✅ 선택창 실제 표시 여부
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ 입력 완료 여부 계산
  const nameOk = useMemo(() => name.trim().length >= 1, [name]);
  const genderOk = useMemo(() => gender !== null, [gender]);
  const ageOk = useMemo(() => ageGroup !== null, [ageGroup]);
  const jobOk = useMemo(() => jobGroup !== null, [jobGroup]);

  // ✅ Toss 스타일 누적 공개 조건
  const showGender = nameOk;
  const showAge = nameOk && genderOk;
  const showJob = nameOk && genderOk && ageOk;
  const canFinish = nameOk && genderOk && ageOk && jobOk;

  // ✅ 선택 목록
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
    if (openSheet === 'gender') return '성별 선택';
    if (openSheet === 'age') return '나이대 선택';
    if (openSheet === 'job') return '직업 선택';
    return '';
  }, [openSheet]);

  // ✅ 현재 열려 있는 선택창 목록
  const modalItems = useMemo(() => {
    if (openSheet === 'gender') return genderItems;
    if (openSheet === 'age') return ageItems;
    if (openSheet === 'job') return jobItems;
    return [];
  }, [openSheet]);

  // ✅ 현재 선택된 값
  const selectedValue = useMemo(() => {
    if (openSheet === 'gender') return gender;
    if (openSheet === 'age') return ageGroup;
    if (openSheet === 'job') return jobGroup;
    return null;
  }, [openSheet, gender, ageGroup, jobGroup]);

  // ✅ 선택 처리
  const onSelectItem = (key: string) => {
    animate();

    // 1) 성별 선택
    if (openSheet === 'gender') {
      setGender(key as Gender);

      // ✅ 상위 값 변경 시 하위 값 초기화
      setAgeGroup(null);
      setJobGroup(null);

      closePicker();
      return;
    }

    // 2) 나이대 선택
    if (openSheet === 'age') {
      setAgeGroup(key as AgeGroup);

      // ✅ 나이 바뀌면 직업 다시 선택하게 초기화
      setJobGroup(null);

      closePicker();
      return;
    }

    // 3) 직업 선택
    if (openSheet === 'job') {
      setJobGroup(key as JobGroup);
      closePicker();
      return;
    }
  };

  // ✅ 저장 버튼
  const finish = async () => {
    if (!canFinish || !gender || !ageGroup || !jobGroup) return;

    try {
      await saveUserProfile({
        name: name.trim(),
        gender,
        ageGroup,
        jobGroup,
      });

      navigation.replace('Main');
    } catch (error) {
      console.error('프로필 저장 실패:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
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
            <Text style={Typography.h2}>프로필</Text>
            <Text style={[Typography.muted, styles.headerDesc]}>
              입력한 정보는 “조언” 표현을 자연스럽게 조정하는 참고용입니다.
            </Text>
          </View>

          {/* 1. 이름 */}
          <View style={styles.card}>
            <Text style={styles.label}>이름</Text>

            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);

                // ✅ 이름을 다시 지우면 아래 선택들도 초기화
                if (value.trim().length === 0) {
                  animate();
                  setGender(null);
                  setAgeGroup(null);
                  setJobGroup(null);
                }
              }}
              placeholder="이름을 입력해주세요"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              returnKeyType="done"
            />
          </View>

          {/* 2. 성별 */}
          {showGender && (
            <View style={styles.card}>
              <Text style={styles.label}>성별</Text>

              <Pressable
                onPress={() => openPicker('gender')}
                style={({ pressed }) => [styles.field, pressed && styles.pressed]}
              >
                <Text style={styles.fieldText}>
                  {genderOk ? getLabel(genderItems, gender) : '선택해주세요'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* 3. 나이대 */}
          {showAge && (
            <View style={styles.card}>
              <Text style={styles.label}>나이대</Text>

              <Pressable
                onPress={() => openPicker('age')}
                style={({ pressed }) => [styles.field, pressed && styles.pressed]}
              >
                <Text style={styles.fieldText}>
                  {ageOk ? getLabel(ageItems, ageGroup) : '선택해주세요'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* 4. 직업 */}
          {showJob && (
            <View style={styles.card}>
              <Text style={styles.label}>직업</Text>

              <Pressable
                onPress={() => openPicker('job')}
                style={({ pressed }) => [styles.field, pressed && styles.pressed]}
              >
                <Text style={styles.fieldText}>
                  {jobOk ? getLabel(jobItems, jobGroup) : '선택해주세요'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* 저장 버튼 */}
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
            * 입력한 정보는 해몽의 핵심 내용이 아니라, 조언 표현을 조금 더 자연스럽게 조정하는 데 사용됩니다.
          </Text>
        </ScrollView>

        {/* ✅ 아래에서 올라오는 선택 모달 */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={closePicker}
        >
          {/* 바깥 어두운 배경 */}
          <Pressable style={styles.modalOverlay} onPress={closePicker}>
            {/* 내부 선택창 */}
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>

              {modalItems.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => onSelectItem(item.key)}
                  style={({ pressed }) => [
                    styles.modalItem,
                    pressed && styles.modalItemPressed,
                  ]}
                >
                  <Text style={styles.modalItemText}>
                    {item.label} {selectedValue === item.key ? '✓' : ''}
                  </Text>
                </Pressable>
              ))}

              <Pressable onPress={closePicker} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>닫기</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
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
    padding: 20,
    paddingBottom: 28,
  },

  header: {
    marginTop: 6,
    marginBottom: 12,
  },
  headerDesc: {
    marginTop: 6,
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
    fontSize: 16,
    paddingVertical: 14,
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

  // ✅ 모달 배경
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },

  // ✅ 아래에서 올라오는 카드
  modalCard: {
    backgroundColor: Colors.backgroundPrimary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },

  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalItemPressed: {
    opacity: 0.7,
  },
  modalItemText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },

  closeBtn: {
    marginTop: 14,
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
});