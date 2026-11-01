/**
 * Request normalization and validation.
 *
 * HTML form controls always yield strings, so `reviews` arrives as "3" rather
 * than 3. Arithmetic on that string silently produces concatenation ("3" + 2
 * === "32"), which previously turned every generated spreadsheet into a 32
 * column grid. Everything crossing the route boundary is coerced here so the
 * renderers only ever see real numbers, booleans and Dates.
 */

const { limits } = require('../data/chartConfig');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/**
 * Coerces to an integer within bounds, falling back when absent or unparseable.
 */
function toInt(value, { min, max, fallback }) {
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

/**
 * Coerces to a boolean, treating the string forms a form or query string
 * produces ("false", "0") as false rather than as truthy strings.
 */
function toBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return !['false', '0', 'no', 'off'].includes(value.toLowerCase());
  return Boolean(value);
}

/**
 * Parses a YYYY-MM-DD string as local midnight.
 *
 * `new Date('2026-08-16')` is parsed as UTC midnight, so formatting it in any
 * timezone west of Greenwich yields the previous day. Every date in the chart
 * was one day early for users on a server anywhere in the Americas.
 */
function parseLocalDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value;
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  // Fall back to today at local midnight.
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Formats a Date as M/D/YYYY.
 *
 * Deliberately explicit rather than toLocaleDateString(), whose output depends
 * on the server's locale and so differed between environments.
 */
function formatDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

/**
 * Returns a new Date advanced by `days`, without mutating the input.
 */
function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Normalizes the weekdays reserved for chazara (0 = Sunday ... 6 = Shabbat).
 *
 * Accepts an array or a comma separated string, drops anything that is not a
 * weekday number, and ignores a selection of all seven days, which would
 * otherwise leave no day to schedule anything on.
 */
function toSkipDays(value) {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const days = [...new Set(list.map((item) => parseInt(item, 10)))]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);

  return days.length === 7 ? [] : days;
}

/**
 * The dates on which `count` consecutive items are learned, starting from
 * `startDate` and passing over any weekday in `skipDays`. A start date that
 * falls on a skipped weekday moves to the next allowed day.
 */
function scheduleDates(startDate, count, skipDays = []) {
  const skip = new Set(skipDays.length === 7 ? [] : skipDays);
  const dates = [];
  let cursor = new Date(startDate.getTime());

  while (dates.length < count) {
    if (!skip.has(cursor.getDay())) dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates;
}

/**
 * Requires a non-empty string, trimmed.
 */
function requireString(value, fieldName) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new ValidationError(`Please provide ${fieldName}`);
  return text;
}

/**
 * Validates and normalizes the item list every chart is built from.
 */
function normalizeItems(pages) {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new ValidationError('Please provide at least one item to include in the chart');
  }

  if (pages.length > limits.maxItems) {
    throw new ValidationError(
      `Charts are limited to ${limits.maxItems} rows; ${pages.length} were requested`
    );
  }

  return pages.map((page) => (page === null || page === undefined ? '' : String(page)));
}

/**
 * Normalizes the settings shared by all six chart endpoints.
 */
function normalizeChartRequest(body = {}) {
  return {
    items: normalizeItems(body.pages),
    reviews: toInt(body.reviews, { ...limits.reviews, fallback: 3 }),
    columnsPerPage: toInt(body.columnsPerPage, { ...limits.columnsPerPage, fallback: 1 }),
    includeDateColumn: toBool(body.includeDateColumn, true),
    useHebrew: toBool(body.useHebrew, false),
    startDate: parseLocalDate(body.startDate),
    skipDays: toSkipDays(body.skipDays)
  };
}

/**
 * Makes a string safe to embed in a Content-Disposition filename.
 */
function safeFilename(value, fallback = 'chazara-chart') {
  const cleaned = String(value || '')
    .replace(/[^a-zA-Z0-9֐-׿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return cleaned || fallback;
}

module.exports = {
  ValidationError,
  toInt,
  toBool,
  parseLocalDate,
  formatDate,
  addDays,
  toSkipDays,
  scheduleDates,
  requireString,
  normalizeItems,
  normalizeChartRequest,
  safeFilename
};
