import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SplashScreen from './src/screens/SplashScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HomeScreen from './src/screens/HomeScreen';
import InputScreen from './src/screens/InputScreen';
import ResultScreen from './src/screens/ResultScreen';
import StatsScreen from './src/screens/StatsScreen';
import DiaryScreen from './src/screens/DiaryScreen';
import type { AgeGroup, JobGroup, Gender } from './src/advice/profileContext'; 

// ✅ Root Stack 네비게이션 타입 정의
export type RootStackParamList = {
  Splash: undefined;

  // ✅ 메인 탭 화면(홈/통계/꿈일기/프로필)
  Main: undefined;

  // ✅ 최초 1회 프로필 입력용(온보딩)
  OnboardingProfile: undefined;

  // ✅ 해몽 흐름
  Input: { dreamText?: string; mode?: 'text' | 'voice' };
  Result: {
    sentenceList: string[];
    dreamText: string;
    usedGPTInSplit: boolean;
    personName?: string;
        // ✅ 추가: 프로필 컨텍스트(없어도 되게 optional)
    gender?: Gender;
    ageGroup?: AgeGroup;
    jobGroup?: JobGroup;
  };
};

// ✅ Tab 네비게이션 타입 정의
export type MainTabParamList = {
  Home: undefined;
  Stats: undefined;
  Diary: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: '통계' }} />
      <Tab.Screen name="Diary" component={DiaryScreen} options={{ title: '꿈일기' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '프로필' }} />
    </Tab.Navigator>
  );
}

export default function Navigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* ✅ 온보딩 프로필 입력(최초 1회) */}
        <Stack.Screen name="OnboardingProfile" component={ProfileScreen} />

        {/* ✅ 메인 탭 */}
        <Stack.Screen name="Main" component={MainTabs} />

        {/* ✅ 해몽 흐름 */}
        <Stack.Screen name="Input" component={InputScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
