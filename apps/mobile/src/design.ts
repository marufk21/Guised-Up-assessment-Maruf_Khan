/**
 * Guised Up — Design System
 *
 * 8pt spacing grid, dark-first palette, system typography scale.
 * Every value is intentional. No magic numbers in components.
 */

// ── Spacing (8pt grid) ──────────────────────────────────────────
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 56,
  11: 64,
} as const;

// ── Border Radius ──────────────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

// ── Typography Scale ───────────────────────────────────────────
export const type = {
  hero:    { size: 36, weight: '800' as const, leading: 42, tracking: -0.8 },
  title:   { size: 20, weight: '700' as const, leading: 26, tracking: -0.3 },
  subtitle:{ size: 17, weight: '600' as const, leading: 23, tracking: -0.2 },
  body:    { size: 16, weight: '400' as const, leading: 25, tracking: 0 },
  label:   { size: 15, weight: '600' as const, leading: 20, tracking: -0.2 },
  meta:    { size: 13, weight: '500' as const, leading: 18, tracking: 0 },
  caption: { size: 11, weight: '600' as const, leading: 14, tracking: 2 },
  tiny:    { size: 10, weight: '700' as const, leading: 12, tracking: 0.5 },
} as const;

// ── Color System (Dark) ─────────────────────────────────────────
export const color = {
  // Backgrounds
  bg:         '#000000',   // true black OLED
  surface:    '#0C0C0E',   // primary surface
  card:       '#161618',   // card background
  cardAlt:    '#1A1A1D',   // slightly raised card variant
  elevated:   '#1C1C1E',   // search, badges, inputs
  overlay:    'rgba(0, 0, 0, 0.6)', // modal/sheet backdrop

  // Borders
  hairline:   '#252528',   // subtle border
  border:     '#333336',   // prominent border
  borderStrong: '#45454A', // focused/active border

  // Text
  primary:    '#F5F5F7',   // headings, body
  secondary:  '#98989E',   // meta, timestamps, placeholders
  tertiary:   '#6C6C72',   // muted labels
  inverse:    '#0C0C0E',   // text on light/accent surfaces

  // Accent
  accent:      '#818CF8',   // indigo-400
  accentBg:    'rgba(129, 140, 248, 0.12)',
  accentBorder:'rgba(129, 140, 248, 0.28)',
  accentMuted: '#6366F1',  // darker accent for badges

  // Secondary accent (for gradients / variety without new hues everywhere)
  accent2:     '#F472B6',   // pink-400, doubles as "reacted"

  // States
  reacted:    '#F472B6',   // pink-400
  reactedBg:  'rgba(244, 114, 182, 0.12)',
  error:      '#FB7185',   // rose-400
  errorBg:    'rgba(251, 113, 133, 0.10)',
  success:    '#34D399',   // emerald-400
  successBg:  'rgba(52, 211, 153, 0.12)',

  // Avatar palette (vibrant, accessible on dark)
  avatar: [
    { bg: '#1E1B4B', text: '#A5B4FC' },
    { bg: '#4C1D3D', text: '#F9A8D4' },
    { bg: '#164E63', text: '#67E8F9' },
    { bg: '#431407', text: '#FDBA74' },
    { bg: '#14532D', text: '#86EFAC' },
    { bg: '#3B1E08', text: '#FDE68A' },
  ],
} as const;

// ── Gradients ────────────────────────────────────────────────────
// Use with expo-linear-gradient or react-native-linear-gradient.
export const gradient = {
  accent: [color.accent, color.accentMuted] as const,
  brand:  ['#818CF8', '#F472B6'] as const,
  fade:   ['transparent', color.bg] as const,
} as const;

// ── Elevation / Shadow ───────────────────────────────────────────
// iOS uses shadow*, Android uses elevation — spread both per level.
export const elevation = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

// ── Animation Durations (ms) ────────────────────────────────────
export const duration = {
  fast:    150,
  normal:  250,
  slow:    400,
  skeleton: 1200,
} as const;

// ── Touch Targets (accessibility) ───────────────────────────────
export const touch = {
  min: 44,  // Apple HIG minimum
};

// ── Layout ──────────────────────────────────────────────────────
export const layout = {
  cardGap:     space[3],   // 12
  pagePadding: space[4],   // 16
  headerTop:   space[10],  // 56
} as const;

// ── Helpers ─────────────────────────────────────────────────────
export function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return color.avatar[Math.abs(hash) % color.avatar.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
}

/** Apply an opacity to a hex color, e.g. withOpacity(color.accent, 0.2) */
export function withOpacity(hex: string, opacity: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}