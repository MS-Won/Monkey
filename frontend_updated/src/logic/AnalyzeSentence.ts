import SQLite from 'react-native-sqlite-storage';
import { getEmbedding, cosineSimilarity } from './embedding';
import { getGPTInterpretation } from './gpt';

const openDB = async (): Promise<SQLite.SQLiteDatabase> => {
  return await SQLite.openDatabase({ name: 'dreams.db', location: 'default' });
};

export type InterpretationMethod = 'CACHE' | 'GPT' | 'ERROR';

export interface AnalysisResult {
  method: InterpretationMethod;
  result: string;
  usedGPT: boolean;
  usedCache: boolean;
  inputToken: number;
  outputToken: number;
  totalCostUsd: number;
  similarity?: number;
}

export const analyzeSentence = async (sentence: string): Promise<AnalysisResult> => {
  try {
    const db = await openDB();

    // ✅ 1) 임베딩 생성(서버 호출). 실패하면 캐시 유사도 비교를 건너뜀.
    const newEmbedding = await getEmbedding(sentence);

    const canUseEmbedding = Array.isArray(newEmbedding) && newEmbedding.length > 0;

    // ✅ 2) 캐시 검색 (임베딩이 있을 때만 유사도 비교)
    const cacheResult = await new Promise<AnalysisResult | null>((resolve) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT sentence, result, embedding FROM cache',
          [],
          (_, results) => {
            if (!canUseEmbedding) {
              resolve(null);
              return;
            }

            for (let i = 0; i < results.rows.length; i++) {
              const row = results.rows.item(i);

              let cachedEmbedding: number[] = [];
              try {
                cachedEmbedding = JSON.parse(row.embedding);
              } catch {
                cachedEmbedding = [];
              }

              const similarity = cosineSimilarity(newEmbedding, cachedEmbedding);
              if (similarity >= 0.9) {
                resolve({
                  method: 'CACHE',
                  result: row.result,
                  usedGPT: false,
                  usedCache: true,
                  inputToken: 0,
                  outputToken: 0,
                  totalCostUsd: 0,
                  similarity,
                });
                return;
              }
            }
            resolve(null);
          },
          (_, error) => {
            console.error('❌ 캐시 검색 오류:', error);
            resolve(null);
            return false;
          }
        );
      });
    });

    if (cacheResult) return cacheResult;

    // ✅ 3) 캐시가 없으면 GPT(서버 호출)
    const gptResponse = await getGPTInterpretation(sentence);

    // ✅ 4) 캐시 저장 (임베딩이 없으면 embedding은 빈 배열로 저장)
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO cache (sentence, result, embedding) VALUES (?, ?, ?)',
        [sentence, gptResponse.result, JSON.stringify(canUseEmbedding ? newEmbedding : [])],
        () => console.log('✅ GPT 결과 캐시 저장 완료'),
        (_, error) => {
          console.error('❌ 캐시 저장 오류:', error);
          return false;
        }
      );
    });

    return {
      method: 'GPT',
      result: gptResponse.result,
      usedGPT: true,
      usedCache: false,
      inputToken: gptResponse.inputToken,
      outputToken: gptResponse.outputToken,
      totalCostUsd: gptResponse.totalCostUsd,
    };
  } catch (error) {
    console.error('❌ 해석 오류:', error);
    return {
      method: 'ERROR',
      result: '해석 실패',
      usedGPT: false,
      usedCache: false,
      inputToken: 0,
      outputToken: 0,
      totalCostUsd: 0,
    };
  }
};
