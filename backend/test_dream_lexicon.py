"""
dream_lexicon 매칭 테스트.

match_symbols는 Okt(JVM)를 쓰므로 이 파일은 test_reading_schema보다 느리다.
그래도 오매칭은 해몽 근거를 통째로 오염시키므로 실제 형태소 분석기로 검증할
값어치가 있다.
"""

import unittest

from konlpy.tag import Okt

import dream_lexicon
from keyword_server import normalize_sentence


okt = Okt()


def headwords(text: str):
    matched = dream_lexicon.match_symbols(text, okt, normalize_sentence)
    return dream_lexicon.matched_headwords(matched)


class VerbFalsePositiveTest(unittest.TestCase):
    """Okt가 동사 활용형을 명사로 잘못 태깅하는 경우."""

    def test_jwiyeo_is_not_a_rat(self):
        # '쥐여 주셨다'는 동사 쥐다. 쥐(rat)가 근거로 잡히면 안 된다.
        self.assertNotIn("쥐", headwords("할머니가 내 손에 금가락지를 쥐여 주셨다"))

    def test_jwigo_is_not_a_rat(self):
        self.assertNotIn("쥐", headwords("손에 꼭 쥐고 있었다"))

    def test_real_rat_still_matches(self):
        self.assertIn("쥐", headwords("쥐가 방 안으로 들어왔다"))

    def test_rat_and_verb_together_keeps_rat(self):
        # 한 꿈에 진짜 쥐와 '쥐여 주다'가 같이 나오면 쥐는 남아야 한다.
        self.assertIn("쥐", headwords("쥐를 보았고, 할머니가 반지를 쥐여 주셨다"))


class NormalMatchingTest(unittest.TestCase):
    """오매칭 방지가 정상 매칭을 망가뜨리지 않는지."""

    def test_snake_matches(self):
        self.assertIn("뱀", headwords("큰 구렁이가 집 마당으로 들어왔다"))

    def test_multiple_symbols(self):
        out = headwords("맑은 물이 흘러넘치고 금가락지를 받았다")
        self.assertIn("물", out)
        self.assertIn("금", out)

    def test_no_symbol_returns_empty(self):
        self.assertEqual(headwords("그냥 걷다가 끝났다"), [])

    def test_empty_text(self):
        self.assertEqual(headwords(""), [])


if __name__ == "__main__":
    unittest.main()
