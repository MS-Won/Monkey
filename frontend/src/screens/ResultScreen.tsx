import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  UIManager,
  TextStyle,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {RootStackParamList} from '../../navigator';
import {
  fetchReading,
  Reading,
  ReadingCategory,
  ReadingError,
  ReadingErrorKind,
  ReadingPhase,
} from '../logic/reading';
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
import CardLabel from '../components/DreamCard/CardLabel';
import CardCreationLoader from '../components/DreamCard/CardCreationLoader';
import AuroraBackground from '../components/holo/AuroraBackground';
import BackButton from '../components/BackButton';
import Button from '../components/Button';

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
 * 무료 플랜 서버가 잠들어 있으면 첫 응답까지 1분 가까이 걸린다. 그동안 아무
 * 설명 없는 스피너만 돌면 사용자는 앱이 멈춘 줄 안다. 기다린 시간에 따라
 * 말을 바꿔 "느리지만 살아 있다"는 것을 알린다.
 */
function loaderSublabel(elapsedMs: number, phase: ReadingPhase): string {
  if (phase === 'retrying') {
    return '연결이 잠시 끊겼어요. 다시 시도하는 중입니다…';
  }
  if (elapsedMs < 8000) {
    return '잠시만 기다려주세요';
  }
  if (elapsedMs < 25000) {
    return '서버를 깨우고 있어요. 처음 한 번은 조금 걸립니다…';
  }
  return '거의 다 됐어요. 첫 해몽은 1분까지 걸릴 수 있습니다…';
}

/** 실패 원인별로 사용자가 다음에 무엇을 하면 되는지 알려준다. */
function errorMessage(kind: ReadingErrorKind): string {
  switch (kind) {
    case 'network':
      return `인터넷에 연결되지 않았어요.
연결을 확인한 뒤 다시 시도해주세요.`;
    case 'timeout':
      return `서버 응답이 너무 늦어요.
잠시 후 다시 시도하면 대개 바로 됩니다.`;
    case 'server':
      return `서버가 깨어나는 중이라 응답하지 못했어요.
잠시 후 다시 시도해주세요.`;
    case 'invalid':
    default:
      return `해몽을 만들지 못했어요.
꿈 내용을 조금 더 자세히 적어보시면 좋아요.`;
  }
}

/** 경과 시간을 세는 작은 훅. 로딩 중에만 돈다. */
function useElapsed(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const startedAt = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [active]);

  return elapsed;
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
  const [phase, setPhase] = useState<ReadingPhase>('waking');
  const [errorKind, setErrorKind] = useState<ReadingErrorKind | null>(null);

  const elapsed = useElapsed(loading);

  const run = useCallback(async () => {
    setLoading(true);
    setErrorKind(null);
    setPhase('waking');
    try {
      const result = await fetchReading(dreamText, {onPhase: setPhase});
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
      setErrorKind(e instanceof ReadingError ? e.kind : 'network');
    } finally {
      setLoading(false);
    }
  }, [dreamText]);

  useEffect(() => {
    run();
  }, [run]);

  if (loading) {
    return (
      <CardCreationLoader
        label="당신의 꿈을 풀이하고 있습니다"
        sublabel={loaderSublabel(elapsed, phase)}
      />
    );
  }

  // 실패했을 때 빈 화면 대신 원인과 재시도 버튼을 보여준다.
  // 예전에는 Alert 하나 띄우고 아무것도 없는 화면에 사용자를 남겨뒀다.
  if (errorKind) {
    return (
      <View style={styles.screen}>
        <AuroraBackground intensity={0.45} />
        <BackButton />
        <View style={styles.errorBox}>
          <Text style={Typography.h2}>해몽을 가져오지 못했어요</Text>
          <Text style={[styles.bodyText, styles.errorText]}>
            {errorMessage(errorKind)}
          </Text>
          <Button label="다시 시도" variant="primary" onPress={run} />
        </View>
      </View>
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
        {card && <CardLabel card={card} />}
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
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  errorText: {
    textAlign: 'center',
  },
});

export default ResultScreen;
