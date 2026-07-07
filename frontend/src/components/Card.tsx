import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Typography, Radius } from '../theme';

type CardProps = {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function Card({ title, children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View>{children}</View>
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
  title: {
    ...Typography.h2,
    fontSize: 16,
    marginBottom: 10,
  },
});
