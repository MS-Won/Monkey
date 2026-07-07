import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ✅ 성별(선택)
 * - 기존 유지
 */
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

/**
 * ✅ 나이대(선택)
 * - "선택"으로 갈 거라 했으니 enum처럼 고정
 */
export type AgeGroup =
  | 'TEENS'      // 10대
  | 'TWENTIES'   // 20대
  | 'THIRTIES'   // 30대
  | 'FORTIES'    // 40대
  | 'FIFTIES'    // 50대
  | 'SIXTY_PLUS';// 60대+

/**
 * ✅ 직업 대분류(선택)
 */
export type JobGroup =
  | 'STUDENT'
  | 'EMPLOYEE'
  | 'SELF_EMPLOYED'
  | 'HOMEMAKER'
  | 'JOB_SEEKER'
  | 'RETIRED'
  | 'OTHER';

// ✅ AsyncStorage 키
const KEY_NAME = 'user.name';
const KEY_GENDER = 'user.gender';

// ✅ 추가 키
const KEY_AGE_GROUP = 'user.ageGroup';
const KEY_JOB_GROUP = 'user.jobGroup';

/**
 * ✅ 저장
 * - 기존에는 (name, gender)만 저장했지만,
 * - 앞으로는 ageGroup/jobGroup도 선택적으로 저장 가능하게 확장
 *
 * 사용 예)
 * 1) saveUserProfile({ name: '문섭', gender: 'MALE' })
 * 2) saveUserProfile({ name: '문섭', gender: 'MALE', ageGroup: 'THIRTIES', jobGroup: 'EMPLOYEE' })
 */
export async function saveUserProfile(profile: {
  name: string;
  gender: Gender;
  ageGroup?: AgeGroup;
  jobGroup?: JobGroup;
}) {
  const pairs: [string, string][] = [
    [KEY_NAME, profile.name],
    [KEY_GENDER, profile.gender],
  ];

  // ✅ 값이 있을 때만 저장(없으면 기존 값 유지가 아니라, "저장 안 함" 처리)
  // -> 만약 "없으면 지우기"가 필요하면 clearUserProfile 또는 별도 함수로 처리
  if (profile.ageGroup) pairs.push([KEY_AGE_GROUP, profile.ageGroup]);
  if (profile.jobGroup) pairs.push([KEY_JOB_GROUP, profile.jobGroup]);

  await AsyncStorage.multiSet(pairs);
}

/**
 * ✅ 로드
 * - 값이 없으면 null 반환
 * - 타입 캐스팅은 안전하게(없거나 잘못된 값이면 null)
 */
export async function loadUserProfile(): Promise<{
  name: string | null;
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  jobGroup: JobGroup | null;
}> {
  const pairs = await AsyncStorage.multiGet([KEY_NAME, KEY_GENDER, KEY_AGE_GROUP, KEY_JOB_GROUP]);
  const map = new Map(pairs);

  const name = map.get(KEY_NAME) ?? null;

  const genderRaw = map.get(KEY_GENDER);
  const gender = (genderRaw as Gender | null) ?? null;

  const ageRaw = map.get(KEY_AGE_GROUP);
  const ageGroup = (ageRaw as AgeGroup | null) ?? null;

  const jobRaw = map.get(KEY_JOB_GROUP);
  const jobGroup = (jobRaw as JobGroup | null) ?? null;

  return { name, gender, ageGroup, jobGroup };
}

/**
 * ✅ 전체 삭제(이전과 동일하지만 키 2개 추가)
 */
export async function clearUserProfile() {
  await AsyncStorage.multiRemove([KEY_NAME, KEY_GENDER, KEY_AGE_GROUP, KEY_JOB_GROUP]);
}
