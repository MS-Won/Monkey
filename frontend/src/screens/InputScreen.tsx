import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  PermissionsAndroid,
  Platform,
  TextInput,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Voice from '@react-native-voice/voice';

import { RootStackParamList } from '../../navigator';
import { SERVER_BASE_URL } from '@env';

// ✅ 프로필 로드
import { loadUserProfile } from '../storage/userProfile';
import type { Gender, AgeGroup, JobGroup } from '../storage/userProfile';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

type InputRouteProp = RouteProp<RootStackParamList, 'Input'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SILENCE_TIMEOUT_MS = 2000;

const InputScreen = () => {
  const route = useRoute<InputRouteProp>();
  const navigation = useNavigation<NavigationProp>();

  const mode = route.params?.mode ?? 'text';
  const initialDreamText = route.params?.dreamText ?? '';

  const [text, setText] = useState<string>(initialDreamText);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ 프로필 컨텍스트
  const [personName, setPersonName] = useState<string | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | undefined>(undefined);
  const [jobGroup, setJobGroup] = useState<JobGroup | undefined>(undefined);

  // ✅ 핵심: 프로필 로딩 완료 플래그
  const [profileLoaded, setProfileLoaded] = useState(false);

  // ✅ 타이머/녹음상태 ref (비동기 이벤트에서 최신값 보장)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const resetSilenceTimer = () => {
    // ✅ 말이 들어오는 동안 계속 타이머 연장
    clearSilenceTimer();

    silenceTimerRef.current = setTimeout(() => {
      // ✅ 일정 시간 동안 아무 이벤트가 없으면 자동 종료
      if (isRecordingRef.current) {
        stopRecording();
      }
    }, SILENCE_TIMEOUT_MS);
  };

  /* ---------------------------
     공통: 프로필 로드
  --------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const profile = await loadUserProfile();

        const name = profile.name?.trim();
        setPersonName(name ? name : undefined);

        setGender(profile.gender ?? undefined);
        setAgeGroup(profile.ageGroup ?? undefined);
        setJobGroup(profile.jobGroup ?? undefined);
      } catch (e) {
        console.warn('⚠️ 프로필 로드 실패(무시 가능):', e);
        setPersonName(undefined);
        setGender(undefined);
        setAgeGroup(undefined);
        setJobGroup(undefined);
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, []);

  /* ---------------------------
     text 모드: 자동 /split → Result
  --------------------------- */
  useEffect(() => {
    if (mode !== 'text') return;
    if (!profileLoaded) return;

    const dreamText = initialDreamText.trim();

    if (!dreamText) {
      Alert.alert('알림', '꿈 내용이 없어 홈으로 이동합니다.');
      navigation.replace('Main');
      return;
    }

    const run = async () => {
      try {
        setIsLoading(true);

        // ✅ 디버그용 (서버 주소가 제대로 들어오는지 확인)
        console.log('✅ SERVER_BASE_URL =', SERVER_BASE_URL);

        const response = await fetch(`${SERVER_BASE_URL}/split`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: dreamText }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('❌ /split 응답 에러:', errText);
          Alert.alert('오류', '서버 응답이 올바르지 않습니다.');
          navigation.replace('Main');
          return;
        }

        const data = await response.json();

        if (!Array.isArray(data.sentences)) {
          Alert.alert('오류', '문장 분리 결과가 없습니다.');
          navigation.replace('Main');
          return;
        }

        navigation.replace('Result', {
          sentenceList: data.sentences,
          dreamText,
          usedGPTInSplit: !!data.usedGPT,
          personName,

          gender,
          ageGroup,
          jobGroup,
        });
      } catch (error) {
        console.error('❌ 서버 요청 에러:', error);
        Alert.alert('오류', '서버 연결에 실패했습니다.');
        navigation.replace('Main');
      } finally {
        setIsLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, profileLoaded]);

  /* ---------------------------
     voice 모드: STT 이벤트 등록 (✅ 1회만)
  --------------------------- */
  useEffect(() => {
    if (mode !== 'voice') return;

    Voice.onSpeechStart = () => {
      // ✅ 인식 시작 시 타이머 스타트
      resetSilenceTimer();
    };

    Voice.onSpeechRecognized = () => {
      // ✅ 엔진이 인식을 진행 중이라고 알림
      resetSilenceTimer();
    };

    Voice.onSpeechPartialResults = () => {
      // ✅ 부분 결과는 자주 오므로 “말하고 있음” 감지에 매우 유리
      resetSilenceTimer();
    };

    Voice.onSpeechResults = (e) => {
      const result = e.value?.[0] ?? '';
      if (result) {
        setText((prev) => (prev ? prev + ' ' + result : result));
      }
      resetSilenceTimer();
    };

    Voice.onSpeechEnd = () => {
      // ✅ 말이 끝났다고 오면 즉시 종료
      stopRecording();
    };

    Voice.onSpeechError = (e) => {
      console.warn('🎙️ onSpeechError:', e);
      stopRecording();
    };

    return () => {
      clearSilenceTimer();
      Voice.destroy().then(() => Voice.removeAllListeners());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: '마이크 권한 요청',
          message: '음성 인식을 위해 마이크 접근 권한이 필요합니다.',
          buttonPositive: '확인',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startRecording = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    try {
      setIsRecording(true);
      isRecordingRef.current = true;

      // ✅ 이벤트가 늦게 오더라도 자동 종료가 되게 타이머를 먼저 걸어둠
      resetSilenceTimer();

      await Voice.start('ko-KR');
    } catch (e) {
      console.error('🎙️ 음성 인식 시작 실패:', e);
      setIsRecording(false);
      isRecordingRef.current = false;
      clearSilenceTimer();
    }
  };

  const stopRecording = async () => {
    // ✅ 중복 stop 방지
    if (!isRecordingRef.current) {
      setIsRecording(false);
      return;
    }

    try {
      isRecordingRef.current = false;
      clearSilenceTimer();
      await Voice.stop();
    } catch (e) {
      console.error('🎙️ 음성 인식 중단 실패:', e);
    } finally {
      setIsRecording(false);
    }
  };

  const handleSubmitVoice = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('알림', '꿈 내용을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      console.log('✅ SERVER_BASE_URL =', SERVER_BASE_URL);

      const response = await fetch(`${SERVER_BASE_URL}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('❌ /split 응답 에러:', errText);
        Alert.alert('오류', '서버 응답이 올바르지 않습니다.');
        return;
      }

      const data = await response.json();

      if (!Array.isArray(data.sentences)) {
        Alert.alert('오류', '문장 분리 결과가 없습니다.');
        return;
      }

      navigation.replace('Result', {
        sentenceList: data.sentences,
        dreamText: trimmed,
        usedGPTInSplit: !!data.usedGPT,
        personName,

        gender,
        ageGroup,
        jobGroup,
      });
    } catch (error) {
      console.error('❌ 서버 요청 에러:', error);
      Alert.alert('오류', '서버 연결에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------
     렌더링
  --------------------------- */
  if (mode === 'text') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={Colors.accentPrimary} />
        <Text style={styles.status}>문장을 정리하고 있어요…</Text>
        <Text style={styles.muted}>잠시만 기다려주세요</Text>
      </View>
    );
  }

  const primaryDisabled = isLoading;
  const recordDisabled = isLoading;

  return (
    <View style={styles.voiceContainer}>
      <Text style={styles.title}>음성 입력</Text>
      <Text style={styles.subtitle}>
        말로 꿈을 기록하거나, 아래 입력창에 직접 수정할 수 있어요.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>꿈 내용</Text>
        <TextInput
          multiline
          value={text}
          onChangeText={setText}
          style={styles.input}
          placeholder="예) 낯선 골목을 걷다가 누군가에게 쫓겼다…"
          placeholderTextColor={Colors.textMuted}
          textAlignVertical="top"
          editable={!isLoading}
        />
      </View>

      {isRecording && (
        <View style={styles.inlineRow}>
          <View style={styles.dot} />
          <Text style={styles.status}>듣는 중… 말이 멈추면 자동 종료됩니다</Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.inlineRow}>
          <ActivityIndicator size="small" color={Colors.accentPrimary} />
          <Text style={styles.status}>생각하는 중…</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Pressable
          onPress={isRecording ? stopRecording : startRecording}
          disabled={recordDisabled}
          style={({ pressed }) => [
            styles.secondaryBtn,
            recordDisabled && styles.btnDisabled,
            pressed && !recordDisabled && styles.btnPressed,
          ]}
        >
          <Text style={styles.secondaryBtnText}>
            {isRecording ? '음성 중지' : '음성 입력'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSubmitVoice}
          disabled={primaryDisabled}
          style={({ pressed }) => [
            styles.primaryBtn,
            primaryDisabled && styles.btnDisabled,
            pressed && !primaryDisabled && styles.btnPressed,
          ]}
        >
          <Text style={styles.primaryBtnText}>해몽 시작</Text>
        </Pressable>
      </View>

      <Text style={styles.devHint}>서버: {SERVER_BASE_URL}</Text>
    </View>
  );
};

export default InputScreen;

// ✅ 기존 styles는 그대로 사용
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 100,
    gap: 10,
  },
  status: {
    ...Typography.muted,
  },
  muted: {
    ...Typography.muted,
  },

  voiceContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: 20,
    paddingTop: 100,
  },

  title: {
    ...Typography.h2,
    fontSize: 20,
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.label,
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
    minHeight: 140,
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },

  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: Colors.accentPrimary,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
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

  btnDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.85,
  },

  devHint: {
    ...Typography.monoSmall,
    marginTop: 14,
  },
});
