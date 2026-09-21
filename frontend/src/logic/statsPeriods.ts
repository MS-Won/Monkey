// frontend/src/logic/statsPeriods.ts
// ------------------------------------------------------------
// 통계 막대그래프의 기간(주/월) 칸 계산.
// 첫 꿈 기록이 속한 주(달)부터 이번 주(달)까지 칸을 만들되 최대 8칸.
// 칸은 오래된 순 — 시간이 지나면 기존 칸이 왼쪽으로 밀리고 오른쪽에 '이번 주'가 새로 생긴다.
// ------------------------------------------------------------

export type ChartMode = 'week' | 'month';

export type Period = {
  label: string;
  /** 월 단위에서 연도를 윗첨자로 붙일 칸만 값이 있다(첫 칸, 1월). 예: '26년' */
  yearTag?: string;
  start: Date; // 포함
  end: Date; // 미포함
};

export const MAX_PERIODS = 8;

/** 해당 날짜가 속한 주의 월요일 00:00 (로컬) */
const startOfWeek = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
};

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export function buildPeriods(mode: ChartMode, firstRecord: Date | null, now: Date): Period[] {
  return mode === 'week' ? buildWeeks(firstRecord, now) : buildMonths(firstRecord, now);
}

const clampCount = (n: number) => Math.min(Math.max(n, 1), MAX_PERIODS);

function buildWeeks(firstRecord: Date | null, now: Date): Period[] {
  const thisWeek = startOfWeek(now);
  const spanWeeks = firstRecord
    ? Math.round((thisWeek.getTime() - startOfWeek(firstRecord).getTime()) / (7 * 86400000))
    : 0;
  const count = clampCount(spanWeeks + 1);

  const periods: Period[] = [];
  for (let ago = count - 1; ago >= 0; ago--) {
    const start = addDays(thisWeek, -7 * ago);
    periods.push({
      label: ago === 0 ? '이번 주' : `${ago}주 전`,
      start,
      end: addDays(start, 7),
    });
  }
  return periods;
}

function buildMonths(firstRecord: Date | null, now: Date): Period[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const spanMonths = firstRecord
    ? (y - firstRecord.getFullYear()) * 12 + (m - firstRecord.getMonth())
    : 0;
  const count = clampCount(spanMonths + 1);

  const periods: Period[] = [];
  for (let ago = count - 1; ago >= 0; ago--) {
    const start = new Date(y, m - ago, 1);
    const isFirst = periods.length === 0;
    periods.push({
      label: `${start.getMonth() + 1}월`,
      yearTag:
        isFirst || start.getMonth() === 0
          ? `${String(start.getFullYear()).slice(-2)}년`
          : undefined,
      start,
      end: new Date(y, m - ago + 1, 1),
    });
  }
  return periods;
}

/**
 * created_at(ISO, UTC)을 로컬 시각으로 해석해 칸별로 센다.
 * SQLite date()로 묶으면 UTC 날짜가 되어 KST 새벽(0~9시) 기록이 전날로 새므로 여기서 직접 센다.
 */
export function countByPeriod(periods: Period[], createdAts: string[]): number[] {
  const counts = new Array(periods.length).fill(0);
  for (const iso of createdAts) {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) continue;
    const i = periods.findIndex(p => t >= p.start.getTime() && t < p.end.getTime());
    if (i >= 0) counts[i] += 1;
  }
  return counts;
}
