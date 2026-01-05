import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Voice from '@react-native-voice/voice';
import { RootStackParamList } from '../../navigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Input'>;

const SILENCE_TIMEOUT_MS = 2000;

const InputScreen = () => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
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
    try {
      setIsLoading(true);
      console.log('📨 서버로 텍스트 전송');

      const response = await fetch('http://172.30.1.15:5001/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.sentences) {
        navigation.navigate('Result', {
          sentenceList: data.sentences,
          dreamText: text,
          usedGPTInSplit: true,
        });
      }
    } catch (error) {
      console.error('❌ 서버 요청 에러:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>꿈을 입력해주세요:</Text>

      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        style={styles.input}
        placeholder="꿈 내용을 입력하거나 음성 입력을 사용하세요"
        placeholderTextColor="#777"
      />

      {isRecording && (
        <Text style={styles.status}>🎙️ 듣는 중… 말이 멈추면 자동 종료됩니다</Text>
      )}

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" />
          <Text style={styles.status}>생각하는 중…</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <Button
          title={isRecording ? '🎙️ 중지' : '🎙️ 음성 입력'}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
        />
        <View style={{ width: 10 }} />
        <Button title="해몽 시작" onPress={handleSubmit} disabled={isLoading} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  label: { fontSize: 16, marginBottom: 10, color: '#000' },
  input: {
    height: 120,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    textAlignVertical: 'top',
    color: '#000',
  },
  status: {
    color: '#000',
    marginBottom: 10,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
});

export default InputScreen;
