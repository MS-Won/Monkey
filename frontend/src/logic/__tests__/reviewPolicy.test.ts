import {
  MIN_SAVED_COUNT,
  REQUEST_INTERVAL_MS,
  shouldRequestReview,
} from '../reviewPolicy';

const NOW = new Date('2026-10-05T12:00:00.000Z');
const base = {savedCount: 3, lastRequestedAt: null, now: NOW, lastResultOk: true};

describe('shouldRequestReview', () => {
  it('저장 3회 이상 + 요청 이력 없음 → true', () => {
    expect(shouldRequestReview(base)).toBe(true);
  });

  it('저장 횟수가 기준 미만이면 false', () => {
    expect(shouldRequestReview({...base, savedCount: MIN_SAVED_COUNT - 1})).toBe(false);
  });

  it('직전 해몽이 실패면 false', () => {
    expect(shouldRequestReview({...base, lastResultOk: false})).toBe(false);
  });

  it('마지막 요청 후 90일이 안 지났으면 false', () => {
    const last = new Date(NOW.getTime() - REQUEST_INTERVAL_MS + 1000).toISOString();
    expect(shouldRequestReview({...base, savedCount: 10, lastRequestedAt: last})).toBe(false);
  });

  it('마지막 요청 후 정확히 90일 지났으면 true', () => {
    const last = new Date(NOW.getTime() - REQUEST_INTERVAL_MS).toISOString();
    expect(shouldRequestReview({...base, savedCount: 10, lastRequestedAt: last})).toBe(true);
  });

  it('lastRequestedAt이 깨진 문자열이면 이력 없음으로 본다', () => {
    expect(shouldRequestReview({...base, lastRequestedAt: 'garbage'})).toBe(true);
  });
});
