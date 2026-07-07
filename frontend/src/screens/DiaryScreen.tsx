import React, {useCallback, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {Colors} from '../theme/colors';
import {Typography} from '../theme/typography';
import {Spacing} from '../theme/spacing';
import {getAllDreamDiaries, DreamDiaryRow} from '../database/initDB';
import Button from '../components/Button';
import Mascot from '../components/Mascot';
import FanCarousel from '../components/FanCarousel';
import AuroraBackground from '../components/holo/AuroraBackground';
import Ornament from '../components/holo/Ornament';
import {formatDate} from '../utils/date';

export default function DiaryScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<DreamDiaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedItem, setFocusedItem] = useState<DreamDiaryRow | null>(null);

  const load = useCallback(async () => {
    try {
      const rows = await getAllDreamDiaries();
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!loading && items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AuroraBackground intensity={0.45} />
        <Text style={Typography.h1}>꿈카드</Text>
        <View style={styles.emptyBody}>
          <Mascot size={72} holo />
          <Text style={[Typography.caption, styles.emptyText]}>아직 기록된 꿈이 없어요.</Text>
          <Button
            label="꿈 기록하러 가기"
            variant="primary"
            onPress={() => navigation.navigate('Input', {mode: 'text'})}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AuroraBackground intensity={0.45} />
      <View style={styles.headerBlock}>
        <Text style={Typography.h1}>꿈카드</Text>
        <Ornament width={140} style={styles.headerOrnament} />
        <Text style={[Typography.caption, styles.dateLabel]}>
          {focusedItem ? formatDate(focusedItem.created_at) : ' '}
        </Text>
      </View>

      <View style={styles.carouselWrap}>
        <FanCarousel
          items={items}
          keyExtractor={item => String(item.id)}
          getKeyword={item => item.keyword || '기타'}
          onOpenFocused={item => navigation.navigate('DiaryDetail', {id: item.id})}
          onFocusChange={item => setFocusedItem(item)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  headerBlock: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  headerOrnament: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  dateLabel: {
    marginTop: 4,
  },
  carouselWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    marginBottom: Spacing.sm,
  },
});
