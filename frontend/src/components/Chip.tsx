import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Radius } from '../theme';

type ChipProps = {
  text: string;
  tone?: 'default' | 'accent' | 'muted';
  style?: StyleProp<ViewStyle>;
};

export default function Chip({ text, tone = 'default', style }: ChipProps) {
  return (
    <View style={[styles.chip, tone === 'accent' && styles.chipAccent, style]}>
      <Text
        style={[
          styles.text,
          tone === 'accent' && styles.textAccent,
          tone === 'muted' && styles.textMuted,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  chipAccent: {
    borderColor: Colors.accentPrimary,
    backgroundColor: Colors.accentPrimaryFaint,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  textAccent: {
    color: Colors.accentPrimary,
  },
  textMuted: {
    color: Colors.textMuted,
  },
});
