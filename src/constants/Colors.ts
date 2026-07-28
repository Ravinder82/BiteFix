export type ColorScheme = 'light' | 'dark';

export const Colors = {
  light: {
    primary:        '#22C55E',   // Vibrant CTA Green
    primaryLight:   '#F0FDF4',   // Very Light Green Tint
    primaryDark:    '#16A34A',   // Slightly darker for active states
    secondary:      '#3BB5A0',   // Teal Accent

    // Backgrounds
    background:     '#FFFFFF',   // Bright white
    surface:        '#F9FAF9',   // Very subtle green tint
    surfaceRaised:  '#F0F2F0',   // Nested surface
    overlay:        'rgba(0,0,0,0.35)',

    // Text
    text:           '#0A1A14',   // Near-black green-tinted
    textSecondary:  '#3D5A4E',   // Crisp green-grey
    textMuted:      '#6E8A7E',   // Readable muted sage
    textInverse:    '#FFFFFF',

    // Borders
    border:         '#E8EDE9',   // Hairline sage
    borderFocus:    '#0D9668',

    // Semantic
    error:          '#DC2626',
    errorLight:     '#FEF2F2',
    success:        '#22C55E',
    successLight:   '#F0FDF4',
    warning:        '#F5A623',
    warningLight:   '#FEF3E4',
    info:           '#3B82F6',
    infoLight:      '#EFF6FF',

    // BiteFix NOVA colors
    nova1:          '#22C55E',   // Whole
    nova2:          '#3BB5A0',   // Minimal
    nova3:          '#F5A623',   // Processed
    nova4:          '#EF4444',   // Ultra-Processed
  },
  dark: {
    primary:        '#34D399',   // Vibrant Mint/Emerald
    primaryLight:   '#3BB5A0',   // Teal
    primaryDark:    '#0D9668',   // Deep Emerald
    secondary:      '#5EEAD4',   // Glowing Cyan-Teal

    // Backgrounds
    background:     '#000000',   // Ultra deep black
    surface:        '#0A0F0C',   // Deep green-black
    surfaceRaised:  '#141A16',   // Elevated dark sage
    overlay:        'rgba(0,0,0,0.7)',

    // Text
    text:           '#FFFFFF',   // Pure White
    textSecondary:  '#9EA7A2',   // Silver-sage
    textMuted:      '#5C6F65',   // Muted sage
    textInverse:    '#0A1A14',

    // Borders
    border:         'rgba(255, 255, 255, 0.08)',
    borderFocus:    '#34D399',

    // Semantic
    error:          '#f87171',
    errorLight:     '#1a0505',
    success:        '#34d399',
    successLight:   '#051a10',
    warning:        '#F5A623',
    warningLight:   '#1a1000',
    info:           '#60a5fa',
    infoLight:      '#050f1a',

    // BiteFix NOVA colors
    nova1:          '#34d399',
    nova2:          '#5EEAD4',
    nova3:          '#FBBF24',
    nova4:          '#f87171',
  },
} as const;
