import React from 'react';
import { View, Text, TextInput, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Typography, Radius } from '../theme';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  placeholder?: string;
  minHeight?: number;
  editable?: boolean;
  variant?: 'plain' | 'bordered';
  style?: StyleProp<ViewStyle>;
};

export default function TextField({
  label,
  value,
  onChangeText,
  multiline,
  placeholder,
  minHeight,
  editable = true,
  variant = 'plain',
  style,
}: TextFieldProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        value={value}
        onChangeText={onChangeText}
        style={[
          variant === 'bordered' ? styles.inputBordered : styles.input,
          multiline && minHeight ? { minHeight } : null,
        ]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        textAlignVertical={multiline ? 'top' : undefined}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  label: {
    ...Typography.caption,
    marginBottom: 10,
  },
  input: {
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  inputBordered: {
    color: Colors.textPrimary,
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
});
