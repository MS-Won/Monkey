import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigator';
import { analyzeSentence } from '../logic/AnalyzeSentence';
import { getGPTSummary } from '../logic/gpt';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

// ✅ 추가: 로딩 화면 컴포넌트
import LoadingOverlay from '../components/LoadingOverlay';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

// ✅ 안드로이드에서 LayoutAnimation 사용하려면 활성화가 필요합니다.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * ✅ 종합 해몽 결과에서 "종합 해몽"과 "조언"을 분리하기 위한 파서
 */
function splitSummaryAndAdvice(text: string) {
  const raw = (text ?? '').trim();
  if (!raw) {
    return { summary: '', advice: '' };
  }

  const adviceHeaderRegex = /(##\s*(조언|기억하세요|기억\s*하세요)\s*)/i;
  const adviceMatch = raw.match(adviceHeaderRegex);

  if (!adviceMatch || adviceMatch.index === undefined) {
    return { summary: raw, advice: '' };
  }

  const adviceStart = adviceMatch.index;
  const before = raw.slice(0, adviceStart).trim();
  const after = raw.slice(adviceStart).trim();

  const adviceBody = after.replace(adviceHeaderRegex, '').trim();

  const summaryBody = before
    .replace(/##\s*(종합\s*해몽|종합\s*해몽\s*결과)\s*/i, '')
    .trim();

  return { summary: summaryBody || before, advice: adviceBody };
}

const ResultScreen = () => {
  const route = useRoute<ResultScreenRouteProp>();
  const { sentenceList, dreamText, usedGPTInSplit, personName } = route.params;

  // ✅ 추가: 로딩 상태 (모든 결과 준비 전까지는 LoadingOverlay만 보여줌)
  const [loading, setLoading] = useState(true);

  // ✅ 개발자용 영역 접기/펼치기
  const [devOpen, setDevOpen] = useState(false);

  // ✅ 문장별 해몽 결과
  const [results, setResults] = useState<any[]>([]);

  // ✅ 종합 해몽 / 조언 분리 출력
  const [summary, setSummary] = useState('');
  const [advice, setAdvice] = useState('');

  // ✅ 종합 해몽 메타(비용 등)
  const [summaryMeta, setSummaryMeta] = useState<any>(null);

  // ✅ 이름 표시(너무 과한 반복 방지)
  const displayName = useMemo(() => {
    const name = (personName ?? '').trim();
    if (!name) return '';
    return name.endsWith('님') ? name : `${name}님`;
  }, [personName]);

  // ✅ 문장 수가 1개인지 여부
  const isSingleSentence = sentenceList.length <= 1;

  useEffect(() => {
    const analyzeAll = async () => {
      // ✅ 시작 시 로딩 ON (혹시 재진입/재실행 대비)
      setLoading(true);

      try {
        const temp: any[] = [];

        // 1) 문장별 해몽
        for (const sentence of sentenceList) {
          const res = await analyzeSentence(sentence);
          temp.push(res);
        }
        setResults(temp);

        // 2) 종합 해몽 + 조언
        const parts = temp.map((r, idx) => {
          return `- 문장 ${idx + 1}: ${sentenceList[idx]}\n  해몽: ${r.result}`;
        });

        const structuredInput = [
          displayName ? `사용자 이름: ${displayName}` : '',
          `꿈 원문: ${dreamText}`,
          '',
          '문장별 해몽:',
          ...parts,
          '',
          '요청:',
          '- 위 문장별 해몽을 단순 나열하지 말고, 하나의 이야기처럼 자연스럽게 엮어주세요.',
          '- 중복 표현은 합치고, 핵심 테마 2~3개로 묶어서 정리해주세요.',
          '- 마지막에 "## 조언" 섹션을 만들어, 사용자가 기억해야 할 행동/주의점 3개 이내로 제시해주세요.',
        ]
          .filter(Boolean)
          .join('\n');

        const summaryRes = await getGPTSummary(structuredInput);

        setSummaryMeta(summaryRes);

        const parsed = splitSummaryAndAdvice(summaryRes.result);
        setSummary(parsed.summary);
        setAdvice(parsed.advice);
      } catch (e) {
        console.log('[ResultScreen] analyzeAll error:', e);

        // ✅ 실패해도 사용자 화면이 멈추지 않도록 기본 메시지 세팅
        setSummary('해석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        setAdvice('네트워크 상태를 확인한 뒤 다시 실행해 보세요.');
      } finally {
        // ✅ 어떤 경우든 마지막에 로딩 OFF → 결과 화면 렌더 가능
        setLoading(false);
      }
    };

    analyzeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCostInfo = (usd: number) => {
    const won = usd * 1366;
    return `💵 ${usd.toFixed(5)} / ₩ ${won.toFixed(0)}`;
  };

  // ✅ 사용자용 "풀이 해몽" 내용
  const userExplainBlocks = useMemo(() => {
    return results.map((res, idx) => {
      return {
        title: `장면 ${idx + 1}`,
        sentence: sentenceList[idx],
        interpretation: res.result,
      };
    });
  }, [results, sentenceList]);

  const toggleDev = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDevOpen((v) => !v);
  };

  // ✅ 추가: 결과 준비 전에는 로딩 화면만 표시
  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={Typography.h2}>해몽 결과</Text>

      <Text style={[Typography.muted, styles.topHint]}>
        {displayName
          ? `${displayName}의 꿈을 바탕으로 정리했습니다.`
          : '꿈을 바탕으로 정리했습니다.'}
      </Text>

      {/* 1) 당신의 꿈 */}
      <Card title="당신의 꿈">
        <Text style={styles.bodyText}>{dreamText}</Text>
      </Card>

      {/* 2) 풀이 해몽 (문장 2개 이상일 때만 표시) */}
      {!isSingleSentence && (
        <Card title="풀이 해몽">
          {userExplainBlocks.map((b, idx) => (
            <View key={idx} style={styles.userBlock}>
              <Text style={styles.userBlockTitle}>
                {b.title}. {b.sentence}
              </Text>
              <Text style={styles.bodyText}>{b.interpretation}</Text>
              {idx !== userExplainBlocks.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </Card>
      )}

      {/* 3) 종합 해몽 */}
      <Card title="종합 해몽">
        <Text style={styles.summaryText}>{summary}</Text>

        {summaryMeta && typeof summaryMeta.totalCostUsd === 'number' && (
          <View style={[styles.metaRow, { marginTop: 10 }]}>
            <Chip
              text={`SUMMARY: ${
                summaryMeta.result !== '해석 실패' ? 'GPT' : 'NO-GPT'
              }`}
            />
            <Chip text={getCostInfo(summaryMeta.totalCostUsd)} />
          </View>
        )}
      </Card>

      {/* 4) 기억하세요(조언) */}
      <Card title="기억하세요">
        {advice ? (
          <Text style={styles.bodyText}>{advice}</Text>
        ) : (
          <Text style={[styles.bodyText, { color: Colors.textSecondary }]}>
            조언을 생성하지 못했습니다.
          </Text>
        )}
      </Card>

      {/* ✅ 개발자용 섹션 (접기/펼치기) */}
      <View style={styles.devWrapper}>
        <Pressable onPress={toggleDev} style={styles.devHeader}>
          <Text style={styles.devTitle}>개발자용(테스트 정보)</Text>
          <Text style={styles.devToggle}>{devOpen ? '접기 ▲' : '펼치기 ▼'}</Text>
        </Pressable>

        {devOpen && (
          <View style={{ marginTop: 10 }}>
            <Text style={[Typography.muted, { marginBottom: 8 }]}>
              비용/캐시 표시는 개발용입니다.
            </Text>

            <Card title="문장 분리 결과(DEV)">
              <Text style={styles.bodyText}>
                {sentenceList.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}
              </Text>

              <View style={styles.metaRow}>
                <Chip text={`SPLIT: ${usedGPTInSplit ? 'GPT' : 'NO-GPT'}`} />
              </View>
            </Card>

            <Card title="문장별 해몽 결과(DEV)">
              {results.map((res, idx) => (
                <View key={idx} style={styles.resultBlock}>
                  <Text style={styles.sentenceTitle}>
                    문장 {idx + 1}. {sentenceList[idx]}
                  </Text>

                  <Text style={styles.bodyText}>→ {res.result}</Text>

                  <View style={styles.metaRow}>
                    <Chip text={`방법: ${res.method}`} />
                    <Chip text={`GPT: ${res.method === 'GPT' ? 'O' : 'X'}`} />
                    <Chip text={`Cache: ${res.method === 'CACHE' ? 'O' : 'X'}`} />
                    {typeof res.totalCostUsd === 'number' ? (
                      <Chip text={getCostInfo(res.totalCostUsd)} />
                    ) : null}
                    <Chip
                      text={
                        res.similarity !== undefined
                          ? `유사도: ${res.similarity.toFixed(3)}`
                          : '유사도: GPT'
                      }
                    />
                  </View>

                  {idx !== results.length - 1 ? <Divider /> : null}
                </View>
              ))}
            </Card>
          </View>
        )}
      </View>

      <Text style={[Typography.muted, styles.footer]}>
        * Monkey는 “운세 앱”이 아니라 꿈 기록과 해석을 위한 도구로 설계됩니다.
      </Text>
    </ScrollView>
  );
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  topHint: {
    marginTop: 6,
    marginBottom: 12,
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
  cardBody: {},

  bodyText: {
    ...Typography.body,
  },

  userBlock: {
    paddingVertical: 6,
  },
  userBlockTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },

  resultBlock: {
    paddingVertical: 6,
  },
  sentenceTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginTop: 14,
  },

  summaryText: {
    ...Typography.body,
  },

  devWrapper: {
    marginTop: 14,
    borderRadius: 14,
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
