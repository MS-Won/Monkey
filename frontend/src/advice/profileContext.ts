// frontend/src/advice/profileContext.ts
// ------------------------------------------------------
// ✅ 프로필(나이대/직업)을 화면에 보여줄 한글 라벨로 바꾸는 유틸
// ✅ 프로필은 서버로 전송하지 않는다. 여기 있는 값은 전부 기기 안에서만 쓴다.
// ✅ 프로필 정보가 없어도(빈 값이어도) 절대 앱이 깨지지 않게 한다.
// ------------------------------------------------------

// 나이대(선택값)
export type AgeGroup =
  | 'TEENS'      // 10대
  | 'TWENTIES'   // 20대
  | 'THIRTIES'   // 30대
  | 'FORTIES'    // 40대
  | 'FIFTIES'    // 50대
  | 'SIXTY_PLUS';// 60대+

// 직업 대분류(선택값)
export type JobGroup =
  | 'STUDENT'        // 학생
  | 'EMPLOYEE'       // 직장인
  | 'SELF_EMPLOYED'  // 자영업/프리랜서
  | 'HOMEMAKER'      // 전업(가사/돌봄)
  | 'JOB_SEEKER'     // 구직
  | 'RETIRED'        // 은퇴
  | 'OTHER';         // 기타

// 프로필 표시용 타입
export type UserProfileForPrompt = {
  name?: string;          // 예: "문섭"
  ageGroup?: AgeGroup;    // 예: "THIRTIES"
  jobGroup?: JobGroup;    // 예: "EMPLOYEE"
};

// --------------------
// 사람이 읽는 라벨 변환
// --------------------
export function formatAgeGroup(ageGroup?: AgeGroup): string {
  switch (ageGroup) {
    case 'TEENS': return '10대';
    case 'TWENTIES': return '20대';
    case 'THIRTIES': return '30대';
    case 'FORTIES': return '40대';
    case 'FIFTIES': return '50대';
    case 'SIXTY_PLUS': return '60대 이상';
    default: return '';
  }
}

export function formatJobGroup(jobGroup?: JobGroup): string {
  switch (jobGroup) {
    case 'STUDENT': return '학생';
    case 'EMPLOYEE': return '직장인';
    case 'SELF_EMPLOYED': return '자영업/프리랜서';
    case 'HOMEMAKER': return '전업(가사/돌봄)';
    case 'JOB_SEEKER': return '구직 중';
    case 'RETIRED': return '은퇴';
    case 'OTHER': return '기타';
    default: return '';
  }
}

// ------------------------------------------------------
// ✅ "이름 호칭" 가공 (선택)
// - 없으면 "" 반환
// - 예: "문섭님"
// ------------------------------------------------------
export function buildDisplayName(name?: string): string {
  const n = (name ?? '').trim();
  if (!n) return '';
  return n.endsWith('님') ? n : `${n}님`;
}
