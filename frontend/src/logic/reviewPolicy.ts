// 인앱 리뷰 요청 여부 판단 — 부수효과 없는 순수 함수.
// 만족도가 높을 시점(해몽 저장 성공 직후)에만, 너무 잦지 않게 띄운다.

export const MIN_SAVED_COUNT = 3;
export const REQUEST_INTERVAL_MS = 90 * 24 * 60 * 60 * 1000;

export interface ReviewPolicyInput {
  savedCount: number;
  lastRequestedAt: string | null;
  now: Date;
  lastResultOk: boolean;
}

export function shouldRequestReview({
  savedCount,
  lastRequestedAt,
  now,
  lastResultOk,
}: ReviewPolicyInput): boolean {
  if (!lastResultOk) return false;
  if (savedCount < MIN_SAVED_COUNT) return false;

  const last = lastRequestedAt ? Date.parse(lastRequestedAt) : NaN;
  if (Number.isNaN(last)) return true;

  return now.getTime() - last >= REQUEST_INTERVAL_MS;
}
