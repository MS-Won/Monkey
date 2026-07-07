/**
 * @format
 */
import 'react-native-gesture-handler';
import {AppRegistry, LogBox} from 'react-native';
import {name as appName} from './app.json';

// @react-native-voice/voice의 알려진 호환성 경고(기능에는 영향 없음, 라이브러리 자체 이슈).
// import는 호이스팅되어 이 설정보다 먼저 평가되므로, require를 써서 App(및 Voice) 평가 시점을 이 뒤로 늦춘다.
LogBox.ignoreLogs([
  'new NativeEventEmitter()',
]);

const App = require('./App').default;


AppRegistry.registerComponent(appName, () => App);
