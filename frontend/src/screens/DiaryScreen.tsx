import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

export default function DiaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={Typography.h2}>꿈일기</Text>
      <Text style={Typography.muted}>꿈 기록 리스트 예정</Text>
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
