import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Voice from '@react-native-voice/voice';

import { RootStackParamList } from '../../navigator';
import { SERVER_BASE_URL } from '@env';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import TextField from '../components/TextField';
import Button from '../components/Button';
import AuroraBackground from '../components/holo/AuroraBackground';
import BackButton from '../components/BackButton';

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
     text 모드: 바로 Result로 넘김
     (문장 분리가 사라져 이 화면에서 할 비동기 작업이 없다)
  --------------------------- */
  useEffect(() => {
    if (mode !== 'text') return;

    const dreamText = initialDreamText.trim();

    if (!dreamText) {
      Alert.alert('알림', '꿈 내용이 없어 홈으로 이동합니다.');
      navigation.replace('Main');
      return;
    }

    navigation.replace('Result', { dreamText });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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

  const handleSubmitVoice = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('알림', '꿈 내용을 입력해주세요.');
      return;
    }

    if (__DEV__) console.log('✅ SERVER_BASE_URL =', SERVER_BASE_URL);

    navigation.replace('Result', { dreamText: trimmed });
  };

  /* ---------------------------
     렌더링
  --------------------------- */
  // text 모드는 위 useEffect가 곧바로 Result로 replace 한다.
  // 그 한 프레임 동안 음성 입력 UI가 스쳐 보이지 않도록 배경만 그린다.
  if (mode === 'text') {
    return <View style={styles.blankContainer} />;
  }

  return (
    <View style={styles.voiceContainer}>
      <AuroraBackground intensity={0.45} />
      <BackButton />
      <Text style={styles.title}>음성 입력</Text>
      <Text style={styles.subtitle}>
        말로 꿈을 기록하거나, 아래 입력창에 직접 수정할 수 있어요.
      </Text>

      <TextField
        label="꿈 내용"
        value={text}
        onChangeText={setText}
        multiline
        minHeight={140}
        placeholder="예) 낯선 골목을 걷다가 누군가에게 쫓겼다…"
      />

      {isRecording && (
        <View style={styles.inlineRow}>
          <View style={styles.dot} />
          <Text style={styles.status}>듣는 중… 말이 멈추면 자동 종료됩니다</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button
          label={isRecording ? '음성 중지' : '음성 입력'}
          variant="secondary"
          onPress={isRecording ? stopRecording : startRecording}
          style={styles.flexBtn}
        />
        <Button
          label="해몽 시작"
          variant="primary"
          onPress={handleSubmitVoice}
          style={styles.flexBtn}
        />
      </View>

      {__DEV__ && <Text style={styles.devHint}>서버: {SERVER_BASE_URL}</Text>}
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
    padding: Spacing.xl,
    paddingTop: 100,
    gap: Spacing.sm,
  },
  status: {
    ...Typography.caption,
  },
  muted: {
    ...Typography.caption,
  },

  voiceContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: Spacing.xl,
    paddingTop: 100,
  },

  // text 모드에서 Result로 넘어가기 직전 한 프레임용
  blankContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },

  title: {
    ...Typography.h2,
    fontSize: 20,
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.label,
    marginBottom: Spacing.lg,
  },

  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accentPrimary,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  flexBtn: {
    flex: 1,
  },

  devHint: {
    ...Typography.overline,
    marginTop: 14,
  },
});
