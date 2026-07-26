import unittest

from reading_schema import (
    MAX_CATEGORIES,
    ReadingValidationError,
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


if __name__ == "__main__":
    unittest.main()
