import unittest

from reading_schema import (
    MAX_CATEGORIES,
    ReadingValidationError,
    merge_reading_parts,
    normalize_reading,
)


class NormalizeReadingTest(unittest.TestCase):
    def test_valid_payload_passes_through(self):
        raw = {
            "summary": "종합 해몽 본문",
            "oneLine": "오늘의 한마디",
            "categories": [
                {"key": "work", "body": "직장운 본문"},
                {"key": "wealth", "body": "재물운 본문"},
            ],
        }
        out = normalize_reading(raw)
        self.assertEqual(out["summary"], "종합 해몽 본문")
        self.assertEqual(out["oneLine"], "오늘의 한마디")
        self.assertEqual([c["key"] for c in out["categories"]], ["work", "wealth"])

    def test_unknown_key_is_dropped(self):
        raw = {
            "summary": "s",
            "oneLine": "o",
            "categories": [
                {"key": "work", "body": "b"},
                {"key": "romance", "body": "b"},
            ],
        }
        out = normalize_reading(raw)
        self.assertEqual([c["key"] for c in out["categories"]], ["work"])

    def test_truncates_to_max(self):
        raw = {
            "summary": "s",
            "oneLine": "o",
            "categories": [
                {"key": k, "body": "b"}
                for k in ("luck", "caution", "relationship", "wealth", "work", "health")
            ],
        }
        out = normalize_reading(raw)
        self.assertEqual(len(out["categories"]), MAX_CATEGORIES)
        self.assertEqual(
            [c["key"] for c in out["categories"]],
            ["luck", "caution", "relationship", "wealth"],
        )

    def test_duplicate_key_kept_once(self):
        raw = {
            "summary": "s",
            "oneLine": "o",
            "categories": [
                {"key": "work", "body": "first"},
                {"key": "work", "body": "second"},
            ],
        }
        out = normalize_reading(raw)
        self.assertEqual(len(out["categories"]), 1)
        self.assertEqual(out["categories"][0]["body"], "first")

    def test_zero_categories_is_allowed(self):
        out = normalize_reading({"summary": "s", "oneLine": "o", "categories": []})
        self.assertEqual(out["categories"], [])

    def test_missing_categories_field_is_allowed(self):
        out = normalize_reading({"summary": "s", "oneLine": "o"})
        self.assertEqual(out["categories"], [])

    def test_empty_body_category_is_dropped(self):
        raw = {
            "summary": "s",
            "oneLine": "o",
            "categories": [{"key": "work", "body": "   "}],
        }
        out = normalize_reading(raw)
        self.assertEqual(out["categories"], [])

    def test_missing_summary_raises(self):
        with self.assertRaises(ReadingValidationError):
            normalize_reading({"oneLine": "o", "categories": []})

    def test_blank_summary_raises(self):
        with self.assertRaises(ReadingValidationError):
            normalize_reading({"summary": "   ", "categories": []})

    def test_missing_one_line_becomes_empty_string(self):
        out = normalize_reading({"summary": "s", "categories": []})
        self.assertEqual(out["oneLine"], "")


class MergeReadingPartsTest(unittest.TestCase):
    """/reading을 두 번의 병렬 호출로 나눈 뒤 결과를 합치는 부분."""

    def test_both_parts_merge(self):
        out = merge_reading_parts(
            {"summary": "종합 해몽", "oneLine": "한마디"},
            {"categories": [{"key": "work", "body": "직장운"}]},
        )
        self.assertEqual(out["summary"], "종합 해몽")
        self.assertEqual(out["oneLine"], "한마디")
        self.assertEqual([c["key"] for c in out["categories"]], ["work"])

    def test_categories_call_failed_keeps_summary(self):
        # 카테고리 호출만 실패(None)해도 종합 해몽은 살려서 보여준다.
        out = merge_reading_parts({"summary": "종합 해몽", "oneLine": "한마디"}, None)
        self.assertEqual(out["summary"], "종합 해몽")
        self.assertEqual(out["categories"], [])

    def test_summary_call_failed_raises(self):
        # 종합 해몽이 없으면 화면을 그릴 수 없으므로 실패로 다룬다.
        with self.assertRaises(ReadingValidationError):
            merge_reading_parts(None, {"categories": [{"key": "work", "body": "b"}]})

    def test_categories_from_summary_call_are_ignored(self):
        # 종합 해몽 호출이 지시를 어기고 categories를 끼워 넣어도 무시한다.
        out = merge_reading_parts(
            {"summary": "s", "categories": [{"key": "luck", "body": "끼어든 것"}]},
            {"categories": [{"key": "work", "body": "제대로 온 것"}]},
        )
        self.assertEqual([c["key"] for c in out["categories"]], ["work"])

    def test_merged_result_is_still_validated(self):
        # 합친 뒤에도 normalize_reading의 검증(알 수 없는 key 제거)이 그대로 걸린다.
        out = merge_reading_parts(
            {"summary": "s"},
            {"categories": [{"key": "없는키", "body": "b"}, {"key": "health", "body": "b"}]},
        )
        self.assertEqual([c["key"] for c in out["categories"]], ["health"])


if __name__ == "__main__":
    unittest.main()
