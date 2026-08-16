/**
 * Hebrew number conversion utilities
 */

// Hebrew letters with their numerical values
const hebrewNumerals = [
  { value: 400, letter: 'ת' },
  { value: 300, letter: 'ש' },
  { value: 200, letter: 'ר' },
  { value: 100, letter: 'ק' },
  { value: 90, letter: 'צ' },
  { value: 80, letter: 'פ' },
  { value: 70, letter: 'ע' },
  { value: 60, letter: 'ס' },
  { value: 50, letter: 'נ' },
  { value: 40, letter: 'מ' },
  { value: 30, letter: 'ל' },
  { value: 20, letter: 'כ' },
  { value: 10, letter: 'י' },
  { value: 9, letter: 'ט' },
  { value: 8, letter: 'ח' },
  { value: 7, letter: 'ז' },
  { value: 6, letter: 'ו' },
  { value: 5, letter: 'ה' },
  { value: 4, letter: 'ד' },
  { value: 3, letter: 'ג' },
  { value: 2, letter: 'ב' },
  { value: 1, letter: 'א' }
];

/**
 * The last two digits 15 and 16 are written tet-vav and tet-zayin rather than
 * yud-hey and yud-vav, which would spell part of a divine name. This is a rule
 * about the remainder, not about specific numbers: it applies equally to 15,
 * 115, 215 ... 615, so it must be derived rather than enumerated.
 */
const remainderOverrides = {
  15: 'טו',
  16: 'טז'
};

/**
 * Converts a non-negative integer to its Hebrew numeral representation.
 *
 * @param {number} num
 * @returns {string} Hebrew numerals, e.g. 215 -> רטו
 */
function numberToHebrew(num) {
  if (!Number.isFinite(num) || num <= 0) return '';

  let result = '';
  let remaining = Math.floor(num);

  // Hundreds are built greedily (500 -> תק, 900 -> תתק).
  for (const { value, letter } of hebrewNumerals) {
    if (value < 100) break;
    while (remaining >= value) {
      result += letter;
      remaining -= value;
    }
  }

  // Tens and units, with the 15/16 override applied to the remainder.
  if (remainderOverrides[remaining]) {
    return result + remainderOverrides[remaining];
  }

  for (const { value, letter } of hebrewNumerals) {
    if (value >= 100) continue;
    while (remaining >= value) {
      result += letter;
      remaining -= value;
    }
  }

  return result;
}

/**
 * Converts a chart item label to its Hebrew representation.
 *
 * Handles the label formats the chart forms produce:
 *   "23"    -> כג          (daf / chapter / siman)
 *   "23a"   -> כג.         (amud alef)
 *   "23b"   -> כג:         (amud bet)
 *   "3:7"   -> ג:ז         (chapter:mishnah)
 *
 * Every numeric run is converted, so compound labels keep all their parts.
 * Anything it cannot interpret is returned unchanged.
 *
 * @param {string|number} input
 * @returns {string|*} Hebrew representation, or the original value
 */
function convertToHebrew(input) {
  if (input === null || input === undefined) return input;

  const text = String(input);
  if (!/\d/.test(text)) return input;

  // Amud markers are a suffix on the final number, not a number themselves.
  const amudMatch = text.match(/^(.*?)([ab])$/);
  const body = amudMatch ? amudMatch[1] : text;
  const amud = amudMatch ? amudMatch[2] : null;

  const converted = body.replace(/\d+/g, (digits) => {
    const hebrew = numberToHebrew(parseInt(digits, 10));
    return hebrew || digits;
  });

  if (!amud) return converted;

  // Amud alef takes a period, amud bet a colon (rendered to the left in RTL).
  return amud === 'a' ? `${converted}.` : `${converted}:`;
}

module.exports = {
  convertToHebrew,
  numberToHebrew,
  hebrewNumerals
};
