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

## Progress (2026-07-07)

- **완료(이번 세션)**: Dream Goddess 아르누보 전면 리디자인 — 30장 무료 AI 일러스트 카드 생성·적용, `DreamCard` 앞면 일러스트화, 앱 전반 골드 아르누보 톤(Ornament/골드 라인). UX 4건: 뒤로가기 버튼(`BackButton` → Result/음성입력/DiaryDetail), 카드 의미 한 줄, 꿈일기→꿈카드, 캐러셀 중앙+스와이프 날짜. **카드 이미지 렌더 버그 해결**(RN Image에 `StyleSheet.absoluteFill`만 주면 Android에서 resizeMode가 깨져 우측 치우침·잘림 → 명시적 `width/height:'100%'` 필요). 에뮬레이터 실기 검증 완료, `tsc` 0오류.
- **남은 일**: Result/Stats/Profile/Splash의 더 깊은 아르누보 오르나멘트는 사용자와 육안 이터레이션하며 추가 가능. 구도가 아쉬운 카드는 해당 id만 재생성(`python scripts/gen-card-art.py <id>`). Beta/수익화/출시 단계는 `todo.md` 참고.
- **확정(다시 묻지 말 것)**: 톤=이리데슨트+아르누보(다크 베이스 유지, 꿈=밤). 카드 아트=정적 자산 1회 생성(매 실행 AI 호출 금지). 이미지 provider 기본=무료 Pollinations. 상세 이력은 auto-memory `project_monkey_status.md` + `docs/`.
