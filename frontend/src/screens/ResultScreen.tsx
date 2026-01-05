import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigator';
import { analyzeSentence } from '../logic/AnalyzeSentence';
import { getGPTSummary } from '../logic/gpt'; // ✅ 요약 함수 import

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

const ResultScreen = () => {
  const route = useRoute<ResultScreenRouteProp>();
  const { sentenceList, dreamText, usedGPTInSplit } = route.params;
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState('');
  const [summaryMeta, setSummaryMeta] = useState<any>(null);

  useEffect(() => {
    const analyzeAll = async () => {
      const temp = [];
      for (const sentence of sentenceList) {
        const res = await analyzeSentence(sentence);
        temp.push(res);
      }
      setResults(temp);

      // ✅ 종합 해몽 요청
      const summaryRes = await getGPTSummary(temp.map(r => r.result));
      setSummary(summaryRes.result);
      setSummaryMeta(summaryRes);
    };

    analyzeAll();
  }, []);

  const getCostInfo = (usd: number) => {
    const won = usd * 1366;
    return `💵 ${usd.toFixed(5)} / ₩ ${won.toFixed(0)}`;
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18 }}>1. 입력한 꿈 본문</Text>
      <Text style={{ marginBottom: 15 }}>{dreamText}</Text>

      <Text style={{ fontWeight: 'bold', fontSize: 18 }}>2. 문장 분리 결과</Text>
      <Text style={{ marginBottom: 15 }}>
        {sentenceList.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}
        {'\n'}(GPT 사용: {usedGPTInSplit ? 'O' : 'X'})
      </Text>

      <Text style={{ fontWeight: 'bold', fontSize: 18 }}>3. 문장별 해몽 결과</Text>
      {results.map((res, idx) => (
        <View key={idx} style={{ marginBottom: 15 }}>
          <Text>문장 {idx + 1}: {sentenceList[idx]}</Text>
          <Text>→ {res.result}</Text>
          <Text>[방법: {res.method}] GPT: {res.method === 'GPT' ? 'O' : 'X'}, Cache: {res.method === 'CACHE' ? 'O' : 'X'} / {getCostInfo(res.totalCostUsd)} / 유사도: {res.similarity !== undefined ? res.similarity.toFixed(3) : 'GPT'}</Text>
        </View>
      ))}

      <Text style={{ fontWeight: 'bold', fontSize: 18 }}>4. 종합 해몽 결과</Text>
      <Text>{summary}</Text>
      {summaryMeta && (
        <Text style={{ marginTop: 5 }}>
          (GPT 사용: {summaryMeta.result !== '해석 실패' ? 'O' : 'X'}) / {getCostInfo(summaryMeta.totalCostUsd)}
        </Text>
      )}
    </ScrollView>
  );
};

export default ResultScreen;
