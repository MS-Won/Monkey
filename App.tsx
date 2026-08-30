import React, { useEffect } from 'react';
import { AppState, AppStateStatus, StyleSheet } from 'react-native';
import Navigator from './frontend/navigator';
import { initDB } from './frontend/src/database/initDB';
import { warmUpServer } from './frontend/src/logic/serverWarmup';

// ✅ 제스처 루트
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const App = () => {
  useEffect(() => {
    initDB();

    // 백엔드는 Render 무료 플랜이라 15분 유휴 뒤 잠들고, 깨우는 데 약 52초가
    // 걸린다. 앱이 열리는 순간 미리 깨워두면 사용자가 꿈을 적는 동안 워밍업이
    // 끝나 해몽 요청은 이미 깨어난 서버로 간다. 실패해도 무시한다.
    warmUpServer();

    // 앱을 한동안 내려뒀다 돌아오면 서버가 다시 잠들었을 수 있다.
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        warmUpServer();
      }
    };
    const sub = AppState.addEventListener('change', onChange);

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <Navigator />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({ flex: { flex: 1 } });

export default App;
