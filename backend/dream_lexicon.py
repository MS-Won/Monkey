# backend/dream_lexicon.py
# ------------------------------------------------------------
# 전통 해몽 상징 사전 로드 + 매칭 (경량 RAG)
# - dream_dictionary.json을 1회 로드해 메모리에 캐시
# - 꿈 문장에서 Okt 명사/동사(원형)를 뽑아 표제어·동의어와 매칭
# - 매칭된 사전 엔트리를 /interpret 프롬프트에 '근거'로 주입할 수 있게 반환
#
# 외부 의존성 추가 없음(표준 라이브러리만). Okt는 keyword_server에서 이미 로드된
# 인스턴스를 인자로 받아 재사용한다(중복 JVM 로딩 방지).
# ------------------------------------------------------------

import json
import os
from typing import List, Dict, Callable

_DICT_PATH = os.path.join(os.path.dirname(__file__), "dream_dictionary.json")

# 서버 기동 시 1회 로드해 캐시
_ENTRIES: List[Dict] = []


def _load() -> None:
    global _ENTRIES
    try:
        with open(_DICT_PATH, encoding="utf-8") as f:
            data = json.load(f)
        _ENTRIES = data.get("symbols", []) or []
    except Exception as e:
        # 사전 로드 실패 시에도 서버는 계속 동작해야 함(근거 없이 GPT 폴백)
        print(f"[dream_lexicon] 사전 로드 실패: {e}")
        _ENTRIES = []


_load()


def _entry_keys(entry: Dict) -> List[str]:
    """
    표제어 + 동의어를 매칭 키 목록으로.
    '매칭제외'에 든 키는 제외한다(동음이의어 오매칭 방지, 예: 눈(目) vs 눈(雪)).
    """
    exclude = set(entry.get("매칭제외") or [])
    keys = [entry.get("표제어", "")]
    keys.extend(entry.get("동의어") or [])
    return [
        k for k in ((k or "").strip() for k in keys)
        if k and k not in exclude
    ]


def match_symbols(
    text: str,
    okt,
    normalize_fn: Callable[[str], str],
) -> List[Dict]:
    """
    꿈 문장에서 전통 해몽 상징을 찾아 매칭된 사전 엔트리 리스트를 반환.

    매칭 규칙(둘 중 하나면 매칭):
    1) Okt로 뽑은 명사/동사(원형) 토큰과 키가 정확히 일치
       - '죽었다' -> stem '죽다', '구렁이' -> 명사 '구렁이' 등
    2) 공백 제거한 문장 안에 키(2자 이상)가 부분 문자열로 존재
       - '하늘로올라감' 같은 복합 동의어를 잡기 위함

    반환 순서는 사전 정의 순서를 따르며 엔트리 중복은 제거된다.
    """
    norm = normalize_fn(text or "")
    if not norm:
        return []

    nospace = norm.replace(" ", "")

    # 명사 + 동사(원형) 토큰 집합
    tokens = set()
    try:
        for surface, pos in okt.pos(norm, norm=True, stem=True):
            if pos in ("Noun", "Verb"):
                tokens.add(surface)
    except Exception:
        # 형태소 분석 실패 시 부분 문자열 매칭만으로 진행
        pass

    matched: List[Dict] = []
    for entry in _ENTRIES:
        for key in _entry_keys(entry):
            if key in tokens or (len(key) >= 2 and key in nospace):
                matched.append(entry)
                break  # 이 엔트리는 이미 매칭됨 → 다음 엔트리로

    return matched


def build_grounding_block(entries: List[Dict]) -> str:
    """
    매칭된 엔트리들을 /interpret 프롬프트에 넣을 근거 텍스트로 변환.
    예) '- 뱀: 태몽이자 재물의 상징... (길흉: 길) [위협적으로 느껴져...]'
    """
    if not entries:
        return ""

    lines = []
    for e in entries:
        head = e.get("표제어", "")
        mean = e.get("의미", "")
        pol = e.get("극성", "")
        note = (e.get("비고") or "").strip()

        line = f"- {head}: {mean} (길흉: {pol})"
        if note:
            line += f" [주의: {note}]"
        lines.append(line)

    return "\n".join(lines)


def matched_headwords(entries: List[Dict]) -> List[str]:
    """디버그/응답용 표제어 배열."""
    return [e.get("표제어", "") for e in entries]
