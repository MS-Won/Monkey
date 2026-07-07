# Monkey

한국 전통 해몽(꿈 해석) 일기 앱. 타로/점술/상담 앱이 아니며, 예측이나 과장된 주장을 하지 않습니다.

흐름: 꿈 입력 → 문장 분리 → 해몽 → 종합 요약 → 저장/통계

## 구조

- Splash → OnboardingProfile(최초 1회) → Main(Home / Diary / Stats / Profile)
- Home → Input → Result (해몽 흐름)

## 아키텍처

- React Native 0.79.2 + TypeScript, Android 우선(iOS는 추후)
- 로컬 저장: `react-native-sqlite-storage`(`dreams.db` — `cache`, `dream_diary` 테이블), 프로필은 `@react-native-async-storage/async-storage`
- 백엔드: `backend/keyword_server.py` (Flask, 포트 5001) — KoNLPy Okt로 문장 분리 여부 판단, OpenAI GPT로 해몽/임베딩/요약 생성. OpenAI API 키는 백엔드에만 존재하며 프론트엔드에는 노출되지 않음.

## 개발 환경 실행

### 프론트엔드

```sh
npm install
npm start          # Metro
npm run android    # 에뮬레이터/기기에서 실행
```

`.env.example`을 참고해 `.env`에 `SERVER_BASE_URL`(백엔드 서버 주소, 예: `http://10.0.2.2:5001`)을 설정하세요.

### 백엔드

```sh
cd backend
pip install -r requirements.txt   # 없다면 flask, python-dotenv, requests, konlpy 설치
python keyword_server.py
```

`backend/.env`에 `OPENAI_API_KEY`를 설정해야 `/embed`, `/interpret`, `/summary`가 동작합니다. 기본적으로 `debug=False`로 실행되며, 필요할 때만 `FLASK_DEBUG=1` 환경변수로 디버그 모드를 켤 수 있습니다.

## 화면 구성

- **Home**: 꿈 텍스트/음성 입력
- **Diary**: 저장된 꿈 기록 목록/상세, 삭제 가능
- **Stats**: 최근 기록 수, 인기 키워드, 주/월간 그래프, 재미용 "로또력" 지표
- **Profile**: 이름/성별/나이대/직업(선택) — 해몽 조언 표현을 조정하는 참고용 정보
