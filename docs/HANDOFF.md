# 다른 PC에서 이어서 작업하기

이 브랜치(`worktree-store-screenshots`)를 다른 컴퓨터에서 그대로 이어받는 방법.
2026-07-28 기준.

## 1) 지금 어디까지 되어 있나

- **앱 수정 3건 완료** (에뮬레이터 실기 확인 + `npx tsc --noEmit` 통과)
  - 홈 꿈 입력: 긴 꿈을 통째로 받는다는 점이 드러나게 개편
    (여러 장면짜리 예시 문구, 입력창 220dp, 글자 수 카운터, 특징 칩 3개,
    "인간관계 · 재물운 · 직장·학업운 · 건강운 · 주의운" 안내)
  - 꿈 기록 화면: 제목이 상태바에 잘리던 것 수정(`paddingTop: 56`), `꿈기록` → `꿈 기록`
  - 통계 "이번 달의 꿈 키워드": 카드 이름 옆에 의미 병기 — `고치 (변화 · 전환 · 성장통)`
- **스토어 폰 스크린샷 5장 교체 완료** — 위 변경이 반영된 새 캡처로 다시 만듦
- **PR은 아직 없다.** 작업한 환경에 `gh` CLI가 없었다.
  https://github.com/MS-Won/Monkey/pull/new/worktree-store-screenshots 에서 만들면 된다.

## 2) 새 PC 세팅

```sh
git clone https://github.com/MS-Won/Monkey.git
cd Monkey
git checkout worktree-store-screenshots
npm install
```

### ⚠️ `.env`는 git에 없다 (반드시 직접 만들 것)

저장소 루트에 `.env`를 만들고 두 값을 넣는다. `backend/.env`가 아니라 **루트**다.

```
SERVER_BASE_URL=https://monkey-backend-htu8.onrender.com
OPENAI_API_KEY=<백엔드용 키>
```

`SERVER_BASE_URL`이 없으면 번들링 단계에서 `@env` 임포트가 깨진다.
로컬 백엔드를 쓸 거면 `http://10.0.2.2:5001`로 바꾸되, **그 상태로 디버그 앱을 설치하면
앱이 로컬 주소를 계속 들고 있으니** 나중에 로컬 서버를 내리면 해몽이 실패한다.

### 실행

```sh
npm start          # Metro
npm run android    # 에뮬레이터에 설치
```

## 3) 스크린샷을 다시 만들려면

Python + Pillow만 있으면 된다(에뮬레이터 불필요).

```sh
pip install pillow
python scripts/gen-store-screenshots.py
```

- 문구만 바꾸려면 `scripts/gen-store-screenshots.py`의 `SHOTS`를 고치고 다시 실행.
- 화면을 새로 찍으려면 `docs/release/store-assets/raw/N-*.png`를 덮어쓰고 다시 실행.
- 자세한 규칙은 `docs/release/store-assets/README.md`.

### 에뮬레이터에서 한글 입력이 안 될 때

`adb shell input text`는 한글을 못 넣는다. 호스트 클립보드를 거친다.

```powershell
Set-Clipboard -Value "여기에 한글 꿈"
```
```sh
adb shell input tap <입력창 좌표>
adb shell input keyevent 279   # 붙여넣기
adb shell input keyevent 111   # ESC — 키보드 닫기
```

`keyevent 4`(뒤로가기)를 두 번 누르면 앱이 종료된다. 키보드는 ESC로 닫을 것.

## 4) git worktree에서 돌릴 때

`.claude/worktrees/*`에는 `node_modules`가 없다. `metro.config.js`가 이 경우를 감지해
원본 체크아웃의 `node_modules`를 빌려 쓰도록 되어 있다(원본에서 실행하면 아무 영향 없음).
`.env`는 gitignore 대상이라 워크트리에도 따로 복사해야 한다.

## 5) 남은 일 — 전부 사용자 브라우저 수동 작업

`docs/release/play-console-checklist.md`에 복붙용 치트시트가 있다.

1. **Play Console 스토어등록정보 → 폰 스크린샷 교체.** 예전 것을 지우고
   `2-home` → `5-card` → `6-interpretation` → `3-diary-cards` → `4-stats` 순서로 5장 업로드.
2. **비공개 테스트에 AAB 업로드** — `android/app/build/outputs/bundle/release/app-release.aab`
   (versionCode 3). ⚠️ 이번 앱 수정은 이 AAB에 **들어 있지 않다.** 반영하려면
   versionCode를 4로 올리고 다시 빌드해야 한다.
3. **Render starter 플랜 결제** — `/reading` 응답이 콜드스타트 포함 60~70초까지 걸린다.
