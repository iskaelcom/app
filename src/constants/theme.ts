import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F8FAFC',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
    primary: '#10B981',
    primaryDark: '#059669',
    whatsappGreen: '#25D366',
    card: '#FFFFFF',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    pin: '#F59E0B',
    danger: '#EF4444',
    inputBg: '#F1F5F9',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0B0F17',
    backgroundElement: '#161F30',
    backgroundSelected: '#222E45',
    primary: '#10B981',
    primaryDark: '#059669',
    whatsappGreen: '#25D366',
    card: '#121824',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    pin: '#FBBF24',
    danger: '#F87171',
    inputBg: '#1A2234',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 840;
