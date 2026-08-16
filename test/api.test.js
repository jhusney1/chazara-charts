const test = require('node:test');
const assert = require('node:assert');
const zlib = require('node:zlib');

const ExcelJS = require('exceljs');

const app = require('../app');

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

/**
 * Reads back a generated workbook.
 */
async function readWorkbook(response) {
  const buffer = Buffer.from(await response.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook.worksheets[0];
}

/**
 * Counts pages in a generated PDF.
 */
async function pdfPageCount(response) {
  const buffer = Buffer.from(await response.arrayBuffer());
  const matches = buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 0;
}

/**
 * Extracts and decompresses every stream in a PDF.
 */
function inflateStreams(buffer) {
  const chunks = [];
  let index = 0;

  while (index < buffer.length) {
    const start = buffer.indexOf('stream', index);
    if (start < 0) break;
    const end = buffer.indexOf('endstream', start);
    if (end < 0) break;

    let from = start + 6;
    while (buffer[from] === 13 || buffer[from] === 10) from++;

    try {
      chunks.push(zlib.inflateSync(buffer.subarray(from, end)).toString('latin1'));
    } catch {
      chunks.push(buffer.subarray(from, end).toString('latin1'));
    }

    index = end + 9;
  }

  return chunks.join('\n');
}

const GEMARA = {
  tractates: ['Berachot'],
  reviews: '3',
  pages: ['2', '3', '4'],
  useHebrew: false,
  columnsPerPage: '1',
  includeDateColumn: true,
  startDate: '2026-08-16',
  dafPerDay: true
};

const MISHNAYOT = {
  seder: 'Moed',
  tractate: 'Sukkah',
  reviews: '3',
  pages: ['1', '2', '3', '4', '5'],
  columnsPerPage: '1',
  includeDateColumn: true,
  startDate: '2026-08-16',
  chaptersPerDay: true
};

const MISHNA_BERURA = {
  section: 'Chelek 1',
  topic: 'Laws of Tzitzit',
  reviews: '3',
  pages: ['8', '9', '10'],
  columnsPerPage: '1',
  includeDateColumn: true,
  startDate: '2026-08-16'
};

test('GET /api/tractates returns the tractate list', async () => {
  const response = await fetch(`${baseUrl}/api/tractates`);
  assert.strictEqual(response.status, 200);
  const data = await response.json();
  assert.strictEqual(data.Berachot, 64);
});

test('all six chart endpoints return a non-empty document', async () => {
  const cases = [
    ['/api/create-excel', GEMARA, 'spreadsheetml'],
    ['/api/create-pdf', GEMARA, 'application/pdf'],
    ['/api/mishnayot-excel', MISHNAYOT, 'spreadsheetml'],
    ['/api/mishnayot-pdf', MISHNAYOT, 'application/pdf'],
    ['/api/mishna-berura-excel', MISHNA_BERURA, 'spreadsheetml'],
    ['/api/mishna-berura-pdf', MISHNA_BERURA, 'application/pdf']
  ];

  for (const [endpoint, body, expectedType] of cases) {
    const response = await post(endpoint, body);
    assert.strictEqual(response.status, 200, `${endpoint} should return 200`);
    assert.ok(
      response.headers.get('content-type').includes(expectedType),
      `${endpoint} should return ${expectedType}`
    );
    const size = (await response.arrayBuffer()).byteLength;
    assert.ok(size > 500, `${endpoint} returned only ${size} bytes`);
  }
});

// The Mishnayot PDF endpoint previously threw on an undefined font, then tried
// to send JSON after PDFKit had already written bytes, exiting the process.
test('the server survives a Mishnayot PDF request and keeps serving', async () => {
  const response = await post('/api/mishnayot-pdf', MISHNAYOT);
  assert.strictEqual(response.status, 200);
  await response.arrayBuffer();

  const health = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(health.status, 200, 'server must still be alive');
});

// "3" + 2 === "32" produced a 32 column sheet from a 5 column request.
test('string reviews produce exactly the requested column count', async () => {
  const sheet = await readWorkbook(await post('/api/create-excel', { ...GEMARA, reviews: '3' }));
  // Daf + Date + 3 reviews
  assert.strictEqual(sheet.columnCount, 5);
});

test('column count scales correctly with reviews and columnsPerPage', async () => {
  const cases = [
    { reviews: '1', columnsPerPage: '1', includeDateColumn: false, expected: 2 },
    { reviews: '5', columnsPerPage: '1', includeDateColumn: true, expected: 7 },
    { reviews: '3', columnsPerPage: '2', includeDateColumn: true, expected: 10 },
    { reviews: 10, columnsPerPage: 1, includeDateColumn: false, expected: 11 }
  ];

  for (const { expected, ...overrides } of cases) {
    const sheet = await readWorkbook(
      await post('/api/create-excel', { ...GEMARA, pages: ['2', '3', '4', '5'], ...overrides })
    );
    assert.strictEqual(
      sheet.columnCount,
      expected,
      `reviews=${overrides.reviews} cols=${overrides.columnsPerPage} should give ${expected}`
    );
  }
});

test('no bordered cells exist beyond the data area', async () => {
  const sheet = await readWorkbook(await post('/api/create-excel', GEMARA));
  let bordered = 0;
  sheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      if (cell.border && cell.border.top) bordered++;
    });
  });
  // 4 rows (header + 3 daf) x 5 columns
  assert.strictEqual(bordered, 20);
});

// new Date('2026-08-16') is UTC midnight; formatting it west of Greenwich gave
// the previous day.
test('the date column starts on the requested date in any timezone', async () => {
  const original = process.env.TZ;
  try {
    for (const tz of ['America/New_York', 'America/Los_Angeles', 'Asia/Jerusalem', 'UTC']) {
      process.env.TZ = tz;
      const sheet = await readWorkbook(
        await post('/api/create-excel', { ...GEMARA, startDate: '2026-08-16' })
      );
      assert.strictEqual(sheet.getCell(2, 2).value, '8/16/2026', `wrong first date in ${tz}`);
      assert.strictEqual(sheet.getCell(3, 2).value, '8/17/2026', `wrong second date in ${tz}`);
    }
  } finally {
    process.env.TZ = original;
  }
});

// 103 rows previously produced a 169 page PDF of scattered fragments.
test('large charts paginate sanely instead of exploding', async () => {
  const pages = Array.from({ length: 103 }, (_, i) => String(242 + i));
  const response = await post('/api/mishna-berura-pdf', {
    ...MISHNA_BERURA,
    topic: 'Laws of Shabbat',
    pages
  });

  assert.strictEqual(response.status, 200);
  const count = await pdfPageCount(response);
  assert.ok(count >= 1 && count <= 8, `expected a handful of pages, got ${count}`);
});

test('small charts produce exactly one page, with no blank trailing pages', async () => {
  for (const [endpoint, body] of [
    ['/api/create-pdf', GEMARA],
    ['/api/mishnayot-pdf', MISHNAYOT],
    ['/api/mishna-berura-pdf', MISHNA_BERURA]
  ]) {
    const count = await pdfPageCount(await post(endpoint, body));
    assert.strictEqual(count, 1, `${endpoint} should produce 1 page, got ${count}`);
  }
});

test('Hebrew text is embedded with a font that can represent it', async () => {
  const response = await post('/api/create-pdf', { ...GEMARA, useHebrew: true });
  const buffer = Buffer.from(await response.arrayBuffer());

  // The PDF standard 14 fonts are WinAnsi encoded and cannot carry Hebrew, so
  // a real TrueType font must be embedded and subset.
  assert.ok(/FontFile2/.test(buffer.toString('latin1')), 'expected an embedded TrueType font');

  // The ToUnicode CMap should map the subset glyphs back to Hebrew codepoints,
  // which both proves the glyphs are Hebrew and keeps the PDF searchable.
  // It lives in a compressed stream, so it has to be inflated first.
  const streams = inflateStreams(buffer);
  assert.ok(
    /<05d[0-9a-f]>/i.test(streams),
    'expected Hebrew codepoints in the ToUnicode map'
  );
});

test('Latin-only charts do not embed the Hebrew font', async () => {
  const response = await post('/api/create-pdf', { ...GEMARA, useHebrew: false });
  const raw = Buffer.from(await response.arrayBuffer()).toString('latin1');
  assert.ok(!/FontFile2/.test(raw), 'no TrueType subset should be needed for Latin text');
});

// Custom siman range mode sends no chelek, which the server used to reject.
test('a chart with no section still generates', async () => {
  const response = await post('/api/mishna-berura-excel', {
    ...MISHNA_BERURA,
    section: '',
    topic: 'Simanim 10-20',
    pages: ['10', '11', '12']
  });
  assert.strictEqual(response.status, 200);
});

test('invalid input is rejected with 400 rather than 500 or silent garbage', async () => {
  const cases = [
    ['/api/create-excel', { ...GEMARA, tractates: [] }],
    ['/api/create-excel', { ...GEMARA, pages: [] }],
    ['/api/mishnayot-excel', { ...MISHNAYOT, tractate: '' }],
    ['/api/mishna-berura-excel', { ...MISHNA_BERURA, topic: '' }],
    ['/api/create-excel', { ...GEMARA, pages: new Array(5000).fill('1') }]
  ];

  for (const [endpoint, body] of cases) {
    const response = await post(endpoint, body);
    assert.strictEqual(response.status, 400, `${endpoint} should reject this body`);
    const json = await response.json();
    assert.ok(json.error, 'expected an error message');
    assert.ok(!json.stack, 'must not leak a stack trace');
  }
});

test('out-of-range numbers are clamped rather than trusted', async () => {
  const sheet = await readWorkbook(
    await post('/api/create-excel', { ...GEMARA, reviews: 9999, includeDateColumn: false })
  );
  // Clamped to the documented maximum of 10 reviews, plus the daf column.
  assert.strictEqual(sheet.columnCount, 11);
});

test('garbage columnsPerPage falls back instead of producing an empty chart', async () => {
  const response = await post('/api/create-pdf', { ...GEMARA, columnsPerPage: 'abc' });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(await pdfPageCount(response), 1);
});
