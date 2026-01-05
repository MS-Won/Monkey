import { OPENAI_API_KEY } from '@env';

export interface GPTResponse {
  result: string;
  inputToken: number;
  outputToken: number;
  totalCostUsd: number;
}

// 문장 하나에 대한 GPT 해몽
export const getGPTInterpretation = async (text: string): Promise<GPTResponse> => {
  try {
    console.log('📡 GPT 요청 시작');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 전통 한국 꿈 해몽 전문가입니다. 심리학적 해석은 하지 마시고 전통 해몽 방식만 사용해주세요.',
          },
          {
            role: 'user',
            content: `"${text}" 이 꿈은 어떤 의미인가요?`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    console.log('✅ GPT 응답 수신 완료');

    const resultText = data.choices?.[0]?.message?.content?.trim() ?? '해석 실패';
    const inputToken = data.usage?.prompt_tokens ?? 0;
    const outputToken = data.usage?.completion_tokens ?? 0;
    const totalCostUsd = (inputToken / 1000) * 0.0015 + (outputToken / 1000) * 0.002;

    return {
      result: resultText,
      inputToken,
      outputToken,
      totalCostUsd,
    };
  } catch (error) {
    console.error('❌ GPT 해석 실패 (fetch):', error);
    return {
      result: 'GPT 호출 오류',
      inputToken: 0,
      outputToken: 0,
      totalCostUsd: 0,
    };
  }
};

// ✅ 여러 문장의 해몽 결과를 종합 요약하는 GPT 호출
export const getGPTSummary = async (sentences: string[]): Promise<GPTResponse> => {
  const prompt = `다음은 꿈 해몽 결과입니다. 이를 종합하여 하나의 해몽으로 요약해주세요. 반드시 진지한 전통 해몽 형식으로 작성하고, 문장은 다음과 같은 구조로 출력해주세요.

[종합 해몽 결과]

[조언]

### 해몽들:
- ${sentences.join('\n- ')}`;

  return await getGPTInterpretation(prompt);
};
