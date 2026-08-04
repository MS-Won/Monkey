"""
/reading 응답 검증·정규화.

GPT 호출과 분리된 순수 함수만 둔다. 네트워크를 타지 않으므로 단위 테스트가
빠르고 무료다. 모델이 이상하게 굴어도 앱이 깨지지 않게 하는 것이 목적이다.
"""

CATEGORY_KEYS = ("luck", "caution", "relationship", "wealth", "work", "health")

# 프롬프트로는 2~4개를 지시하지만, 검증에서 받아들이는 범위는 0~4개다.
# 근거가 거의 없는 짧은 꿈에서 모델이 적게 내는 것은 옳은 동작이다.
MAX_CATEGORIES = 4


class ReadingValidationError(ValueError):
    """해몽 본문(summary)이 없어 화면을 그릴 수 없는 경우."""


def normalize_reading(raw: dict) -> dict:
    """
    모델이 준 dict를 앱이 신뢰할 수 있는 형태로 정규화한다.

    - summary 가 비면 ReadingValidationError
    - oneLine 이 없으면 빈 문자열
    - categories 는 알 수 없는 key / 빈 body / 중복 key 를 걸러내고
      최대 MAX_CATEGORIES 개까지만 남긴다
    """
    if not isinstance(raw, dict):
        raise ReadingValidationError("응답이 객체가 아닙니다")

    summary = str(raw.get("summary") or "").strip()
    if not summary:
        raise ReadingValidationError("summary 가 비어 있습니다")

    one_line = str(raw.get("oneLine") or "").strip()

    categories = []
    seen = set()
    for item in raw.get("categories") or []:
        if not isinstance(item, dict):
            continue
        key = str(item.get("key") or "").strip()
        body = str(item.get("body") or "").strip()
        if key not in CATEGORY_KEYS or not body or key in seen:
            continue
        seen.add(key)
        categories.append({"key": key, "body": body})
        if len(categories) >= MAX_CATEGORIES:
            break

    return {"summary": summary, "oneLine": one_line, "categories": categories}


def merge_reading_parts(summary_part, categories_part) -> dict:
    """
    /reading을 두 번의 OpenAI 호출로 나눠 받은 결과를 합쳐 정규화한다.

    - summary_part    : {"summary": ..., "oneLine": ...}
    - categories_part : {"categories": [...]} — None이면 카테고리 없이 진행한다.

    종합 해몽이 없으면 화면을 그릴 수 없으므로 ReadingValidationError를 낸다.
    반대로 카테고리만 실패한 경우는 종합 해몽만이라도 보여주는 편이 낫다
    (호출을 쪼갠 뒤로는 '전부 아니면 전무'일 이유가 없다).
    """
    merged = dict(summary_part) if isinstance(summary_part, dict) else {}

    # 종합 해몽 호출이 지시를 어기고 categories를 끼워 넣어도 무시한다.
    # 카테고리의 출처는 언제나 카테고리 호출이어야 한다.
    merged.pop("categories", None)

    if isinstance(categories_part, dict):
        merged["categories"] = categories_part.get("categories") or []

    return normalize_reading(merged)
