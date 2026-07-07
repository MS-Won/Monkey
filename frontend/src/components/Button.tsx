import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Radius } from '../theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: ButtonProps) {
  const variantStyle =
    variant === 'primary' ? styles.primary : variant === 'danger' ? styles.danger : styles.secondary;
  const textStyle =
    variant === 'primary'
      ? styles.primaryText
      : variant === 'danger'
      ? styles.dangerText
      : styles.secondaryText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        variantStyle,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.accentPrimary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primaryText: {
    color: Colors.backgroundPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondary: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  secondaryText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  danger: {
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerFaint,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  dangerText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
