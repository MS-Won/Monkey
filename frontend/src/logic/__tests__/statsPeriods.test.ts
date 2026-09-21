import {buildPeriods, countByPeriod, MAX_PERIODS} from '../statsPeriods';

// 모든 날짜는 로컬 시간 생성자로 만든다 — 테스트가 실행 PC의 시간대에 좌우되지 않게.
const NOW = new Date(2026, 8, 23, 15, 0); // 2026-09-23(수) 15:00

describe('buildPeriods — 주 단위', () => {
  it('기록이 없으면 이번 주 한 칸', () => {
    const p = buildPeriods('week', null, NOW);
    expect(p.map(x => x.label)).toEqual(['이번 주']);
    expect(p[0].start).toEqual(new Date(2026, 8, 21)); // 월요일 시작
    expect(p[0].end).toEqual(new Date(2026, 8, 28));
  });

  it('첫 기록이 이번 주면 한 칸', () => {
    const p = buildPeriods('week', new Date(2026, 8, 21, 1), NOW);
    expect(p).toHaveLength(1);
  });

  it('첫 기록이 2주 전 주면 세 칸, 오래된 순', () => {
    const p = buildPeriods('week', new Date(2026, 8, 10), NOW);
    expect(p.map(x => x.label)).toEqual(['2주 전', '1주 전', '이번 주']);
  });

  it('8칸을 넘지 않는다', () => {
    const p = buildPeriods('week', new Date(2025, 0, 1), NOW);
    expect(p).toHaveLength(MAX_PERIODS);
    expect(p[0].label).toBe('7주 전');
    expect(p[MAX_PERIODS - 1].label).toBe('이번 주');
  });

  it('첫 기록이 미래(시계 어긋남)여도 한 칸', () => {
    expect(buildPeriods('week', new Date(2027, 0, 1), NOW)).toHaveLength(1);
  });
});

describe('buildPeriods — 월 단위', () => {
  it('첫 칸에만 연도를 붙인다', () => {
    const p = buildPeriods('month', new Date(2026, 6, 5), NOW);
    expect(p.map(x => [x.yearTag ?? '', x.label])).toEqual([
      ['26년', '7월'],
      ['', '8월'],
      ['', '9월'],
    ]);
  });

  it('해가 바뀌는 1월에 연도를 다시 붙인다', () => {
    const now = new Date(2027, 1, 10);
    const p = buildPeriods('month', new Date(2026, 9, 1), now);
    expect(p.map(x => [x.yearTag ?? '', x.label])).toEqual([
      ['26년', '10월'],
      ['', '11월'],
      ['', '12월'],
      ['27년', '1월'],
      ['', '2월'],
    ]);
  });

  it('8개월을 넘지 않고, 잘린 첫 칸에도 연도가 붙는다', () => {
    const p = buildPeriods('month', new Date(2024, 0, 1), NOW);
    expect(p).toHaveLength(MAX_PERIODS);
    expect(p[0]).toMatchObject({yearTag: '26년', label: '2월'});
    expect(p[0].start).toEqual(new Date(2026, 1, 1));
    expect(p[MAX_PERIODS - 1].end).toEqual(new Date(2026, 9, 1));
  });
});

describe('countByPeriod', () => {
  it('ISO(UTC) 저장값을 로컬 시각 기준으로 칸에 넣는다', () => {
    const p = buildPeriods('week', new Date(2026, 8, 14), NOW);
    const createdAts = [
      // 이번 주 월요일 로컬 00:30 — UTC 날짜로 묶으면 KST에선 지난주 일요일로 샌다
      new Date(2026, 8, 21, 0, 30).toISOString(),
      new Date(2026, 8, 20, 23, 59).toISOString(), // 지난주 일요일 밤
      new Date(2026, 8, 23, 9).toISOString(),
      new Date(2026, 7, 1).toISOString(), // 범위 밖
      'garbage',
    ];
    expect(countByPeriod(p, createdAts)).toEqual([1, 2]);
  });
});
