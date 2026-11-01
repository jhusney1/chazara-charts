const test = require('node:test');
const assert = require('node:assert');

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

async function pdfPageCount(response) {
  const buffer = Buffer.from(await response.arrayBuffer());
  const matches = buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 0;
}

const pages = (count) => Array.from({ length: count }, (_, i) => String(i + 2));

test('PDF responses report page and row counts in headers', async () => {
  const response = await post('/api/create-pdf', {
    tractates: ['Berachot'],
    reviews: 3,
    pages: pages(5),
    includeDateColumn: true,
    startDate: '2026-08-16'
  });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get('x-chart-rows'), '5');
  assert.strictEqual(response.headers.get('x-chart-pages'), '1');
  assert.strictEqual(await pdfPageCount(response), 1, 'header matches the real page count');
});

test('X-Chart-Pages grows with a long chart and matches the PDF', async () => {
  const response = await post('/api/mishna-berura-pdf', {
    section: 'Chelek 1',
    topic: 'Laws of Tzitzit',
    reviews: 3,
    pages: pages(120),
    columnsPerPage: 1,
    includeDateColumn: true,
    startDate: '2026-08-16'
  });
  const headerPages = Number(response.headers.get('x-chart-pages'));
  assert.ok(headerPages > 1, `expected several pages, got ${headerPages}`);
  assert.strictEqual(await pdfPageCount(response), headerPages);
  assert.strictEqual(response.headers.get('x-chart-rows'), '120');
});

test('X-Chart-Rows counts perek heading rows too', async () => {
  const response = await post('/api/create-pdf', {
    tractates: ['Berachot'],
    reviews: 2,
    pages: ['12', '13', '14'],
    includePerakim: true
  });
  assert.strictEqual(response.headers.get('x-chart-rows'), '4');
});

test('Excel responses are unaffected', async () => {
  const response = await post('/api/create-excel', { tractates: ['Berachot'], pages: pages(3) });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get('x-chart-pages'), null);
});
