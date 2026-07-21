import { lookupAlternatives, deduceFunctionalArchetype } from '../src/utils/scannerAPI';

async function runTests() {
  console.log('--- Testing Noodle/Ramen Archetype Detection ---\n');
  const signal = new AbortController().signal;

  // Test: Archetype detection for Nongshim
  const archetypes = [
    { name: 'Shin Ramyun', brand: 'Nongshim', cat: 'en:instant-noodles' },
    { name: 'Chicken Flavor Ramen', brand: 'Nissin Top Ramen', cat: 'en:instant-noodles' },
    { name: 'Instant Noodles', brand: 'Maruchan', cat: undefined },
    { name: 'Cup Noodles Spicy', brand: 'Nissin', cat: 'en:ramen-noodles' },
    { name: 'Buldak Spicy Noodle', brand: 'Samyang', cat: 'en:instant-noodles' },
    // Negative tests
    { name: 'Tropicana Orange Juice', brand: 'PepsiCo', cat: 'en:fruit-juices' },
    { name: 'Some Unknown Random Food XYZ', brand: 'Unknown Brand', cat: undefined },
  ];

  for (const item of archetypes) {
    const result = deduceFunctionalArchetype(item.name, item.brand, item.cat);
    const expected = item.name.toLowerCase().includes('juice') ? 'fruit_juice' :
                     (item.cat === undefined && item.brand === 'Unknown Brand') ? 'no_match' : 'instant_noodles';
    const passed = result.archetype === expected;
    console.log(`${passed ? '✅' : '❌'} "${item.name}" by ${item.brand} => archetype: ${result.archetype}`);
  }

  console.log('\n--- Testing lookupAlternatives for Shin Ramyun ---\n');
  const shinResult = await lookupAlternatives(
    'en:instant-noodles',
    {
      name: 'Shin Ramyun',
      brand: 'Nongshim',
      sugarPer100g: 3.5,
      novaClass: 4,
      additiveCount: 8,
      additives: [
        { tag: 'en:e621', displayName: 'MSG (E621)', functionLabel: 'Flavor Enhancer', riskLevel: 'elevated' },
        { tag: 'en:e627', displayName: 'Disodium Guanylate (E627)', functionLabel: 'Flavor Enhancer', riskLevel: 'elevated' },
      ],
      biteFixScore: 28,
    } as any,
    signal
  );
  console.log(`Found ${shinResult.length} alternatives for Shin Ramyun:`);
  shinResult.forEach((item, index) => {
    console.log(`  ${index + 1}. [${item.brand}] ${item.name} | NOVA: ${item.novaClass} | BiteFix: ${item.biteFixScore}`);
  });
  const shinPassed = shinResult.length > 0 && shinResult.some(r => r.name.toLowerCase().includes('noodle') || r.name.toLowerCase().includes('ramen') || r.name.toLowerCase().includes('konjac'));
  console.log(shinPassed ? '\n✅ Noodle substitute test PASSED! Ramen/noodle alternatives returned.' : '\n❌ Noodle substitute test FAILED.');

  console.log('\n--- Testing lookupAlternatives returns EMPTY for unrecognized product ---\n');
  const unknownResult = await lookupAlternatives(
    'unknown',
    {
      name: 'Some Completely Unknown XYZ Product 9999',
      brand: 'Unknown Brand',
      sugarPer100g: 10,
      novaClass: 4,
      biteFixScore: 30,
    } as any,
    signal
  );
  const emptyPassed = unknownResult.length === 0;
  console.log(emptyPassed ? '✅ Unknown product correctly returns empty (no cross-category suggestion).' : `❌ Should return empty but returned ${unknownResult.length} items:`);
  if (!emptyPassed) unknownResult.forEach(r => console.log(`  - ${r.name}`));
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
});
