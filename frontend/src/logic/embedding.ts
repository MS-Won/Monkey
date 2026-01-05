import { OPENAI_API_KEY } from '@env';

// 임베딩 생성 함수 (직접 fetch 사용)
export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
    });

    const data = await response.json();

    if (!data || !data.data || !data.data[0]?.embedding) {
      console.error('❌ 임베딩 응답 오류:', data);
      throw new Error('Embedding 실패');
    }

    return data.data[0].embedding;
  } catch (error) {
    console.error('❌ getEmbedding 오류:', error);
    return [];
  }
};

// 코사인 유사도 계산
export const cosineSimilarity = (vec1: number[], vec2: number[]): number => {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitude1 * magnitude2);
};
