const test = require('node:test');
const assert = require('node:assert');

const ExcelJS = require('exceljs');

const app = require('../app');
const perakimData = require('../data/perakimData');
const { withPerakim, perekLabel } = require('../lib/perakim');
const { toEntries } = require('../lib/excelChart');

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

async function readWorkbook(response) {
  const buffer = Buffer.from(await response.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook.worksheets[0];
}

// Berachot perek 2 (Hayah Korei) begins on 13a.
const BERACHOT = {
  tractates: ['Berachot'],
  reviews: 2,
  pages: ['12', '13', '14'],
  columnsPerPage: 1,
  includeDateColumn: true,
  startDate: '2026-08-16',
  includePerakim: true
};

test('perakim data covers every tractate with gemara', () => {
  for (const tractate of Object.keys(perakimData)) {
    const perakim = perakimData[tractate];
    assert.ok(Array.isArray(perakim), `${tractate} should be an array`);
    perakim.forEach((perek, index) => {
      assert.strictEqual(perek.number, index + 1, `${tractate} perakim are numbered in order`);
      assert.ok(perek.name && perek.heName, `${tractate} perek ${perek.number} has names`);
      assert.ok(Number.isInteger(perek.daf) && perek.daf >= 2, `${tractate} perek ${perek.number} has a daf`);
      assert.ok(['a', 'b'].includes(perek.amud));
    });
  }
  assert.strictEqual(perakimData.Berachot.length, 9);
  assert.deepStrictEqual(
    { daf: perakimData.Berachot[1].daf, amud: perakimData.Berachot[1].amud },
    { daf: 13, amud: 'a' }
  );
  // Mishnah-only tractates have no gemara perakim on Sefaria.
  assert.deepStrictEqual(perakimData.Middot, []);
});

test('withPerakim inserts a heading before the first page of each perek', () => {
  const items = withPerakim(['12', '13', '14'], 'Berachot', false);
  assert.deepStrictEqual(items, [
    '12',
    { heading: true, label: 'Perek 2 - Hayah Korei' },
    '13',
    '14'
  ]);
});

test('withPerakim matches amud mode exactly and daf mode by containing daf', () => {
  // Tamid perek 1 starts on 25b.
  assert.deepStrictEqual(withPerakim(['25a', '25b'], 'Tamid', false), [
    '25a',
    { heading: true, label: 'Perek 1 - BiShloshah Mekomot' },
    '25b'
  ]);
  assert.strictEqual(withPerakim(['25'], 'Tamid', false).length, 2, 'daf mode: heading before the daf containing 25b');
  // A perek starting on 13a is not placed before 13b.
  assert.deepStrictEqual(withPerakim(['13b'], 'Berachot', false), ['13b']);
});

test('withPerakim leaves pages untouched for tractates without perek data', () => {
  assert.deepStrictEqual(withPerakim(['2', '3'], 'Middot', false), ['2', '3']);
  assert.deepStrictEqual(withPerakim(['2', '3'], 'Not A Tractate', false), ['2', '3']);
});

test('perek labels follow the Hebrew toggle', () => {
  const perek = perakimData.Berachot[1];
  assert.strictEqual(perekLabel(perek, false), 'Perek 2 - Hayah Korei');
  assert.strictEqual(perekLabel(perek, true), 'פרק ב - היה קורא');
});

test('toEntries gives headings a row but no day', () => {
  const entries = toEntries(['2', { heading: true, label: 'Perek 1' }, '3']);
  assert.deepStrictEqual(
    entries.map((entry) => [entry.heading, entry.dayIndex]),
    [[false, 0], [true, null], [false, 1]]
  );
});

test('Excel chart has a perek row with no date and the date sequence skips it', async () => {
  const response = await post('/api/create-excel', BERACHOT);
  assert.strictEqual(response.status, 200);
  const sheet = await readWorkbook(response);

  const labels = [];
  sheet.eachRow((row) => labels.push(row.getCell(1).value));
  assert.deepStrictEqual(labels, ['Daf', '12', 'Perek 2 - Hayah Korei', '13', '14']);

  // The heading is one cell merged across the whole block, so there is no
  // separate date or review cell on that row.
  const perekRow = sheet.getRow(3);
  assert.strictEqual(perekRow.getCell(1).font.bold, true);
  assert.strictEqual(perekRow.getCell(2).isMerged, true, 'date cell is part of the merged heading');
  assert.strictEqual(perekRow.getCell(4).isMerged, true, 'last review cell is part of the merged heading');
  assert.strictEqual(perekRow.getCell(4).master.address, 'A3');
  assert.strictEqual(perekRow.getCell(5).isMerged, false, 'merge stops at the block edge');

  assert.strictEqual(sheet.getRow(2).getCell(2).value, '8/16/2026');
  assert.strictEqual(sheet.getRow(4).getCell(2).value, '8/17/2026', 'day after 12 is 13, not the heading');
  assert.strictEqual(sheet.getRow(5).getCell(2).value, '8/18/2026');
});

test('Excel chart uses the Hebrew perek name when useHebrew is on', async () => {
  const response = await post('/api/create-excel', { ...BERACHOT, useHebrew: true });
  const sheet = await readWorkbook(response);
  assert.strictEqual(sheet.getRow(3).getCell(1).value, 'פרק ב - היה קורא');
  assert.strictEqual(sheet.getRow(2).getCell(1).value, 'יב');
});

test('perek rows are opt-in: omitting includePerakim gives exactly the pages sent', async () => {
  const { includePerakim, ...body } = BERACHOT;
  const sheet = await readWorkbook(await post('/api/create-excel', body));
  const labels = [];
  sheet.eachRow((row) => labels.push(row.getCell(1).value));
  assert.deepStrictEqual(labels, ['Daf', '12', '13', '14']);
});

test('PDF chart renders with perek rows', async () => {
  const response = await post('/api/create-pdf', { ...BERACHOT, pages: ['2', '3', '13', '14'] });
  assert.strictEqual(response.status, 200);
  assert.ok(response.headers.get('content-type').includes('application/pdf'));
  const size = (await response.arrayBuffer()).byteLength;
  assert.ok(size > 1000, `PDF is only ${size} bytes`);
});

test('GET /api/perakim returns the perek data', async () => {
  const response = await fetch(`${baseUrl}/api/perakim`);
  assert.strictEqual(response.status, 200);
  const data = await response.json();
  assert.strictEqual(data.Berachot[0].name, 'MeEimatai');
});
