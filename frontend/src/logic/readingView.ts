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
 * 문장 단위로 자른다.
 *
 * 정규식 lookbehind는 Hermes 버전에 따라 동작이 갈리므로 직접 훑는다.
 * 마침표가 없는 꼬리 문장도 버리지 않는다.
 */
function splitSentences(text: string): string[] {
  const out: string[] = [];
  let buf = '';

  for (const ch of text) {
    buf += ch;
    if (ch === '.' || ch === '!' || ch === '?') {
      const s = buf.trim();
      if (s) out.push(s);
      buf = '';
    }
  }

  const tail = buf.trim();
  if (tail) out.push(tail);

  return out;
}

/**
 * 긴 해몽을 읽기 좋은 단락으로 나눈다.
 *
 * 모델이 개행 없이 한 덩어리로 돌려주기 때문에, 분량을 2배로 늘린 뒤로는
 * 단락 없이 8~12문장이 벽처럼 이어져 읽기가 힘들어졌다. 화면에서만 나누며
 * 저장되는 평문은 건드리지 않는다.
 *
 * 문장 수가 적으면 굳이 쪼개지 않는다. 두 문장짜리 단락 두 개보다
 * 네 문장 한 덩어리가 낫다.
 */
export function toParagraphs(text: string, perParagraph = 3): string[] {
  const body = (text ?? '').trim();
  if (!body) return [];

  const sentences = splitSentences(body);
  if (sentences.length <= perParagraph + 1) return [body];

  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += perParagraph) {
    out.push(sentences.slice(i, i + perParagraph).join(' '));
  }

  return out;
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
