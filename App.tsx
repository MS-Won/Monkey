import React, { useEffect } from 'react';
import Navigator from './frontend/navigator';
import { initDB } from './frontend/src/database/initDB';

const App = () => {
  useEffect(() => {
    // ✅ DB 초기화는 앱 시작 시 1회
    initDB();
  }, []);

  // ✅ 화면 흐름은 navigator가 담당 (Splash → Profile → Input → Result)
  return <Navigator />;
};

export default App;
