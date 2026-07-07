// frontend/src/theme/typography.ts
import { Colors } from './colors';

export const FontFamily = {
  serifRegular: 'NanumMyeongjo',
  serifBold: 'NanumMyeongjo-Bold',
  serifExtraBold: 'NanumMyeongjo-ExtraBold',
  sansRegular: 'Pretendard-Regular',
  sansMedium: 'Pretendard-Medium',
  sansSemiBold: 'Pretendard-SemiBold',
  sansBold: 'Pretendard-Bold',
};

export const Typography = {
  // 스플래시 워드마크
  display: {
    fontFamily: FontFamily.serifExtraBold,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: 0.5,
    color: Colors.textPrimary,
  },

  // 화면 타이틀 (해몽 결과 / 꿈일기 / 프로필 / 통계)
  h1: {
    fontFamily: FontFamily.serifBold,
    fontSize: 24,
    lineHeight: 32,
    color: Colors.textPrimary,
  },

  // 섹션/카드 타이틀
  h2: {
    fontFamily: FontFamily.serifBold,
    fontSize: 18,
    lineHeight: 26,
    color: Colors.textPrimary,
  },

  // 서브 헤더, 키워드 칩 라벨
  h3: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.textPrimary,
  },

  bodyLg: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  label: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  // 기존 `muted` 대체
  caption: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
  },
  // 기존 `monoSmall` 대체
  overline: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: Colors.textMuted,
  },

  // 타로 카드 상단 심볼명 (영문 대문자, 넓은 트래킹)
  cardSymbol: {
    fontFamily: FontFamily.serifExtraBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 2.5,
    color: Colors.textPrimary,
  },
  // 카드 하단 의미
  cardMeaning: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0.3,
    color: Colors.textSecondary,
  },
};
