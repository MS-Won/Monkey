// frontend/src/screens/StatsScreen.tsx

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import {LineChart} from 'react-native-chart-kit';
import {useFocusEffect} from '@react-navigation/native';

import {Colors} from '../theme/colors';
import {Typography} from '../theme/typography';

const screenWidth = Dimensions.get('window').width;

const db = SQLite.openDatabase(
  {
    name: 'dreams.db',
    location: 'default',
  },
  () => console.log('✅ StatsScreen DB 연결 성공'),
  error => console.log('❌ StatsScreen DB 연결 실패:', error),
);

type KeywordStat = {
  keyword: string;
  count: number;
  percent: number;
};

type ChartMode = 'week' | 'month';

type PeriodItem = {
  label: string;
  startDate: Date;
  endDate: Date;
};

const StatsScreen = () => {
  const [totalAllCount, setTotalAllCount] = useState(0);
  const [total30Count, setTotal30Count] = useState(0);
  const [comment, setComment] = useState('');

  const [topKeyword, setTopKeyword] = useState<string | null>(null);
  const [keywordComment, setKeywordComment] = useState('');
  const [keywordStats, setKeywordStats] = useState<KeywordStat[]>([]);

  const [chartMode, setChartMode] = useState<ChartMode>('week');
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);

  const [lottoPower, setLottoPower] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadChartData(chartMode);
    }, [chartMode]),
  );

  const loadStats = () => {
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

          const calculated = temp.map(item => ({
            keyword: item.keyword,
            count: item.count,
            percent:
              totalKeywordCount === 0
                ? 0
                : Math.round((item.count / totalKeywordCount) * 100),
          }));

          setKeywordStats(calculated);

          if (calculated.length > 0) {
            setTopKeyword(calculated[0].keyword);
            setKeywordComment(getKeywordComment(calculated[0].keyword));
          } else {
            setTopKeyword(null);
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
    if (mode === 'week') {
      const weeks = buildRecentSixWeeks();

      const labels = weeks.map(item => item.label);
      const data = new Array(weeks.length).fill(0);
      let completed = 0;

      db.transaction(tx => {
        weeks.forEach((week, index) => {
          tx.executeSql(
            `
            SELECT COUNT(*) as count
            FROM dream_diary
            WHERE date(created_at) >= date(?)
            AND date(created_at) < date(?);
            `,
            [
              formatDateForSQLite(week.startDate),
              formatDateForSQLite(week.endDate),
            ],
            (_, result) => {
              data[index] = result.rows.item(0).count;
              completed += 1;

              if (completed === weeks.length) {
                setChartLabels(labels);
                setChartData([...data]);
              }
            },
            (_, error) => {
              console.log('❌ 주 단위 그래프 조회 실패:', error);
              completed += 1;

              if (completed === weeks.length) {
                setChartLabels(labels);
                setChartData([...data]);
              }

              return false;
            },
          );
        });
      });

      return;
    }

    const months = buildRecentSixMonths();

    const labels = months.map(item => item.label);
    const data = new Array(months.length).fill(0);
    let completed = 0;

    db.transaction(tx => {
      months.forEach((month, index) => {
        tx.executeSql(
          `
          SELECT COUNT(*) as count
          FROM dream_diary
          WHERE date(created_at) >= date(?)
          AND date(created_at) < date(?);
          `,
          [
            formatDateForSQLite(month.startDate),
            formatDateForSQLite(month.endDate),
          ],
          (_, result) => {
            data[index] = result.rows.item(0).count;
            completed += 1;

            if (completed === months.length) {
              setChartLabels(labels);
              setChartData([...data]);
            }
          },
          (_, error) => {
            console.log('❌ 월 단위 그래프 조회 실패:', error);
            completed += 1;

            if (completed === months.length) {
              setChartLabels(labels);
              setChartData([...data]);
            }

            return false;
          },
        );
      });
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

  const getKeywordComment = (keyword: string) => {
    return `“${keyword}”은/는 최근 꿈에서 자주 등장한 상징이에요. 최근 이와 관련된 생각이나 상황이 반복되고 있지는 않은지 가볍게 돌아보세요.`;
  };

  const getLottoTitle = (score: number) => {
    if (score >= 90) return '행운력 매우 높음';
    if (score >= 70) return '행운력 높음';
    if (score >= 50) return '행운력 보통';
    if (score >= 30) return '행운력 낮음';
    return '행운력 매우 낮음';
  };

  const safeChartData = chartData.length > 0 ? chartData : [0, 0, 0, 0, 0, 0];
  const safeChartLabels =
    chartLabels.length > 0
      ? chartLabels
      : ['-', '-', '-', '-', '-', '-'];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* 상단 카드 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>최근 30일 꿈 기록</Text>

        {totalAllCount === 0 ? (
          <>
            <Text style={styles.bigText}>아직 기록이 없어요</Text>
            <Text style={styles.subText}>{comment}</Text>
          </>
        ) : (
          <>
            <Text style={styles.bigText}>{total30Count}번</Text>
            <Text style={styles.subText}>
              최근 30일 중에 꿈을 {total30Count}번 기록했어요.
            </Text>
            <Text style={styles.subText}>{comment}</Text>
          </>
        )}
      </View>

      {/* 중단 카드 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>최근 자주 등장한 꿈 키워드</Text>

        {topKeyword ? (
          <>
            <Text style={styles.keywordText}>{topKeyword}</Text>
            <Text style={styles.subText}>{keywordComment}</Text>
          </>
        ) : (
          <Text style={styles.subText}>
            꿈을 몇 번 기록하면 자주 나타나는 상징을 보여드릴게요.
          </Text>
        )}
      </View>

      {/* 하단 1 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>이번 달의 꿈 키워드</Text>

        {keywordStats.length > 0 ? (
          keywordStats.map(item => (
            <View key={item.keyword} style={styles.keywordRow}>
              <Text style={styles.keywordName}>{item.keyword}</Text>
              <Text style={styles.keywordPercent}>{item.percent}%</Text>
            </View>
          ))
        ) : (
          <Text style={styles.subText}>아직 집계할 키워드가 없어요.</Text>
        )}
      </View>

      {/* 하단 2 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>꿈 기록 통계</Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              chartMode === 'week' && styles.toggleActive,
            ]}
            onPress={() => setChartMode('week')}>
            <Text style={styles.toggleText}>주 단위</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              chartMode === 'month' && styles.toggleActive,
            ]}
            onPress={() => setChartMode('month')}>
            <Text style={styles.toggleText}>월 단위</Text>
          </TouchableOpacity>
        </View>

        <LineChart
          data={{
            labels: safeChartLabels,
            datasets: [{data: safeChartData}],
          }}
          width={screenWidth-60}
          height={230}
          yAxisSuffix="회"
          chartConfig={{
            backgroundGradientFrom: Colors.backgroundSecondary,
            backgroundGradientTo: Colors.backgroundSecondary,
            decimalPlaces: 0,
            color: opacity => `rgba(255, 255, 255, ${opacity})`,
            labelColor: opacity => `rgba(255, 255, 255, ${opacity})`,
            propsForDots: {
              r: '4',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* 하단 3 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>로또력 분석</Text>

        <Text style={styles.lottoTitle}>{getLottoTitle(lottoPower)}</Text>
        <Text style={styles.bigText}>{lottoPower}%</Text>

        <Text style={styles.subText}>
          최근 꿈 기록을 바탕으로 본 재미용 행운 지표예요.
        </Text>

        <Text style={styles.notice}>
          ※ 로또력은 꿈 데이터를 바탕으로 한 재미용 분석입니다.
        </Text>
      </View>
    </ScrollView>
  );
};

export default StatsScreen;

/**
 * 날짜를 SQLite date 비교용 문자열로 변환
 * 예: 2026-05-16
 */
const formatDateForSQLite = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

/**
 * 해당 날짜가 포함된 주의 월요일을 구함
 * 한국식 주간 계산을 위해 월요일 시작으로 통일
 */
const getMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();

  // 일요일이면 이전 월요일로 이동
  // 월요일이면 그대로
  const diff = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);

  return d;
};

/**
 * 목요일 기준 주차 라벨 계산
 *
 * 예:
 * 2026-05-16은 2026년 5월 2주
 */
const getWeekLabelByThursdayRule = (date: Date): PeriodItem => {
  const monday = getMonday(date);

  // 해당 주의 목요일
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);

  const year = thursday.getFullYear();
  const month = thursday.getMonth();

  // 해당 월 1일
  const firstDayOfMonth = new Date(year, month, 1);

  // 해당 월 1일이 포함된 주의 월요일
  const firstMonday = getMonday(firstDayOfMonth);

  // 첫 월요일 기준 목요일
  const firstThursday = new Date(firstMonday);
  firstThursday.setDate(firstMonday.getDate() + 3);

  let baseMonday = firstMonday;

  // 첫 목요일이 해당 월이 아니면 다음 주 월요일부터 1주차
  if (firstThursday.getMonth() !== month) {
    baseMonday = new Date(firstMonday);
    baseMonday.setDate(firstMonday.getDate() + 7);
  }

  const diffMs = monday.getTime() - baseMonday.getTime();
  const weekNumber = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

  return {
    label: `${month + 1}월 ${weekNumber}주`,
    startDate: monday,
    endDate: new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000),
  };
};

/**
 * 현재 주 포함 최근 6주 생성
 * 순서: 현재 → 과거
 */
const buildRecentSixWeeks = (): PeriodItem[] => {
  const today = new Date();
  const currentMonday = getMonday(today);
  const weeks: PeriodItem[] = [];

  for (let i = 0; i < 6; i++) {
    const targetDate = new Date(currentMonday);
    targetDate.setDate(currentMonday.getDate() - i * 7);

    weeks.push(getWeekLabelByThursdayRule(targetDate));
  }

  return weeks;
};

/**
 * 현재 월 포함 최근 6개월 생성
 * 순서: 현재 → 과거
 */
const buildRecentSixMonths = (): PeriodItem[] => {
  const today = new Date();
  const months: PeriodItem[] = [];

  for (let i = 0; i < 6; i++) {
    const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

    months.push({
      label: `${startDate.getFullYear()}년 ${startDate.getMonth() + 1}월`,
      startDate,
      endDate,
    });
  }

  return months;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginTop: 12,
  },
  cardTitle: {
    ...Typography.h2,
    fontSize: 16,
    marginBottom: 10,
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
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  keywordName: {
    color: Colors.textPrimary,
    fontSize: 15,
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
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginRight: 8,
  },
  toggleActive: {
    backgroundColor: Colors.borderSubtle,
  },
  toggleText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  chart: {
    borderRadius: 12,
    marginTop: 4,
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