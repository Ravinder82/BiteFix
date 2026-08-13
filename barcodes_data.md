# BiteFix Test Barcodes Collection

This file maintains 100% verified food product barcodes for testing the BiteFix hybrid scanner engine, NOVA classification, allergen alerts, Eco-Scores, and score calibration.

---

### 1. Beyond Burger Plant-Based Patties (Retail 2-Pack)
- **Barcode (UPC-A):** `0852629004583`
- **Category:** Plant-Based / Vegan Meat Alternative
- **What it verifies:** 
  - Triggers OpenFoodFacts + USDA **Hybrid Data Merge** (OFF for images + USDA for exact nutrition).
  - Verifies correct **0g Sugar** representation (preventing carbs from promoting to sugar).
  - Verifies **Gut Shield Pro** alerts (detects **E461 Methylcellulose** emulsifier).
  - Verifies **Eco-Score B** and carbon footprint fallback.

---

### 2. Coca-Cola Classic (355ml Can)
- **Barcode (UPC-A):** `049000028904`
- **Category:** Soda / Carbonated Beverage
- **What it verifies:**
  - Verifies high sugar load (~39g per serving / ~9.3 teaspoons) and **Red WHO Limit Warning**.
  - Verifies high jogging burn-down offset time.
  - Verifies **Nutri-Score E** color rendering.
  - Verifies **Watch List Compounds** (E150d Caramel Color) vs **Generally Accepted** (Phosphoric Acid).

---

### 3. Quaker Organic Whole Oats (18 oz)
- **Barcode (UPC-A):** `070734053157`
- **Category:** Organic Oats / Whole Grains
- **What it verifies:**
  - Verifies **Clean Label Badge** (0 additives found).
  - Verifies **Gut Shield Pro 100/100** ("Microbiome Friendly").
  - Verifies **Organic** dietary badge activation.
  - Verifies **Nutri-Score A** (Green) and **NOVA 1** (Minimally processed).
