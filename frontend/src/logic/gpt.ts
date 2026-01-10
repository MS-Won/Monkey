import { SERVER_BASE_URL } from '@env';

export interface GPTResponse {
  result: string;
  inputToken: number;
  outputToken: number;
  totalCostUsd: number;
}

// ✅ 문장 하나 해몽: 서버가 OpenAI 호출
export const getGPTInterpretation = async (text: string): Promise<GPTResponse> => {
  try {
    const res = await fetch(`${SERVER_BASE_URL}/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('❌ /interpret 에러:', err);
      throw new Error('interpret failed');
    }

    const data = await res.json();
    return {
      result: data.result ?? '해석 실패',
      inputToken: data.inputToken ?? 0,
      outputToken: data.outputToken ?? 0,
      totalCostUsd: data.totalCostUsd ?? 0,
    };
  } catch (error) {
    console.error('❌ GPT 해석 실패:', error);
    return { result: 'GPT 호출 오류', inputToken: 0, outputToken: 0, totalCostUsd: 0 };
  }
};

// ✅ 종합 요약: 서버가 OpenAI 호출(요약 전용 프롬프트/메시지)
//
// ✅ 입력을 string[] 뿐 아니라 string(하나의 구조화된 프롬프트)로도 받을 수 있게 확장
// - 백엔드 /summary는 기존처럼 { interpretations: string[] } 형태를 받는다고 가정합니다.
// - string으로 들어오면 배열로 감싸서 그대로 전달합니다. (백엔드 수정 없이 호환)
export const getGPTSummary = async (
  sentenceInterpretations: string | string[]
): Promise<GPTResponse> => {
  try {
    // ✅ string이면 배열로 감싸고, string[]이면 그대로 사용
    const interpretations = Array.isArray(sentenceInterpretations)
      ? sentenceInterpretations
      : [sentenceInterpretations];

    const res = await fetch(`${SERVER_BASE_URL}/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interpretations }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('❌ /summary 에러:', err);
      throw new Error('summary failed');
    }

    const data = await res.json();
    return {
      result: data.result ?? '요약 실패',
      inputToken: data.inputToken ?? 0,
      outputToken: data.outputToken ?? 0,
      totalCostUsd: data.totalCostUsd ?? 0,
    };
  } catch (error) {
    console.error('❌ GPT 요약 실패:', error);
    return { result: '요약 호출 오류', inputToken: 0, outputToken: 0, totalCostUsd: 0 };
  }
};
