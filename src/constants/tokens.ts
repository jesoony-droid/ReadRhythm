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
  border: '#1D2240',        // 구분선 / 테두리

  // ── Text ─────────────────────────────────────────────────
  text: '#EDF0FF',          // 기본 텍스트 (near-white)
  textSub: '#8891AD',       // 보조 텍스트
  textMuted: '#505870',     // 희미한 텍스트 / 플레이스홀더

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
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  hero: 44,
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
