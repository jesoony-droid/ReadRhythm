export const Colors = {
  // ── Brand ─────────────────────────────────────────────────
  primary: '#5B7EFF',       // 다크 배경 대비용으로 밝게 (was #3B5BDB)
  primaryDark: '#3A5DE0',
  primaryLight: '#151E4A',  // 선택/활성 tint (was #EEF2FF)
  primaryMid: '#1E2C6E',    // 중간 tint (was #C5D0FA)

  accent: '#FF7A50',
  accentLight: '#2D1810',

  green: '#30D158',         // iOS 스타일 선명한 그린 (was #2F9E44)
  greenLight: '#0B2216',

  purple: '#9B6DFF',        // was #7048E8
  purpleLight: '#1A0D38',

  gold: '#FFD60A',          // iOS 골드 (was #F59F00)
  goldLight: '#272000',

  red: '#FF453A',           // iOS 레드 (was #E03131)
  redLight: '#2D0E0C',

  // ── Backgrounds & Surfaces ────────────────────────────────
  bg: '#0B0D17',            // 메인 배경 (깊은 다크 네이비)
  surface: '#13162A',       // 카드/패널 배경
  border: '#272E50',        // 구분선 / 테두리

  // ── Text ─────────────────────────────────────────────────
  text: '#F5F7FF',          // 기본 텍스트 (pure near-white)
  textSub: '#C2CADF',       // 보조 텍스트 (충분한 대비)
  textMuted: '#8A94B0',     // 희미한 텍스트 / 플레이스홀더

  // ── Dark (타이머 전용) ────────────────────────────────────
  dark: '#070912',          // 가장 깊은 다크 (타이머 배경)
  darkMid: '#162155',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 9999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 30,
  hero: 48,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;
