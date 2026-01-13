export const radii = {
  small: 4,
  medium: 6,
  large: 8,
}

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 2px 6px 0 rgb(0 0 0 / 0.08)'
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
}

export const colors = {
  brand: '#1e3a8a',
  text: '#0f172a',
  subtext: '#475569',
  border: '#e5e7eb',
  surface: '#ffffff',
}

export const zIndex = {
  header: 10,
  overlay: 20,
  modal: 30,
}

export const theme = { radii, shadows, spacing, colors, zIndex }

export type Theme = typeof theme





