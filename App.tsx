import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Navigator from './frontend/navigator';
import { initDB } from './frontend/src/database/initDB';

// ✅ 제스처 루트
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const App = () => {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <Navigator />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({ flex: { flex: 1 } });

export default App;
