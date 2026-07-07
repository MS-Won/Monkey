// frontend/src/data/archetypeCards.ts
// ------------------------------------------------------------
// Monkey Dream Archetype Cards (30) — 타로 레퍼런스 아키타입 카드.
// 단일 소스(코드). 사람이 읽는 설계 스펙: ../../../docs/design/archetype-cards.md
//
// 카드 규격(디자인 요청):
//   - 상단: Symbol 이름(영문, 타로풍 대문자 표기)
//   - 하단: 의미(한국어)
//
// keywords: 꿈 내용/해몽 텍스트에서 이 카드를 "선정"하기 위한 한국어 매칭 태그.
//           (Dev 요청: 카드 심볼/의미가 해몽 내용과 연관되어야 함)
// ------------------------------------------------------------

export type ArchetypeCard = {
  id: number;
  /** 카드 상단에 찍히는 영문 심볼명 (타로풍) */
  name: string;
  /** 한국어 표기(부제) */
  nameKo: string;
  /** 카드 하단 의미(한국어 짧은 문구) */
  meaning: string;
  /** 카드의 핵심 정서/테마 한 줄 (해몽 어조 연결용) */
  essence: string;
  /** 선정 매칭 태그(한국어) */
  keywords: string[];
  /** 정서 극성: 상서로움(+)/중립(0)/경계(-) — 연출/색조 힌트용 */
  polarity: 'light' | 'neutral' | 'shadow';
};

export const ARCHETYPE_CARDS: ArchetypeCard[] = [
  { id: 1, name: 'Dawn', nameKo: '새벽', meaning: '새로운 시작 · 기회', essence: '어둠이 걷히고 첫 빛이 트는 문턱', keywords: ['새벽', '아침', '해', '태양', '빛', '시작', '출발', '떠오르', '첫'], polarity: 'light' },
  { id: 2, name: 'Cocoon', nameKo: '고치', meaning: '변화 · 전환 · 성장통', essence: '지금은 감춰져 있으나 곧 날개가 될 시간', keywords: ['고치', '나비', '알', '변신', '변화', '준비', '숨', '기다림'], polarity: 'neutral' },
  { id: 3, name: 'Great Tree', nameKo: '큰 나무', meaning: '성장 · 성숙 · 발전', essence: '뿌리 깊게 자라 그늘을 드리우는 힘', keywords: ['나무', '숲', '뿌리', '가지', '열매', '성장', '자라'], polarity: 'light' },
  { id: 4, name: 'Crossroads', nameKo: '갈림길', meaning: '선택 · 결정 · 방향', essence: '두 길이 갈라지는 자리에 선 순간', keywords: ['길', '갈림길', '선택', '고민', '결정', '방향', '어디로'], polarity: 'neutral' },
  { id: 5, name: 'Summit', nameKo: '정상', meaning: '도전 · 시련 · 인내', essence: '오르막의 끝, 견딤이 만드는 봉우리', keywords: ['산', '정상', '봉우리', '오르', '등산', '높', '시련', '견디'], polarity: 'neutral' },
  { id: 6, name: 'Compass', nameKo: '나침반', meaning: '목표 · 여정 · 방향성', essence: '흔들려도 북쪽을 가리키는 마음', keywords: ['나침반', '목표', '여행', '여정', '길찾', '방향', '떠나'], polarity: 'light' },
  { id: 7, name: 'Crown', nameKo: '왕관', meaning: '성취 · 성공 · 인정', essence: '오래 견딘 자의 머리에 얹히는 영광', keywords: ['왕관', '왕', '성공', '합격', '승진', '인정', '상', '이기'], polarity: 'light' },
  { id: 8, name: 'Gold', nameKo: '황금', meaning: '풍요 · 번영 · 재물운', essence: '손에 쥐면 온기가 도는 값진 결실', keywords: ['금', '황금', '돈', '재물', '보석', '복', '풍요', '부자', '돼지'], polarity: 'light' },
  { id: 9, name: 'Bridge', nameKo: '다리', meaning: '인연 · 연결 · 소통', essence: '끊긴 두 곳을 잇는 마음의 통로', keywords: ['다리', '건너', '연결', '인연', '만남', '소통', '이어'], polarity: 'light' },
  { id: 10, name: 'Rose', nameKo: '장미', meaning: '사랑 · 애정 · 정', essence: '가시 속에서도 피어나는 붉은 마음', keywords: ['장미', '꽃', '사랑', '연애', '애정', '연인', '결혼', '설레'], polarity: 'light' },
  { id: 11, name: 'Anchor', nameKo: '닻', meaning: '신뢰 · 안정 · 믿음', essence: '풍랑 속에서도 흔들리지 않는 무게', keywords: ['닻', '배', '항구', '안정', '믿음', '신뢰', '지키', '머무'], polarity: 'light' },
  { id: 12, name: 'Storm', nameKo: '폭풍', meaning: '갈등 · 긴장 · 대립', essence: '한바탕 몰아쳐야 개는 하늘', keywords: ['폭풍', '비', '바람', '천둥', '싸움', '갈등', '다툼', '화'], polarity: 'shadow' },
  { id: 13, name: 'Empty Chair', nameKo: '빈 의자', meaning: '상실 · 부재 · 그리움', essence: '누군가 앉았던 자리에 남은 온기', keywords: ['의자', '빈', '이별', '상실', '떠나', '그리움', '없어', '죽'], polarity: 'shadow' },
  { id: 14, name: 'Spring', nameKo: '샘', meaning: '치유 · 회복 · 재생', essence: '마른 땅을 적시는 맑은 물줄기', keywords: ['샘', '물', '우물', '치유', '회복', '낫', '씻', '맑'], polarity: 'light' },
  { id: 15, name: 'Shield', nameKo: '방패', meaning: '보호 · 안전 · 수호', essence: '나와 소중한 것을 가리는 단단함', keywords: ['방패', '지키', '보호', '막', '안전', '수호', '조상', '가족'], polarity: 'light' },
  { id: 16, name: 'Wings', nameKo: '날개', meaning: '자유 · 독립 · 해방', essence: '땅을 박차고 오르는 가벼움', keywords: ['날개', '날', '새', '하늘', '자유', '독립', '해방', '비행'], polarity: 'light' },
  { id: 17, name: 'Chain', nameKo: '사슬', meaning: '속박 · 제약 · 굴레', essence: '풀어야 할 매듭, 벗어야 할 굴레', keywords: ['사슬', '묶', '갇', '감옥', '속박', '제약', '벗어', '답답'], polarity: 'shadow' },
  { id: 18, name: 'Abyss', nameKo: '심연', meaning: '두려움 · 불안 · 혼란', essence: '바닥이 보이지 않는 깊은 물음', keywords: ['심연', '어둠', '떨어', '추락', '두려움', '불안', '무서', '깊'], polarity: 'shadow' },
  { id: 19, name: 'Shadow', nameKo: '그림자', meaning: '무의식 · 숨은 자아', essence: '외면했던 나 자신과의 조우', keywords: ['그림자', '거울속', '나', '내면', '무의식', '숨', '어두운'], polarity: 'shadow' },
  { id: 20, name: 'Seal', nameKo: '봉인', meaning: '비밀 · 감춰진 진실', essence: '아직 열리지 않은 봉인된 진실', keywords: ['봉인', '비밀', '숨겨', '상자', '문서', '진실', '감춰'], polarity: 'neutral' },
  { id: 21, name: 'Moon', nameKo: '달', meaning: '직관 · 본능 · 안내', essence: '밤을 밝히는 은근한 예감', keywords: ['달', '밤', '별빛', '직관', '예감', '느낌', '본능'], polarity: 'neutral' },
  { id: 22, name: 'Mirror', nameKo: '거울', meaning: '기억 · 회상 · 과거', essence: '지난 시간이 되비치는 수면', keywords: ['거울', '기억', '과거', '추억', '회상', '옛', '비치'], polarity: 'neutral' },
  { id: 23, name: 'Thread', nameKo: '실', meaning: '인연의 실 · 운명', essence: '보이지 않게 이어진 사람과 사건', keywords: ['실', '인연', '운명', '엮', '연결', '만날', '이어진'], polarity: 'neutral' },
  { id: 24, name: 'Scales', nameKo: '저울', meaning: '균형 · 조화 · 공정', essence: '한쪽으로 기울지 않는 마음의 저울', keywords: ['저울', '균형', '공정', '판단', '재판', '조화', '고르'], polarity: 'neutral' },
  { id: 25, name: 'Labyrinth', nameKo: '미궁', meaning: '혼돈 · 미로 · 불확실', essence: '길을 잃은 듯한 얽힌 마음', keywords: ['미궁', '미로', '길잃', '헤매', '혼란', '복잡', '얽'], polarity: 'shadow' },
  { id: 26, name: 'Tower', nameKo: '탑', meaning: '질서 · 체계 · 안정', essence: '한 층씩 쌓아 올린 굳건함', keywords: ['탑', '건물', '집', '쌓', '질서', '체계', '기둥', '회사'], polarity: 'neutral' },
  { id: 27, name: 'Star', nameKo: '별', meaning: '희망 · 낙관 · 가능성', essence: '어둠이 깊을수록 또렷한 빛', keywords: ['별', '희망', '소원', '빛나', '반짝', '꿈꾸', '낙관'], polarity: 'light' },
  { id: 28, name: 'Torch', nameKo: '횃불', meaning: '각성 · 깨달음 · 통찰', essence: '어둠을 밀어내는 한 자루의 불', keywords: ['횃불', '불', '촛불', '깨달', '각성', '통찰', '밝히', '알게'], polarity: 'light' },
  { id: 29, name: 'Wheel', nameKo: '수레바퀴', meaning: '순환 · 반복 · 흐름', essence: '돌고 도는 삶의 리듬', keywords: ['바퀴', '수레', '차', '돌', '순환', '반복', '흐름', '되풀이'], polarity: 'neutral' },
  { id: 30, name: 'Gate', nameKo: '관문', meaning: '초월 · 새로운 차원', essence: '지금 세계를 넘어서는 문턱', keywords: ['관문', '문', '통과', '초월', '넘어', '새로운세계', '차원', '들어가'], polarity: 'light' },
];

// id → 카드 빠른 조회
export const ARCHETYPE_BY_ID: Record<number, ArchetypeCard> = ARCHETYPE_CARDS.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<number, ArchetypeCard>,
);

// name(영문) → 카드
export const ARCHETYPE_BY_NAME: Record<string, ArchetypeCard> = ARCHETYPE_CARDS.reduce(
  (acc, c) => {
    acc[c.name.toLowerCase()] = c;
    return acc;
  },
  {} as Record<string, ArchetypeCard>,
);

const DEFAULT_CARD = ARCHETYPE_BY_NAME['moon']; // 매칭 실패 시 '달'(직관)로 폴백

/**
 * 저장된 keyword를 카드로 복원.
 * - 신규 저장: keyword = 카드 영문명(예: "Gold") → 직접 매핑
 * - 레거시 저장: keyword = 한국어 꿈 키워드(예: "돼지") → 텍스트 기반 재선정
 */
export function resolveArchetypeCard(
  keyword: string | null | undefined,
  ...fallbackTexts: string[]
): ArchetypeCard {
  const key = (keyword ?? '').trim().toLowerCase();
  if (key && ARCHETYPE_BY_NAME[key]) return ARCHETYPE_BY_NAME[key];
  return selectArchetypeCard(keyword ?? '', ...fallbackTexts);
}

/**
 * 꿈 원문 + 해몽 텍스트에서 가장 연관 깊은 아키타입 카드를 선정한다.
 * - keywords 히트를 "키워드 길이" 가중치로 스코어링한다(단순 히트 개수 아님).
 *   한국어는 조사가 명사 뒤에 공백 없이 바로 붙어(예: "산"+"에") 안정적인 단어 경계
 *   판별이 어렵고, 1글자 키워드는 무관한 단어 속에 우연히 섞여 들어가기 쉽다
 *   (예: '해'가 "극복해야"의 일부로 매치). 길이로 가중치를 주면 더 구체적인(긴)
 *   키워드 매치가 이런 우연한 1글자 매치를 자연스럽게 압도한다.
 * - 동점이면 id가 앞선 카드 우선(Card.txt 순서 = 상서로움→중립→그림자 흐름)
 * - 아무 것도 안 맞으면 '달'(Moon)로 폴백
 */
export function selectArchetypeCard(...texts: string[]): ArchetypeCard {
  const haystack = texts.join(' ');
  let best = DEFAULT_CARD;
  let bestScore = 0;

  for (const card of ARCHETYPE_CARDS) {
    let score = 0;
    for (const kw of card.keywords) {
      if (kw && haystack.includes(kw)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }
  return best;
}
