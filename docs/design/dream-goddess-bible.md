# Dream Goddess Tarot — Design Bible (30 Cards)

> 이 문서는 30종 아키타입 카드의 **일러스트 제작 스펙(단일 소스)**입니다.
> 카드 데이터(id/name/nameKo/meaning/essence/keywords/polarity)의 단일 소스는
> `frontend/src/data/archetypeCards.ts`이며, 이 바이블은 그것을 시각화하기 위한 아트 스펙입니다.
> 이미지 생성 스크립트 `scripts/gen-card-art.py`가 아래 **Global Style Guide + 카드별 스펙**을
> 조합해 프롬프트를 만듭니다.

---

## Global Style Guide (모든 카드 공통)

**Art direction**: Art Nouveau (Alphonse Mucha 계열)의 유려한 곡선·식물 오르나멘트 + 이리데슨트(오팔·홀로그래픽) 광택. 신비로운 "꿈의 여신(dream goddess)" 한 명이 각 카드의 아키타입을 의인화한다. 앱의 정체성인 **다크·꿈=밤** 톤을 유지 — 딥 인디고~바이올렛 나이트 캔버스 위에서 여신과 상징이 은은히 발광한다.

**공통 프롬프트 프리앰블**(영문, 전 카드 앞에 붙임):
```
Art Nouveau tarot card illustration in the style of Alphonse Mucha, a single ethereal dream goddess,
flowing organic linework, ornamental gold filigree border with floral motifs, decorative halo arch behind her head,
iridescent holographic sheen (opal, mother-of-pearl), deep indigo and violet night palette,
soft luminous glow, elegant flowing robes, celestial and dreamlike atmosphere,
highly detailed, symmetrical ornamental composition, portrait orientation, vertical tarot card format,
no text, no lettering, no words, no frame borders cut off
```

**공통 네거티브(지원 provider에 한함)**: `text, watermark, signature, letters, words, ugly, deformed hands, extra limbs, low quality, photorealistic, modern clothing`

**기술 파라미터**:
- 종횡비: **portrait 2:3** (예: 832×1248 또는 896×1344). 카드 프레임이 하단 텍스트 오버레이를 얹으므로 **인물/핵심 상징은 상단~중앙에** 배치되도록 유도.
- 파일: `frontend/assets/images/cards/01.png … 30.png` (id 2자리 zero-pad).
- 일관성: 동일 프리앰블 + 고정 seed 스킴. (Gemini 사용 시 카드 1을 style reference로 체이닝하여 덱 통일감 강화.)

**Polarity → 톤 매핑**:
- `light`(상서로움): 밝은 골드·화이트 발광, 상승/개방 포즈, 꽃·빛·새벽빛. 여신 표정 온화·평온.
- `neutral`(중립): 균형 잡힌 실루엣, 은빛·바이올렛, 사색적 표정, 정적인 우아함.
- `shadow`(경계): 짙은 인디고·먹빛 보라, 베일·그림자·가시, 내향적/고요한 긴장. 공포가 아닌 **묵직한 아름다움**(단정적 공포 연출 금지 — CLAUDE.md 원칙).

**카드 구성 규칙**: 여신(Goddess Pose) + Main Symbol을 중심축에, Secondary Symbols를 오르나멘트/배경에 분산. 무하식 원형 헤일로 아치를 머리 뒤에 배치. 하단 1/4은 텍스트 오버레이 공간이므로 시각적으로 비교적 단순하게.

---

## Cards

각 카드: **Element · Season · Emotional Tone**, Main / Secondary Symbols, Color Palette, Goddess Pose, Visual Story, 이름(의미).

### No.01 — Dawn (새벽) · light
- **Element**: Fire · **Season**: 이른 봄 · **Tone**: 희망에 찬 각성, 설렘
- **Main Symbol**: 지평선 위로 떠오르는 태양 원반
- **Secondary**: 첫 새벽빛 광선, 이슬 맺힌 백합, 깨어나는 새
- **Palette**: 딥 인디고 바탕에 로즈골드·앰버 선라이즈, 크림빛 하이라이트
- **Goddess Pose**: 두 팔을 위로 벌려 떠오르는 해를 맞이하는 개방적 자세
- **Visual Story**: 어둠이 걷히는 문턱에서 여신이 첫 빛을 온몸으로 받아들인다. 새 출발의 상서로운 예감.
- **의미**: 새로운 시작 · 기회 — 어둠이 걷히고 첫 빛이 트는 문턱.

### No.02 — Cocoon (고치) · neutral
- **Element**: Earth · **Season**: 늦겨울 → 봄 · **Tone**: 인내 어린 기대, 고요한 준비
- **Main Symbol**: 빛나는 실크 고치
- **Secondary**: 반쯤 열린 나비 날개, 감긴 덩굴, 은빛 실
- **Palette**: 뮤트된 바이올렛·펄 화이트, 부드러운 실버 글로우
- **Goddess Pose**: 몸을 감싸 안듯 웅크린, 껍질 속에서 깨어나려는 자세
- **Visual Story**: 아직 감춰져 있으나 날개가 될 시간을 품은 여신. 변화의 임계.
- **의미**: 변화 · 전환 · 성장통 — 곧 날개가 될 기다림의 시간.

### No.03 — Great Tree (큰 나무) · light
- **Element**: Earth · **Season**: 한여름 · **Tone**: 든든함, 풍성한 생명력
- **Main Symbol**: 뿌리 깊고 가지 무성한 거목
- **Secondary**: 매달린 열매, 뿌리 사이의 빛, 나뭇잎 오르나멘트
- **Palette**: 에메랄드·딥 그린 위 골드 수액 발광, 인디고 배경
- **Goddess Pose**: 나무와 하나 되어 팔이 가지처럼 뻗은 대지모 자세
- **Visual Story**: 깊은 뿌리로 자라 그늘을 드리우는 성숙의 힘.
- **의미**: 성장 · 성숙 · 발전 — 뿌리 깊게 자라 그늘을 드리우는 힘.

### No.04 — Crossroads (갈림길) · neutral
- **Element**: Air · **Season**: 가을 · **Tone**: 사색적 긴장, 결단의 무게
- **Main Symbol**: 두 갈래로 갈라지는 길
- **Secondary**: 이정표, 흩날리는 낙엽, 두 갈래 덩굴
- **Palette**: 트와일라잇 바이올렛·앰버, 실버 라인
- **Goddess Pose**: 두 길 사이 교차점에 서서 한쪽으로 시선을 둔 자세
- **Visual Story**: 두 길이 갈라지는 자리에 선 순간, 방향을 저울질하는 마음.
- **의미**: 선택 · 결정 · 방향 — 두 길이 갈라지는 자리에 선 순간.

### No.05 — Summit (정상) · neutral
- **Element**: Earth · **Season**: 겨울 · **Tone**: 견딤, 결연함
- **Main Symbol**: 눈 덮인 산 봉우리
- **Secondary**: 오르는 길, 정상의 깃발/별, 바람에 날리는 옷자락
- **Palette**: 아이시 블루·화이트, 딥 인디고 하늘
- **Goddess Pose**: 봉우리 끝에 한 발을 딛고 바람을 견디며 서 있는 자세
- **Visual Story**: 오르막의 끝, 견딤이 만든 봉우리 위의 여신.
- **의미**: 도전 · 시련 · 인내 — 견딤이 만드는 봉우리.

### No.06 — Compass (나침반) · light
- **Element**: Air · **Season**: 가을 · **Tone**: 확신, 방향감
- **Main Symbol**: 빛나는 황금 나침반
- **Secondary**: 별자리 지도, 북극성, 항로 곡선
- **Palette**: 골드·틸, 나이트 인디고
- **Goddess Pose**: 나침반을 손에 받쳐 들고 북쪽을 응시하는 자세
- **Visual Story**: 흔들려도 북쪽을 가리키는 마음의 이정표.
- **의미**: 목표 · 여정 · 방향성 — 흔들려도 북쪽을 가리키는 마음.

### No.07 — Crown (왕관) · light
- **Element**: Fire · **Season**: 한여름 · **Tone**: 영광, 자긍
- **Main Symbol**: 발광하는 황금 왕관
- **Secondary**: 월계수 잎, 빛기둥, 승리의 별
- **Palette**: 로열 골드·크림슨 악센트, 딥 퍼플
- **Goddess Pose**: 고개를 살짝 든 채 왕관을 쓴 위엄 있는 정면 자세
- **Visual Story**: 오래 견딘 자의 머리에 얹히는 영광.
- **의미**: 성취 · 성공 · 인정 — 견딘 자에게 얹히는 영광.

### No.08 — Gold (황금) · light
- **Element**: Earth · **Season**: 가을(수확) · **Tone**: 풍요, 따뜻한 만족
- **Main Symbol**: 흘러넘치는 황금 동전/보물
- **Secondary**: 벼 이삭, 황금 돼지, 보석
- **Palette**: 리치 골드·앰버, 딥 마룬 그림자
- **Goddess Pose**: 두 손 가득 황금을 받쳐 든 풍요의 자세
- **Visual Story**: 손에 쥐면 온기가 도는 값진 결실.
- **의미**: 풍요 · 번영 · 재물운 — 온기가 도는 값진 결실.

### No.09 — Bridge (다리) · light
- **Element**: Air · **Season**: 봄 · **Tone**: 이어짐, 화해
- **Main Symbol**: 안개 위로 놓인 아치형 다리
- **Secondary**: 맞잡은 두 손, 잇는 빛줄기, 흐르는 강
- **Palette**: 소프트 틸·라벤더, 골드 아치
- **Goddess Pose**: 다리 한가운데서 양쪽으로 손을 내미는 자세
- **Visual Story**: 끊긴 두 곳을 잇는 마음의 통로.
- **의미**: 인연 · 연결 · 소통 — 두 곳을 잇는 마음의 통로.

### No.10 — Rose (장미) · light
- **Element**: Water · **Season**: 초여름 · **Tone**: 애틋함, 설렘
- **Main Symbol**: 만개한 붉은 장미
- **Secondary**: 얽힌 가시 덩굴, 떨어지는 꽃잎, 하트형 오르나멘트
- **Palette**: 크림슨·로즈핑크, 딥 바이올렛 배경, 골드 라인
- **Goddess Pose**: 장미를 가슴에 안고 눈을 지그시 감은 자세
- **Visual Story**: 가시 속에서도 피어나는 붉은 마음.
- **의미**: 사랑 · 애정 · 정 — 가시 속에서도 피어나는 붉은 마음.

### No.11 — Anchor (닻) · light
- **Element**: Water · **Season**: 겨울 · **Tone**: 든든함, 신뢰
- **Main Symbol**: 바다 밑에 내린 황금 닻
- **Secondary**: 감긴 밧줄, 잔잔한 파도, 항구의 불빛
- **Palette**: 딥 틸·네이비, 골드 닻, 펄 하이라이트
- **Goddess Pose**: 닻줄을 붙잡고 굳건히 선 안정된 자세
- **Visual Story**: 풍랑 속에서도 흔들리지 않는 무게.
- **의미**: 신뢰 · 안정 · 믿음 — 흔들리지 않는 무게.

### No.12 — Storm (폭풍) · shadow
- **Element**: Air · **Season**: 여름(장마) · **Tone**: 격정, 대립의 긴장
- **Main Symbol**: 번개 치는 먹구름
- **Secondary**: 휘몰아치는 바람, 부러진 나뭇가지, 빗줄기
- **Palette**: 스톰 그레이·일렉트릭 바이올렛, 번개의 시안 섬광
- **Goddess Pose**: 바람에 옷자락과 머리칼이 휘날리며 맞서는 자세
- **Visual Story**: 한바탕 몰아쳐야 개는 하늘.
- **의미**: 갈등 · 긴장 · 대립 — 몰아쳐야 개는 하늘.

### No.13 — Empty Chair (빈 의자) · shadow
- **Element**: Ether · **Season**: 늦가을 · **Tone**: 그리움, 잔잔한 상실
- **Main Symbol**: 홀로 놓인 빈 의자
- **Secondary**: 스러지는 촛불, 남겨진 숄, 떨어진 꽃 한 송이
- **Palette**: 더스키 바이올렛·콜드 그레이, 희미한 골드
- **Goddess Pose**: 빈 의자 곁에 서서 손끝을 얹고 고개 숙인 자세
- **Visual Story**: 누군가 앉았던 자리에 남은 온기.
- **의미**: 상실 · 부재 · 그리움 — 자리에 남은 온기.

### No.14 — Spring (샘) · light
- **Element**: Water · **Season**: 봄 · **Tone**: 치유, 맑은 안도
- **Main Symbol**: 바위 틈에서 솟는 맑은 샘
- **Secondary**: 물결 파문, 수련, 흐르는 물빛
- **Palette**: 아쿠아·민트, 딥 인디고, 실버 워터 하이라이트
- **Goddess Pose**: 샘물에 손을 담가 떠올리는 자세
- **Visual Story**: 마른 땅을 적시는 맑은 물줄기.
- **의미**: 치유 · 회복 · 재생 — 마른 땅을 적시는 물줄기.

### No.15 — Shield (방패) · light
- **Element**: Earth · **Season**: 겨울 · **Tone**: 수호, 단단한 안심
- **Main Symbol**: 문양이 새겨진 황금 방패
- **Secondary**: 수호 룬, 감싸는 빛의 원, 조상의 문장
- **Palette**: 골드·딥 그린, 인디고 배경
- **Goddess Pose**: 방패를 앞세워 소중한 것을 가리는 보호 자세
- **Visual Story**: 나와 소중한 것을 가리는 단단함.
- **의미**: 보호 · 안전 · 수호 — 소중한 것을 가리는 단단함.

### No.16 — Wings (날개) · light
- **Element**: Air · **Season**: 봄 · **Tone**: 해방감, 가벼운 자유
- **Main Symbol**: 활짝 펼친 거대한 날개
- **Secondary**: 흩날리는 깃털, 열린 하늘, 상승 기류
- **Palette**: 스카이 라벤더·화이트, 이리데슨트 깃털, 골드
- **Goddess Pose**: 날개를 펴고 땅을 박차 오르는 상승 자세
- **Visual Story**: 땅을 박차고 오르는 가벼움.
- **의미**: 자유 · 독립 · 해방 — 땅을 박차고 오르는 가벼움.

### No.17 — Chain (사슬) · shadow
- **Element**: Earth · **Season**: 겨울 · **Tone**: 답답함, 벗어나려는 의지
- **Main Symbol**: 끊어지려는 무거운 사슬
- **Secondary**: 풀리는 매듭, 갇힌 새, 균열
- **Palette**: 아이언 그레이·딥 퍼플, 갈라진 틈의 골드 빛
- **Goddess Pose**: 사슬을 팽팽히 당겨 끊어내려는 자세
- **Visual Story**: 풀어야 할 매듭, 벗어야 할 굴레.
- **의미**: 속박 · 제약 · 굴레 — 벗어야 할 굴레.

### No.18 — Abyss (심연) · shadow
- **Element**: Water · **Season**: 깊은 겨울 · **Tone**: 불안, 아득함
- **Main Symbol**: 바닥이 보이지 않는 검은 물/심연
- **Secondary**: 소용돌이, 가라앉는 빛, 멀어지는 수면
- **Palette**: 애비스 블랙·딥 인디고, 희미한 시안 글로우
- **Goddess Pose**: 심연 가장자리에서 아래를 응시하는 긴장된 자세
- **Visual Story**: 바닥이 보이지 않는 깊은 물음.
- **의미**: 두려움 · 불안 · 혼란 — 바닥이 보이지 않는 물음.

### No.19 — Shadow (그림자) · shadow
- **Element**: Ether · **Season**: 가을 황혼 · **Tone**: 내향, 자기 대면
- **Main Symbol**: 여신과 마주 선 그녀의 그림자 형상
- **Secondary**: 거울, 갈라진 빛과 어둠, 이중 실루엣
- **Palette**: 차콜 바이올렛·먹빛, 한 줄기 골드
- **Goddess Pose**: 자신의 그림자와 손끝을 맞대는 대칭 자세
- **Visual Story**: 외면했던 나 자신과의 조우.
- **의미**: 무의식 · 숨은 자아 — 나 자신과의 조우.

### No.20 — Seal (봉인) · neutral
- **Element**: Ether · **Season**: 겨울 · **Tone**: 은밀함, 긴장된 호기심
- **Main Symbol**: 밀랍으로 봉인된 고대 문서/상자
- **Secondary**: 잠긴 자물쇠, 봉인 문양, 감춰진 열쇠
- **Palette**: 딥 버건디·골드, 인디고 그림자
- **Goddess Pose**: 봉인에 손을 얹고 열지 말지 망설이는 자세
- **Visual Story**: 아직 열리지 않은 봉인된 진실.
- **의미**: 비밀 · 감춰진 진실 — 열리지 않은 봉인.

### No.21 — Moon (달) · neutral
- **Element**: Water · **Season**: 가을밤 · **Tone**: 직관, 몽환
- **Main Symbol**: 크고 은은한 보름달(또는 초승달)
- **Secondary**: 별무리, 물에 비친 달, 나방
- **Palette**: 문라이트 실버·딥 인디고, 소프트 바이올렛
- **Goddess Pose**: 달을 등지고 두 손을 가슴에 모은 명상적 자세
- **Visual Story**: 밤을 밝히는 은근한 예감.
- **의미**: 직관 · 본능 · 안내 — 밤을 밝히는 예감.

### No.22 — Mirror (거울) · neutral
- **Element**: Water · **Season**: 가을 · **Tone**: 회상, 잔잔한 성찰
- **Main Symbol**: 오르나멘트 프레임의 거울/수면
- **Secondary**: 되비친 과거 상, 잔물결, 시든 꽃
- **Palette**: 실버·더스티 로즈, 인디고
- **Goddess Pose**: 거울 속 자신을 응시하는 옆모습 자세
- **Visual Story**: 지난 시간이 되비치는 수면.
- **의미**: 기억 · 회상 · 과거 — 되비치는 수면.

### No.23 — Thread (실) · neutral
- **Element**: Ether · **Season**: 봄 · **Tone**: 운명적 연결, 섬세함
- **Main Symbol**: 손가락 사이로 이어진 붉은 운명의 실
- **Secondary**: 물레, 얽힌 별자리 선, 매듭
- **Palette**: 크림슨 실·딥 인디고, 골드 스파클
- **Goddess Pose**: 실을 손끝으로 잣는 섬세한 자세
- **Visual Story**: 보이지 않게 이어진 사람과 사건.
- **의미**: 인연의 실 · 운명 — 보이지 않게 이어진 인연.

### No.24 — Scales (저울) · neutral
- **Element**: Air · **Season**: 추분 · **Tone**: 균형, 냉정한 공정
- **Main Symbol**: 평형을 이룬 황금 저울
- **Secondary**: 깃털과 돌, 눈을 가린 띠, 대칭 오르나멘트
- **Palette**: 골드·플래티넘, 딥 인디고
- **Goddess Pose**: 저울을 받쳐 든 채 균형을 응시하는 정중한 자세
- **Visual Story**: 한쪽으로 기울지 않는 마음의 저울.
- **의미**: 균형 · 조화 · 공정 — 기울지 않는 저울.

### No.25 — Labyrinth (미궁) · shadow
- **Element**: Earth · **Season**: 겨울 · **Tone**: 혼란, 얽힘
- **Main Symbol**: 위에서 내려다본 미로
- **Secondary**: 얽힌 실타래, 막다른 길, 흐릿한 등불
- **Palette**: 스모키 바이올렛·머스터드 골드, 딥 그레이
- **Goddess Pose**: 미로 한가운데서 길을 더듬는 헤매는 자세
- **Visual Story**: 길을 잃은 듯한 얽힌 마음.
- **의미**: 혼돈 · 미로 · 불확실 — 길을 잃은 얽힌 마음.

### No.26 — Tower (탑) · neutral
- **Element**: Earth · **Season**: 겨울 · **Tone**: 견고함, 질서
- **Main Symbol**: 한 층씩 쌓아 올린 석탑
- **Secondary**: 벽돌 결, 균형 잡힌 기둥, 기하 오르나멘트
- **Palette**: 스톤 그레이·골드, 딥 인디고
- **Goddess Pose**: 탑을 배경으로 손바닥에 작은 탑을 세운 자세
- **Visual Story**: 한 층씩 쌓아 올린 굳건함.
- **의미**: 질서 · 체계 · 안정 — 쌓아 올린 굳건함.

### No.27 — Star (별) · light
- **Element**: Ether · **Season**: 겨울밤 · **Tone**: 희망, 잔잔한 낙관
- **Main Symbol**: 크게 빛나는 한 별
- **Secondary**: 쏟아지는 별빛, 밤하늘 성좌, 물에 비친 별
- **Palette**: 셀레스철 블루·골드 스파클, 딥 인디고
- **Goddess Pose**: 별을 향해 손을 뻗어 소원을 담는 자세
- **Visual Story**: 어둠이 깊을수록 또렷한 빛.
- **의미**: 희망 · 낙관 · 가능성 — 깊은 어둠 속 또렷한 빛.

### No.28 — Torch (횃불) · light
- **Element**: Fire · **Season**: 가을 · **Tone**: 각성, 통찰
- **Main Symbol**: 어둠을 밀어내는 한 자루 횃불
- **Secondary**: 번지는 불빛, 밝혀지는 길, 불티
- **Palette**: 앰버·오렌지 플레임, 딥 인디고 어둠
- **Goddess Pose**: 횃불을 높이 들어 앞을 밝히는 자세
- **Visual Story**: 어둠을 밀어내는 한 자루의 불.
- **의미**: 각성 · 깨달음 · 통찰 — 어둠을 밀어내는 불.

### No.29 — Wheel (수레바퀴) · neutral
- **Element**: Fire · **Season**: 순환(전 계절) · **Tone**: 흐름, 순응
- **Main Symbol**: 돌아가는 거대한 수레바퀴
- **Secondary**: 사계 상징의 테두리, 회전 궤적, 별자리 링
- **Palette**: 골드·브론즈, 딥 인디고, 이리데슨트 회전 블러
- **Goddess Pose**: 바퀴 중심에서 팔을 벌린 회전의 축 자세
- **Visual Story**: 돌고 도는 삶의 리듬.
- **의미**: 순환 · 반복 · 흐름 — 돌고 도는 삶의 리듬.

### No.30 — Gate (관문) · light
- **Element**: Ether · **Season**: 동지/문턱 · **Tone**: 초월, 경외
- **Main Symbol**: 빛이 새어 나오는 아치형 관문
- **Secondary**: 열리는 문틈의 광휘, 별의 계단, 넘나드는 실루엣
- **Palette**: 라디언트 화이트골드·바이올렛, 딥 인디고
- **Goddess Pose**: 관문 앞에서 한 발 내딛으며 빛으로 나아가는 자세
- **Visual Story**: 지금 세계를 넘어서는 문턱.
- **의미**: 초월 · 새로운 차원 — 지금 세계를 넘어서는 문턱.

---

## Progress note
- 이 바이블은 요청 #2("Dream Goddess Tarot Style Guide로 30장 디자인 바이블")에 대응.
- 다음: `scripts/gen-card-art.py`가 이 스펙으로 30 PNG 생성 → `frontend/assets/images/cards/`.
- 카드 코드 데이터와의 정합성은 `archetypeCards.ts`가 단일 소스(이 문서는 아트 스펙).
