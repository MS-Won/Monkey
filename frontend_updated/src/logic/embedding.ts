import { SERVER_BASE_URL } from '@env';

// ✅ 임베딩: 서버가 OpenAI 호출
export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    const res = await fetch(`${SERVER_BASE_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('❌ /embed 에러:', err);
      throw new Error('embed failed');
    }

    const data = await res.json();
    if (!Array.isArray(data.embedding)) {
      console.error('❌ 임베딩 응답 형식 오류:', data);
      return [];
    }

    return data.embedding;
  } catch (error) {
    console.error('❌ getEmbedding 오류:', error);
    return [];
  }
};

// ✅ 코사인 유사도(벡터 길이/0나눗셈 방지)
export const cosineSimilarity = (vec1: number[], vec2: number[]): number => {
  if (!vec1?.length || !vec2?.length) return 0;
  if (vec1.length !== vec2.length) return 0;

  let dot = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    const a = vec1[i];
    const b = vec2[i];
    dot += a * b;
    mag1 += a * a;
    mag2 += b * b;
  }

  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
};
