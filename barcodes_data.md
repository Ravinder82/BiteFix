# BiteFix Test Barcodes Collection

This file maintains 100% verified food product barcodes and sample images for testing the BiteFix scanner engine, NOVA classification, allergen alerts, and score calibration.

---

### 1. Coca-Cola Original (0.33L Can)
- **Barcode (EAN-13):** `5449000000996`
- **Category:** Soda / Carbonated Beverage
- **Expected Classification:** NOVA 4 (Ultra-Processed) | Score: $\le 35$ (18/100)
- **Image Reference:** `assets/barcodes/coca_cola_5449000000996.png`

![Coca-Cola Barcode](file:///Users/ravinderpoonia/BiteFix/assets/barcodes/coca_cola_5449000000996.png)

---

### 2. Beyond Burger Plant-Based Patties (Retail 2-Pack)
- **Barcode (UPC-A):** `0852629004583`
- **Category:** Plant-Based / Vegan Meat Alternative
- **Expected Verification:** Passes `Vegan` & `Vegetarian` guardrail filters successfully.
- **Image Reference:** `assets/barcodes/beyond_burger_0852629004583.png`

![Beyond Burger Barcode](file:///Users/ravinderpoonia/BiteFix/assets/barcodes/beyond_burger_0852629004583.png)
