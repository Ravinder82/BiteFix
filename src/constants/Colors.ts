export type ColorScheme = 'light' | 'dark';

export const Colors = {
  light: {
    primary:        '#3A5E14',   // Deep Lime Green
    primaryLight:   '#F0FCE6',   // Soft Lime Tint
    primaryDark:    '#25400A',   // Extra Deep Forest Olive
    secondary:      '#3BB5A0',   // Teal Accent

    // Backgrounds
    background:     '#F8F9FA',   // Lightest vivid grey
    surface:        '#FFFFFF',   // Pure solid white for neomorphic cards
    surfaceRaised:  '#F1F3F5',   // Nested surface
    overlay:        'rgba(0,0,0,0.35)',

    // Text
    text:           '#0A1A14',   // Near-black green-tinted
    textSecondary:  '#3D5A4E',   // Crisp green-grey
    textMuted:      '#6E8A7E',   // Readable muted sage
    textInverse:    '#FFFFFF',

    // Borders
    border:         '#E8EDE9',   // Hairline sage
    borderFocus:    '#3A5E14',

    // Semantic
    error:          '#DC2626',
    errorLight:     '#FEF2F2',
    success:        '#3A5E14',
    successLight:   '#F0FCE6',
    warning:        '#F5A623',
    warningLight:   '#FEF3E4',
    info:           '#3A5E14',
    infoLight:      '#F0FCE6',

    // BiteFix NOVA colors
    nova1:          '#3A5E14',   // Whole
    nova2:          '#76B738',   // Minimal
    nova3:          '#F5A623',   // Processed
    nova4:          '#EF4444',   // Ultra-Processed
  },
  dark: {
    primary:        '#3A5E14',   // Deep Lime Green
    primaryLight:   '#F0FCE6',   // Soft Lime Tint
    primaryDark:    '#25400A',   // Extra Deep Forest Olive
    secondary:      '#3BB5A0',   // Teal Accent

    // Backgrounds
    background:     '#000000',   // Ultra deep black
    surface:        '#0A0F0C',   // Deep green-black
    surfaceRaised:  '#141A16',   // Elevated dark sage
    overlay:        'rgba(0,0,0,0.7)',

    // Text
    text:           '#FFFFFF',   // Pure White
    textSecondary:  '#9EA7A2',   // Silver-sage
    textMuted:      '#5C6F65',   // Muted sage
    textInverse:    '#FFFFFF',

    // Borders
    border:         'rgba(255, 255, 255, 0.08)',
    borderFocus:    '#3A5E14',

    // Semantic
    error:          '#f87171',
    errorLight:     '#1a0505',
    success:        '#3A5E14',
    successLight:   '#051a10',
    warning:        '#F5A623',
    warningLight:   '#1a1000',
    info:           '#3A5E14',
    infoLight:      '#050f1a',

    // BiteFix NOVA colors
    nova1:          '#3A5E14',
    nova2:          '#76B738',
    nova3:          '#FBBF24',
    nova4:          '#f87171',
  },
} as const;
