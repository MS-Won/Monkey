// frontend/src/components/BackButton.tsx
// 좌상단 플로팅 뒤로가기 버튼. 전역 headerShown:false라 화면마다 직접 배치한다.
// 스택 화면(Result/Input voice/DiaryDetail)에서 재사용.
import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

type Props = {
  /** 커스텀 동작(없으면 goBack, 못 가면 Main으로) */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function BackButton({ onPress, style }: Props) {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main');
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="뒤로 가기"
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}>
      <Icon name="chevron-back" size={24} color={Colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 44,
    left: Spacing.lg,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentPrimaryFaint,
  },
  pressed: { opacity: 0.6 },
});
