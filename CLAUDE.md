# Monkey (夢Key) — 꿈 해몽 앱

React Native(Android) 앱 + Flask 백엔드(Render). 전통 해몽 사전으로 그라운딩한
GPT 해몽과 30종 아르누보 카드가 핵심이다.

---

## 🔴 세션을 시작하면 가장 먼저 할 일

**`docs/STATE.md`를 읽어라.** 지금 어디까지 됐고 다음에 뭘 해야 하는지가 거기 있다.

이 프로젝트는 **여러 PC에서 번갈아 작업한다.** Claude의 로컬 메모리는 PC 사이를
넘어오지 않으므로, PC 간에 전달되는 상태는 오직 git에 커밋된 문서뿐이다.
`docs/STATE.md`가 그 역할을 한다 — 다른 PC의 지난 세션이 남긴 인수인계서다.

사용자가 "이어서 진행해줘" 류의 말을 하면 `/resume`을 실행하면 된다.
작업이 끝나면 `/handoff`로 상태를 남기고 커밋·푸시한다.

## 문서 지도

| 파일 | 무엇이 있나 | 갱신 주기 |
|---|---|---|
| `docs/STATE.md` | **현재 상태와 다음 할 일** | 매 세션 (`/handoff`) |
| `todo.md` | 작업 큐. 완료 시 `[x]`로 체크하고 근거를 남긴다 | 작업 완료 시 |
| `docs/HANDOFF.md` | 새 PC 환경 세팅, 에뮬레이터 조작법 | 드물게 |
| `docs/release/play-console-checklist.md` | Play Console 복붙 치트시트, 서명 키 지문 | 출시 관련 변경 시 |
| `docs/release/RELEASE.md` | 빌드·서명·배포 절차 | 드물게 |
| `docs/design/dream-goddess-bible.md` | 디자인 규칙 | 드물게 |

## 반드시 알아야 할 함정

- **`.env`는 저장소 루트에 있다** (`backend/.env` 아님). git에 없으므로 새 PC에서
  직접 만들어야 한다. 없으면 `@env` 임포트가 깨져 번들링이 실패한다. → `docs/HANDOFF.md`
- **릴리스 서명**: `android/keystore.properties`가 없으면 Gradle이 조용히 **디버그 키로
  폴백**한다. 빌드는 성공하는데 Play가 "잘못된 키로 서명되었습니다"로 거부한다.
  업로드 전 반드시 지문을 대조할 것 → `docs/release/play-console-checklist.md` 2-2절
- **이 PC는 CPU가 포화되면 멈춘다.** Gradle은 `--max-workers=2` + `BelowNormal`
  우선순위로 돌리고, 에뮬레이터는 띄우기 전에 사용자에게 물어본다.
- **RN 릴리스 번들은 Hermes 바이트코드**다. 번들 안 한글 문자열을 검증할 땐 `utf-16-le`로 찾는다.
- `versionCode`는 코드/에셋이 바뀔 때마다 반드시 올린다. 되돌릴 수 없다.

## 작업 규칙

- `todo.md`가 작업 큐다. 완료하면 체크하고 **무엇을 어떻게 검증했는지**까지 적는다.
- 코드를 고쳤으면 `npx tsc --noEmit`과 `npx jest`를 통과시킨 뒤 커밋한다.
- 커밋 메시지는 한국어로, **왜 그렇게 했는지**를 남긴다.
