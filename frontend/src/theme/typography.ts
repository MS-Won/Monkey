// frontend/src/theme/typography.ts
import { Colors } from './colors';

export const Typography = {
  // ✅ Splash / App Title 용
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    color: Colors.textPrimary,
  },

  h2: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  muted: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  monoSmall: {
    fontSize: 12,
    color: Colors.textMuted,
  },
};
