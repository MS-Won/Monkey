import { SERVER_BASE_URL } from '@env';

export type CategoryKey =
  | 'luck'
  | 'caution'
  | 'relationship'
  | 'wealth'
  | 'work'
  | 'health';

export interface ReadingCategory {
  key: CategoryKey;
  body: string;
}

export interface Reading {
  summary: string;
  oneLine: string;
  categories: ReadingCategory[];
  symbols: string[];
  inputToken: number;
  outputToken: number;
  totalCostUsd: number;
}

const VALID_KEYS: CategoryKey[] = [
  'luck',
  'caution',
  'relationship',
  'wealth',
  'work',
  'health',
];

/**
 * 꿈 전문 하나로 해몽을 받아온다. 네트워크 왕복 1회.
 *
 * 프로필은 보내지 않는다. 기기 밖으로 나가는 것은 꿈 텍스트뿐이며,
 * 이는 개인정보처리방침과 Play 데이터 보안 신고를 지키기 위한 제약이다.
 *
 * 실패하면 예외를 던진다. 해몽 없이는 화면을 그릴 수 없으므로
 * 호출부가 오류 처리를 해야 한다.
 */
export const fetchReading = async (text: string): Promise<Reading> => {
  const res = await fetch(`${SERVER_BASE_URL}/reading`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('❌ /reading 에러:', err);
    throw new Error('reading failed');
  }

  const data = await res.json();

  const summary = String(data.summary || '').trim();
  if (!summary) {
    throw new Error('reading has no summary');
  }

  // 서버가 이미 걸렀지만 방어적으로 한 번 더 확인한다.
  const categories: ReadingCategory[] = Array.isArray(data.categories)
    ? data.categories
        .filter(
          (c: any) =>
            c &&
            VALID_KEYS.includes(c.key) &&
            String(c.body || '').trim().length > 0,
        )
        .map((c: any) => ({ key: c.key as CategoryKey, body: String(c.body).trim() }))
    : [];

  return {
    summary,
    oneLine: String(data.oneLine || '').trim(),
    categories,
    symbols: Array.isArray(data.symbols) ? data.symbols.map(String) : [],
    inputToken: data.inputToken ?? 0,
    outputToken: data.outputToken ?? 0,
    totalCostUsd: data.totalCostUsd ?? 0,
  };
};
