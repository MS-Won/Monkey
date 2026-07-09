# Monkey — Google Play 클로즈드 테스트 출시 가이드

이 문서는 코드에 이미 반영된 준비 위에서, **사람이 직접 해야 하는 단계**(계정·배포·키·업로드)를 순서대로 안내합니다.
설계 근거는 `C:\Users\User\.claude\plans\lovely-launching-phoenix.md` 참고.

## 코드에서 이미 완료된 것 (이 저장소 변경분)
- 백엔드 컨테이너화: `backend/Dockerfile`, `backend/.dockerignore`, `requirements.txt`(버전 핀+gunicorn), `keyword_server.py`에 `/health` + `PORT` 환경변수.
- 앱: 개발용 서버 표시를 `__DEV__`로 숨김(`InputScreen.tsx`).
- Android: `RECORD_AUDIO` 매니페스트 선언, 앱 이름 `Monkey`, `applicationId = com.xellos0304.monkey`(영구), 릴리스 서명 설정(`keystore.properties` 있으면 릴리스 키 사용, 없으면 debug 폴백), `.gitignore` 보호.
- 문서: 개인정보처리방침(`docs/legal/privacy-policy.md`), 스토어 문구(`docs/release/store-listing.md`).

---

## 1단계 — 백엔드를 공개 서버에 배포 (가장 먼저)

호스트 예시로 **Render**(Docker) 기준. Railway/Fly.io도 동일 개념.

1. GitHub에 이 저장소를 push(백엔드 폴더 포함). `.env`는 커밋되지 않음(정상).
2. Render → New → **Web Service** → 저장소 연결 → Root Directory `backend`, Environment **Docker**.
3. 환경변수 추가: `OPENAI_API_KEY = <실제 키>`. (Render가 `PORT`는 자동 주입, Dockerfile이 사용함)
4. 인스턴스 타입: JVM(Okt) 때문에 메모리 여유 있는 유료 소형 권장(무료는 슬립→첫 응답 지연). 배포.
5. 배포 완료 후 발급된 HTTPS URL 확인. 검증:
   - `https://<앱주소>/health` → `{"ok":true}`
   - `POST https://<앱주소>/interpret` `{"text":"어젯밤 큰 돼지가 집에 들어왔다"}` → 200 + 해몽 텍스트

## 2단계 — 앱을 배포된 백엔드로 연결

1. 루트 `.env`의 `SERVER_BASE_URL` 을 1단계 HTTPS URL로 변경:
   `SERVER_BASE_URL=https://<앱주소>` (끝에 `/` 없이)
2. 이 값은 **릴리스 번들 빌드 시점에 앱에 인라인**되므로, 값을 바꾼 뒤 4단계에서 릴리스를 새로 빌드해야 반영됩니다.

## 3단계 — 업로드 키스토어 생성 (한 번만, 반드시 백업)

> 이 키를 잃어버리면 앱 업데이트를 영구히 못 올립니다. 안전한 곳에 백업하세요.

1. 키 생성(JDK의 keytool 사용). 프로젝트 루트에서:
   ```
   keytool -genkeypair -v -keystore android/app/upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
   이름/조직/비밀번호를 입력. (upload-keystore.jks 와 keystore.properties 는 .gitignore로 커밋 제외됨)
2. `android/keystore.properties.example` 을 복사해 `android/keystore.properties` 로 만들고 값 채우기:
   ```
   storeFile=upload-keystore.jks
   storePassword=<생성 시 입력한 store 비밀번호>
   keyAlias=upload
   keyPassword=<생성 시 입력한 key 비밀번호>
   ```

## 4단계 — 릴리스 AAB 빌드

1. `android` 폴더에서(경로에 공백 있으니 android 폴더에서 직접 실행):
   ```
   cd android
   .\gradlew.bat bundleRelease
   ```
   결과물: `android/app/build/outputs/bundle/release/app-release.aab`
2. (권장) 업로드 전 실기기 스모크 테스트: `.\gradlew.bat installRelease` 로 릴리스 APK 설치 후
   음성/텍스트 → 해몽 → 종합 → 카드 → 저장 → 통계 전 과정이 **배포된 HTTPS 백엔드**와 동작하는지 확인.

## 5단계 — 개인정보처리방침 공개 URL

- `docs/legal/privacy-policy.md` 를 공개 웹페이지로 게시(예: GitHub Pages, Google Sites, Notion 공개페이지).
- 발급된 URL을 Play Console에 입력(6단계).

## 6단계 — Google Play Console 클로즈드 테스트

1. Google Play 개발자 계정 등록($25, 1회) — 없으면 먼저 생성.
2. 앱 만들기 → 앱 이름 `Monkey`.
3. 스토어 등록정보: `docs/release/store-listing.md` 의 제목/짧은설명/자세한설명 붙여넣기. 아이콘 512, 피처그래픽 1024×500, 스크린샷 업로드.
4. 앱 콘텐츠: 개인정보처리방침 URL, **데이터 보안** 양식(store-listing.md 가이드 참고), 콘텐츠 등급 설문, 타깃 연령, 광고 없음.
5. 테스트 → **비공개 테스트(Closed testing)** 트랙 생성 → `app-release.aab` 업로드 → 테스터 이메일 목록(또는 구글 그룹) 등록 → 검토 후 출시.
6. 테스터는 받은 옵트인 링크로 설치. 최초 심사는 수일 걸릴 수 있음.

---

## 남은 리스크 / 후속
- **OpenAI 비용**: 해몽마다 과금. 클로즈드 테스트(소규모)는 미미하나, 정식/대규모 확대 전 레이트리밋·수익화 필요.
- **백엔드 콜드스타트**: 무료 티어는 첫 요청 시 Okt(JVM) 로딩으로 지연 가능 → 슬립 없는 인스턴스 권장.
- **음성 인식(Android 11+)**: 일부 기기에서 SpeechRecognizer 가용성 이슈 가능 → 테스터 기기에서 실제 음성 입력 확인 권장.
- **iOS**: 이번 범위 밖. 이후 EAS(클라우드 Mac) 빌드로 진행(번들ID·Info.plist 마이크/음성 사용설명·Apple 개발자 계정 필요).
