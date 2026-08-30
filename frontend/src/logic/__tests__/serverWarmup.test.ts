/**
 * Render 무료 플랜은 15분 유휴 뒤 컨테이너를 재운다. 콜드스타트 실측 52초.
 * 그 52초를 사용자가 꿈을 입력하는 동안 미리 태워 없애는 것이 이 모듈의 목적이다.
 */
import {
  warmUpServer,
  waitUntilWarm,
  getWarmupState,
  __resetWarmupForTest,
  WARM_TTL_MS,
} from '../serverWarmup';

const flush = () => new Promise(r => setImmediate(r));

describe('serverWarmup', () => {
  beforeEach(() => {
    __resetWarmupForTest();
    jest.useRealTimers();
    (global as any).fetch = jest.fn();
  });

  it('시작 상태는 idle이다', () => {
    expect(getWarmupState()).toBe('idle');
  });

  it('/health 를 GET 으로 한 번 호출하고 ready 가 된다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await warmUpServer();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toMatch(/\/health$/);
    expect(init.method).toBe('GET');
    expect(getWarmupState()).toBe('ready');
  });

  it('동시에 여러 번 불러도 요청은 한 번만 나간다', async () => {
    let resolveFetch: (v: any) => void = () => {};
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise(r => {
        resolveFetch = r;
      }),
    );

    const a = warmUpServer();
    const b = warmUpServer();
    const c = warmUpServer();

    expect(getWarmupState()).toBe('waking');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    resolveFetch({ ok: true });
    await Promise.all([a, b, c]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('ready 상태가 TTL 안이면 다시 핑하지 않는다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await warmUpServer();
    await warmUpServer();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('TTL 이 지나면 서버가 다시 잠들었다고 보고 재핑한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    const now = Date.now();
    const spy = jest.spyOn(Date, 'now');

    spy.mockReturnValue(now);
    await warmUpServer();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    spy.mockReturnValue(now + WARM_TTL_MS + 1);
    await warmUpServer();
    expect(global.fetch).toHaveBeenCalledTimes(2);

    spy.mockRestore();
  });

  it('핑이 실패해도 예외를 던지지 않는다 — 워밍업은 최선 노력이다', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    await expect(warmUpServer()).resolves.toBe(false);
    expect(getWarmupState()).toBe('failed');
  });

  it('핑이 실패한 뒤에는 다음 호출에서 다시 시도한다', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await warmUpServer();

    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    await warmUpServer();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(getWarmupState()).toBe('ready');
  });

  describe('waitUntilWarm', () => {
    it('진행 중인 핑이 끝날 때까지 기다린다', async () => {
      let resolveFetch: (v: any) => void = () => {};
      (global.fetch as jest.Mock).mockReturnValue(
        new Promise(r => {
          resolveFetch = r;
        }),
      );

      warmUpServer();
      let done = false;
      const waiter = waitUntilWarm(5000).then(() => {
        done = true;
      });

      await flush();
      expect(done).toBe(false);

      resolveFetch({ ok: true });
      await waiter;
      expect(done).toBe(true);
    });

    it('제한 시간을 넘기면 핑을 기다리지 않고 그냥 진행한다', async () => {
      // 콜드스타트가 유난히 길어도 해몽 요청 자체는 막지 않는다.
      let resolveFetch: (v: any) => void = () => {};
      (global.fetch as jest.Mock).mockReturnValue(
        new Promise(r => {
          resolveFetch = r;
        }),
      );
      const pending = warmUpServer();

      await expect(waitUntilWarm(30)).resolves.toBeUndefined();

      // 매달린 핑을 정리해 테스트가 열린 핸들을 남기지 않게 한다.
      resolveFetch({ ok: true });
      await pending;
    });

    it('아직 아무도 핑하지 않았으면 스스로 핑을 시작한다', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await waitUntilWarm(5000);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(getWarmupState()).toBe('ready');
    });
  });
});
