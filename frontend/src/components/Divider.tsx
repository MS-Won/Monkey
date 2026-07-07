import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../theme';

type DividerProps = {
  style?: StyleProp<ViewStyle>;
};

export default function Divider({ style }: DividerProps) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: Colors.dividerGold,
    marginTop: 14,
  },
});
