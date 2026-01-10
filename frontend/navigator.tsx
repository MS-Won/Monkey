import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/screens/SplashScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import InputScreen from './src/screens/InputScreen';
import ResultScreen from './src/screens/ResultScreen';

// ✅ Stack 네비게이션 타입 정의
export type RootStackParamList = {
  Splash: undefined;
  Profile: undefined;
  Input: undefined;
  Result: {
    sentenceList: string[];
    dreamText: string;
    usedGPTInSplit: boolean;

    // ✅ 추가: 사용자 이름(없을 수도 있으니 optional)
    personName?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigator = () => {
  return (
    <NavigationContainer>
      {/* ✅ 앱 시작은 Splash */}
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Input" component={InputScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
