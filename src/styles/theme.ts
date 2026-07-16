export const theme = {
  colors: {
    bg: 'oklch(0.09 0 0)',
    surface: 'oklch(0.135 0 0)',
    elevated: 'oklch(0.17 0 0)',
    border: 'oklch(0.22 0 0)',
    borderHover: 'oklch(0.28 0 0)',
    ink: 'oklch(0.95 0.008 230)',
    muted: 'oklch(0.62 0.015 230)',
    faint: 'oklch(0.45 0.01 230)',
    primary: 'oklch(0.65 0.12 230)',
    primaryHover: 'oklch(0.70 0.13 230)',
    primaryMuted: 'oklch(0.28 0.06 230)',
    accent: 'oklch(0.72 0.11 195)',
    danger: 'oklch(0.65 0.18 25)',
    dangerMuted: 'oklch(0.28 0.06 25)',
    success: 'oklch(0.72 0.14 155)',
    successMuted: 'oklch(0.26 0.05 155)',
    warning: 'oklch(0.78 0.12 85)',
    warningMuted: 'oklch(0.28 0.05 85)',
    overlay: 'oklch(0.05 0 0 / 0.72)',
  },
  fonts: {
    sans: '"Outfit", system-ui, sans-serif',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.8125rem',
    md: '0.875rem',
    lg: '1rem',
    xl: '1.125rem',
    '2xl': '1.375rem',
    '3xl': '1.75rem',
    '4xl': '2.25rem',
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  radii: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px oklch(0 0 0 / 0.35)',
    md: '0 4px 16px oklch(0 0 0 / 0.4)',
    lg: '0 12px 40px oklch(0 0 0 / 0.5)',
  },
  space: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },
  layout: {
    sidebarWidth: '240px',
    headerHeight: '56px',
  },
  motion: {
    fast: '120ms',
    base: '180ms',
    slow: '260ms',
    ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  z: {
    dropdown: 100,
    sticky: 200,
    modalBackdrop: 300,
    modal: 400,
    toast: 500,
    tooltip: 600,
  },
} as const

export type AppTheme = typeof theme

declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {}
}
