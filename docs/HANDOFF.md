# 새 PC에서 개발 환경 세팅하기

git에 들어 있지 않아 **PC마다 직접 챙겨야 하는 것들**과, 자주 쓰는 조작법을 모아둔다.
환경 구성 문서이므로 자주 바뀌지 않는다.

> **지금 무슨 작업을 하던 중이었는지**는 여기가 아니라 **`docs/STATE.md`**에 있다.
> 이어서 작업하려면 `/resume`을 실행하면 된다.

## 1) 새 PC 세팅

```sh
git clone https://github.com/MS-Won/Monkey.git
cd Monkey
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

### ⚠️ 릴리스 서명 키도 git에 없다 — 없으면 Play가 AAB를 거부한다

`android/keystore.properties`와 `android/app/upload-keystore.jks`는 gitignore 대상이다.
**둘 중 하나라도 없으면 Gradle이 조용히 디버그 키로 폴백한다.** 빌드는 성공하지만
업로드할 때 Play가 이렇게 되돌려보낸다:

> Android App Bundle이 잘못된 키로 서명되었습니다.

실제로 2026-08-30에 이 문제로 업로드가 막혀 있었다. 릴리스 빌드를 할 PC라면
키스토어를 안전한 경로로 옮겨와야 한다(공유 채널에 올리지 말 것).

**업로드 전 반드시 지문을 대조한다:**

```sh
unzip -q -o android/app/build/outputs/bundle/release/app-release.aab -d /tmp/aab
ls /tmp/aab/META-INF/          # UPLOAD.RSA 여야 한다. CERT.RSA 면 디버그 키 폴백이다.
keytool -printcert -file /tmp/aab/META-INF/UPLOAD.RSA | grep SHA256
```

기대값은 `docs/release/play-console-checklist.md` 2-2절에 적어두었다.

### 실행

```sh
npm start          # Metro
npm run android    # 에뮬레이터에 설치
```

## 2) 스크린샷을 다시 만들려면

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

## 3) git worktree에서 돌릴 때

`.claude/worktrees/*`에는 `node_modules`가 없다. `metro.config.js`가 이 경우를 감지해
원본 체크아웃의 `node_modules`를 빌려 쓰도록 되어 있다(원본에서 실행하면 아무 영향 없음).
`.env`는 gitignore 대상이라 워크트리에도 따로 복사해야 한다.
