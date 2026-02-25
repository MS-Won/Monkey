import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={Typography.h2}>통계</Text>
      <Text style={Typography.muted}>추후 구현 예정</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: 20,
  },
});
