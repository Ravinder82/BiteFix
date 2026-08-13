export type ColorScheme = 'light' | 'dark';

export const Colors = {
  light: {
    // ── Brand ──────────────────────────────────────────────
    primary:        '#4A8A1A',   // Vivid Lime — legible on white surface
    primaryLight:   '#EBF8D6',   // Pale lime wash
    primaryDark:    '#2E5A0A',   // Forest depth
    primaryGlow:    'rgba(74, 138, 26, 0.14)',
    secondary:      '#1E9E8A',   // Teal accent

    // ── Glass Material System ──────────────────────────────
    glass:          'rgba(255, 255, 255, 0.85)',  // L1 card surface
    glassMid:       'rgba(248, 250, 248, 0.95)',  // L2 inner module
    glassThin:      'rgba(240, 244, 240, 0.90)',  // L3 deepest nested
    glassBorder:    'rgba(0, 0, 0, 0.07)',        // Highlight border
    glassDivider:   'rgba(0, 0, 0, 0.05)',        // Subtle separator

    // ── Backgrounds ────────────────────────────────────────
    background:     '#F2F4F2',   // Soft sage-white
    surface:        '#FFFFFF',   // Card surface
    surfaceRaised:  '#F8FAF8',   // Inner module
    overlay:        'rgba(0, 0, 0, 0.32)',

    // ── Text ───────────────────────────────────────────────
    text:           '#0D1A0E',   // Near-black, forest-tinted
    textSecondary:  '#3A5040',   // Muted forest
    textMuted:      '#7A9080',   // Sage-grey
    textInverse:    '#FFFFFF',

    // ── Borders ────────────────────────────────────────────
    border:         '#DDE8DC',   // Hairline sage
    borderFocus:    '#4A8A1A',

    // ── Semantic Tints (translucent — no eye blast) ────────
    tintGreen:      'rgba( 34, 197, 94, 0.10)',
    tintAmber:      'rgba(245, 158, 11, 0.10)',
    tintRed:        'rgba(239, 68,  68, 0.10)',
    tintCyan:       'rgba(  6, 182,212, 0.10)',
    tintTeal:       'rgba( 20, 184,166, 0.10)',
    tintOrange:     'rgba(249,115, 22, 0.10)',

    // ── Accent Solids (icons/text only — high legibility) ──
    accentGreen:    '#16A34A',
    accentAmber:    '#D97706',
    accentRed:      '#DC2626',
    accentCyan:     '#0891B2',
    accentTeal:     '#0F766E',
    accentOrange:   '#EA580C',

    // ── Semantic ───────────────────────────────────────────
    error:          '#DC2626',
    errorLight:     '#FEF2F2',
    success:        '#16A34A',
    successLight:   '#F0FDF4',
    warning:        '#D97706',
    warningLight:   '#FFFBEB',
    info:           '#0891B2',
    infoLight:      '#ECFEFF',

    // ── NOVA Classification ────────────────────────────────
    nova1:          '#16A34A',
    nova2:          '#65A30D',
    nova3:          '#D97706',
    nova4:          '#DC2626',
  },

  dark: {
    // ── Brand ──────────────────────────────────────────────
    primary:        '#6EE041',   // Bright neon lime — glows on dark glass
    primaryLight:   'rgba(110, 224, 65, 0.14)',
    primaryDark:    '#3A7A18',
    primaryGlow:    'rgba(110, 224, 65, 0.20)',
    secondary:      '#2DD4BF',   // Bright teal

    // ── Glass Material System ──────────────────────────────
    glass:          'rgba(255, 255, 255, 0.06)',  // L1 card surface
    glassMid:       'rgba(255, 255, 255, 0.04)',  // L2 inner module
    glassThin:      'rgba(255, 255, 255, 0.025)', // L3 deepest nested
    glassBorder:    'rgba(255, 255, 255, 0.10)',  // Highlight border
    glassDivider:   'rgba(255, 255, 255, 0.06)',  // Subtle separator

    // ── Backgrounds ────────────────────────────────────────
    background:     '#050A06',   // Ultra deep green-black
    surface:        '#0A0F0C',   // Deep forest black
    surfaceRaised:  '#111816',   // Elevated dark sage
    overlay:        'rgba(0, 0, 0, 0.72)',

    // ── Text ───────────────────────────────────────────────
    text:           '#F0FDF4',   // Slightly green-tinted white — easier on eyes
    textSecondary:  '#8BA898',   // Silver-sage
    textMuted:      '#4D6459',   // Deep muted sage
    textInverse:    '#FFFFFF',

    // ── Borders ────────────────────────────────────────────
    border:         'rgba(255, 255, 255, 0.08)',
    borderFocus:    '#6EE041',

    // ── Semantic Tints (translucent — works on dark glass) ─
    tintGreen:      'rgba( 52, 211,153, 0.12)',
    tintAmber:      'rgba(251, 191, 36, 0.12)',
    tintRed:        'rgba(248, 113,113, 0.12)',
    tintCyan:       'rgba( 34, 211,238, 0.12)',
    tintTeal:       'rgba( 45, 212,191, 0.12)',
    tintOrange:     'rgba(251,146, 60, 0.12)',

    // ── Accent Solids (icons/text only — high legibility) ──
    accentGreen:    '#34D399',
    accentAmber:    '#FBBF24',
    accentRed:      '#F87171',
    accentCyan:     '#22D3EE',
    accentTeal:     '#2DD4BF',
    accentOrange:   '#FB923C',

    // ── Semantic ───────────────────────────────────────────
    error:          '#F87171',
    errorLight:     'rgba(248,113,113,0.10)',
    success:        '#34D399',
    successLight:   'rgba(52,211,153,0.10)',
    warning:        '#FBBF24',
    warningLight:   'rgba(251,191,36,0.10)',
    info:           '#22D3EE',
    infoLight:      'rgba(34,211,238,0.10)',

    // ── NOVA Classification ────────────────────────────────
    nova1:          '#34D399',
    nova2:          '#86EFAC',
    nova3:          '#FBBF24',
    nova4:          '#F87171',
  },
} as const;

