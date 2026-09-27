export const colors = {
  background: '#EAF6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#DCEEF1',
  surfaceStrong: '#CDE4E8',
  ink: '#0B1112',
  mutedInk: '#4D6064',
  subtleInk: '#718489',
  inverseInk: '#FFFFFF',
  accent: '#087885',
  accentStrong: '#05616C',
  accentSoft: '#D5EFF2',
  highlight: '#E7FF45',
  highlightPressed: '#D4F22C',
  highlightInk: '#0B1112',
  dataPanel: '#087380',
  dataPanelStrong: '#055B65',
  border: '#D3E4E7',
  borderStrong: '#AFC9CE',
  success: '#237A5A',
  successSoft: '#E0F2E9',
  warning: '#A9651B',
  warningSoft: '#FAEBD6',
  critical: '#B64A43',
  criticalSoft: '#F8E3E1',
  info: '#376F9F',
  infoSoft: '#E2EEF8',
  leftSide: '#3976A8',
  leftSideSoft: '#E4EFF7',
  rightSide: '#B8643F',
  rightSideSoft: '#F7E9E1',
  activityLoad: '#E7FF45',
  recovery: '#087885',
  baseline: '#56737A',
} as const;

export const typography = {
  display: { fontSize: 40, lineHeight: 44, fontWeight: '800' as const },
  title: { fontSize: 32, lineHeight: 36, fontWeight: '800' as const },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  subheading: { fontSize: 17, lineHeight: 23, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
  },
  metric: { fontSize: 42, lineHeight: 46, fontWeight: '800' as const },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const sizes = {
  buttonHeight: 52,
  compactButtonHeight: 40,
  iconSm: 16,
  iconMd: 22,
  iconLg: 28,
  touchTarget: 44,
} as const;

export const shadows = {
  card: {
    shadowColor: '#12363C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  floating: {
    shadowColor: '#12363C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  },
} as const;
