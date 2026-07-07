// frontend/src/utils/date.ts
// 공용 날짜 포맷터. DiaryDetail/Diary 등에서 재사용.

/** created_at(ISO 등) → "YYYY년 M월 D일". 파싱 실패 시 원문 반환. */
export function formatDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}
