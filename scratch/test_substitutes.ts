import { lookupAlternatives } from '../src/utils/scannerAPI';

async function runTests() {
  console.log('--- Testing lookupAlternatives Intelligent Substitute Engine ---\n');
  const signal = new AbortController().signal;

  // Test Case 1: Soda / Cola (Should match soda_cola archetype and yield Zevia / Olipop)
  console.log('Test 1: Scanning "Coca Cola"...');
  const resultCola = await lookupAlternatives(
    'en:colas',
    {
      name: 'Coca Cola Classic',
      brand: 'Coca Cola',
      sugarPer100g: 10.6,
      novaClass: 4,
      additiveCount: 3,
      biteFixScore: 40,
    } as any,
    signal
  );
  console.log(`Found ${resultCola.length} alternatives:`);
  resultCola.forEach((item, index) => {
    console.log(`  ${index + 1}. [Curated: ${item.brand}] ${item.name} | Sugar: ${item.sugarGrams}g | BiteFix Score: ${item.biteFixScore}`);
  });

  const colaMatch = resultCola.some(r => r.brand === 'Zevia' || r.brand === 'Olipop');
  console.log(colaMatch ? '✅ Cola Test Passed!\n' : '❌ Cola Test Failed!\n');

  // Test Case 2: Hazelnut Spread (Should match hazelnut_spread archetype and yield Rigoni / Good Good)
  console.log('Test 2: Scanning "Nutella"...');
  const resultNutella = await lookupAlternatives(
    'en:hazelnut-spreads',
    {
      name: 'Nutella hazelnut spread',
      brand: 'Ferrero',
      sugarPer100g: 56.3,
      novaClass: 4,
      additiveCount: 2,
      biteFixScore: 35,
    } as any,
    signal
  );
  console.log(`Found ${resultNutella.length} alternatives:`);
  resultNutella.forEach((item, index) => {
    console.log(`  ${index + 1}. [Curated: ${item.brand}] ${item.name} | Sugar: ${item.sugarGrams}g | BiteFix Score: ${item.biteFixScore}`);
  });

  const nutellaMatch = resultNutella.some(r => r.brand === 'Good Good' || r.brand?.includes('Rigoni'));
  console.log(nutellaMatch ? '✅ Nutella Test Passed!\n' : '❌ Nutella Test Failed!\n');

  // Test Case 3: Ketchup (Should match ketchup_condiment archetype and yield Primal Kitchen)
  console.log('Test 3: Scanning "Heinz Tomato Ketchup"...');
  const resultKetchup = await lookupAlternatives(
    'en:ketchups',
    {
      name: 'Tomato Ketchup',
      brand: 'Heinz',
      sugarPer100g: 22.8,
      novaClass: 4,
      additiveCount: 1,
      biteFixScore: 45,
    } as any,
    signal
  );
  console.log(`Found ${resultKetchup.length} alternatives:`);
  resultKetchup.forEach((item, index) => {
    console.log(`  ${index + 1}. [Curated: ${item.brand}] ${item.name} | Sugar: ${item.sugarGrams}g | BiteFix Score: ${item.biteFixScore}`);
  });

  const ketchupMatch = resultKetchup.some(r => r.brand === 'Primal Kitchen');
  console.log(ketchupMatch ? '✅ Ketchup Test Passed!\n' : '❌ Ketchup Test Failed!\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
});
