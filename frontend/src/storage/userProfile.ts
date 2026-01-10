import AsyncStorage from '@react-native-async-storage/async-storage';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

const KEY_NAME = 'user.name';
const KEY_GENDER = 'user.gender';

export async function saveUserProfile(name: string, gender: Gender) {
  await AsyncStorage.multiSet([
    [KEY_NAME, name],
    [KEY_GENDER, gender],
  ]);
}

export async function loadUserProfile(): Promise<{ name: string | null; gender: Gender | null }> {
  const pairs = await AsyncStorage.multiGet([KEY_NAME, KEY_GENDER]);
  const map = new Map(pairs);
  const name = map.get(KEY_NAME) ?? null;
  const gender = (map.get(KEY_GENDER) as Gender | null) ?? null;
  return { name, gender };
}

export async function clearUserProfile() {
  await AsyncStorage.multiRemove([KEY_NAME, KEY_GENDER]);
}
