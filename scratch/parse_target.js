const fs = require('fs');

try {
  const raw = fs.readFileSync('scratch/product_8901058895780.json', 'utf8');
  const data = JSON.parse(raw);
  const p = data.product;
  const n = p.nutriments || {};
  
  console.log(`=== Product Details for ${p.code} ===`);
  console.log(`Product Name: ${p.product_name}`);
  console.log(`Brand: ${p.brands}`);
  console.log(`Quantity: ${p.quantity}`);
  console.log(`Serving Size: ${p.serving_size}`);
  console.log(`Serving Quantity: ${p.serving_quantity}`);
  console.log(`Sugars/100g: ${n.sugars_100g}`);
  console.log(`Sugars/serving: ${n.sugars_serving}`);
  console.log(`Carbohydrates/100g: ${n.carbohydrates_100g}`);
  console.log(`Energy-Kcal/100g: ${n['energy-kcal_100g']}`);
  console.log(`Energy-Kcal/serving: ${n['energy-kcal_serving']}`);
  console.log(`Ingredients: ${p.ingredients_text || p.ingredients_text_en}`);
  console.log(`\nAll Nutriments:`, JSON.stringify(n, null, 2));
} catch (err) {
  console.error('Error:', err.message);
}
