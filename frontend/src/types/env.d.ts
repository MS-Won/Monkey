// frontend/src/types/env.d.ts
declare module '@env' {
  // ✅ 서버 주소 (프론트가 Flask 서버에 접근할 때 사용)
  export const SERVER_BASE_URL: string;

  // (남아있다면) 기존 선언들
  // export const OPENAI_API_KEY: string; // ✅ 이제는 쓰지 않으면 지워도 됨
}
