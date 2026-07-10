# Monkey — Android/iOS 스토어 출시 가이드

이 문서는 릴리스 진행 상황을 기록하고, **사람이 직접 해야 하는 다음 단계**를 안내합니다.
설계 근거(비용/일정/스토어 정책 상세)는 `C:\Users\user\.claude\plans\lazy-wibbling-parnas.md` 참고
(다른 PC의 `.claude` 폴더에 있다면 이 문서만으로도 이어서 진행 가능하도록 아래에 핵심 내용을 정리해둠).

---

## 지금 바로 할 일 — "다음으로 필요한 것"

집 PC에서 이어서 작업할 때 이 체크리스트부터 보면 됩니다.

- [ ] **`.env`의 `SERVER_BASE_URL` 갱신** — 루트 `.env` 파일을 열어
      `SERVER_BASE_URL=https://monkey-backend-htu8.onrender.com` 로 변경 (끝에 `/` 없이).
      `OPENAI_API_KEY`는 그대로 둠(로컬 백엔드 개발용). 릴리스 빌드에 인라인되므로 값 변경 후 반드시 재빌드.
- [ ] **Google Play Console 본인 인증 완료 대기** — 가입/결제는 끝남, 인증 진행 중.
- [ ] **Apple Developer Program 개인 등록 신청** — 아직 안 했다면 지금 신청(승인까지 1~4주 걸릴 수 있어 최대한 일찍 시작 권장).
- [ ] **Render를 `starter`(유료) 플랜으로 업그레이드** — 지금은 배포 검증을 위해 `free` 플랜으로 되어 있음(`render.yaml`에 TODO 표시됨). 스토어 정식 제출 직전에는 반드시 업그레이드(무료 플랜은 15분 유휴 후 슬립 → 첫 요청 지연으로 사용자 이탈 위험).
- [ ] **앱 아이콘 / 피처 그래픽 / 스토어 스크린샷 제작** — 아직 없음. `docs/release/store-listing.md` 문구는 준비돼 있으나 그래픽 자산 없이는 Play Console 제출 불가.
- [ ] **업로드 키스토어 생성 + `gradlew bundleRelease`** — JDK가 있는 이 PC(집 PC)에서 진행 (아래 "Android 릴리스 빌드" 절 참고).
- [ ] **GitHub Pages 켜서 개인정보처리방침 공개 URL 만들기** — 저장소 Settings → Pages → Source: `main` 브랜치 `/docs` 폴더. 완료되면 `docs/legal/privacy-policy.md`가 공개 URL로 노출됨. 그 URL을 Play Console/App Store Connect에 등록.
- [ ] **`eas login` 후 첫 iOS 빌드 테스트** — Mac 없이 클라우드 빌드. Apple Developer 계정 승인 전에도 `preview` 프로필로 시뮬레이터 빌드는 가능.

---

## 지금까지 완료된 것

### 백엔드 (배포 완료, 검증됨)
- Render Free 플랜에 배포 완료: **https://monkey-backend-htu8.onrender.com**
- `/health` → `{"ok":true}` 확인됨
- `/interpret` 실제 GPT 호출까지 end-to-end 검증 완료 (예: "산에서 큰 호랑이를 만났다" 입력 → 정상 해몽 텍스트 반환, 비용 약 $0.0007)
- `render.yaml` 추가(Blueprint 배포용, Docker/`backend/Dockerfile` 기준, health check `/health`, region `singapore`). 현재 `plan: free`로 되어 있고 스토어 제출 전 `starter`로 바꿔야 한다는 TODO 주석 포함.
- `backend/Dockerfile`의 gunicorn 설정(`--workers 1`, `--preload` 미사용) + `keyword_server.py`의 module-level `Okt()` 초기화 조합을 검토한 결과, JVM/JPype fork-safety 문제 없이 안전하게 구성되어 있음 확인(수정 불필요).

### Android
- `applicationId = com.xellos0304.monkey`(영구), 릴리스 서명 설정(`android/keystore.properties` 있으면 릴리스 키, 없으면 debug 폴백) — 이미 올바르게 구성됨.
- `android/keystore.properties.example` 템플릿 존재, 실제 키스토어는 아직 생성 안 됨.
- `targetSdkVersion 35` — 2026-08-31부터 신규/업데이트 앱은 API 36 의무화(연장 시 11/1까지). 제출 시점이 이 날짜에 가까워지면 업그레이드 필요.

### iOS (이번 세션에서 신규 준비)
- Bundle Identifier를 RN CLI 기본값(`org.reactjs.native.example.monkey`)에서 Android와 동일한 **`com.xellos0304.monkey`**로 변경 (`ios/monkey.xcodeproj/project.pbxproj`).
- `ios/monkey/Info.plist`: 사용하지 않는 빈 `NSLocationWhenInUseUsageDescription` 제거, `@react-native-voice/voice`에 필요한 `NSMicrophoneUsageDescription` / `NSSpeechRecognitionUsageDescription` 추가.
- `ios/monkey/PrivacyInfo.xcprivacy`: AsyncStorage 등 Required Reason API 사유(`CA92.1` 등)가 이미 올바르게 선언되어 있음을 확인(수정 불필요).
- `eas.json` 신규 생성 — development/preview/production 빌드 프로필. iOS 빌드 이미지는 명시적으로 고정하지 않음(현재 EAS 기본 이미지가 이미 Xcode 26.4라 별도 고정 불필요, 필요시 `docs.expo.dev/build-reference/infrastructure/`에서 최신 이미지명 확인).
- Apple Developer Program 계정 및 EAS 로그인은 아직 안 되어 있음.

### 문서/정책
- `docs/legal/privacy-policy.md`: OpenAI가 표준 API 정책상 최대 30일간 데이터를 보관할 수 있다는 내용 추가(한/영 모두). Play Data Safety / App Privacy 신고 시 "수집됨/제3자 공유" 근거로 사용.
- GitHub Pages는 아직 활성화 안 함(위 체크리스트 참고).

---

## Android 릴리스 빌드 (집 PC에서, JDK 필요)

1. 루트 `.env`의 `SERVER_BASE_URL`을 프로덕션 백엔드 URL로 갱신 (위 체크리스트 참고).
2. 업로드 키스토어 생성(최초 1회, 반드시 안전하게 백업 — 분실 시 앱 업데이트 영구 불가):
   ```
   keytool -genkeypair -v -keystore android/app/upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
3. `android/keystore.properties.example`을 복사해 `android/keystore.properties` 생성 후 값 채우기:
   ```
   storeFile=upload-keystore.jks
   storePassword=<생성 시 입력한 비밀번호>
   keyAlias=upload
   keyPassword=<생성 시 입력한 비밀번호>
   ```
4. 릴리스 AAB 빌드:
   ```
   cd android
   .\gradlew.bat bundleRelease
   ```
   결과물: `android/app/build/outputs/bundle/release/app-release.aab`
5. (권장) 업로드 전 실기기 스모크 테스트: `.\gradlew.bat installRelease`로 릴리스 APK 설치 후, 음성/텍스트 입력 → 해몽 → 종합 → 카드 → 저장 → 통계 전 과정이 **배포된 Render 백엔드**와 정상 동작하는지 확인.

## Google Play Console 제출

1. Play Console 계정 인증 완료 확인(위 체크리스트).
2. 앱 만들기 → 앱 이름 `Monkey`.
3. 스토어 등록정보: `docs/release/store-listing.md`의 제목/짧은설명/자세한설명 붙여넣기. 아이콘 512×512, 피처그래픽 1024×500, 스크린샷 업로드(그래픽 자산 준비 필요).
4. 앱 콘텐츠: 개인정보처리방침 URL(GitHub Pages), **데이터 안전(Data Safety)** 양식 — 꿈 텍스트(사용자 생성 콘텐츠)를 OpenAI로 전송 → "수집됨" + "제3자와 공유됨"으로 신고, 마이크/음성 데이터도 별도 신고. 콘텐츠 등급 설문, 타깃 연령, 광고 없음 체크.
5. 테스트 → **비공개 테스트(Closed testing)** 트랙 생성 → `app-release.aab` 업로드 → 테스터 이메일 목록 등록.
6. **신규 개인 계정은 최소 12명 테스터가 14일 연속 옵트인·실사용해야** 프로덕션 전환 가능 (설치만 하고 미사용 시 "참여 부족"으로 재시작될 수 있음 — 실제로 반복 사용할 테스터 확보 필요).
7. 비공개 테스트 통과 후 프로덕션 전환 신청 → Google 검토(보통 7일 이내) → 단계적 출시(staged rollout) 권장.

## iOS 릴리스 (EAS Build, Mac 불필요)

1. Apple Developer Program 개인 등록 완료 대기.
2. `npx eas-cli login` → Expo 계정 로그인(없으면 생성).
3. `npx eas-cli build --platform ios --profile preview` — Apple 계정 승인 전에도 시뮬레이터/애드혹 빌드로 네이티브 모듈(voice, sqlite-storage) 호환성 먼저 확인 가능.
4. Apple 계정 승인 후: App Store Connect에서 Bundle ID(`com.xellos0304.monkey`) 등록 및 앱 레코드 생성. 서명 인증서/프로비저닝 프로파일은 `eas credentials`로 자동 관리 가능.
5. `npx eas-cli build --platform ios --profile production` → `npx eas-cli submit --platform ios`.
6. App Store Connect: App Privacy(개인정보) 라벨 작성(Play Data Safety와 동일 논리로 "수집됨/제3자 공유"), 스크린샷, 설명, 연령 등급.
7. **App Review 콘텐츠 리스크**: Apple의 2026-06 가이드라인 개정으로 "운세/점술" 카테고리 신규 진입 장벽이 강화됨. 제출 시 "Notes for Reviewer"란에 "점술/상담 앱이 아니라 음성 입력·로컬 저장 기반 개인 일기/자기성찰 도구"라는 차별점을 명확히 서술. 반려 후 재제출 1회를 일정에 버퍼로 반영 권장.
8. 내부 TestFlight(승인 불필요, 최대 100명) 먼저 진행 → 외부 TestFlight/제출.

---

## 남은 리스크 / 참고
- **OpenAI 비용**: 해몽마다 과금. 소규모 테스트는 미미하나 정식/대규모 확대 전 레이트리밋 필요.
- **백엔드 콜드스타트**: 현재 Free 플랜은 15분 유휴 후 슬립 → 첫 요청 지연. 스토어 제출 전 `starter` 이상으로 업그레이드 필수.
- **음성 인식(Android 11+)**: 일부 기기에서 SpeechRecognizer 가용성 이슈 가능 → 테스터 기기에서 실제 음성 입력 확인 권장.
- **targetSdkVersion 36 의무화(2026-08-31)**: 제출 시점이 임박하면 `android/build.gradle`의 `targetSdkVersion`/`compileSdkVersion`을 36으로 올릴 것.
