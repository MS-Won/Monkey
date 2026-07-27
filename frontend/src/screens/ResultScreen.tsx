import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  UIManager,
  Alert,
  TextStyle,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {RootStackParamList} from '../../navigator';
import {fetchReading, Reading, ReadingCategory} from '../logic/reading';
import {
  CATEGORY_TITLES,
  sortCategoriesByProfile,
  renderReadingText,
  toParagraphs,
} from '../logic/readingView';
import {loadUserProfile} from '../storage/userProfile';
import {saveDreamDiary} from '../database/initDB';

import {Colors} from '../theme/colors';
import {Typography} from '../theme/typography';
import {Spacing} from '../theme/spacing';

import Card from '../components/Card';
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

// 카드를 뒤집을 때 프레임이 내용 높이만큼 늘어나는 것을 부드럽게 처리한다.
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

/**
 * 긴 본문을 단락으로 끊어 렌더한다.
 *
 * 모델은 개행 없이 한 덩어리로 돌려주는데, 분량을 2배로 늘린 뒤로는
 * 문장이 벽처럼 이어져 읽기 힘들었다. 화면에서만 나누고 저장 평문은 그대로 둔다.
 */
function Paragraphs({text, style}: {text: string; style: TextStyle}) {
  const paras = toParagraphs(text);

  return (
    <>
      {paras.map((p, i) => (
        <Text key={i} style={[style, i > 0 && styles.paragraphGap]}>
          {p}
        </Text>
      ))}
    </>
  );
}

const ResultScreen = () => {
  const route = useRoute<ResultScreenRouteProp>();

  const {dreamText} = route.params as {dreamText: string};

  const [loading, setLoading] = useState(true);
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
            growBack
            renderBack={() => (
              <>
                {/* 종합 해몽 → 카테고리 → 오늘의 한마디를 한 프레임에 담는다.
                    저장되는 평문(renderReadingText)과 순서가 같아야
                    화면에서 본 것과 꿈기록에 남는 것이 일치한다. */}
                <Text style={styles.cardBackTitle}>종합 해몽</Text>
                <Paragraphs text={reading?.summary ?? ''} style={styles.summaryText} />

                {ordered.map(c => (
                  <View key={c.key}>
                    <Divider style={styles.cardBackDivider} />
                    <Text style={styles.cardBackTitle}>{CATEGORY_TITLES[c.key]}</Text>
                    <Paragraphs text={c.body} style={styles.bodyText} />
                  </View>
                ))}

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
  summaryText: {
    ...Typography.body,
  },
  // 단락 사이 숨 쉴 틈. 8~12문장이 벽처럼 이어지지 않게 한다.
  paragraphGap: {
    marginTop: Spacing.md,
  },
  footer: {
    marginTop: 16,
  },
});

export default ResultScreen;