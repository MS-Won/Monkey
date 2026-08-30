import { SERVER_BASE_URL } from '@env';

/**
 * 서버 워밍업.
 *
 * 백엔드는 Render 무료 플랜에 올라가 있고, 무료 인스턴스는 15분간 요청이 없으면
 * 컨테이너를 재운다. 다시 깨우는 데 실측 52초가 걸린다(`/health` 콜드 52.5초 /
 * 웜 0.07초). 그 52초가 해몽 요청 위에 그대로 얹히면 사용자는 1분짜리 스피너를
 * 보거나, 스핀업 중인 Render 엣지가 돌려주는 502 HTML을 받는다.
 *
 * 해결책은 그 52초를 사용자가 꿈을 입력하는 시간과 겹치게 만드는 것이다.
 * 앱이 켜지는 순간(그리고 포그라운드로 돌아올 때마다) 핑을 날려두면,
 * 사용자가 꿈을 적고 "해몽 시작"을 누를 즈음엔 서버가 이미 깨어 있다.
 *
 * 워밍업은 어디까지나 최선 노력이다. 실패해도 예외를 던지지 않으며
 * 해몽 요청 자체를 막지 않는다.
 */

export type WarmupState = 'idle' | 'waking' | 'ready' | 'failed';

/**
 * 이 시간이 지나면 서버가 다시 잠들었다고 본다.
 * Render 무료 플랜의 유휴 기준은 15분이므로 그보다 짧게 잡아 여유를 둔다.
 */
export const WARM_TTL_MS = 10 * 60 * 1000;

/** 핑 자체가 매달려 있지 않도록 하는 상한. 콜드스타트 52초 + 여유. */
const PING_TIMEOUT_MS = 90 * 1000;

let state: WarmupState = 'idle';
let inFlight: Promise<boolean> | null = null;
let readyAt = 0;

export const getWarmupState = (): WarmupState => state;

/** 테스트 전용. 모듈 수준 상태를 초기화한다. */
export const __resetWarmupForTest = () => {
  state = 'idle';
  inFlight = null;
  readyAt = 0;
};

const ping = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  try {
    const res = await fetch(`${SERVER_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    if (res.ok) {
      state = 'ready';
      readyAt = Date.now();
      return true;
    }

    // 스핀업 중이면 엣지가 5xx를 준다. 깨우기는 어차피 시작됐으므로
    // 실패로 기록하되 다음 호출에서 다시 시도하게 둔다.
    state = 'failed';
    return false;
  } catch {
    state = 'failed';
    return false;
  } finally {
    clearTimeout(timer);
    inFlight = null;
  }
};

/**
 * 서버를 깨운다. 여러 번 불러도 안전하다(진행 중인 핑을 공유하고,
 * 최근에 깨워둔 상태면 아무것도 하지 않는다).
 */
export const warmUpServer = (): Promise<boolean> => {
  if (state === 'ready' && Date.now() - readyAt < WARM_TTL_MS) {
    return Promise.resolve(true);
  }

  if (inFlight) {
    return inFlight;
  }

  state = 'waking';
  inFlight = ping();
  return inFlight;
};

/**
 * 워밍업이 끝나기를 최대 `maxWaitMs`까지 기다린다.
 *
 * 제한 시간을 넘겨도 예외를 던지지 않고 그냥 반환한다. 워밍업이 오래 걸린다고
 * 해몽 요청을 막을 이유는 없다 — 요청 자체가 서버를 깨우기도 하기 때문이다.
 */
export const waitUntilWarm = async (maxWaitMs: number): Promise<void> => {
  const pending = warmUpServer();

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      pending,
      new Promise(resolve => {
        timer = setTimeout(resolve, maxWaitMs);
      }),
    ]);
  } finally {
    // 핑이 먼저 끝났으면 남은 타이머를 걷어낸다.
    if (timer) {
      clearTimeout(timer);
    }
  }
};
