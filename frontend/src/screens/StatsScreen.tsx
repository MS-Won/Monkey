// frontend/src/screens/StatsScreen.tsx

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

import {Colors} from '../theme/colors';
import {Spacing, Radius} from '../theme/spacing';
import {getDB} from '../database/initDB';
import Card from '../components/Card';
import BarChart, {BarDatum} from '../components/BarChart';
import {buildPeriods, countByPeriod, ChartMode} from '../logic/statsPeriods';
import Mascot from '../components/Mascot';
import AuroraBackground from '../components/holo/AuroraBackground';
import {resolveArchetypeCard, ArchetypeCard} from '../data/archetypeCards';

// 한글 받침 유무로 조사 선택 (예: '새벽'+은/는 → '새벽은')
const hasFinalConsonant = (word: string) => {
  if (!word) return false;
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
};
const josa = (word: string, withF: string, withoutF: string) =>
  hasFinalConsonant(word) ? withF : withoutF;

type KeywordStat = {
  keyword: string; // DB 원본 값(영문 카드명 등) — React key/조회용
  nameKo: string; // 화면 표기용 한글
  meaning: string; // 카드 의미(예: '풍요 · 번영 · 재물운') — 이름만으로는 뜻이 안 통해서 함께 보여준다
  count: number;
  percent: number;
};

const StatsScreen = () => {
  const [totalAllCount, setTotalAllCount] = useState(0);
  const [total30Count, setTotal30Count] = useState(0);
  const [comment, setComment] = useState('');

  const [topCard, setTopCard] = useState<ArchetypeCard | null>(null);
  const [keywordComment, setKeywordComment] = useState('');
  const [keywordStats, setKeywordStats] = useState<KeywordStat[]>([]);

  const [chartMode, setChartMode] = useState<ChartMode>('week');
  const [chartData, setChartData] = useState<BarDatum[]>([]);

  const [lottoPower, setLottoPower] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadChartData(chartMode);
    }, [chartMode]),
  );

  const loadStats = () => {
    const db = getDB();

    db.transaction(tx => {
      // 전체 꿈 기록 수
      tx.executeSql(
        `SELECT COUNT(*) as count FROM dream_diary;`,
        [],
        (_, allResult) => {
          const allCount = allResult.rows.item(0).count;
          setTotalAllCount(allCount);

          // 최근 30일 꿈 기록 수
          tx.executeSql(
            `
            SELECT COUNT(*) as count
            FROM dream_diary
            WHERE date(created_at) >= date('now', '-29 day');
            `,
            [],
            (_, recentResult) => {
              const recentCount = recentResult.rows.item(0).count;
              setTotal30Count(recentCount);
              setComment(getTopCardComment(recentCount, allCount));
            },
            (_, error) => {
              console.log('❌ 최근 30일 꿈 기록 수 조회 실패:', error);
              return false;
            },
          );
        },
        (_, error) => {
          console.log('❌ 전체 꿈 기록 수 조회 실패:', error);
          return false;
        },
      );

      // 최근 30일 키워드 통계
      tx.executeSql(
        `
        SELECT keyword, COUNT(*) as count
        FROM dream_diary
        WHERE date(created_at) >= date('now', '-29 day')
        AND keyword IS NOT NULL
        AND keyword != ''
        GROUP BY keyword
        ORDER BY count DESC
        LIMIT 5;
        `,
        [],
        (_, result) => {
          const rows = result.rows;
          const temp: {keyword: string; count: number}[] = [];
          let totalKeywordCount = 0;

          for (let i = 0; i < rows.length; i++) {
            const item = rows.item(i);

            temp.push({
              keyword: item.keyword,
              count: item.count,
            });

            totalKeywordCount += item.count;
          }

          const calculated = temp.map(item => {
            const card = resolveArchetypeCard(item.keyword);
            return {
              keyword: item.keyword,
              nameKo: card.nameKo,
              meaning: card.meaning,
              count: item.count,
              percent:
                totalKeywordCount === 0
                  ? 0
                  : Math.round((item.count / totalKeywordCount) * 100),
            };
          });

          setKeywordStats(calculated);

          if (temp.length > 0) {
            const card = resolveArchetypeCard(temp[0].keyword);
            setTopCard(card);
            setKeywordComment(getKeywordComment(card));
          } else {
            setTopCard(null);
            setKeywordComment('');
          }
        },
        (_, error) => {
          console.log('❌ 키워드 통계 조회 실패:', error);
          return false;
        },
      );

      // 로또력 평균
      tx.executeSql(
        `
        SELECT AVG(lucky_score) as avgLucky
        FROM dream_diary
        WHERE date(created_at) >= date('now', '-29 day');
        `,
        [],
        (_, result) => {
          const avgLucky = result.rows.item(0).avgLucky;

          if (avgLucky === null || avgLucky === undefined) {
            setLottoPower(0);
          } else {
            setLottoPower(Math.round(avgLucky / 10) * 10);
          }
        },
        (_, error) => {
          console.log('❌ 로또력 조회 실패:', error);
          setLottoPower(0);
          return false;
        },
      );
    });
  };

  const loadChartData = (mode: ChartMode) => {
    const db = getDB();

    // 칸 수는 첫 기록 시점에 따라 1~8칸. 날짜 묶기는 SQLite date()(UTC)가 아니라
    // countByPeriod에서 로컬 시각으로 한다 — KST 새벽 기록이 전날로 새지 않게.
    db.transaction(tx => {
      tx.executeSql(
        `SELECT created_at FROM dream_diary WHERE created_at IS NOT NULL ORDER BY created_at;`,
        [],
        (_, result) => {
          const createdAts: string[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            createdAts.push(result.rows.item(i).created_at);
          }
          const first = createdAts.length > 0 ? new Date(createdAts[0]) : null;
          const periods = buildPeriods(
            mode,
            first && !Number.isNaN(first.getTime()) ? first : null,
            new Date(),
          );
          const counts = countByPeriod(periods, createdAts);
          setChartData(
            periods.map((p, i) => ({label: p.label, superscript: p.yearTag, value: counts[i]})),
          );
        },
        (_, error) => {
          console.log('❌ 그래프 조회 실패:', error);
          const periods = buildPeriods(mode, null, new Date());
          setChartData(periods.map(p => ({label: p.label, superscript: p.yearTag, value: 0})));
          return false;
        },
      );
    });
  };

  const getTopCardComment = (count: number, allCount: number) => {
    if (allCount === 0) {
      return '아직 기록된 꿈이 없어요. 기억에 남는 꿈을 남겨보세요.';
    }

    if (count === 0) {
      return '최근 30일 동안 기록된 꿈이 없어요. 꿈을 기억하지 못한 날이 많았을 수도 있어요.';
    }

    if (count >= 21) {
      return '꿈을 매우 자주 기억하고 계시네요.';
    }

    if (count >= 11) {
      return '최근 꿈을 자주 기억하는 편이에요.';
    }

    if (count >= 6) {
      return '꾸준히 꿈을 기록하고 있어요.';
    }

    if (count >= 3) {
      return '비교적 안정적인 수면 흐름일 수도 있어요.';
    }

    return '비교적 깊은 잠에 들고 계시는 것 같아요.';
  };

  // 카드의 의미(meaning)와 정서 극성(polarity)을 바탕으로 문장 + 조언을 구성
  const getKeywordComment = (card: ArchetypeCard) => {
    const meaning = card.meaning.replace(/\s*·\s*/g, ', ');
    const topic = josa(card.nameKo, '은', '는');
    const obj = meaning + josa(meaning, '을', '를');

    const advice =
      card.polarity === 'light'
        ? '마음이 향하는 밝은 신호일 수 있어요. 지금의 흐름을 믿고 한 걸음 더 나아가 보세요.'
        : card.polarity === 'shadow'
        ? '조금 지치고 무거운 시기일 수 있어요. 감정을 밀어내기보다 천천히 들여다보고 스스로를 다독여 주세요.'
        : '요즘 이 주제가 마음속에서 맴돌고 있는지도 몰라요. 스스로에게 가만히 물어보는 시간을 가져 보세요.';

    return `‘${card.nameKo}’${topic} 최근 꿈에 자주 나타난 상징이에요. ${obj} 뜻하는 카드로, ${card.essence}. ${advice}`;
  };

  const getLottoTitle = (score: number) => {
    if (score >= 90) return '행운력 매우 높음';
    if (score >= 70) return '행운력 높음';
    if (score >= 50) return '행운력 보통';
    if (score >= 30) return '행운력 낮음';
    return '행운력 매우 낮음';
  };

  return (
    <View style={styles.screen}>
      <AuroraBackground intensity={0.45} />
      <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.content}>
      {/* 상단 카드 */}
      <Card title="최근 30일 꿈 기록" style={styles.card}>
        {totalAllCount === 0 ? (
          <View style={styles.emptyRowCentered}>
            <Mascot size={56} holo />
            <Text style={[styles.bigText, styles.centerText]}>아직 기록이 없어요</Text>
            <Text style={[styles.subText, styles.centerText]}>{comment}</Text>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <Text style={[styles.bigText, styles.centerText]}>{total30Count}번</Text>
            <Text style={[styles.subText, styles.centerText]}>
              최근 30일 중에 꿈을 {total30Count}번 기록했어요.
            </Text>
            <Text style={[styles.subText, styles.centerText]}>{comment}</Text>
          </View>
        )}
      </Card>

      {/* 중단 카드 */}
      <Card title="최근 자주 등장한 꿈 키워드" style={styles.card}>
        {topCard ? (
          <View style={styles.centerContent}>
            <Text style={[styles.keywordText, styles.centerText]}>{topCard.nameKo}</Text>
            <Text style={[styles.subText, styles.centerText]}>{keywordComment}</Text>
          </View>
        ) : (
          <Text style={[styles.subText, styles.centerText]}>
            꿈을 몇 번 기록하면 자주 나타나는 상징을 보여드릴게요.
          </Text>
        )}
      </Card>

      {/* 하단 1 */}
      <Card title="이번 달의 꿈 키워드" style={styles.card}>
        {keywordStats.length > 0 ? (
          keywordStats.map(item => (
            <View key={item.keyword} style={styles.keywordRow}>
              <Text style={styles.keywordName} numberOfLines={2}>
                {item.nameKo}
                <Text style={styles.keywordMeaning}> ({item.meaning})</Text>
              </Text>
              <Text style={styles.keywordPercent}>{item.percent}%</Text>
            </View>
          ))
        ) : (
          <Text style={styles.subText}>아직 집계할 키워드가 없어요.</Text>
        )}
      </Card>

      {/* 하단 2 */}
      <Card title="꿈 기록 통계" style={styles.card}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              chartMode === 'week' && styles.toggleActive,
            ]}
            onPress={() => setChartMode('week')}>
            <Text style={[styles.toggleText, chartMode === 'week' && styles.toggleTextActive]}>
              주 단위
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              chartMode === 'month' && styles.toggleActive,
            ]}
            onPress={() => setChartMode('month')}>
            <Text style={[styles.toggleText, chartMode === 'month' && styles.toggleTextActive]}>
              월 단위
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chart}>
          <BarChart data={chartData} />
        </View>
      </Card>

      {/* 하단 3 */}
      <Card title="로또력 분석" style={styles.card}>
        <Text style={styles.lottoTitle}>{getLottoTitle(lottoPower)}</Text>
        <Text style={styles.bigText}>{lottoPower}%</Text>

        <Text style={styles.subText}>
          최근 꿈 기록을 바탕으로 본 재미용 행운 지표예요.
        </Text>

        <Text style={styles.notice}>
          ※ 로또력은 꿈 데이터를 바탕으로 한 재미용 분석입니다.
        </Text>
      </Card>
      </ScrollView>
    </View>
  );
};

export default StatsScreen;

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
    paddingBottom: 28,
  },
  card: {
    marginTop: Spacing.md,
  },
  emptyRowCentered: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  centerContent: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  bigText: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  subText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  keywordText: {
    color: Colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 10,
  },
  keywordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  keywordName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  keywordMeaning: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  keywordPercent: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginRight: 8,
  },
  toggleActive: {
    backgroundColor: Colors.accentPrimaryFaint,
    borderColor: Colors.accentPrimary,
  },
  toggleText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: Colors.accentPrimary,
  },
  chart: {
    marginTop: 8,
  },
  lottoTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  notice: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 10,
  },
});