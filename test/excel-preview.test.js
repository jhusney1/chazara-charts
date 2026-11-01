const test = require('node:test');
const assert = require('node:assert');

const ExcelJS = require('exceljs');

const app = require('../app');
const { workbookToGrid, argbToHex, columnNumber } = require('../lib/excelPreview');

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

async function post(endpoint, body) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response;
}

async function readWorkbook(response) {
  const buffer = Buffer.from(await response.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook.worksheets[0];
}

const GEMARA = {
  tractates: ['Berachot'],
  reviews: 2,
  pages: ['12', '13', '14'],
  includeDateColumn: true,
  startDate: '2026-08-16',
  includePerakim: true
};

test('helpers convert colours and column letters', () => {
  assert.strictEqual(argbToHex('FFE0E7FF'), '#e0e7ff');
  assert.strictEqual(argbToHex('4338CA'), '#4338ca');
  assert.strictEqual(argbToHex(undefined), null);
  assert.strictEqual(columnNumber('A'), 1);
  assert.strictEqual(columnNumber('Z'), 26);
  assert.strictEqual(columnNumber('AA'), 27);
});

test('workbookToGrid reports merges, fills and bold', () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Demo');
  sheet.getCell(1, 1).value = 'Daf';
  sheet.mergeCells(2, 1, 2, 3);
  sheet.getCell(2, 1).value = 'Perek 1';
  sheet.getCell(2, 1).font = { bold: true };
  sheet.getCell(2, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
  sheet.getColumn(1).width = 8;

  const grid = workbookToGrid(workbook);
  assert.strictEqual(grid.sheetName, 'Demo');
  assert.strictEqual(grid.rowCount, 2);
  assert.strictEqual(grid.columnCount, 3);
  assert.strictEqual(grid.columnWidths[0], 8);
  assert.deepStrictEqual(grid.rows[1].map((cell) => (cell ? cell.v : null)), ['Perek 1', null, null]);
  assert.strictEqual(grid.rows[1][0].colSpan, 3);
  assert.strictEqual(grid.rows[1][0].b, true);
  assert.strictEqual(grid.rows[1][0].fill, '#e0e7ff');
});

test('the Gemara preview grid matches the downloaded workbook', async () => {
  const grid = await (await post('/api/create-excel-preview', GEMARA)).json();
  const sheet = await readWorkbook(await post('/api/create-excel', GEMARA));

  assert.strictEqual(grid.rowCount, sheet.rowCount);
  assert.strictEqual(grid.columnCount, sheet.columnCount);
  assert.deepStrictEqual(grid.rows[0].map((cell) => cell.v), ['Daf', 'Date', '1', '2']);
  assert.strictEqual(grid.rows[0][0].fill, '#4338ca', 'header fill from the gemara theme');
  assert.strictEqual(grid.rows[0][0].color, '#ffffff');

  // Row 3 is the perek heading: one merged cell across the block.
  assert.strictEqual(grid.rows[2][0].v, 'Perek 2 - Hayah Korei');
  assert.strictEqual(grid.rows[2][0].colSpan, 4);
  assert.deepStrictEqual(grid.rows[2].slice(1), [null, null, null]);

  assert.strictEqual(grid.rows[1][1].v, '8/16/2026');
  assert.strictEqual(grid.rows[3][1].v, '8/17/2026');
  assert.strictEqual(grid.frozenRows, 1);
});

test('Mishnayot and Mishna Berura preview grids include their title rows', async () => {
  const mishnayot = await (await post('/api/mishnayot-excel-preview', {
    seder: 'Moed', tractate: 'Sukkah', pages: ['1', '2'], chaptersPerDay: true
  })).json();
  assert.strictEqual(mishnayot.rows[0][0].v, 'Mishnayot: Sukkah (Moed)');
  assert.strictEqual(mishnayot.rows[0][0].colSpan, mishnayot.columnCount);

  const mb = await (await post('/api/mishna-berura-excel-preview', {
    section: 'Chelek 1', topic: 'Laws of Tzitzit', pages: ['8', '9']
  })).json();
  assert.strictEqual(mb.rows[0][0].v, 'Mishna Berura: Laws of Tzitzit (Chelek 1)');
  assert.ok(mb.rows.some((row) => row[0] && row[0].v === 'Siman'), 'header row present');
});

test('preview endpoints validate like the download endpoints', async () => {
  const response = await post('/api/create-excel-preview', { tractates: [], pages: [] });
  assert.strictEqual(response.status, 400);
  const body = await response.json();
  assert.ok(body.error);
});
