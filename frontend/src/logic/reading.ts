import { SERVER_BASE_URL } from '@env';
import { waitUntilWarm } from './serverWarmup';

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

/** 화면이 사용자에게 무슨 일이 벌어지는지 말해줄 수 있도록 알리는 단계. */
export type ReadingPhase = 'waking' | 'requesting' | 'retrying';

export type ReadingErrorKind =
  /** 요청이 서버에 닿지 못했다(비행기 모드, 전파 없음 등). */
  | 'network'
  /** 서버가 5xx를 돌려줬거나 스핀업 중 엣지 오류 페이지를 받았다. */
  | 'server'
  /** 제한 시간 안에 응답이 오지 않았다. */
  | 'timeout'
  /** 서버가 요청을 거절했거나 쓸 수 없는 응답을 줬다. 재시도해도 같다. */
  | 'invalid';

export class ReadingError extends Error {
  kind: ReadingErrorKind;

  constructor(kind: ReadingErrorKind, message: string) {
    super(message);
    this.name = 'ReadingError';
    this.kind = kind;
  }
}

export interface FetchReadingOptions {
  /** 총 시도 횟수(첫 시도 포함). */
  maxAttempts?: number;
  /** 재시도 사이 기본 대기(지수 백오프의 첫 항). */
  retryDelayMs?: number;
  /** 한 번의 요청에 허용하는 시간. */
  timeoutMs?: number;
  /** 워밍업을 기다려주는 최대 시간. */
  warmupWaitMs?: number;
  onPhase?: (phase: ReadingPhase) => void;
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
 * 콜드스타트가 겹치면 서버가 깨어나는 데 실측 52초가 걸리고, 그 위에 해몽
 * 생성 6~7초가 더 붙는다. 90초는 그 최악을 담고도 남는 값이다.
 */
const DEFAULT_TIMEOUT_MS = 90 * 1000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 1500;
const DEFAULT_WARMUP_WAIT_MS = 60 * 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** 다시 걸어보면 달라질 수 있는 실패인가. */
const isRetryable = (e: unknown): boolean =>
  e instanceof ReadingError && (e.kind === 'network' || e.kind === 'server' || e.kind === 'timeout');

/**
 * 한 번의 /reading 왕복. 실패는 전부 ReadingError로 정규화해서 던진다.
 */
const requestOnce = async (text: string, timeoutMs: number): Promise<Reading> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${SERVER_BASE_URL}/reading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new ReadingError('timeout', `no response within ${timeoutMs}ms`);
    }
    throw new ReadingError('network', String(e?.message ?? e));
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');

    // 4xx는 우리가 보낸 요청이 잘못된 것이므로 다시 걸어도 같은 답이 온다.
    if (res.status >= 400 && res.status < 500) {
      throw new ReadingError('invalid', `HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }

    // 5xx. Render가 스핀업 중이면 JSON이 아니라 HTML 오류 페이지가 온다.
    throw new ReadingError('server', `HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    // 200인데 JSON이 아니라면 우리 서버가 아니라 중간 프록시가 답한 것이다.
    throw new ReadingError('server', 'response was not JSON');
  }

  const summary = String(data?.summary || '').trim();
  if (!summary) {
    throw new ReadingError('invalid', 'reading has no summary');
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

/**
 * 꿈 전문 하나로 해몽을 받아온다.
 *
 * 프로필은 보내지 않는다. 기기 밖으로 나가는 것은 꿈 텍스트뿐이며,
 * 이는 개인정보처리방침과 Play 데이터 보안 신고를 지키기 위한 제약이다.
 *
 * 무료 플랜 백엔드가 잠들어 있을 수 있으므로 (1) 먼저 워밍업을 기다리고,
 * (2) 스핀업 중에 나오는 일시적 5xx/네트워크 오류는 백오프를 두고 재시도한다.
 * 되살릴 수 없는 실패는 kind가 붙은 ReadingError로 던져 호출부가
 * 사용자에게 맞는 말을 할 수 있게 한다.
 */
export const fetchReading = async (
  text: string,
  options: FetchReadingOptions = {},
): Promise<Reading> => {
  const {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    warmupWaitMs = DEFAULT_WARMUP_WAIT_MS,
    onPhase,
  } = options;

  onPhase?.('waking');
  await waitUntilWarm(warmupWaitMs);

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      onPhase?.(attempt === 1 ? 'requesting' : 'retrying');
      return await requestOnce(text, timeoutMs);
    } catch (e) {
      lastError = e;

      if (!isRetryable(e) || attempt === maxAttempts) {
        break;
      }

      console.warn(
        `[reading] 시도 ${attempt}/${maxAttempts} 실패, 재시도합니다:`,
        (e as Error).message,
      );
      // 지수 백오프. 서버가 깨어나는 중이라면 조금 기다려주는 편이 낫다.
      await sleep(retryDelayMs * attempt);
    }
  }

  console.error('❌ /reading 실패:', lastError);
  throw lastError instanceof ReadingError
    ? lastError
    : new ReadingError('network', String(lastError));
};
