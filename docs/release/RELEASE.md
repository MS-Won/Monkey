# Monkey — Android/iOS 스토어 출시 가이드

이 문서는 릴리스 진행 상황을 기록하고, **사람이 직접 해야 하는 다음 단계**를 안내합니다.
설계 근거(비용/일정/스토어 정책 상세)는 `C:\Users\user\.claude\plans\lazy-wibbling-parnas.md` 참고
(다른 PC의 `.claude` 폴더에 있다면 이 문서만으로도 이어서 진행 가능하도록 아래에 핵심 내용을 정리해둠).

---

## 지금 바로 할 일 — "다음으로 필요한 것" (2026-08-24 기준)

Android 비공개 테스트 버전은 이미 **Google 검토에 제출**됐습니다. 남은 건 테스터 확보와 병행 준비뿐입니다.
구체적인 입력값·순서는 `docs/release/play-console-checklist.md`(치트시트)를 따라가면 됩니다.

- [ ] **테스터 12명 확보(가장 시급 — 병목)** — 현재 1명(문섭테스터)만 등록됨. 신규 개인 계정은
      최소 12명이 14일 연속 옵트인·실사용해야 프로덕션 전환 가능(설치만 하고 미사용 시 리셋 위험).
      Play Console → 테스트 및 출시 → 비공개 테스트 → 테스터 탭에서 이메일 추가 + 옵트인 링크 전달.
- [ ] **Render `starter` 플랜 실제 적용** — `render.yaml`은 `starter`로 바꿔뒀지만, Render 대시보드에서
      플랜 변경(결제 발생)하거나 Blueprint를 재동기화해야 실제로 반영됨. 14일 실사용 기간 시작 전 권장.
- [ ] **Apple Developer Program 개인 등록 신청** — 아직 안 했다면 지금 신청(승인까지 1~4주). iOS는 Android 출시 이후 단계.
- [ ] **`eas login` 후 첫 iOS 빌드 테스트** — Mac 없이 클라우드 빌드. Apple 계정 승인 전에도 `preview` 프로필로 시뮬레이터 빌드는 가능.

### 완료됨 (재작업 불필요)
- ✅ 루트 `.env` `SERVER_BASE_URL=https://monkey-backend-htu8.onrender.com` 반영 + 릴리스 번들에 인라인됨
- ✅ 업로드 키스토어 생성(`android/app/upload-keystore.jks`, gitignore) + 서명된 AAB 빌드
- ✅ GitHub Pages 방침 URL 라이브: `https://ms-won.github.io/Monkey/`
- ✅ 그래픽 자산(아이콘 512 / 피처 1024×500 / 스크린샷 6장) `docs/release/store-assets/`
- ✅ Play Console 앱 생성(2026-07-17) 및 패키지명 `com.mswon.monkey` 확정
- ✅ **[2026-08-24] 비공개 테스트(Alpha) 버전 1 Google 검토 제출 완료** — 승인 대기 중
- ✅ **[2026-08-24] iOS Bundle ID를 Android와 통일** (`com.mswon.monkey`, `ios/monkey.xcodeproj/project.pbxproj`)
- ✅ **[2026-08-24] `eas.json`에 `SERVER_BASE_URL` env + Android `buildType`(preview: apk, production: app-bundle) 추가**

---

## 지금까지 완료된 것

### 백엔드 (배포 완료, 검증됨)
- Render Free 플랜에 배포 완료: **https://monkey-backend-htu8.onrender.com**
- `/health` → `{"ok":true}` 확인됨
- `/interpret` 실제 GPT 호출까지 end-to-end 검증 완료 (예: "산에서 큰 호랑이를 만났다" 입력 → 정상 해몽 텍스트 반환, 비용 약 $0.0007)
- `render.yaml` 추가(Blueprint 배포용, Docker/`backend/Dockerfile` 기준, health check `/health`, region `singapore`). `plan: starter`로 갱신함(파일 기준) — **대시보드/Blueprint 재동기화로 실제 적용 필요**.
- 해몽 모델 `gpt-4o-mini`(2026-07-12 개선), 전통 해몽 사전 RAG 그라운딩 유지.
- `backend/Dockerfile`의 gunicorn 설정(`--workers 1`, `--preload` 미사용) + `keyword_server.py`의 module-level `Okt()` 초기화 조합을 검토한 결과, JVM/JPype fork-safety 문제 없이 안전하게 구성되어 있음 확인(수정 불필요).

### Android
- `applicationId = com.mswon.monkey` — **Play Console 앱 생성 시 확정된 영구 패키지명**(초기 `com.xellos0304.monkey`에서 변경, 2026-07-17). 스토어에 한 번 올라가면 변경 불가.
- 릴리스 서명 설정(`android/keystore.properties` 있으면 릴리스 키, 없으면 debug 폴백) — 구성 완료.
- 업로드 키스토어 `android/app/upload-keystore.jks` 생성 완료(alias `upload`, gitignore). **분실 시 앱 업데이트 영구 불가 — 별도 백업 필수.**
- 서명된 릴리스 AAB 빌드 완료: `android/app/build/outputs/bundle/release/app-release.aab` (versionCode 1 / versionName 1.0, 패키지명 `com.mswon.monkey` 검증됨).
- `targetSdkVersion 35` — 2026-08-31부터 신규/업데이트 앱은 API 36 의무화(연장 시 11/1까지). 제출 시점이 이 날짜에 가까워지면 업그레이드 필요.

### iOS
- Bundle Identifier: **`com.mswon.monkey`** — Android와 통일 완료(2026-08-24, `ios/monkey.xcodeproj/project.pbxproj`). 최초 RN CLI 기본값(`org.reactjs.native.example.monkey`) → 임시로 `com.xellos0304.monkey` → Android 쪽이 Play Console 앱 생성 시 `com.mswon.monkey`로 확정되면서 통일. 아직 Apple 앱 레코드를 만들기 전이라 지금이 변경 가능한 마지막 시점이었음(등록 후엔 변경 불가).
- `ios/monkey/Info.plist`: 사용하지 않는 빈 `NSLocationWhenInUseUsageDescription` 제거, `@react-native-voice/voice`에 필요한 `NSMicrophoneUsageDescription` / `NSSpeechRecognitionUsageDescription` 추가.
- `ios/monkey/PrivacyInfo.xcprivacy`: AsyncStorage 등 Required Reason API 사유(`CA92.1` 등)가 이미 올바르게 선언되어 있음을 확인(수정 불필요).
- `eas.json` 신규 생성 — development/preview/production 빌드 프로필. iOS 빌드 이미지는 명시적으로 고정하지 않음(현재 EAS 기본 이미지가 이미 Xcode 26.4라 별도 고정 불필요, 필요시 `docs.expo.dev/build-reference/infrastructure/`에서 최신 이미지명 확인).
- Apple Developer Program 계정 및 EAS 로그인은 아직 안 되어 있음.

### 문서/정책
- `docs/legal/privacy-policy.md`: OpenAI가 표준 API 정책상 최대 30일간 데이터를 보관할 수 있다는 내용 추가(한/영 모두). Play Data Safety / App Privacy 신고 시 "수집됨/제3자 공유" 근거로 사용.
- GitHub Pages 활성화 완료 → 공개 방침 URL **https://ms-won.github.io/Monkey/** (Play Console·App Store Connect에 등록할 주소).
- 스토어 그래픽 자산 제작 완료: `docs/release/store-assets/`(아이콘 512, 피처 1024×500, 스크린샷 6장) + 생성 스크립트.

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

> 실제 입력값(앱 이름·설명 문구·데이터 안전 답변표)은 `docs/release/play-console-checklist.md`에 복붙 가능한 형태로 정리돼 있음.

1. ✅ Play Console 계정 인증 완료.
2. ✅ 앱 만들기 완료(2026-07-17) — `Monkey (夢Key; 꿈의 키워드) - 해몽, 운명`, 패키지 `com.mswon.monkey`.
3. 스토어 등록정보: `docs/release/store-listing.md`의 제목/짧은설명/자세한설명 붙여넣기. 아이콘 512×512, 피처그래픽 1024×500, 스크린샷 업로드(그래픽 자산 준비 필요).
4. 앱 콘텐츠: 개인정보처리방침 URL(GitHub Pages), **데이터 안전(Data Safety)** 양식 — 꿈 텍스트(사용자 생성 콘텐츠)를 OpenAI로 전송 → "수집됨" + "제3자와 공유됨"으로 신고, 마이크/음성 데이터도 별도 신고. 콘텐츠 등급 설문, 타깃 연령, 광고 없음 체크.
5. 테스트 → **비공개 테스트(Closed testing)** 트랙 생성 → `app-release.aab` 업로드 → 테스터 이메일 목록 등록.
6. **신규 개인 계정은 최소 12명 테스터가 14일 연속 옵트인·실사용해야** 프로덕션 전환 가능 (설치만 하고 미사용 시 "참여 부족"으로 재시작될 수 있음 — 실제로 반복 사용할 테스터 확보 필요).
7. 비공개 테스트 통과 후 프로덕션 전환 신청 → Google 검토(보통 7일 이내) → 단계적 출시(staged rollout) 권장.

## iOS 릴리스 (EAS Build, Mac 불필요)

1. Apple Developer Program 개인 등록 완료 대기.
2. `npx eas-cli login` → Expo 계정 로그인(없으면 생성).
3. `npx eas-cli build --platform ios --profile preview` — Apple 계정 승인 전에도 시뮬레이터/애드혹 빌드로 네이티브 모듈(voice, sqlite-storage) 호환성 먼저 확인 가능.
4. Apple 계정 승인 후: App Store Connect에서 Bundle ID(`com.mswon.monkey`, Android와 통일됨) 등록 및 앱 레코드 생성. 서명 인증서/프로비저닝 프로파일은 `eas credentials`로 자동 관리 가능.
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
