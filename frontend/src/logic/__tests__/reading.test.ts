/**
 * 콜드스타트 중 Render 엣지는 502 HTML 오류 페이지를 돌려준다.
 * 그때 앱이 "해몽을 가져오지 못했습니다"로 끝내버리면 안 되고, 재시도해야 한다.
 */
import { fetchReading, ReadingError } from '../reading';
import { __resetWarmupForTest } from '../serverWarmup';

const okBody = {
  summary: '큰 뱀이 하늘로 오르는 꿈은 지위 상승의 조짐입니다.',
  oneLine: '새로운 시작이 가까이 있습니다.',
  categories: [
    { key: 'luck', body: '운이 트입니다.' },
    { key: 'work', body: '직장에서 인정받습니다.' },
    { key: 'bogus', body: '알 수 없는 키' },
  ],
  symbols: ['뱀', '하늘'],
  inputToken: 100,
  outputToken: 593,
  totalCostUsd: 0.0006768,
};

const jsonRes = (body: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => 'application/json' },
  json: async () => body,
  text: async () => JSON.stringify(body),
});

const htmlRes = (status: number) => ({
  ok: false,
  status,
  headers: { get: () => 'text/html; charset=utf-8' },
  json: async () => {
    throw new Error('Unexpected token < in JSON');
  },
  text: async () => '<html><body>Bad Gateway</body></html>',
});

/**
 * /health(워밍업 핑)와 /reading 은 같은 fetch 목을 공유한다.
 * mockResolvedValueOnce 큐를 쓰면 핑이 첫 응답을 먹어버려 테스트가
 * 엉뚱한 이유로 통과한다. URL 로 갈라서 각 엔드포인트의 응답을 따로 준다.
 */
const routeFetch = (readingResponses: any[]) => {
  const queue = [...readingResponses];
  (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
    if (String(url).endsWith('/health')) {
      return jsonRes({ ok: true, oktReady: true });
    }
    const next = queue.length > 1 ? queue.shift() : queue[0];
    if (next instanceof Error) {
      throw next;
    }
    return next;
  });
};

const readingCallCount = () =>
  (global.fetch as jest.Mock).mock.calls.filter(([u]) =>
    String(u).endsWith('/reading'),
  ).length;

describe('fetchReading', () => {
  beforeEach(() => {
    __resetWarmupForTest();
    (global as any).fetch = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('정상 응답을 파싱하고 잘못된 카테고리 키는 걸러낸다', async () => {
    routeFetch([jsonRes(okBody)]);

    const r = await fetchReading('뱀 꿈', { retryDelayMs: 0 });

    expect(r.summary).toContain('지위 상승');
    expect(r.categories.map(c => c.key)).toEqual(['luck', 'work']);
    expect(r.symbols).toEqual(['뱀', '하늘']);
  });

  it('스핀업 중 502 HTML 을 받으면 재시도해서 성공한다', async () => {
    routeFetch([htmlRes(502), jsonRes(okBody)]);

    const r = await fetchReading('뱀 꿈', { retryDelayMs: 0 });

    expect(r.summary).toContain('지위 상승');
    expect(readingCallCount()).toBe(2);
  });

  it('네트워크 오류도 재시도한다', async () => {
    routeFetch([new TypeError('Network request failed'), jsonRes(okBody)]);

    const r = await fetchReading('뱀 꿈', { retryDelayMs: 0 });
    expect(r.oneLine).toContain('새로운 시작');
    expect(readingCallCount()).toBe(2);
  });

  it('재시도를 다 쓰면 kind=server 인 ReadingError 를 던진다', async () => {
    routeFetch([htmlRes(502)]);

    await expect(
      fetchReading('뱀 꿈', { retryDelayMs: 0, maxAttempts: 2 }),
    ).rejects.toMatchObject({ name: 'ReadingError', kind: 'server' });
    expect(readingCallCount()).toBe(2);
  });

  it('400 같은 클라이언트 오류는 재시도하지 않는다 — 재시도해도 같은 답이다', async () => {
    routeFetch([jsonRes({ error: 'text is required' }, 400)]);

    await expect(
      fetchReading('', { retryDelayMs: 0 }),
    ).rejects.toMatchObject({ kind: 'invalid' });

    expect(readingCallCount()).toBe(1);
  });

  it('summary 가 비면 실패로 본다 — 해몽 없이는 화면을 그릴 수 없다', async () => {
    routeFetch([jsonRes({ ...okBody, summary: '   ' })]);

    await expect(
      fetchReading('뱀 꿈', { retryDelayMs: 0, maxAttempts: 1 }),
    ).rejects.toBeInstanceOf(ReadingError);
  });

  it('요청 전에 서버 워밍업을 기다린다', async () => {
    const order: string[] = [];
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      order.push(url.endsWith('/health') ? 'health' : 'reading');
      return jsonRes(okBody);
    });

    await fetchReading('뱀 꿈', { retryDelayMs: 0 });

    expect(order[0]).toBe('health');
  });

  it('진행 상황을 콜백으로 알려준다 — 죽은 스피너를 막기 위한 것이다', async () => {
    routeFetch([htmlRes(502), jsonRes(okBody)]);

    const phases: string[] = [];
    await fetchReading('뱀 꿈', {
      retryDelayMs: 0,
      onPhase: p => phases.push(p),
    });

    expect(phases).toContain('waking');
    expect(phases).toContain('retrying');
  });
});
