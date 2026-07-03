import React, {useEffect, useMemo, useState} from 'react';
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
import {RouteProp, useRoute} from '@react-navigation/native';
import {RootStackParamList} from '../../navigator';
import {analyzeSentence} from '../logic/AnalyzeSentence';
import {getGPTSummary} from '../logic/gpt';
import {saveDreamDiary} from '../database/initDB';

import {Colors} from '../theme/colors';
import {Typography} from '../theme/typography';

import LoadingOverlay from '../components/LoadingOverlay';

import {
  buildDisplayName,
  buildProfileContextForPrompt,
} from '../advice/profileContext';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function splitSummaryAndAdvice(text: string) {
  const raw = (text ?? '').trim();

  if (!raw) {
    return {summary: '', advice: ''};
  }

  const adviceHeaderRegex = /(##\s*(조언|기억하세요|기억\s*하세요)\s*)/i;
  const adviceMatch = raw.match(adviceHeaderRegex);

  if (!adviceMatch || adviceMatch.index === undefined) {
    return {summary: raw, advice: ''};
  }

  const adviceStart = adviceMatch.index;
  const before = raw.slice(0, adviceStart).trim();
  const after = raw.slice(adviceStart).trim();

  const adviceBody = after.replace(adviceHeaderRegex, '').trim();

  const summaryBody = before
    .replace(/##\s*(종합\s*해몽|종합\s*해몽\s*결과)\s*/i, '')
    .trim();

  return {summary: summaryBody || before, advice: adviceBody};
}

// 대표 키워드 추출
function extractMainKeyword(dreamText: string, resultText: string) {
  const source = `${dreamText} ${resultText}`;

  const keywords = [
    '돼지',
    '뱀',
    '물',
    '불',
    '피',
    '돈',
    '금',
    '조상',
    '가족',
    '친구',
    '학교',
    '회사',
    '집',
    '바다',
    '산',
    '강',
    '아이',
    '아기',
    '개',
    '고양이',
    '호랑이',
    '용',
    '새',
    '비',
    '눈',
    '차',
    '길',
    '문',
    '옷',
    '신발',
  ];

  for (const keyword of keywords) {
    if (source.includes(keyword)) {
      return keyword;
    }
  }

  return '기타';
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

  const {
    sentenceList,
    dreamText,
    usedGPTInSplit,
    personName,
    gender,
    ageGroup,
    jobGroup,
  } = route.params as any;

  const [loading, setLoading] = useState(true);
  const [devOpen, setDevOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState('');
  const [advice, setAdvice] = useState('');
  const [summaryMeta, setSummaryMeta] = useState<any>(null);

  const displayName = useMemo(() => buildDisplayName(personName), [personName]);

  const contextLine = useMemo(() => {
    return buildProfileContextForPrompt({
      gender,
      ageGroup,
      jobGroup,
    });
  }, [gender, ageGroup, jobGroup]);

  const isSingleSentence = sentenceList.length <= 1;

  useEffect(() => {
    const analyzeAll = async () => {
      setLoading(true);

      try {
        const temp: any[] = [];

        for (const sentence of sentenceList) {
          const res = await analyzeSentence(sentence);
          temp.push(res);
        }

        setResults(temp);

        const parts = temp.map((r, idx) => {
          return `- 문장 ${idx + 1}: ${sentenceList[idx]}\n  해몽: ${r.result}`;
        });

        const structuredInput = [
          displayName ? `사용자 이름: ${displayName}` : '',
          contextLine ? contextLine : '',
          `꿈 원문: ${dreamText}`,
          '',
          '문장별 해몽:',
          ...parts,
          '',
          '요청:',
          '- 위 문장별 해몽을 단순 나열하지 말고, 하나의 이야기처럼 자연스럽게 엮어주세요.',
          '- 중복 표현은 합치고, 핵심 테마 2~3개로 묶어서 정리해주세요.',
          '- 마지막에 "## 조언" 섹션을 만들고, 사용자가 기억해야 할 행동/주의점을 3개 이내로 제시해주세요.',
          '- 단, 위의 "사용자 맥락(참고용)"이 제공된 경우 그 정보를 참고하여 조언의 표현과 강조점을 조정해주세요.',
          '- 사용자 맥락이 비어있다면 일반적인 조언으로 작성해주세요.',
        ]
          .filter(Boolean)
          .join('\n');

        const summaryRes = await getGPTSummary(structuredInput);
        setSummaryMeta(summaryRes);

        const parsed = splitSummaryAndAdvice(summaryRes.result);

        setSummary(parsed.summary);
        setAdvice(parsed.advice);

        const finalTextForSave = `${parsed.summary}\n${parsed.advice}`;
        const mainKeyword = extractMainKeyword(dreamText, finalTextForSave);
        const luckyScore = calculateLuckyScore(finalTextForSave);

        saveDreamDiary(
          dreamText,
          finalTextForSave,
          mainKeyword,
          luckyScore,
        );
      } catch (e) {
        console.log('[ResultScreen] analyzeAll error:', e);

        setSummary('해석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        setAdvice('네트워크 상태를 확인한 뒤 다시 실행해 보세요.');
      } finally {
        setLoading(false);
      }
    };

    analyzeAll();
  }, []);

  const getCostInfo = (usd: number) => {
    const won = usd * 1366;
    return `💵 ${usd.toFixed(5)} / ₩ ${won.toFixed(0)}`;
  };

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
    setDevOpen(v => !v);
  };

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

      <Card title="당신의 꿈">
        <Text style={styles.bodyText}>{dreamText}</Text>
      </Card>

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

      <Card title="종합 해몽">
        <Text style={styles.summaryText}>{summary}</Text>

        {summaryMeta && typeof summaryMeta.totalCostUsd === 'number' && (
          <View style={[styles.metaRow, {marginTop: 10}]}>
            <Chip
              text={`SUMMARY: ${
                summaryMeta.result !== '해석 실패' ? 'GPT' : 'NO-GPT'
              }`}
            />
            <Chip text={getCostInfo(summaryMeta.totalCostUsd)} />
          </View>
        )}
      </Card>

      <Card title="기억하세요">
        {advice ? (
          <Text style={styles.bodyText}>{advice}</Text>
        ) : (
          <Text style={[styles.bodyText, {color: Colors.textSecondary}]}>
            조언을 생성하지 못했습니다.
          </Text>
        )}
      </Card>

      <View style={styles.devWrapper}>
        <Pressable onPress={toggleDev} style={styles.devHeader}>
          <Text style={styles.devTitle}>개발자용(테스트 정보)</Text>
          <Text style={styles.devToggle}>{devOpen ? '접기 ▲' : '펼치기 ▼'}</Text>
        </Pressable>

        {devOpen && (
          <View style={{marginTop: 10}}>
            <Text style={[Typography.muted, {marginBottom: 8}]}>
              비용/캐시 표시는 개발용입니다.
            </Text>

            <Card title="문장 분리 결과(DEV)">
              <Text style={styles.bodyText}>
                {sentenceList
                  .map((s: string, idx: number) => `${idx + 1}. ${s}`)
                  .join('\n')}
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

            <Card title="Profile Context(DEV)">
              <Text style={styles.bodyText}>
                {contextLine ? contextLine : '(프로필 정보 없음)'}
              </Text>
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

function Card({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

function Chip({text}: {text: string}) {
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