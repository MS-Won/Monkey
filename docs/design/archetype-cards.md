# 아키타입 카드 30종 (설계 스펙)

> 구현 단일 소스: [`frontend/src/data/archetypeCards.ts`](../../frontend/src/data/archetypeCards.ts)
> 원본 참고: `C:\Users\User\Downloads\Card.txt`

## 카드 규격 (디자인 요청 반영)
- **상단**: Symbol 이름(영문, 타로풍 대문자 표기) + 한국어 부제(nameKo)
- **하단**: 의미(한국어, `meaning`)
- 30장은 타로를 레퍼런스로 하되 Monkey 고유 아키타입. 홀로그래픽 카드 프레임 공유.

## 선정 로직 (Dev #2: 심볼↔해몽 연관)
`selectArchetypeCard(dreamText, interpretation)`가 각 카드 `keywords` 히트 수로 스코어링해
가장 연관 깊은 카드 1장을 고른다. 동점이면 id 우선, 무매칭이면 `Moon(달)` 폴백.
해몽 프롬프트에도 선정된 카드의 `essence`/`meaning`을 전달해 **해몽 문장이 카드와 호응**하게 한다.

## 목록
| id | Symbol | 한글 | 의미(하단) | polarity |
|----|--------|------|-----------|----------|
| 1 | Dawn | 새벽 | 새로운 시작·기회·출발 | light |
| 2 | Cocoon | 고치 | 변화·전환·성장통 | neutral |
| 3 | Great Tree | 큰 나무 | 성장·성숙·발전 | light |
| 4 | Crossroads | 갈림길 | 선택·결정·방향 | neutral |
| 5 | Summit | 정상 | 도전·시련·인내 | neutral |
| 6 | Compass | 나침반 | 목표·여정·방향성 | light |
| 7 | Crown | 왕관 | 성취·성공·인정 | light |
| 8 | Gold | 황금 | 풍요·번영·재물운 | light |
| 9 | Bridge | 다리 | 인연·연결·소통 | light |
| 10 | Rose | 장미 | 사랑·애정·정 | light |
| 11 | Anchor | 닻 | 신뢰·안정·믿음 | light |
| 12 | Storm | 폭풍 | 갈등·긴장·대립 | shadow |
| 13 | Empty Chair | 빈 의자 | 상실·부재·그리움 | shadow |
| 14 | Spring | 샘 | 치유·회복·재생 | light |
| 15 | Shield | 방패 | 보호·안전·수호 | light |
| 16 | Wings | 날개 | 자유·독립·해방 | light |
| 17 | Chain | 사슬 | 속박·제약·굴레 | shadow |
| 18 | Abyss | 심연 | 두려움·불안·혼란 | shadow |
| 19 | Shadow | 그림자 | 무의식·숨은 자아·내면 | shadow |
| 20 | Seal | 봉인 | 비밀·감춰진 진실 | neutral |
| 21 | Moon | 달 | 직관·본능·내면의 안내 | neutral |
| 22 | Mirror | 거울 | 기억·회상·과거 | neutral |
| 23 | Thread | 실 | 인연의 실·운명 | neutral |
| 24 | Scales | 저울 | 균형·조화·공정 | neutral |
| 25 | Labyrinth | 미궁 | 혼돈·미로·불확실 | shadow |
| 26 | Tower | 탑 | 질서·체계·안정 | neutral |
| 27 | Star | 별 | 희망·낙관·가능성 | light |
| 28 | Torch | 횃불 | 각성·깨달음·통찰 | light |
| 29 | Wheel | 수레바퀴 | 순환·반복·흐름 | neutral |
| 30 | Gate | 관문 | 초월·새로운 차원 | light |

`keywords`/`essence`는 코드 파일에 정의. 문구 수정 시 코드 파일을 소스로 삼고 이 표를 갱신.
