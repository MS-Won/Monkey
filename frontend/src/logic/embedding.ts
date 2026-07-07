// frontend/src/utils/embedding.ts

import {SERVER_BASE_URL} from '@env';

/**
 * .env에서 가져온 서버 주소를 안전하게 정리하는 함수
 *
 * 예:
 * SERVER_BASE_URL=http://10.0.2.2:5001;
 * 처럼 실수로 세미콜론이 들어가면 제거함
 */
const getCleanServerBaseUrl = (): string => {
  return String(SERVER_BASE_URL || '')
    .trim()
    .replace(/;$/, '');
};

/**
 * fetch에 timeout을 걸기 위한 함수
 *
 * 서버가 꺼져 있거나 주소가 틀린 경우,
 * 요청이 오래 멈춰있지 않도록 일정 시간 후 자동 실패 처리함
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = 10000,
): Promise<Response> => {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * 임베딩 생성 함수
 *
 * 현재 구조:
 * 앱 → Flask 서버 /embed → OpenAI API
 *
 * 실패해도 앱 전체가 멈추지 않도록 [] 반환
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
  const baseUrl = getCleanServerBaseUrl();

  if (!baseUrl) {
    console.error('❌ SERVER_BASE_URL이 비어 있습니다. .env를 확인하세요.');
    return [];
  }

  const url = `${baseUrl}/embed`;

  try {
    console.log('📡 임베딩 요청 URL:', url);

    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({text}),
      },
      10000,
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('❌ /embed 응답 오류:', res.status, err);
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data.embedding)) {
      console.error('❌ 임베딩 응답 형식 오류:', data);
      return [];
    }

    return data.embedding;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.error('❌ /embed 요청 시간 초과: 서버 주소 또는 서버 실행 상태 확인 필요');
    } else {
      console.error('❌ getEmbedding 네트워크 오류:', error);
    }

    return [];
  }
};

/**
 * 코사인 유사도 계산 함수
 *
 * 두 벡터가 얼마나 비슷한지 계산함.
 * 1에 가까울수록 매우 유사함.
 */
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