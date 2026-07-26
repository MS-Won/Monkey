import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {RootStackParamList} from '../../navigator';
import {fetchReading, Reading, ReadingCategory} from '../logic/reading';
import {
  CATEGORY_TITLES,
  sortCategoriesByProfile,
  renderReadingText,
} from '../logic/readingView';
import {loadUserProfile} from '../storage/userProfile';
import {saveDreamDiary} from '../database/initDB';

import {Colors} from '../theme/colors';
import {Typography} from '../theme/typography';
import {Spacing, Radius} from '../theme/spacing';

import Card from '../components/Card';
import Chip from '../components/Chip';
import Divider from '../components/Divider';
import DreamCard from '../components/DreamCard/DreamCard';
import CardCreationLoader from '../components/DreamCard/CardCreationLoader';
import AuroraBackground from '../components/holo/AuroraBackground';
import BackButton from '../components/BackButton';

import {
  selectArchetypeCard,
  ArchetypeCard,
} from '../data/archetypeCards';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 로또력 점수 계산
function calculateLuckyScore(text: string) {
  let score = 0;

  const luckyWords = [
    '행운',
    '재물',
    '금전',
    '돈',
    '복',
    '성공',
    '합격',
    '기회',
    '풍요',
    '좋은 결과',
    '번창',
    '돼지',
    '용',
    '금',
    '보석',
  ];

  luckyWords.forEach(word => {
    if (text.includes(word)) {
      score += 10;
    }
  });

  if (score > 100) {
    return 100;
  }

  return score;
}

const ResultScreen = () => {
  const route = useRoute<ResultScreenRouteProp>();

  const {dreamText} = route.params as {dreamText: string};

  const [loading, setLoading] = useState(true);
  const [devOpen, setDevOpen] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
  const [ordered, setOrdered] = useState<ReadingCategory[]>([]);
  const [card, setCard] = useState<ArchetypeCard | null>(null);
  const [cardFlipped, setCardFlipped] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const result = await fetchReading(dreamText);
        setReading(result);

        const profile = await loadUserProfile();
        const sorted = sortCategoriesByProfile(
          result.categories,
          profile.ageGroup,
          profile.jobGroup,
        );
        setOrdered(sorted);

        // 카드 선정: 꿈 원문 + 해몽 본문 전체를 신호로 쓴다.
        const bodyJoined = [result.summary, ...sorted.map(c => c.body)].join(' ');
        const drawnCard = selectArchetypeCard(dreamText, bodyJoined);
        setCard(drawnCard);

        const finalText = renderReadingText(result, sorted);
        const luckyScore = calculateLuckyScore(finalText);
        saveDreamDiary(dreamText, finalText, drawnCard.name, luckyScore);
      } catch (e) {
        console.log('[ResultScreen] fetchReading error:', e);
        Alert.alert('오류', '해몽을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [dreamText]);

  const getCostInfo = (usd: number) => {
    const won = usd * 1366;
    return `💵 ${usd.toFixed(5)} / ₩ ${won.toFixed(0)}`;
  };

  const toggleDev = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDevOpen(v => !v);
  };

  if (loading) {
    return (
      <CardCreationLoader
        label="당신의 꿈을 풀이하고 있습니다"
        sublabel="잠시만 기다려주세요"
      />
    );
  }

  return (
    <View style={styles.screen}>
      <AuroraBackground intensity={0.45} />
      <BackButton />
      <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.content}>
      <Text style={Typography.h1}>해몽 결과</Text>

      <Card title="당신의 꿈" style={styles.card}>
        <Text style={styles.bodyText}>{dreamText}</Text>
      </Card>

      <Text style={[Typography.caption, styles.cardSectionLabel]}>
        오늘 당신에게 드리운 상징 · 탭하면 해몽을 볼 수 있어요
      </Text>

      <View style={styles.cardWrapper}>
        {card && (
          <DreamCard
            card={card}
            flipped={cardFlipped}
            onToggleFlip={() => setCardFlipped(v => !v)}
            entrance
            renderBack={() => (
              <>
                <Text style={styles.cardBackTitle}>종합 해몽</Text>
                <Text style={styles.summaryText}>{reading?.summary}</Text>

                {!!reading?.oneLine && (
                  <>
                    <Divider style={styles.cardBackDivider} />
                    <Text style={styles.cardBackTitle}>오늘의 한마디</Text>
                    <Text style={styles.bodyText}>{reading.oneLine}</Text>
                  </>
                )}
              </>
            )}
          />
        )}
      </View>

      {cardFlipped &&
        ordered.map(c => (
          <Card key={c.key} title={CATEGORY_TITLES[c.key]} style={styles.card}>
            <Text style={styles.bodyText}>{c.body}</Text>
          </Card>
        ))}

      {__DEV__ && (
        <View style={styles.devWrapper}>
          <Pressable onPress={toggleDev} style={styles.devHeader}>
            <Text style={styles.devTitle}>개발자용(테스트 정보)</Text>
            <Text style={styles.devToggle}>{devOpen ? '접기 ▲' : '펼치기 ▼'}</Text>
          </Pressable>

          {devOpen && reading && (
            <Card title="해몽 호출(DEV)" style={styles.card}>
              <View style={styles.metaRow}>
                <Chip text={`in ${reading.inputToken} / out ${reading.outputToken}`} />
                <Chip text={getCostInfo(reading.totalCostUsd)} />
              </View>
              <Text style={styles.bodyText}>
                상징: {reading.symbols.join(', ') || '(매칭 없음)'}
              </Text>
            </Card>
          )}
        </View>
      )}

      <Text style={[Typography.caption, styles.footer]}>
        * Monkey는 “운세 앱”이 아니라 꿈 기록과 해석을 위한 도구로 설계됩니다.
      </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  scrollFlex: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: 72,
    paddingBottom: 28,
  },
  card: {
    marginTop: Spacing.md,
  },
  cardSectionLabel: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  cardWrapper: {
    alignItems: 'center',
  },
  cardBackTitle: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  cardBackDivider: {
    marginVertical: Spacing.md,
  },
  bodyText: {
    ...Typography.body,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 10,
  },
  summaryText: {
    ...Typography.body,
  },
  devWrapper: {
    marginTop: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 12,
    backgroundColor: 'transparent',
  },
  devHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  devTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  devToggle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    marginTop: 16,
  },
});

export default ResultScreen;