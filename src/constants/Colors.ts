export type ColorScheme = 'light' | 'dark';

export const Colors = {
  light: {
    primary:        '#701a75',   // Deep Plum / Berry
    primaryLight:   '#a21caf',
    primaryDark:    '#4a044e',
    secondary:      '#f97316',   // Peach / Orange accent

    // Backgrounds
    background:     '#faf8f5',   // Sugar Cream
    surface:        '#ffffff',
    surfaceRaised:  '#f5ebe0',   // Warm surface card overlay
    overlay:        'rgba(0,0,0,0.4)',

    // Text
    text:           '#1c1917',   // Stone-900 / dark charcoal
    textSecondary:  '#78716c',   // Stone-500 / warm gray
    textMuted:      '#a8a29e',   // Stone-400 / muted gray
    textInverse:    '#ffffff',

    // Borders
    border:         '#f3ebe1',
    borderFocus:    '#701a75',

    // Semantic
    error:          '#ef4444',
    errorLight:     '#fef2f2',
    success:        '#10b981',
    successLight:   '#ecfdf5',
    warning:        '#f59e0b',
    warningLight:   '#fffbeb',
    info:           '#3b82f6',
    infoLight:      '#eff6ff',
  },
  dark: {
    primary:        '#e879f9',   // Vibrant Neon Plum
    primaryLight:   '#fdf4ff',
    primaryDark:    '#701a75',
    secondary:      '#fb923c',   // Warm Peach / Orange

    // Backgrounds
    background:     '#120e10',   // Obsidian Plum (near black with deep berry undertone)
    surface:        '#1e161a',   // Tinted dark surface
    surfaceRaised:  '#2a1f24',   // Lighter raised dark surface
    overlay:        'rgba(0,0,0,0.6)',

    // Text
    text:           '#fafaf9',   // Bright off-white
    textSecondary:  '#a8a29e',   // Stone-400
    textMuted:      '#78716c',   // Stone-500
    textInverse:    '#120e10',

    // Borders
    border:         '#2a1f24',
    borderFocus:    '#e879f9',

    // Semantic
    error:          '#f87171',
    errorLight:     '#250c0c',
    success:        '#34d399',
    successLight:   '#062318',
    warning:        '#fbbf24',
    warningLight:   '#221600',
    info:           '#60a5fa',
    infoLight:      '#0b1d33',
  },
} as const;
