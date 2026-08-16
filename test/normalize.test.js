const test = require('node:test');
const assert = require('node:assert');

const {
  ValidationError,
  toInt,
  toBool,
  parseLocalDate,
  formatDate,
  addDays,
  normalizeChartRequest,
  safeFilename
} = require('../lib/normalize');

test('toInt coerces the strings HTML form controls produce', () => {
  const bounds = { min: 1, max: 10, fallback: 3 };
  assert.strictEqual(toInt('3', bounds), 3);
  assert.strictEqual(toInt(3, bounds), 3);
  assert.strictEqual(toInt('abc', bounds), 3, 'unparseable falls back');
  assert.strictEqual(toInt(undefined, bounds), 3);
  assert.strictEqual(toInt('99', bounds), 10, 'clamps to max');
  assert.strictEqual(toInt('-5', bounds), 1, 'clamps to min');
});

test('normalized reviews is a number, so arithmetic cannot concatenate', () => {
  const { reviews } = normalizeChartRequest({ pages: ['1'], reviews: '3' });
  assert.strictEqual(typeof reviews, 'number');
  assert.strictEqual(reviews + 2, 5, 'must be 5, not the string "32"');
});

test('toBool treats string "false" as false', () => {
  assert.strictEqual(toBool('false', true), false);
  assert.strictEqual(toBool('0', true), false);
  assert.strictEqual(toBool('true', false), true);
  assert.strictEqual(toBool(undefined, true), true);
  assert.strictEqual(toBool(false, true), false);
});

test('parseLocalDate keeps the requested calendar day in any timezone', () => {
  const original = process.env.TZ;
  try {
    for (const tz of ['America/New_York', 'America/Los_Angeles', 'Asia/Jerusalem', 'UTC']) {
      process.env.TZ = tz;
      const date = parseLocalDate('2026-08-16');
      assert.strictEqual(
        formatDate(date),
        '8/16/2026',
        `${tz} must render the requested day, not the day before`
      );
    }
  } finally {
    process.env.TZ = original;
  }
});

test('parseLocalDate falls back to today for invalid input', () => {
  const date = parseLocalDate('not-a-date');
  assert.ok(!Number.isNaN(date.getTime()));
});

test('addDays does not mutate its input', () => {
  const start = parseLocalDate('2026-08-16');
  const next = addDays(start, 1);
  assert.strictEqual(formatDate(start), '8/16/2026');
  assert.strictEqual(formatDate(next), '8/17/2026');
});

test('addDays crosses a DST boundary without slipping a day', () => {
  const original = process.env.TZ;
  try {
    process.env.TZ = 'America/New_York';
    // US DST ends 2026-11-01.
    let date = parseLocalDate('2026-10-31');
    const seen = [];
    for (let i = 0; i < 4; i++) {
      seen.push(formatDate(date));
      date = addDays(date, 1);
    }
    assert.deepStrictEqual(seen, ['10/31/2026', '11/1/2026', '11/2/2026', '11/3/2026']);
  } finally {
    process.env.TZ = original;
  }
});

test('rejects an empty or oversized item list', () => {
  assert.throws(() => normalizeChartRequest({ pages: [] }), ValidationError);
  assert.throws(() => normalizeChartRequest({}), ValidationError);
  assert.throws(
    () => normalizeChartRequest({ pages: new Array(5000).fill('1') }),
    ValidationError
  );
});

test('safeFilename strips characters that break Content-Disposition', () => {
  assert.strictEqual(safeFilename('Laws of Shabbat'), 'laws-of-shabbat');
  assert.strictEqual(safeFilename('a"b;c\\d'), 'a-b-c-d');
  assert.strictEqual(safeFilename(''), 'chazara-chart');
});
