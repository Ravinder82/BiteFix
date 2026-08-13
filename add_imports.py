import re

with open('src/app/(tabs)/index.tsx', 'r') as f:
    code = f.read()

import_statements = """
// Oil Painting Backgrounds
const basketImpastoBg = require('../../../assets/images/oil_paint/basket_score_impasto.jpg');
const gutShieldBg = require('../../../assets/images/oil_paint/gut_shield_oil.jpg');
const sugarAuditBg = require('../../../assets/images/oil_paint/sugar_audit_oil.jpg');
const ecoClimateBg = require('../../../assets/images/oil_paint/eco_climate_oil.jpg');
const calorieBurnBg = require('../../../assets/images/oil_paint/calorie_burn_oil.jpg');
"""

# Let's place it right before the component definition: `export default function DashboardScreen()`
code = code.replace(
    "export default function DashboardScreen() {",
    import_statements + "\nexport default function DashboardScreen() {"
)

with open('src/app/(tabs)/index.tsx', 'w') as f:
    f.write(code)
