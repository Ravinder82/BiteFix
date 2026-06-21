export type ColorScheme = 'light' | 'dark';

export const Colors = {
  light: {
    primary:        '#E8820C',   // Warm Amber
    primaryLight:   '#FEF3E4',   // Amber Tint
    primaryDark:    '#C06A00',   // Deep Amber
    secondary:      '#F5A623',   // Golden Amber

    // Backgrounds
    background:     '#FFFFFF',   // Bright white shiny like silk
    surface:        '#F9F9F9',   // Light surface
    surfaceRaised:  '#F0F0F0',   // Nested surface
    overlay:        'rgba(0,0,0,0.35)',

    // Text
    text:           '#1A1008',   // Near-black warm
    textSecondary:  '#5A4E42',   // Crisp warm charcoal for contrast
    textMuted:      '#8A7E6E',   // Readable muted warm grey
    textInverse:    '#FFFFFF',

    // Borders
    border:         '#EFEFEC',   // Hairline warm
    borderFocus:    '#E8820C',

    // Semantic
    error:          '#DC2626',
    errorLight:     '#FEF2F2',
    success:        '#22C55E',
    successLight:   '#F0FDF4',
    warning:        '#F5A623',
    warningLight:   '#FEF3E4',
    info:           '#3B82F6',
    infoLight:      '#EFF6FF',
  },
  dark: {
    primary:        '#E8820C',   // Warm Amber / Orange
    primaryLight:   '#F5A623',   // Light Amber
    primaryDark:    '#C06A00',   // Deep Amber
    secondary:      '#F5A623',   // Glowing Gold

    // Backgrounds
    background:     '#000000',   // Ultra shiny darkest black
    surface:        '#111111',   // Deep dark surface
    surfaceRaised:  '#1A1A1A',   // Elevated dark grey
    overlay:        'rgba(0,0,0,0.7)',

    // Text
    text:           '#FFFFFF',   // Pure White
    textSecondary:  '#9E9EA7',   // Silver-grey
    textMuted:      '#6C6C75',   // Muted slate
    textInverse:    '#121214',

    // Borders
    border:         'rgba(255, 255, 255, 0.08)',   // Subtle shiny border
    borderFocus:    '#FF9500',

    // Semantic
    error:          '#f87171',
    errorLight:     '#1a0505',
    success:        '#34d399',
    successLight:   '#051a10',
    warning:        '#F5A623',
    warningLight:   '#1a1000',
    info:           '#60a5fa',
    infoLight:      '#050f1a',
  },
} as const;
