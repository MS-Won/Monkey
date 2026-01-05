import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InputScreen from './src/screens/InputScreen';
import ResultScreen from './src/screens/ResultScreen';

// 🔧 Stack 네비게이션 타입 정의 (✅ 수정됨)
export type RootStackParamList = {
  Input: undefined;
  Result: {
    sentenceList: string[];
    dreamText: string;
    usedGPTInSplit: boolean; // ✅ 추가됨
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Input">
        <Stack.Screen name="Input" component={InputScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
