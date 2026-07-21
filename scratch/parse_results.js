const fs = require('fs');

try {
  const raw = fs.readFileSync('scratch/results.json', 'utf8');
  if (raw.trim().startsWith('<!DOCTYPE')) {
    console.error('The file contains HTML instead of JSON:');
    console.log(raw.substring(0, 500));
  } else {
    const parsed = JSON.parse(raw);
    console.log(`Parsed ${parsed.products?.length || 0} products.`);
    if (parsed.products) {
      parsed.products.forEach(p => {
        const name = p.product_name || p.product_name_en || '';
        if (name.toLowerCase().includes('hot') || name.toLowerCase().includes('sweet') || name.toLowerCase().includes('chili') || name.toLowerCase().includes('chilli')) {
          const nut = p.nutriments || {};
          console.log(`- Code: ${p.code}`);
          console.log(`  Name: ${name}`);
          console.log(`  Serving Size: ${p.serving_size || 'N/A'}`);
          console.log(`  Countries: ${p.countries || 'N/A'}`);
          console.log(`  Sugars/100g: ${nut.sugars_100g !== undefined ? nut.sugars_100g : 'N/A'}`);
          console.log(`  Sugars/serving: ${nut.sugars_serving !== undefined ? nut.sugars_serving : 'N/A'}`);
          console.log(`  Energy/100g (kcal): ${nut['energy-kcal_100g'] !== undefined ? nut['energy-kcal_100g'] : 'N/A'}`);
        }
      });
    }
  }
} catch (err) {
  console.error('Error reading/parsing file:', err.message);
}
