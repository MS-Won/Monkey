// frontend/src/components/DreamCard/CardLabel.tsx
// 아키타입 카드의 한글 이름/뜻. 카드 이미지 **바깥**에 놓는다.
//
// 예전에는 이 글자가 일러스트 한복판에 구워져 있어(scripts/apply-card-labels.py)
// 글자와 그림이 서로 간섭했다. 이제 카드 PNG는 원본 그대로 두고 — 원본 하단에는
// 영문 이름판이 자체 카투슈 안에 들어 있다 — 한글은 앱이 카드 위에 그린다.
import React from 'react';
import {View, Text, StyleSheet, StyleProp, ViewStyle} from 'react-native';

import {Colors, Typography, Spacing} from '../../theme';
import type {ArchetypeCard} from '../../data/archetypeCards';

type CardLabelProps = {
  card: ArchetypeCard;
  style?: StyleProp<ViewStyle>;
};

export default function CardLabel({card, style}: CardLabelProps) {
  return (
    <View style={[styles.block, style]}>
      <Text style={styles.nameKo}>{card.nameKo}</Text>
      <View style={styles.rule} />
      <Text style={styles.meaning}>{card.meaning}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  nameKo: {
    ...Typography.h2,
    color: Colors.textPrimary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  // 이름과 뜻 사이의 얇은 골드 선 — 카드 아르누보 톤과 맞춘다.
  rule: {
    width: 40,
    height: 1,
    backgroundColor: Colors.accentGold,
    opacity: 0.7,
    marginVertical: Spacing.xs,
  },
  meaning: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
