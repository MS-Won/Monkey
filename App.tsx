import React, { useEffect } from 'react';
import Navigator from './frontend/navigator';
import { initDB } from './frontend/src/database/initDB';

const App = () => {
  useEffect(() => {  
    //dropCacheTable(); // ⚠️ 단 한 번 실행 후 주석처리할 것
    initDB();
  }, []);

  return <Navigator />;
};

export default App;
