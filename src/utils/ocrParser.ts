/**
 * ocrParser.ts
 *
 * Parses raw OCR text from nutrition labels to extract the sugar value.
 * Handles real-world noise: OCR typos, multiple line formats, international
 * variants (kJ energy lines, percent-only lines, etc.).
 *
 * Priority order:
 *  1. Added Sugars (most health-relevant)
 *  2. Total Sugars / Sugars
 *  3. Fallback: Any line mentioning "sugar" followed by a number+g
 */

// ─────────────────────────────────────────────────────────
// OCR character substitution correction map
// (Common OCR mistakes on printed nutrition labels)
// ─────────────────────────────────────────────────────────
function fixOcrNumericString(str: string): string {
  return str
    .replace(/[oO]/g, '0')    // 'o' or 'O' → '0'
    .replace(/[lLiI|]/g, '1') // 'l', 'L', 'i', 'I', '|' → '1'
    .replace(/[Bb]/g, '8')    // 'B' or 'b' → '8' (rare but seen)
    .replace(/[sS]/g, '5')    // 'S' or 's' → '5' (in numeric positions only, but we apply then validate)
    .replace(/[Gg]/g, '9')    // 'G' → '9' sometimes
    .trim();
}

function extractNumber(raw: string): number | null {
  const fixed = fixOcrNumericString(raw);
  const n = parseFloat(fixed);
  if (!isNaN(n) && n >= 0 && n <= 999) return n; // 999g upper bound sanity check
  return null;
}

// Matches a numeric value possibly with a decimal, possibly with OCR noise
// e.g. "12", "12.5", "l2", "Og", "0.5"
const NUM = `([0-9oOlLiIbBsS|]+(?:[.,][0-9oOlLiIbBsS|]+)?)`;

// Suffix: "g", "grams", or just end of token
const G_SUFFIX = `\\s*(?:g(?:rams?)?)?`;

type SugarResult = { amount: number; type: 'added' | 'total'; rawText: string };

export function parseNutritionLabel(text: string): SugarResult | null {
  if (!text || !text.trim()) return null;

  // Normalize: lower-case, collapse multiple spaces/newlines to single space
  const normalized = text
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // ─── PASS 1: Added Sugars ────────────────────────────────
  // Matches:
  //   "Includes 10g Added Sugars"
  //   "Added Sugars 10g"
  //   "added sugars: 12.5g"
  //   "incl. 5g added sugars"
  const addedPatterns: RegExp[] = [
    // "Includes Xg Added Sugars" / "incl. Xg added sugars"
    new RegExp(`incl(?:udes?|\\.)?\\s+${NUM}${G_SUFFIX}\\s+added\\s+sugars?`, 'i'),
    // "Added Sugars Xg" / "added sugars: Xg"
    new RegExp(`added\\s+sugars?\\s*[:\\-–—]?\\s*${NUM}${G_SUFFIX}`, 'i'),
    // "of which sugars Xg" (UK/EU format sometimes says added sugars this way)
    new RegExp(`of\\s+which\\s+(?:added\\s+)?sugars?\\s*[:\\-–—]?\\s*${NUM}${G_SUFFIX}`, 'i'),
  ];

  for (const pattern of addedPatterns) {
    const m = normalized.match(pattern);
    if (m && m[1]) {
      const n = extractNumber(m[1]);
      if (n !== null) return { amount: n, type: 'added', rawText: m[0] };
    }
  }

  // ─── PASS 2: Total Sugars ───────────────────────────────
  // Matches:
  //   "Total Sugars 12g"
  //   "Sugars 5g"
  //   "sugars: 8.0 g"
  //   "of which sugars 3g" (EU nutrition label format)
  const totalPatterns: RegExp[] = [
    new RegExp(`total\\s+sugars?\\s*[:\\-–—]?\\s*${NUM}${G_SUFFIX}`, 'i'),
    new RegExp(`(?:^|\\s)sugars?\\s*[:\\-–—]?\\s*${NUM}${G_SUFFIX}`, 'i'),
    new RegExp(`of\\s+which\\s+sugars?\\s*[:\\-–—]?\\s*${NUM}${G_SUFFIX}`, 'i'),
  ];

  for (const pattern of totalPatterns) {
    const m = normalized.match(pattern);
    if (m && m[1]) {
      const n = extractNumber(m[1]);
      if (n !== null) return { amount: n, type: 'total', rawText: m[0] };
    }
  }

  // ─── PASS 3: Fuzzy fallback ─────────────────────────────
  // Any occurrence of "sugar" near a number+g within the same "sentence"
  // Handles garbled OCR like "Sug4rs 12g" or "sugars l2.5g"
  const lines = normalized.split(/[.\n;]/);
  for (const line of lines) {
    if (/sugar/i.test(line)) {
      const numMatch = line.match(new RegExp(NUM + G_SUFFIX));
      if (numMatch && numMatch[1]) {
        const n = extractNumber(numMatch[1]);
        if (n !== null) return { amount: n, type: 'total', rawText: line.trim() };
      }
    }
  }

  return null;
}
