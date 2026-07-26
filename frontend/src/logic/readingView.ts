import type { AgeGroup, JobGroup } from '../storage/userProfile';
import type { CategoryKey, Reading, ReadingCategory } from './reading';

/**
 * 카테고리 한글 제목. 이모지는 쓰지 않는다.
 * 전통 해몽·아르누보 톤에서 이모지는 진정성을 떨어뜨린다.
 */
export const CATEGORY_TITLES: Record<CategoryKey, string> = {
  luck: '행운',
  caution: '주의운',
  relationship: '인간관계',
  wealth: '재물운',
  work: '직장·학업운',
  health: '건강운',
};

const JOB_PRIORITY: Record<JobGroup, CategoryKey[]> = {
  STUDENT: ['work'],
  EMPLOYEE: ['work', 'wealth'],
  SELF_EMPLOYED: ['work', 'wealth'],
  JOB_SEEKER: ['work'],
  RETIRED: ['health'],
  HOMEMAKER: ['relationship', 'health'],
  OTHER: [],
};

const AGE_PRIORITY: Record<AgeGroup, CategoryKey[]> = {
  TEENS: ['work'],
  TWENTIES: [],
  THIRTIES: [],
  FORTIES: [],
  FIFTIES: [],
  SIXTY_PLUS: ['health'],
};

/**
 * 로컬 프로필로 카테고리 순서만 바꾼다. 서버로는 아무것도 보내지 않는다.
 *
 * 직업과 나이대가 서로 다른 키를 가리키면 직업을 우선한다.
 * 직업이 현재 생활을 더 직접적으로 반영하기 때문이다.
 *
 * 안정 정렬이므로 우선 키가 아닌 항목의 상대 순서는 서버가 준 순서를 유지한다.
 * 모델이 애초에 그 카테고리를 내지 않았으면 올릴 것이 없다 — 이것이
 * 프로필을 전송하지 않는 설계의 한계다.
 */
export function sortCategoriesByProfile(
  categories: ReadingCategory[],
  ageGroup: AgeGroup | null,
  jobGroup: JobGroup | null,
): ReadingCategory[] {
  const priority: CategoryKey[] = [];

  if (jobGroup) {
    for (const k of JOB_PRIORITY[jobGroup]) {
      if (!priority.includes(k)) priority.push(k);
    }
  }
  if (ageGroup) {
    for (const k of AGE_PRIORITY[ageGroup]) {
      if (!priority.includes(k)) priority.push(k);
    }
  }

  if (priority.length === 0) return [...categories];

  const rank = (c: ReadingCategory) => {
    const i = priority.indexOf(c.key);
    return i === -1 ? priority.length : i;
  };

  return categories
    .map((c, idx) => ({ c, idx }))
    .sort((a, b) => rank(a.c) - rank(b.c) || a.idx - b.idx)
    .map(x => x.c);
}

/**
 * 꿈기록에 저장할 평문을 만든다.
 *
 * 기존 dream_diary.interpretation 컬럼을 그대로 쓰므로 스키마 변경과
 * 마이그레이션이 없다. 카테고리는 정렬을 적용한 뒤의 순서로 저장한다 —
 * 화면에서 본 것과 꿈기록에 남는 것이 같아야 한다.
 */
export function renderReadingText(
  reading: Reading,
  ordered: ReadingCategory[],
): string {
  const blocks: string[] = [`종합 해몽\n${reading.summary}`];

  for (const c of ordered) {
    blocks.push(`${CATEGORY_TITLES[c.key]}\n${c.body}`);
  }

  if (reading.oneLine) {
    blocks.push(`오늘의 한마디\n${reading.oneLine}`);
  }

  return blocks.join('\n\n');
}
