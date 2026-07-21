const fs = require('fs');
const path = require('path');

const files = [
  { name: '500g Pack (8901058117783)', path: '/Users/ravinderpoonia/.gemini/antigravity-ide/brain/ea007d6a-e4c0-414f-a3db-b2db2959c1e7/.system_generated/steps/15/content.md' },
  { name: '1kg Pack (8901058895773)', path: '/Users/ravinderpoonia/.gemini/antigravity-ide/brain/ea007d6a-e4c0-414f-a3db-b2db2959c1e7/.system_generated/steps/19/content.md' }
];

files.forEach(f => {
  try {
    const raw = fs.readFileSync(f.path, 'utf8');
    const parts = raw.split('---');
    const jsonStr = parts[parts.length - 1].trim();
    const data = JSON.parse(jsonStr);
    const p = data.product;
    const n = p.nutriments || {};
    
    console.log(`\n=== ${f.name} ===`);
    console.log(`Product Name: ${p.product_name || p.product_name_en}`);
    console.log(`Brand: ${p.brands}`);
    console.log(`Serving Size: ${p.serving_size}`);
    console.log(`Serving Quantity: ${p.serving_quantity}`);
    console.log(`Serving Quantity Unit: ${p.serving_quantity_unit}`);
    console.log(`Quantity (Total Package): ${p.quantity}`);
    console.log(`Nutriments object:`, JSON.stringify(n, null, 2));
  } catch (err) {
    console.error(`Error reading or parsing ${f.name}:`, err.message);
  }
});
