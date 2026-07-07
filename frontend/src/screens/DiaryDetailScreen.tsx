import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';

import {RootStackParamList} from '../../navigator';
import {getDreamDiaryById, deleteDreamDiary, DreamDiaryRow} from '../database/initDB';
import {Colors} from '../theme/colors';
import {Typography} from '../theme/typography';
import {Spacing} from '../theme/spacing';
import LoadingOverlay from '../components/LoadingOverlay';
import Chip from '../components/Chip';
import Divider from '../components/Divider';
import Button from '../components/Button';
import DreamCard from '../components/DreamCard/DreamCard';
import {resolveArchetypeCard} from '../data/archetypeCards';
import AuroraBackground from '../components/holo/AuroraBackground';
import BackButton from '../components/BackButton';
import {formatDate} from '../utils/date';

type DiaryDetailRouteProp = RouteProp<RootStackParamList, 'DiaryDetail'>;

const DiaryDetailScreen = () => {
  const route = useRoute<DiaryDetailRouteProp>();
  const navigation = useNavigation<any>();
  const {id} = route.params;

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<DreamDiaryRow | null>(null);
  const [flipped, setFlipped] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await getDreamDiaryById(id);
        setRow(result);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onDelete = () => {
    Alert.alert('꿈 기록 삭제', '이 기록을 삭제할까요?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteDreamDiary(id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!row) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={Typography.h1}>기록을 찾을 수 없어요</Text>
        <Text style={Typography.caption}>삭제되었거나 존재하지 않는 기록입니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AuroraBackground intensity={0.45} />
      <BackButton />
      <Text style={Typography.h1}>꿈 기록</Text>
      <Text style={[Typography.caption, styles.topHint]}>{formatDate(row.created_at)}</Text>

      <View style={styles.cardWrapper}>
        <DreamCard
          card={resolveArchetypeCard(row.keyword, row.dream_text, row.interpretation)}
          flipped={flipped}
          onToggleFlip={() => setFlipped(v => !v)}
          renderBack={() => (
            <>
              <Text style={styles.sectionTitle}>당신의 꿈</Text>
              <Text style={styles.bodyText}>{row.dream_text}</Text>

              <Divider style={styles.divider} />

              <Text style={styles.sectionTitle}>해몽</Text>
              <Text style={styles.bodyText}>{row.interpretation}</Text>

              <View style={styles.metaRow}>
                <Chip text={`행운력 ${row.lucky_score}%`} />
              </View>
            </>
          )}
        />
      </View>

      <Button label="이 기록 삭제" variant="danger" onPress={onDelete} style={styles.deleteBtn} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: Spacing.xl,
    paddingTop: 72,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  topHint: {
    marginTop: 6,
    marginBottom: Spacing.lg,
  },
  cardWrapper: {
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  bodyText: {
    ...Typography.body,
  },
  divider: {
    marginVertical: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  deleteBtn: {
    marginTop: Spacing.md,
  },
});

export default DiaryDetailScreen;
