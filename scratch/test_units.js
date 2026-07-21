const { parseQuantityString } = require('../src/utils/scannerAPI');
const { formatWeight } = require('../src/utils/format');

let failed = false;

function assertEqual(actual, expected, description) {
  if (actual === expected) {
    console.log(`✅ PASS: ${description} (got: "${actual}")`);
  } else {
    console.error(`❌ FAIL: ${description} (expected: "${expected}", got: "${actual}")`);
    failed = true;
  }
}

function assertClose(actual, expected, tolerance, description) {
  if (actual === null || expected === null) {
    if (actual === expected) {
      console.log(`✅ PASS: ${description} (both null)`);
    } else {
      console.error(`❌ FAIL: ${description} (expected: ${expected}, got: ${actual})`);
      failed = true;
    }
    return;
  }
  if (Math.abs(actual - expected) <= tolerance) {
    console.log(`✅ PASS: ${description} (got: ${actual}, expected: ${expected})`);
  } else {
    console.error(`❌ FAIL: ${description} (expected: ${expected}, got: ${actual}, diff: ${Math.abs(actual - expected)})`);
    failed = true;
  }
}

console.log('--- Testing parseQuantityString ---');
assertClose(parseQuantityString("500 g"), 500, 0.01, "Parse 500 g");
assertClose(parseQuantityString("1 kg"), 1000, 0.01, "Parse 1 kg");
assertClose(parseQuantityString("1.5 lb"), 680.39, 0.1, "Parse 1.5 lb");
assertClose(parseQuantityString("2 lbs"), 907.18, 0.1, "Parse 2 lbs");
assertClose(parseQuantityString("6 x 1.5 lbs"), 4082.33, 0.5, "Parse multi-pack 6 x 1.5 lbs");
assertClose(parseQuantityString("12 fl oz"), 354.88, 0.1, "Parse 12 fl oz");
assertClose(parseQuantityString("16 oz"), 453.59, 0.1, "Parse 16 oz");
assertClose(parseQuantityString("140"), 140, 0.01, "Parse raw number 140");

console.log('\n--- Testing formatWeight ---');
assertEqual(formatWeight("100 g", "oz"), "3.53 oz", "Format 100g to oz");
assertEqual(formatWeight("500 g", "oz"), "1.1 lb", "Format 500g (>=16oz) to oz/lb");
assertEqual(formatWeight("1000 g", "oz"), "2.2 lb", "Format 1000g to oz/lb");
assertEqual(formatWeight("12 fl oz", "oz"), "12 fl oz", "Format 12 fl oz to fl oz");
assertEqual(formatWeight("20 fl oz", "oz"), "20 fl oz", "Format 20 fl oz to fl oz");
assertEqual(formatWeight("100 g", "g"), "100 g", "Format 100g to g");
assertEqual(formatWeight("1000 g", "g"), "1 kg", "Format 1000g to g/kg");
assertEqual(formatWeight("1.5 lb", "g"), "680 g", "Format 1.5 lb to g");
assertEqual(formatWeight("3 lbs", "g"), "1.4 kg", "Format 3 lbs to g/kg");

if (failed) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY');
}
