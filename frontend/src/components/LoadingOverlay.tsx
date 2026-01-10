import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

/**
 * ✅ 로딩 화면 컴포넌트
 * - "생각하는 중" 문구에 점(.)이 0~3개까지 반복되는 애니메이션
 * - 외부 라이브러리 없이 setInterval로 구현
 */
const LoadingOverlay = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 450); // ✅ 속도: 0.45초마다 변경 (원하면 350~600으로 조절)

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.mainText}>생각하는 중{dots}</Text>
      <Text style={styles.subText}>꿈의 의미를 차분히 정리하고 있습니다</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mainText: {
    ...Typography.h2,
    fontSize: 20,
    textAlign: 'center',
  },
  subText: {
    ...Typography.muted,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default LoadingOverlay;
