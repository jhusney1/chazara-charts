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
 * Special case numbers that need custom handling
 * to avoid spelling parts of God's name
 */
const specialHebrewNumbers = {
  15: 'טו', // Tet-Vav (not Yud-Hey)
  16: 'טז', // Tet-Zayin (not Yud-Vav)
  115: 'קטו', // Kuf-Tet-Vav (not Kuf-Yud-Hey)
  116: 'קטז', // Kuf-Tet-Zayin (not Kuf-Yud-Vav)
  // Add more special cases as needed
};

/**
 * Converts a numeric input with optional amud marker to Hebrew representation
 * 
 * @param {string} input - Input string like "23" or "23a" or "23b"
 * @returns {string} Hebrew representation with appropriate amud notation
 */
function convertToHebrew(input) {
  // Extract the number and amud part (if present)
  const match = input.match(/(\d+)([ab])?/);
  if (!match) return input;
  
  const num = parseInt(match[1]);
  const amud = match[2]; // This might be undefined if no amud is specified
  
  // Check for special case numbers
  if (specialHebrewNumbers[num]) {
    const hebrewNumber = specialHebrewNumbers[num];
    return amud ? (amud === 'a' ? hebrewNumber + '.' : hebrewNumber + ':') : hebrewNumber;
  }
  
  let hebrewNum = '';
  let remaining = num;
  
  // Convert the number to Hebrew letters
  for (const { value, letter } of hebrewNumerals) {
    while (remaining >= value) {
      hebrewNum += letter;
      remaining -= value;
    }
  }
  
  // Add the amud notation using traditional formatting
  if (amud) {
    // For amud alef (a): add a period to the left of the number
    // For amud bet (b): add a colon to the left of the number
    return amud === 'a' ? hebrewNum + '.' : hebrewNum + ':';
  }
  
  return hebrewNum;
}

module.exports = {
  convertToHebrew,
  hebrewNumerals,
  specialHebrewNumbers
}; 