// frontend/src/advice/profileContext.ts
// ------------------------------------------------------
// ✅ Profile Context(나이/성별/직업 등)를 "문장"으로 만들어 GPT 프롬프트에 넣기 위한 유틸
// ✅ 중요한 목표:
// 1) 프로필 정보가 없어도(빈 값이어도) 절대 앱이 깨지지 않게
// 2) advice category/engine 없이, "참고용 컨텍스트 텍스트"만 제공
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

// 성별(선택값) - 프로젝트에서 이미 다른 형태를 쓰면, 여기만 맞춰주면 됩니다.
export type Gender =
  | 'MALE'
  | 'FEMALE'
  | 'OTHER'
  | 'NONE'; // 선택 안 함/비공개

// ResultScreen에 들어갈 "프롬프트용 프로필"
export type UserProfileForPrompt = {
  name?: string;          // 예: "문섭"
  gender?: Gender;        // 예: "MALE"
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

export function formatGender(gender?: Gender): string {
  switch (gender) {
    case 'MALE': return '남성';
    case 'FEMALE': return '여성';
    case 'OTHER': return '기타';
    case 'NONE': return ''; // 미선택은 공란 처리
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
// ✅ 핵심 함수 1) "프롬프트에 넣을 컨텍스트 한 줄" 생성
// - 아무 정보도 없으면 ""(빈 문자열) 반환
// - 예: "사용자 맥락(참고용): 30대 · 남성 · 직장인"
// ------------------------------------------------------
export function buildProfileContextForPrompt(profile?: UserProfileForPrompt): string {
  if (!profile) return '';

  const ageText = formatAgeGroup(profile.ageGroup);
  const genderText = formatGender(profile.gender);
  const jobText = formatJobGroup(profile.jobGroup);

  // 비어있는 값은 제거하고 연결
  const parts = [ageText, genderText, jobText].filter(Boolean);

  // 아무 것도 없으면 컨텍스트 라인을 아예 넣지 않음
  if (parts.length === 0) return '';

  return `사용자 맥락(참고용): ${parts.join(' · ')}`;
}

// ------------------------------------------------------
// ✅ 핵심 함수 2) "이름 호칭" 가공 (선택)
// - 없으면 "" 반환
// - 예: "문섭님"
// ------------------------------------------------------
export function buildDisplayName(name?: string): string {
  const n = (name ?? '').trim();
  if (!n) return '';
  return n.endsWith('님') ? n : `${n}님`;
}
