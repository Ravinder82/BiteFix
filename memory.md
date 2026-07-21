# BiteFix Project Memory — Product Features & Technical Specifications

This document serves as the permanent record of completed features, specifications, and architecture decisions for **BiteFix**. Use this for marketing copy, App Store Connect details, onboarding content, and design alignment.

---

## 🎯 Value Proposition
BiteFix is a gamified, processing-level and additive transparency food alchemist. It tells the user at a glance: **"Is this product safe and clean, or is it highly processed and loaded with industrial chemicals?"**

---

## ⚙️ Core Technical Features

### 1. Proprietary BiteFix Score (0–100 Scale)
Calculated instantly during scan using the formula:
$$\text{Score} = (0.4 \times \text{NOVA Factor}) + (0.4 \times \text{Additive Cleanliness}) + (0.2 \times \text{Nutritional Profile})$$
- **NOVA Factor**: NOVA 1 $\rightarrow$ 100, NOVA 2 $\rightarrow$ 75, NOVA 3 $\rightarrow$ 45, NOVA 4 $\rightarrow$ 15, Unknown $\rightarrow$ 50.
- **Additive Cleanliness**: Starts at 100, decays by 12 points for each industrial additive found.
- **Nutrient Profile**: Map of Nutri-Score letter (A $\rightarrow$ 100, B $\rightarrow$ 80, C $\rightarrow$ 55, D $\rightarrow$ 30, E $\rightarrow$ 10, Unknown $\rightarrow$ 50).

### 2. Live Mascot Biofeedback
The active mascot (`OrbMascot`) shifts facial expressions, physical liquid colors, and ambient glow animations based on the computed **BiteFix Score**:
- **Score 76–100**: `happy` state (beaming face, glowing **emerald/green** liquid and halo).
- **Score 41–75**: `idle` state (friendly, alert expressions, glowing **amber/yellow** liquid and halo).
- **Score 0–40**: `shocked` / `dizzy` state (concerned expressions, glowing **crimson/red** liquid and halo).

### 3. Stealth Food Detective
Audits ingredient lists to highlight synthetic texturizers, preservatives, and alternative sweeteners using objective, functional, and legally safe descriptions:
- Highlighting disguised sugars (brown rice syrup, maltodextrin).
- Identifying E-numbers and chemical synonyms neutrally, avoiding alarmist language to ensure compliance and avoid liability.

### 4. The Gut Shield
Microbiome integrity protector that scans ingredient profiles for industrial emulsifiers (e.g. Carrageenan, Polysorbates, Carboxymethylcellulose) and artificial sweeteners:
- Status states: `Active / Safe` (zero matched microbiome disruptors) and `Vigilant / Alert` (matches found).
- Displays objective educational info based on gut health clinical research.

### 5. Custom Allergen Alerts
Users can toggle on personalized warnings in Settings. The scanner cross-references ingredient lists and tags, showing high-priority alerts for:
- Gluten, Dairy, Soy, Nuts, Eggs, Artificial Sweeteners, and Palm Oil.

---

## 🎨 Styling & Navigation Architecture
- **Palette**: Organic Emeralds (`#10B981`, `#3BB5A0`), warm warning Ambers (`#F59E0B`), and clear error Reds (`#EF4444`).
- **Tab Layout**:
  - **Tab 1: Home Dashboard** — Integrated visual layout containing **The Food Alchemist Card** (floating mascot inside animated SVG orbital rings), **Stealth Food Detective Card** (additive audits), and **The Gut Shield Card** (microbiome protector).
  - **Tab 2: Live Scanner** — Camera scanning viewport with custom target bounds and overlay card.
  - **Tab 3: Settings** — Custom allergen pills, audit toggles, data reset commands, and compliance info.
