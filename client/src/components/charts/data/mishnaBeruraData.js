/**
 * Mishna Berura data: the six printed volumes (chalakim) and the halachic
 * topics inside each, with the simanim of Shulchan Aruch Orach Chaim they
 * cover.
 *
 * Topic names and ranges follow Sefaria's Orach Chayim topic index
 * (api/v2/index/Shulchan_Arukh,_Orach_Chayim -> alts.Topic). The volume
 * split follows the standard six-volume edition of the Mishna Berura:
 *   Chelek 1: 1-127     Chelek 2: 128-241   Chelek 3: 242-344
 *   Chelek 4: 345-428   Chelek 5: 429-494   Chelek 6: 495-697
 */

const mishnaBeruraData = {
  'Chelek 1': {
    'Laws Upon Awakening in the Morning': { start: 1, end: 7, heName: 'הלכות הנהגת האדם בבוקר' },
    'Laws of Tzitzit': { start: 8, end: 24, heName: 'הלכות ציצית' },
    'Laws of Tefillin': { start: 25, end: 46, heName: 'הלכות תפילין' },
    'Laws of Morning Blessings': { start: 47, end: 57, heName: 'הלכות ברכות השחר ושאר ברכות' },
    'Laws of Reciting Shema': { start: 58, end: 88, heName: 'הלכות קריאת שמע' },
    'Laws of Prayer': { start: 89, end: 127, heName: 'הלכות תפילה' }
  },
  'Chelek 2': {
    'Laws of the Priestly Blessing': { start: 128, end: 135, heName: 'הלכות נשיאת כפים' },
    'Laws of Reading the Torah': { start: 136, end: 149, heName: 'הלכות קריאת התורה' },
    'Laws of the Synagogue': { start: 150, end: 156, heName: 'הלכות בית הכנסת' },
    "Laws of Washing One's Hands for a Meal": { start: 157, end: 165, heName: 'הלכות נטילת ידים' },
    'Laws of the Meal': { start: 166, end: 201, heName: 'הלכות סעודה' },
    'Laws of Blessings on Fruit': { start: 202, end: 214, heName: 'הלכות ברכת הפירות' },
    'Laws of Other Blessings': { start: 215, end: 241, heName: 'הלכות שאר ברכות' }
  },
  'Chelek 3': {
    'Laws of Shabbat': { start: 242, end: 344, heName: 'הלכות שבת' }
  },
  'Chelek 4': {
    'Laws of Eruvin': { start: 345, end: 395, heName: 'הלכות ערובין' },
    'Laws of Techumin': { start: 396, end: 407, heName: 'הלכות תחומין' },
    'Laws of Eruv Techumin': { start: 408, end: 416, heName: 'הלכות עירובי תחומין' },
    'Laws of Rosh Chodesh': { start: 417, end: 428, heName: 'הלכות ראש חודש' }
  },
  'Chelek 5': {
    'Laws of Passover': { start: 429, end: 494, heName: 'הלכות פסח' }
  },
  'Chelek 6': {
    'Laws of the Festivals': { start: 495, end: 529, heName: 'הלכות יום טוב' },
    'Laws of Chol HaMoed': { start: 530, end: 548, heName: 'הלכות חול המועד' },
    'Laws of the Ninth of Av': { start: 549, end: 561, heName: 'הלכות תשעה באב' },
    'Laws of Fast Days': { start: 562, end: 580, heName: 'הלכות תענית' },
    'Laws of Rosh Hashanah': { start: 581, end: 603, heName: 'הלכות ראש השנה' },
    'Laws of Yom Kippur': { start: 604, end: 624, heName: 'הלכות יום הכיפורים' },
    'Laws of Sukkot': { start: 625, end: 644, heName: 'הלכות סוכה' },
    'Laws of the Four Species': { start: 645, end: 669, heName: 'הלכות לולב' },
    'Laws of Chanukah': { start: 670, end: 685, heName: 'הלכות חנוכה' },
    'Laws of Purim': { start: 686, end: 697, heName: 'הלכות מגילה' }
  }
};

/**
 * Every siman in order with the chelek and topic it belongs to:
 * [{ siman: 1, chelek: 'Chelek 1', topic: 'Laws Upon Awakening in the Morning', heName }, ...]
 */
export const simanIndex = Object.entries(mishnaBeruraData).flatMap(([chelek, topics]) =>
  Object.entries(topics).flatMap(([topic, { start, end, heName }]) =>
    Array.from({ length: end - start + 1 }, (_, offset) => ({
      siman: start + offset,
      chelek,
      topic,
      heName
    }))
  )
);

/** Lookup of a siman number to its { chelek, topic, heName }; undefined when out of range. */
export const simanInfo = (siman) => simanIndex[Number(siman) - 1];

export default mishnaBeruraData;
