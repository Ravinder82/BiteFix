export function parseNutritionLabel(text: string): { amount: number, type: 'added' | 'total', rawText: string } | null {
  // Normalize: lower case and replace newlines with spaces for easier matching
  const normalized = text.toLowerCase().replace(/\n/g, ' ');
  
  // Regex piece to match a number, including common OCR typos (O->0, l->1, B->8, i->1)
  const numRegex = `([oOlBi\\d]+(?:\\.[oOlBi\\d]+)?)`;
  
  // Added sugars patterns:
  // e.g. "Includes 10g Added Sugars"
  // e.g. "Added Sugars 10g"
  const addedPatterns = [
    new RegExp(`includes\\s*${numRegex}\\s*g(?:rams)?\\s*(?:of)?\\s*added sugars?`, 'i'),
    new RegExp(`added sugars?\\s*[:\\-]?\\s*${numRegex}\\s*g`, 'i')
  ];
  
  // Total sugars patterns:
  // e.g. "Total Sugars 12g"
  // e.g. "Sugars 12g"
  const totalPatterns = [
    new RegExp(`total sugars?\\s*[:\\-]?\\s*${numRegex}\\s*g`, 'i'),
    new RegExp(`sugars?\\s*[:\\-]?\\s*${numRegex}\\s*g`, 'i')
  ];

  // Helper to fix OCR mistakes in the extracted number string
  const extractNumber = (str: string) => {
    let clean = str.replace(/[oO]/g, '0')
                   .replace(/[lLiI]/g, '1')
                   .replace(/B/g, '8');
    return parseFloat(clean);
  };

  // 1. Try finding Added Sugars first (more important for health)
  for (const p of addedPatterns) {
    const match = normalized.match(p);
    if (match && match[1]) {
      const val = extractNumber(match[1]);
      if (!isNaN(val)) return { amount: val, type: 'added', rawText: match[0] };
    }
  }

  // 2. Try finding Total Sugars
  for (const p of totalPatterns) {
    const match = normalized.match(p);
    if (match && match[1]) {
      const val = extractNumber(match[1]);
      if (!isNaN(val)) return { amount: val, type: 'total', rawText: match[0] };
    }
  }

  return null;
}
