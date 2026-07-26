# CLAUDE.md

> 이 파일은 **얇게** 유지합니다(토큰 절약). 상세 작업 로그/설계 문서는
> 프로젝트 루트 `docs/` 하위에 주제별 `.md`로 쌓고, 아래 **Progress Index**에서 한 줄로 링크만 겁니다.
> CLAUDE.md 본문에는 장문 진행 기록을 추가하지 마세요.

## Rules

- Always respond in Korean
- Never commit API keys, .env files, or secrets
- Avoid unnecessary file creation
- Analyze and propose a plan before coding
- Minimize usage of API to reduce cost
- 상세 작업 내역은 CLAUDE.md에 누적하지 말고 루트 `docs/<주제>/*.md`로 분리 후 Progress Index에 링크

## Structure

Splash → Main(Home, Diary, Stats, Profile)

## Architecture

- React Native 0.79.2 + TypeScript
- Supabase + OpenAI + KoNLPy Okt (해몽/분리/임베딩은 backend Flask가 OpenAI 호출)
- Android first, iOS later
- Design tone: **Art Nouveau + iridescent (Dream Goddess tarot)** — 무하풍 여신 일러스트 카드. 카드 아트는 `scripts/gen-card-art.py`로 1회 생성해 `frontend/assets/images/cards/NN.png`에 정적 고정(매 실행 호출 아님)

## Domain

Monkey는 꿈 기록 + 전통 해몽 앱입니다. 해석의 **뿌리는 전통 한국 해몽**이되,
연출/톤은 몰입감 있는 **점술가(mystic) 어조 + 타로 레퍼런스 아키타입 카드**를 사용합니다.
- Flow: Dream → Split → Interpret → Summary(점술가 어조) → Archetype Card 선정 → Save/Stats
- 아키타입 카드 30종은 `../docs/design/archetype-cards.md` 정의를 단일 소스로 사용
- 과장된 미래 예언·공포 마케팅 금지 (연출은 몰입감이되, 단정적 예언은 하지 않음)
- '로또력 분석'은 재미용 부가 기능(예외)

## Progress Index

- [2026-07-06 달빛 서재 리디자인 (아카이브)](../docs/progress/2026-07-06-moonlight-redesign.md) — 네이비+골드 구버전
- [홀로그래픽 타로 리디자인 (아카이브)](../docs/design/holographic-redesign.md) — 벡터 시길 기반 구버전 톤/토큰
- [Dream Goddess 아르누보 바이블 (현재)](../docs/design/dream-goddess-bible.md) — 30장 카드 아트 스펙 + 생성 프롬프트(현 디자인)
- [아키타입 카드 30종 정의](../docs/design/archetype-cards.md) — 카드 데이터(코드) 단일 소스
- 카드 일러스트 생성: `scripts/gen-card-art.py` (무료 Pollinations FLUX 기본, provider 교체 가능) → `frontend/assets/images/cards/`, `frontend/src/data/cardArt.ts` 매핑

## Progress (2026-07-19)

> 상세 로그는 auto-memory `project_monkey_status.md`(추가 15~18) 참고. 여기선 현황만.

**출시 파이프라인 거의 완료 — 남은 건 사용자의 Play Console 업로드 하나뿐**
- **백엔드 배포**: Render `https://monkey-backend-htu8.onrender.com` 가동(루트 `.env` `SERVER_BASE_URL` 이 주소로 교체됨, 릴리스 번들에 인라인). `/health`·`/interpret` 프로덕션 검증 완료.
- **해몽 품질 개선**(`backend/keyword_server.py`): 모델 `gpt-3.5-turbo`→**`gpt-4o-mini`**(번역투 대폭 개선, 비용상수 갱신), `PERSONA_SYSTEM`에 자연스러운 구어체·번역투 금지 + 구체적 일상어 규칙, `/summary` 첫 문장을 구체적 핵심 한 줄로 시작(`## 종합 해몽`/`## 조언` 헤더 유지=프론트 파서 호환). 로컬+프로덕션 검증. 전통 RAG 근거 불변.
- **앱 아이콘/캐릭터**: `docs/release/store-assets/icon.png`(원숭이 점술가 일러스트) 기준으로 런처 아이콘(어댑티브 꽉찬 버전, 크림링 제거)·인앱 `Mascot`(이미지)·네이티브 스플래시 로고·스토어 512 아이콘 전부 교체. 생성기 `scripts/apply-monkey-icon.ps1`. 에뮬 검증.
- **키스토어**: `android/app/upload-keystore.jks` 생성(비번 `Wraith7766!@`, gitignore, **분실 시 업데이트 영구 불가—백업필수**). SHA256 `AA:26:27:D0:...:5C:A9`.
- **패키지명 변경(중요)**: Play Console 앱 생성 시 `com.xellos0304.monkey` → **`com.mswon.monkey`**로 확정. `android/app/build.gradle` 반영 + AAB 재빌드 완료(2026-07-19, AAB 매니페스트에서 패키지명 검증됨). iOS pbxproj는 아직 `com.xellos0304.monkey`(서로 달라도 무방, 통일하려면 Apple 앱 레코드 생성 전에).
- **릴리스 AAB**: `android/app/build/outputs/bundle/release/app-release.aab`(2026-07-19 재빌드, versionCode 1/versionName 1.0, 서명 업로드키 일치). **이 파일을 Play에 업로드.**
- **개인정보처리방침**: GitHub Pages 라이브 `https://ms-won.github.io/Monkey/`.
- **스토어 자료**: 문구 `docs/release/store-listing.md`, 그래픽(아이콘512·피처1024x500·스크린샷6장) `docs/release/store-assets/`.
- GitHub push 완료(`MS-Won/Monkey` main, origin=d2a4819 이후). git push는 Git Credential Manager 쓰기인증이 이 세션 비대화형에선 처음엔 행걸리나, 사용자가 자기 터미널서 1회 로그인하면 캐시돼 이후 통과됨.

**다음(사용자 수동) — 치트시트 `docs/release/play-console-checklist.md` 그대로 따라가기**
- 앱 만들기 ✅완료(2026-07-17). 남은 것: 스토어 등록정보(문구+그래픽) → 앱 콘텐츠(방침 URL·데이터보안 답변표·콘텐츠등급·타깃층) → **비공개 테스트 트랙에 `app-release.aab` 업로드 + 테스터 이메일 등록** → 검토 제출.
- Render `starter` 플랜은 `render.yaml`에만 반영됨 → **대시보드에서 실제 플랜 변경 필요**(결제 발생). 테스터 14일 실사용 기간 전에.

**확정 결정(재질문 불필요)**
- 플랫폼: Android 먼저, iOS는 이후 EAS 클라우드 빌드. 출시: 클로즈드(비공개) 테스트 먼저.
- 백엔드: 현 Flask+Okt 구조 그대로 Render 컨테이너 호스팅. 해몽 모델=gpt-4o-mini.
- 앱명 `Monkey`, `applicationId=com.mswon.monkey`(Play 등록 기준 영구). 아이콘=원숭이 점술가 일러스트.

