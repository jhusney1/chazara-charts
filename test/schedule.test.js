const test = require('node:test');
const assert = require('node:assert');

const ExcelJS = require('exceljs');

const app = require('../app');
const { toSkipDays, scheduleDates, parseLocalDate, formatDate } = require('../lib/normalize');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  if (server) server.close();
});

function post(endpoint, body) {
  return fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function dateColumn(response) {
  const buffer = Buffer.from(await response.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  // Charts with a title block have the header further down, so pick out the
  // date-shaped cells rather than assuming a row number.
  const dates = [];
  sheet.eachRow((row) => {
    const value = row.getCell(2).value;
    if (typeof value === 'string' && /^\d+\/\d+\/\d{4}$/.test(value)) dates.push(value);
  });
  return dates;
}

// 2026-08-16 is a Sunday.
const SUNDAY = '2026-08-16';

const GEMARA = {
  tractates: ['Berachot'],
  reviews: 2,
  pages: ['2', '3', '4', '5', '6', '7'],
  columnsPerPage: 1,
  includeDateColumn: true,
  startDate: SUNDAY
};

test('toSkipDays accepts arrays and strings and drops junk', () => {
  assert.deepStrictEqual(toSkipDays([6, 5, 5]), [5, 6]);
  assert.deepStrictEqual(toSkipDays('5,6'), [5, 6]);
  assert.deepStrictEqual(toSkipDays(['0', 'x', 7, -1, 3.9]), [0, 3]);
  assert.deepStrictEqual(toSkipDays(undefined), []);
  assert.deepStrictEqual(toSkipDays(null), []);
});

test('toSkipDays ignores a selection of every weekday', () => {
  assert.deepStrictEqual(toSkipDays([0, 1, 2, 3, 4, 5, 6]), []);
});

test('scheduleDates passes over the chosen weekdays', () => {
  const dates = scheduleDates(parseLocalDate(SUNDAY), 6, [5, 6]).map(formatDate);
  assert.deepStrictEqual(dates, ['8/16/2026', '8/17/2026', '8/18/2026', '8/19/2026', '8/20/2026', '8/23/2026']);
});

test('scheduleDates moves a start date that falls on a skipped day', () => {
  const dates = scheduleDates(parseLocalDate(SUNDAY), 2, [0]).map(formatDate);
  assert.deepStrictEqual(dates, ['8/17/2026', '8/18/2026']);
});

test('scheduleDates with no skipped days is consecutive and never loops on all seven', () => {
  assert.deepStrictEqual(scheduleDates(parseLocalDate(SUNDAY), 3, []).map(formatDate), ['8/16/2026', '8/17/2026', '8/18/2026']);
  assert.deepStrictEqual(scheduleDates(parseLocalDate(SUNDAY), 2, [0, 1, 2, 3, 4, 5, 6]).map(formatDate), ['8/16/2026', '8/17/2026']);
  assert.deepStrictEqual(scheduleDates(parseLocalDate(SUNDAY), 0, [0]), []);
});

test('Excel date column skips Friday and Shabbat when asked', async () => {
  const dates = await dateColumn(await post('/api/create-excel', { ...GEMARA, skipDays: [5, 6] }));
  assert.deepStrictEqual(dates, ['8/16/2026', '8/17/2026', '8/18/2026', '8/19/2026', '8/20/2026', '8/23/2026']);
});

test('Excel date column is unchanged when no days are skipped', async () => {
  const dates = await dateColumn(await post('/api/create-excel', GEMARA));
  assert.deepStrictEqual(dates, ['8/16/2026', '8/17/2026', '8/18/2026', '8/19/2026', '8/20/2026', '8/21/2026']);
});

test('skipped days combine with perek headings, which still take no day', async () => {
  const response = await post('/api/create-excel', {
    ...GEMARA,
    pages: ['12', '13'],
    includePerakim: true,
    skipDays: [0]
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  assert.strictEqual(sheet.getRow(2).getCell(1).value, '12');
  assert.strictEqual(sheet.getRow(2).getCell(2).value, '8/17/2026');
  assert.strictEqual(sheet.getRow(3).getCell(1).value, 'Perek 2 - Hayah Korei');
  assert.strictEqual(sheet.getRow(4).getCell(1).value, '13');
  assert.strictEqual(sheet.getRow(4).getCell(2).value, '8/18/2026');
});

test('every chart type honours skipDays in Excel and renders a PDF', async () => {
  const cases = [
    ['/api/mishnayot-excel', '/api/mishnayot-pdf', { seder: 'Moed', tractate: 'Sukkah', pages: ['1', '2'], chaptersPerDay: true }],
    ['/api/mishna-berura-excel', '/api/mishna-berura-pdf', { section: 'Chelek 1', topic: 'Laws of Tzitzit', pages: ['8', '9'] }]
  ];

  for (const [excelEndpoint, pdfEndpoint, extra] of cases) {
    const body = { ...extra, reviews: 2, columnsPerPage: 1, includeDateColumn: true, startDate: SUNDAY, skipDays: [0] };
    const dates = await dateColumn(await post(excelEndpoint, body));
    assert.deepStrictEqual(dates, ['8/17/2026', '8/18/2026'], excelEndpoint);

    const pdf = await post(pdfEndpoint, body);
    assert.strictEqual(pdf.status, 200, pdfEndpoint);
    assert.ok(pdf.headers.get('content-type').includes('application/pdf'));
  }
});
