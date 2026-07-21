const https = require('https');
const url = require('url');

const targetUrl = 'https://world.openfoodfacts.org/api/v2/search?categories_tags=en:sauces&brands_tags=maggi&fields=code,product_name,serving_size,nutriments';
const parsedUrl = url.parse(targetUrl);

const options = {
  hostname: parsedUrl.hostname,
  path: parsedUrl.path,
  method: 'GET',
  headers: {
    'User-Agent': 'GoodByeSugarApp - iOS/Android - Version 1.0 - ravinderpoonia'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`Found ${parsed.products?.length || 0} products.`);
      if (parsed.products) {
        parsed.products.forEach(p => {
          const nut = p.nutriments || {};
          console.log(`- Code: ${p.code}`);
          console.log(`  Name: ${p.product_name || p.product_name_en}`);
          console.log(`  Serving Size: ${p.serving_size || 'N/A'}`);
          console.log(`  Sugars/100g: ${nut.sugars_100g !== undefined ? nut.sugars_100g : 'N/A'}`);
          console.log(`  Sugars/serving: ${nut.sugars_serving !== undefined ? nut.sugars_serving : 'N/A'}`);
          console.log(`  Energy/100g (kcal): ${nut['energy-kcal_100g'] !== undefined ? nut['energy-kcal_100g'] : 'N/A'}`);
          console.log(`  Energy/serving (kcal): ${nut['energy-kcal_serving'] !== undefined ? nut['energy-kcal_serving'] : 'N/A'}`);
        });
      }
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
      console.log('Response sample:', data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.error('Error fetching data:', err.message);
});
