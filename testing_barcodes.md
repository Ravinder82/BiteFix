# BiteFix App Testing Barcodes

Use this test suite to verify the scoring logic, dietary compliance rules, organic tags, and AI label scan fallback mechanisms in the BiteFix app.

---

## 🥗 Food Product Barcodes (UPC-A)

These barcodes are active in the Open Food Facts US registry. Type them into manual input or look up the numbers online to scan the barcode images directly.

### 1. Minimally Processed & Organic Dairy
*   **Product:** Organic Valley Whole Milk (Gallon)
*   **UPC:** `093966007428`
*   **Verifies:** `Organic` indicator stamp, `NOVA 1` processing level, high nutrition value.

### 2. Quart Milk (Organic Alternate Size)
*   **Product:** Organic Valley Whole Milk (Quart)
*   **UPC:** `093966000917`
*   **Verifies:** Size-based scaling comparison.

### 3. Plant-Based / Vegan
*   **Product:** Beyond Burger Plant-Based Patties (Retail 2-Pack)
*   **UPC:** `852629004583`
*   **Verifies:** Passes `Vegan` & `Vegetarian` guardrail filters successfully.

### 4. Zero Sugar Yogurt (Clean Diet)
*   **Product:** Chobani Plain Non-Fat Greek Yogurt (5.3 oz)
*   **UPC:** `894700010014`
*   **Verifies:** Highest rating scores, zero added sugar warnings, `NOVA 1` clean label.

### 5. Vanilla Yogurt (Sugar Comparison)
*   **Product:** Chobani Vanilla Greek Yogurt (5.3 oz)
*   **UPC:** `894700010021`
*   **Verifies:** Added sugar detection thresholds and score drop compared to the plain version.

### 6. Ultra-Processed / High Sugar
*   **Product:** Coca-Cola Original Taste (355ml)
*   **UPC:** `5449000043382`
*   **Verifies:** Severe sugar warnings, triggers `NOVA 4` (ultra-processed) card, and drops health score.

### 7. High Fructose Corn Syrup
*   **Product:** Heinz Tomato Ketchup (20 oz)
*   **UPC:** `013000013673`
*   **Verifies:** Sweetener alert flags (corn syrup) and additives classification.

### 8. Alternative Sweetener Ketchup
*   **Product:** Heinz Simply Tomato Ketchup (34 oz)
*   **UPC:** `705833716356`
*   **Verifies:** Uses real cane sugar; compares health score improvement vs. original Heinz.

### 9. Natural Deli Cheese
*   **Product:** Applegate Naturals Sliced Medium Cheddar Cheese (8 oz)
*   **UPC:** `025317771009`
*   **Verifies:** Clean packaging, natural additives processing level.

### 10. Whole Ingredients Snack Bar
*   **Product:** Lärabar Peanut Butter Chocolate Chip (1.6 oz Bar)
*   **UPC:** `021844333020`
*   **Verifies:** Checks correct processing category tag mapping.

---

## 📷 Fallback & Gemini Vision API Testing

To test the **Gemini Vision API** flow, use the non-food barcode below. Since it is not in the food database, scanning it will trigger the **Product Not Found** screen. From there, you can choose "Scan Label with AI" to upload or capture a photo of any food package's ingredients label.

*   **Product:** Non-Food Item (Standard Book Barcode / ISBN)
*   **Barcode:** `9780134093413`
*   **Result:** Triggers **Product Not Found** fallback screen. Tap **Scan Label with AI** to test the Gemini Vision camera upload pipeline.
