export const Colors = {
  primary: '#3B5BDB',
  primaryDark: '#2145C2',
  primaryLight: '#EEF2FF',
  primaryMid: '#C5D0FA',

  accent: '#F76707',
  accentLight: '#FFF4E6',

  green: '#2F9E44',
  greenLight: '#EBFBEE',

  purple: '#7048E8',
  purpleLight: '#F3F0FF',

  gold: '#F59F00',
  goldLight: '#FFF9DB',

  red: '#E03131',
  redLight: '#FFF5F5',

  bg: '#F8F9FC',
  surface: '#FFFFFF',
  border: '#E2E6F0',

  text: '#1A1D2E',
  textSub: '#4A5068',
  textMuted: '#8590A6',

  // Dark bg (타이머, 커버 등)
  dark: '#0D0F1A',
  darkMid: '#1A2560',
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
} as const;
