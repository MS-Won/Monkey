# Play Store Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the "Monkey" React Native dream-diary app from "runs on developer's PC only" to "installable release build a real user can run," by fixing release signing, deploying the Flask/konlpy backend to a public HTTPS endpoint (Render, Docker), preparing the Play Console listing content (privacy policy + description), and fixing a runtime-permission bug that currently breaks voice input on real devices.

**Architecture:** No new architecture — this is release-engineering work on the existing RN app (`frontend/`, `android/`) and existing Flask backend (`backend/keyword_server.py`). The backend gets containerized (Dockerfile) and deployed to Render as a Docker web service; the Flask app itself gains two new routes (`/health`, `/privacy`) so the deployed instance can serve its own privacy-policy URL for the Play Console data-safety form.

**Tech Stack:** React Native 0.79 / Android Gradle, Python 3 / Flask / konlpy (JVM via JPype) / gunicorn, Docker, Render.

## Global Constraints

- `applicationId` stays `com.monkey` — do not change it, it's what will be registered in Play Console.
- Never commit secrets: the release keystore file, its passwords, or `OPENAI_API_KEY` must never enter git. `.env`, `.env.*` (except `.env.example`) are already gitignored — new secret-bearing files must be added to `.gitignore` in the same commit that introduces them, before they're ever staged.
- Backend must be reachable over HTTPS only (Render provides this automatically) — no cleartext `http://` in the shipped app.
- Backend must bind to the `PORT` env var Render injects, not the hardcoded `5001` (that hardcoded value stays as the local-dev default).
- All new user-facing text (privacy policy, store listing) is Korean, matching the app's existing UI language.
- No local Docker daemon is available in this environment — Docker build correctness is verified by inspection + a successful Render deploy, not a local `docker build`.

---

### Task 1: Generate release upload keystore and wire up Gradle signing

**Files:**
- Create: `android/app/monkey-upload-key.keystore` (binary, gitignored, never committed)
- Create: `android/keystore.properties` (gitignored, never committed)
- Modify: `android/app/build.gradle`
- Modify: `.gitignore`

**Interfaces:**
- Produces: a `release` build type in `android/app/build.gradle` signed with a real upload key (not `debug.keystore`), loading credentials from `android/keystore.properties` via Gradle `Properties` API — so Task 3/CI never needs the passwords hardcoded in a tracked file.

- [ ] **Step 1: Add the new secret files to `.gitignore` first, before they exist**

Edit `.gitignore`, in the section right after the existing `android/app/debug.keystore` line:

```
android/app/debug.keystore
android/app/*.keystore
android/keystore.properties
android/app/src/main/assets/*.db
dreamlog.txt
```

- [ ] **Step 2: Generate the upload keystore with a random 32-char password**

Run (PowerShell, from repo root):

```powershell
$storePass = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
$keyPass = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})
& "D:\Program Files\Java\jdk-23\bin\keytool.exe" -genkeypair -v `
  -keystore android/app/monkey-upload-key.keystore `
  -alias monkey-upload `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -storepass $storePass -keypass $keyPass `
  -dname "CN=Monkey App, OU=Dev, O=Monkey, L=Seoul, ST=Seoul, C=KR"
"MYAPP_UPLOAD_STORE_FILE=monkey-upload-key.keystore" | Out-File android/keystore.properties -Encoding utf8
"MYAPP_UPLOAD_KEY_ALIAS=monkey-upload" | Add-Content android/keystore.properties
"MYAPP_UPLOAD_STORE_PASSWORD=$storePass" | Add-Content android/keystore.properties
"MYAPP_UPLOAD_KEY_PASSWORD=$keyPass" | Add-Content android/keystore.properties
Write-Host "Store password: $storePass"
Write-Host "Key password:   $keyPass"
```

Expected: `Generating 2,048 bit RSA key pair...` followed by `[Storing android/app/monkey-upload-key.keystore]`, and `android/keystore.properties` now contains 4 lines.

**IMPORTANT — tell the user, in plain text, right after this step runs:** copy the two printed passwords (and the keystore file itself) somewhere durable outside the repo (password manager). If this keystore is lost, the app can never be updated on Play Store again under the same listing — Google cannot recover it.

- [ ] **Step 3: Verify the keystore is valid**

Run: `& "D:\Program Files\Java\jdk-23\bin\keytool.exe" -list -v -keystore android/app/monkey-upload-key.keystore -storepass $storePass`
Expected: prints `Alias name: monkey-upload`, `Valid from: ... until: ...` (~27 years out).

- [ ] **Step 4: Wire the keystore into `android/app/build.gradle`**

Modify `android/app/build.gradle` — add this block right before `android {` (after the `jscFlavor` line):

```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Then replace the `signingConfigs { ... }` block:

```groovy
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['MYAPP_UPLOAD_STORE_FILE'])
                storePassword keystoreProperties['MYAPP_UPLOAD_STORE_PASSWORD']
                keyAlias keystoreProperties['MYAPP_UPLOAD_KEY_ALIAS']
                keyPassword keystoreProperties['MYAPP_UPLOAD_KEY_PASSWORD']
            }
        }
    }
```

And change the `release` build type's `signingConfig`:

```groovy
        release {
            // Signed with the real upload key from android/keystore.properties (gitignored).
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
```

- [ ] **Step 5: Bump versioning for the first real release**

In the same file's `defaultConfig`, confirm `versionCode 1` / `versionName "1.0"` — leave as-is for the first upload (this is correct for a first release; only bump on subsequent updates).

- [ ] **Step 6: Build a signed release AAB to prove the signing config works**

Run: `cd android; .\gradlew.bat bundleRelease; cd ..`
Expected: `BUILD SUCCESSFUL`, and `android/app/build/outputs/bundle/release/app-release.aab` exists.

- [ ] **Step 7: Confirm the AAB is signed with the new key, not the debug key**

Run: `& "D:\Program Files\Java\jdk-23\bin\keytool.exe" -printcert -jarfile android/app/build/outputs/bundle/release/app-release.aab`
Expected: `Owner: CN=Monkey App, OU=Dev, O=Monkey, L=Seoul, ST=Seoul, C=KR` (matches Step 2's `-dname`, not `CN=Android Debug`).

- [ ] **Step 8: Commit the Gradle/gitignore changes (not the secrets)**

```bash
git add .gitignore android/app/build.gradle
git status
```
Expected in `git status`: `android/keystore.properties` and `android/app/monkey-upload-key.keystore` show as untracked but are NOT staged (gitignore is working). Then:
```bash
git commit -m "build: sign Android release builds with a real upload keystore"
```

---

### Task 2: Containerize the backend for deployment

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`
- Modify: `backend/keyword_server.py:458-461` (the `if __name__ == "__main__":` block, plus two new routes)

**Interfaces:**
- Produces: `GET /health` → `200 {"status": "ok"}` (used by Render's health check and by Task 3's post-deploy verification).
- Produces: `GET /privacy` → `200`, `text/html`, the Korean privacy policy (used as the Play Console privacy-policy URL in Task 4).
- Consumes: existing `/split`, `/embed`, `/interpret`, `/summary` routes are untouched.

- [ ] **Step 1: Write `backend/requirements.txt`**

```
flask==3.0.3
python-dotenv==1.0.1
requests==2.32.3
konlpy==0.6.0
JPype1==1.5.0
gunicorn==22.0.0
```

- [ ] **Step 2: Add `/health` and `/privacy` routes, and make the dev server prod-safe**

In `backend/keyword_server.py`, add near the other route definitions (right after the imports/setup section, e.g. after line 55's `VERB_SPLIT_THRESHOLD = 2`):

```python
PRIVACY_POLICY_HTML = """
<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>Monkey 개인정보처리방침</title></head><body style="font-family:sans-serif;max-width:640px;margin:40px auto;line-height:1.6">
<h1>Monkey 개인정보처리방침</h1>
<p>최종 수정일: 2026-07-17</p>
<h2>1. 수집하는 정보</h2>
<p>Monkey는 사용자가 입력한 꿈 내용(텍스트 또는 음성 인식 결과)을 분석 목적으로 서버에 전송합니다.
음성 데이터 자체는 서버에 저장되지 않으며, 인식된 텍스트만 처리됩니다.</p>
<h2>2. 정보의 이용 목적</h2>
<p>입력된 문장은 OpenAI API를 통해 해몽 분석 및 요약을 생성하는 데에만 사용되며,
분석 결과와 사용자의 꿈 일기는 사용자의 기기 내 로컬 데이터베이스(SQLite)에 저장됩니다.
서버는 분석 요청을 처리한 뒤 해당 요청 데이터를 보관하지 않습니다.</p>
<h2>3. 제3자 제공</h2>
<p>분석을 위해 입력 문장이 OpenAI(미국)로 전송됩니다. 그 외 제3자에게 정보를 제공하지 않습니다.</p>
<h2>4. 데이터 보관 및 삭제</h2>
<p>꿈 일기, 프로필 정보는 사용자 기기에만 저장됩니다. 앱을 삭제하면 해당 데이터도 함께 삭제됩니다.</p>
<h2>5. 문의</h2>
<p>개인정보 관련 문의: {contact_email}</p>
</body></html>
"""

@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200

@app.get("/privacy")
def privacy():
    return PRIVACY_POLICY_HTML, 200, {"Content-Type": "text/html; charset=utf-8"}
```

Replace `{contact_email}` with the user's actual support email before deploying (ask the user which address to publish — do not guess or reuse `xellos0304@gmail.com` without confirming they want it public).

Then replace the bottom `if __name__ == "__main__":` block (currently lines 458-461):

```python
if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001"))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
```

- [ ] **Step 3: Write `backend/Dockerfile`**

```dockerfile
FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends default-jdk-headless curl && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/default-java

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001
CMD ["sh", "-c", "gunicorn -w 2 -b 0.0.0.0:${PORT:-5001} --timeout 120 keyword_server:app"]
```

- [ ] **Step 4: Write `backend/.dockerignore`**

```
venv/
__pycache__/
*.pyc
.env
```

- [ ] **Step 5: Sanity-check the Flask app still imports cleanly**

No local Docker/JVM is available in this environment, so this step is a static check, not a run. Run: `grep -n "def health\|def privacy\|PORT" backend/keyword_server.py`
Expected: shows the two new route functions and the `os.getenv("PORT"` line — confirms the edit landed in the right place and didn't break the file structure (no syntax errors visible around it).

- [ ] **Step 6: Commit**

```bash
git add backend/requirements.txt backend/Dockerfile backend/.dockerignore backend/keyword_server.py
git commit -m "feat: containerize backend for Render deployment, add /health and /privacy routes"
```

---

### Task 3: Deploy backend to Render and point the app at it

This task is mostly manual on Render's dashboard (an external account action the user must take), plus one local verification and one local config change. No code changes to commit here.

- [ ] **Step 1: Push the branch so Render can see the Dockerfile**

```bash
git push origin main
```

- [ ] **Step 2: Create the Render Web Service (user does this in the Render dashboard)**

Guide the user through:
1. https://dashboard.render.com → New → Web Service
2. Connect the `MS-Won/Monkey` GitHub repo
3. Root Directory: `backend`
4. Environment: **Docker** (Render auto-detects `backend/Dockerfile`)
5. Instance type: Free (or Starter if the free tier's cold-start delay is unacceptable for the diary-analysis flow)
6. Environment Variables → add `OPENAI_API_KEY` = (their real key, pasted directly into Render's dashboard — never into a file in this repo)
7. Create Web Service, wait for the build to finish

- [ ] **Step 3: Verify the deployed service is reachable**

Once Render shows "Live," run (substituting the actual `.onrender.com` URL Render assigned):

```bash
curl -s https://<service-name>.onrender.com/health
curl -s https://<service-name>.onrender.com/privacy | head -5
```
Expected: first command returns `{"status":"ok"}`; second returns the start of the HTML privacy page.

- [ ] **Step 4: Point the local `.env` at the deployed backend for the release build**

Edit the user's local `.env` (gitignored, not committed):
```
SERVER_BASE_URL=https://<service-name>.onrender.com
```
Update `.env.example` in the repo to document this as the pattern (keep placeholder, not the real URL):
```
OPENAI_API_KEY=YOUR_KEY_HERE
SERVER_BASE_URL=https://your-backend.onrender.com
```

- [ ] **Step 5: Rebuild the release AAB against the deployed backend and smoke-test**

```bash
cd android; .\gradlew.bat bundleRelease; cd ..
```
Install the resulting AAB (via `bundletool` or a debug-signed equivalent APK) on a real device with Wi-Fi/mobile data (not the same network as the old dev PC) and run through: enter a dream sentence → submit → confirm a result comes back. This is the first true end-to-end test that a user *not* on the developer's LAN can use the app.

- [ ] **Step 6: Commit the `.env.example` update**

```bash
git add .env.example
git commit -m "docs: document production SERVER_BASE_URL in .env.example"
```

---

### Task 4: Store listing content

**Files:**
- Create: `docs/store-listing/listing-copy-ko.md`
- Create: `docs/store-listing/data-safety-notes-ko.md`

**Interfaces:**
- Produces: source-of-truth copy the user pastes into the Play Console listing form and Data Safety questionnaire (Play Console has no API/file-upload path for this text — it's pasted manually).

- [ ] **Step 1: Write `docs/store-listing/listing-copy-ko.md`**

```markdown
# Monkey — Play Console 등록정보

## 짧은 설명 (80자 이내)
매일 꾼 꿈을 기록하고 AI로 해몽 분석까지 — 나만의 꿈 일기장

## 전체 설명
Monkey는 당신이 꾼 꿈을 텍스트 또는 음성으로 간편하게 기록하고,
AI 분석을 통해 꿈에 담긴 의미를 해몽해주는 꿈 일기 앱입니다.

주요 기능
- 음성 또는 텍스트로 빠르게 꿈 기록
- AI 기반 문장 분석 및 전통 해몽 스타일 요약
- 꿈 일기 히스토리 및 통계로 나의 꿈 패턴 확인
- 모든 일기는 기기 내부에 안전하게 저장

이런 분께 추천해요
- 꿈이 잦고, 그 의미가 궁금한 분
- 매일의 꿈을 기록하는 습관을 만들고 싶은 분

## 카테고리 (제안)
라이프스타일

## 콘텐츠 등급 (제안 — Play Console 설문에서 최종 결정)
전체 이용가 (사용자 생성 텍스트 콘텐츠 있음 — 꿈 내용 자유 서술)

## 연락처 이메일
(배포자가 정할 것 — /privacy 페이지의 {contact_email}과 동일하게 맞출 것)
```

- [ ] **Step 2: Write `docs/store-listing/data-safety-notes-ko.md`**

```markdown
# Play Console "Data Safety" 설문 참고자료

이 앱이 실제로 하는 일 기준으로 작성. 설문 항목과 1:1 매핑은 아니며,
콘솔에서 해당 항목을 찾아 아래 답으로 체크할 것.

- 수집 데이터: 사용자 생성 콘텐츠(꿈 텍스트) — 서버로 전송되어 분석에 사용, 서버에 영구 저장 안 함
- 기기 저장: 꿈 일기, 프로필은 SQLite로 기기 로컬 저장만 함 (서버 미저장)
- 제3자 공유: OpenAI(미국)로 분석 목적 전송 — "제3자와 공유" = Yes, 목적 = 앱 기능(analytics/기능 제공 아님, "App functionality")
- 데이터 암호화: 전송 중 암호화 여부 = Yes (HTTPS, Render 자동 제공)
- 데이터 삭제 요청: 서버에 사용자 데이터를 보관하지 않으므로 별도 삭제 요청 절차 불필요 —
  앱 삭제 시 로컬 데이터는 함께 삭제됨. 이 사실을 설문/개인정보처리방침에 명시.
- 광고/트래킹 SDK: 코드베이스에 없음 (package.json 확인 완료, 2026-07-17 기준) — "No ads" 로 표기
```

- [ ] **Step 3: Commit**

```bash
git add docs/store-listing/
git commit -m "docs: draft Play Console listing copy and data-safety notes"
```

- [ ] **Step 4: Flag the remaining manual-only assets**

Tell the user directly (not a file, just a message) that these still need to be produced outside this repo and can't be generated by an agent:
- App icon, 512×512 PNG (hi-res store icon, separate from the in-app launcher icons already in `android/app/src/main/res/mipmap-*`)
- Feature graphic, 1024×500 PNG
- At least 2 phone screenshots (Play Console requires them) — take these from the release build once Task 3 is done

---

### Task 5: Fix voice input — missing RECORD_AUDIO permission (discovered bug, release-blocking)

Found while auditing the manifest for Task 3: `frontend/src/screens/InputScreen.tsx:240` calls `Voice.start('ko-KR')` for the diary voice-input feature, but `android/app/src/main/AndroidManifest.xml` only declares `INTERNET` — no `RECORD_AUDIO`, and there's no `PermissionsAndroid.request` call anywhere in the file. On Android 6+ this means voice input will fail (permission denial) for every real user, not just in this dev environment. Since it's a core feature (the input screen offers voice as a primary entry mode), it should be fixed before shipping.

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `frontend/src/screens/InputScreen.tsx:230-245` (wherever `Voice.start` is called)

**Interfaces:**
- Consumes: `@react-native-voice/voice`'s existing `Voice.start('ko-KR')` call (already present).

- [ ] **Step 1: Add the manifest permission**

In `android/app/src/main/AndroidManifest.xml`, add alongside the existing `<uses-permission android:name="android.permission.INTERNET" />`:

```xml
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
```

- [ ] **Step 2: Request the permission at runtime before starting voice recognition**

In `frontend/src/screens/InputScreen.tsx`, add the import near the top (with the other React Native imports):

```typescript
import { PermissionsAndroid, Platform } from 'react-native';
```

Find the function that calls `await Voice.start('ko-KR');` (around line 240) and wrap the call:

```typescript
const ensureMicPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: '마이크 권한 필요',
      message: '음성으로 꿈을 기록하려면 마이크 접근 권한이 필요합니다.',
      buttonPositive: '허용',
      buttonNegative: '취소',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};
```

Then, immediately before the existing `await Voice.start('ko-KR');` line, add:

```typescript
const hasPermission = await ensureMicPermission();
if (!hasPermission) {
  return;
}
```

- [ ] **Step 3: Rebuild and manually verify on a device**

```bash
cd android; .\gradlew.bat assembleDebug; cd ..
```
Install the debug APK on a real Android device or emulator, tap the voice-input button, and confirm the OS permission dialog appears and, after granting it, speech recognition actually starts (the existing `Voice.onSpeechStart` handler fires — check logcat or UI state change).

- [ ] **Step 4: Commit**

```bash
git add android/app/src/main/AndroidManifest.xml frontend/src/screens/InputScreen.tsx
git commit -m "fix: request RECORD_AUDIO permission before starting voice input"
```

---

## Task Order

Tasks 1, 2+3, 4, and 5 are independent of each other and can be done in any order or in parallel — but **Task 3 depends on Task 2** (can't deploy what isn't containerized yet), and the final "real device, real network" smoke test in Task 3 Step 5 is most meaningful once Task 5 is also done (otherwise voice input will still look broken during that test for an unrelated reason).
