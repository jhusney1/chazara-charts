const test = require('node:test');
const assert = require('node:assert');

const { convertToHebrew } = require('../data/hebrewUtils');

test('converts basic numbers to Hebrew numerals', () => {
  assert.strictEqual(convertToHebrew('1'), 'א');
  assert.strictEqual(convertToHebrew('2'), 'ב');
  assert.strictEqual(convertToHebrew('10'), 'י');
  assert.strictEqual(convertToHebrew('11'), 'יא');
  assert.strictEqual(convertToHebrew('64'), 'סד');
  assert.strictEqual(convertToHebrew('100'), 'ק');
  assert.strictEqual(convertToHebrew('157'), 'קנז');
  assert.strictEqual(convertToHebrew('176'), 'קעו');
});

test('builds hundreds correctly above 400', () => {
  assert.strictEqual(convertToHebrew('400'), 'ת');
  assert.strictEqual(convertToHebrew('500'), 'תק');
  assert.strictEqual(convertToHebrew('600'), 'תר');
  assert.strictEqual(convertToHebrew('697'), 'תרצז');
});

// Numbers whose last two digits are 15 or 16 must not be spelled with
// yud+hey / yud+vav, which would spell a divine name. Mishna Berura simanim
// run to 697, so this applies well beyond the 15/16/115/116 base cases.
test('never spells a divine name for any number ending in 15 or 16', () => {
  const expected = {
    15: 'טו',
    16: 'טז',
    115: 'קטו',
    116: 'קטז',
    215: 'רטו',
    216: 'רטז',
    315: 'שטו',
    316: 'שטז',
    415: 'תטו',
    416: 'תטז',
    515: 'תקטו',
    516: 'תקטז',
    615: 'תרטו',
    616: 'תרטז'
  };

  for (const [num, hebrew] of Object.entries(expected)) {
    const actual = convertToHebrew(String(num));
    assert.strictEqual(actual, hebrew, `${num} should be ${hebrew}, got ${actual}`);
  }
});

test('no number in the full siman range spells a divine name', () => {
  for (let n = 1; n <= 697; n++) {
    const hebrew = convertToHebrew(String(n));
    assert.ok(!hebrew.includes('יה'), `${n} -> ${hebrew} contains יה`);
    assert.ok(!hebrew.includes('יו'), `${n} -> ${hebrew} contains יו`);
  }
});

test('appends amud notation', () => {
  assert.strictEqual(convertToHebrew('2a'), 'ב.');
  assert.strictEqual(convertToHebrew('2b'), 'ב:');
  assert.strictEqual(convertToHebrew('15a'), 'טו.');
  assert.strictEqual(convertToHebrew('15b'), 'טו:');
  assert.strictEqual(convertToHebrew('115b'), 'קטו:');
});

test('accepts numeric input without throwing', () => {
  assert.strictEqual(convertToHebrew(5), 'ה');
  assert.strictEqual(convertToHebrew(15), 'טו');
});

test('passes through values it cannot convert', () => {
  assert.strictEqual(convertToHebrew('3:7'), 'ג:ז');
  assert.strictEqual(convertToHebrew(''), '');
  assert.strictEqual(convertToHebrew(null), null);
  assert.strictEqual(convertToHebrew(undefined), undefined);
});
