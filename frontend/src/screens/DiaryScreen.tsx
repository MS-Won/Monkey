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
import {resolveArchetypeCard} from '../data/archetypeCards';
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

  const focusedCard = focusedItem
    ? resolveArchetypeCard(focusedItem.keyword || '기타')
    : null;
  const focusedCardLabel = focusedCard
    ? `${focusedCard.nameKo} · ${focusedCard.meaning}`
    : ' ';

  if (!loading && items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AuroraBackground intensity={0.45} />
        <Text style={Typography.h1}>꿈 기록</Text>
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
        <Text style={Typography.h1}>꿈 기록</Text>
        <Ornament width={140} style={styles.headerOrnament} />
        <Text style={[Typography.caption, styles.dateLabel]}>
          {focusedItem ? formatDate(focusedItem.created_at) : ' '}
        </Text>
        {/* 캐러셀 카드는 부채꼴로 겹쳐 있어 카드마다 라벨을 붙일 수 없다.
            대신 가운데(포커스) 카드의 한글 이름/뜻을 여기 한 줄로 보여준다. */}
        <Text style={[Typography.caption, styles.cardLabel]}>
          {focusedItem ? focusedCardLabel : ' '}
        </Text>
        {/* 카드만으로는 어떤 꿈이었는지 떠오르지 않아 원문 앞부분을 함께 보여준다.
            3줄 높이를 항상 확보해 원문 길이에 따라 캐러셀이 들썩이지 않게 한다. */}
        <Text style={styles.dreamPreview} numberOfLines={3}>
          {focusedItem ? focusedItem.dream_text.replace(/\s+/g, ' ').trim() : ''}
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
    // 탭 화면이라 상태바 뒤로 제목이 들어간다. 상세 화면(paddingTop 72)이
    // 뒤로가기 버튼 자리를 함께 비우는 값이라, 그보다 조금 작게 잡는다.
    paddingTop: 56,
  },
  headerOrnament: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  dateLabel: {
    marginTop: 4,
  },
  cardLabel: {
    marginTop: 2,
    color: Colors.accentGold,
  },
  dreamPreview: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 21,
    height: 21 * 3,
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
  },
  carouselWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    padding: Spacing.xl,
    paddingTop: 56,
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
