import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Voice from '@react-native-voice/voice';
import { RootStackParamList } from '../../navigator';
import { SERVER_BASE_URL } from '@env';

// ✅ 프로필(이름) 불러오기: ResultScreen에서 사용자 이름을 반영하기 위해 사용
import { loadUserProfile } from '../storage/userProfile';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Input'>;

const SILENCE_TIMEOUT_MS = 2000;

const InputScreen = () => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ 저장된 사용자 이름(프로필 화면에서 입력한 값)
  const [personName, setPersonName] = useState<string | undefined>(undefined);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    // ✅ 앱 시작 시 저장된 프로필 로드(이름)
    // - 실패해도 앱은 정상 동작해야 하므로 try/catch로 안전하게 처리
    (async () => {
      try {
        const profile = await loadUserProfile();
        const name = profile.name?.trim();
        setPersonName(name ? name : undefined);
      } catch (e) {
        console.warn('⚠️ 프로필 로드 실패(무시 가능):', e);
        setPersonName(undefined);
      }
    })();

    Voice.onSpeechResults = (e) => {
      const result = e.value?.[0] ?? '';
      if (!result) return;

      console.log('🎙️ 인식된 텍스트:', result);
      setText((prev) => (prev ? prev + ' ' + result : result));

      resetSilenceTimer();
    };

    Voice.onSpeechEnd = () => {
      stopRecording();
    };

    Voice.onSpeechError = () => {
      stopRecording();
    };

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      Voice.destroy().then(Voice.removeAllListeners);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      if (isRecording) {
        console.log('⏱️ 침묵 감지 → STT 자동 종료');
        stopRecording();
      }
    }, SILENCE_TIMEOUT_MS);
  };

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
      await Voice.start('ko-KR');
      resetSilenceTimer();
    } catch (e) {
      console.error('🎙️ 음성 인식 시작 실패:', e);
    }
  };

  const stopRecording = async () => {
    try {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      await Voice.stop();
      setIsRecording(false);
    } catch (e) {
      console.error('🎙️ 음성 인식 중단 실패:', e);
    }
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('알림', '꿈 내용을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📡 SERVER_BASE_URL =', SERVER_BASE_URL);
      console.log('📨 요청 URL =', `${SERVER_BASE_URL}/split`);

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

      if (Array.isArray(data.sentences)) {
        navigation.navigate('Result', {
          sentenceList: data.sentences,
          dreamText: trimmed,
          usedGPTInSplit: !!data.usedGPT,

          // ✅ ResultScreen에서 이름을 보여주고, 종합 해몽 프롬프트에도 활용
          personName,
        });
      } else {
        Alert.alert('오류', '문장 분리 결과가 없습니다.');
      }
    } catch (error) {
      console.error('❌ 서버 요청 에러:', error);
      Alert.alert('오류', '서버 연결에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const primaryDisabled = isLoading;
  const recordDisabled = isLoading;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>꿈 기록</Text>
      <Text style={styles.subtitle}>
        오늘 꾼 꿈을 그대로 입력하거나 음성 입력을 사용하세요.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>꿈 내용</Text>
        <TextInput
          multiline
          value={text}
          onChangeText={setText}
          style={styles.input}
          placeholder="예) 낯선 골목을 걷다가 누군가에게 쫓겼고, 결국 문을 잠그고 숨었다."
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
        <View style={styles.loading}>
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
          onPress={handleSubmit}
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

      {/* 개발 중 확인용(필요 없으면 제거 가능) */}
      <Text style={styles.devHint}>
        서버: {SERVER_BASE_URL}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: 20,
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

  status: {
    ...Typography.muted,
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

  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
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

export default InputScreen;
