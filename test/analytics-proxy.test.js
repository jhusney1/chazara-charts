/**
 * The app serves the Umami tracker and its event endpoint from its own
 * domain (lib/analyticsProxy.js). A stand-in Umami records what reaches it.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const received = [];
const fakeUmami = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    received.push({ method: req.method, url: req.url, headers: req.headers, body });
    if (req.url === '/script.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end('/* tracker */');
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    }
  });
});

let app;
let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => fakeUmami.listen(0, '127.0.0.1', resolve));
  // Read when app.js loads; each test file runs in its own process.
  process.env.UMAMI_URL = `http://127.0.0.1:${fakeUmami.address().port}`;
  app = require('../app');
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  server?.close();
  fakeUmami.close();
});

test('the tracker script is served from /stats/script.js', async () => {
  const response = await fetch(`${baseUrl}/stats/script.js`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '/* tracker */');
  assert.equal(received.at(-1).url, '/script.js');
});

test('events reach Umami intact, with the visitor IP headers nginx set', async () => {
  const event = { type: 'event', payload: { website: 'abc', name: 'generate-chart', data: { chart: 'gemara' } } };
  const response = await fetch(`${baseUrl}/stats/api/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Real-IP': '203.0.113.7',
      'X-Forwarded-For': '203.0.113.7'
    },
    body: JSON.stringify(event)
  });
  assert.equal(response.status, 200);

  const hit = received.at(-1);
  assert.equal(hit.method, 'POST');
  assert.equal(hit.url, '/api/send');
  assert.deepEqual(JSON.parse(hit.body), event);
  assert.equal(hit.headers['x-real-ip'], '203.0.113.7');
  assert.match(hit.headers['x-forwarded-for'], /^203\.0\.113\.7\b/);
});

test('nothing else under /stats reaches Umami', async () => {
  const before = received.length;
  await fetch(`${baseUrl}/stats/login`);
  await fetch(`${baseUrl}/stats/api/websites`);
  assert.equal(received.length, before);
});

test('the chart API still works with the proxy mounted', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
});

test('when Umami is down the routes answer 503 instead of failing the request', async () => {
  const { analyticsProxy } = require('../lib/analyticsProxy');
  // A port that was just free: nothing is listening there.
  const closed = http.createServer();
  await new Promise((resolve) => closed.listen(0, '127.0.0.1', resolve));
  const deadPort = closed.address().port;
  await new Promise((resolve) => closed.close(resolve));

  const isolated = express();
  isolated.use(analyticsProxy(`http://127.0.0.1:${deadPort}`));
  isolated.get('/ok', (req, res) => res.send('still up'));
  const isolatedServer = await new Promise((resolve) => {
    const s = isolated.listen(0, '127.0.0.1', () => resolve(s));
  });
  const url = `http://127.0.0.1:${isolatedServer.address().port}`;

  try {
    const script = await fetch(`${url}/stats/script.js`);
    assert.equal(script.status, 503);
    const send = await fetch(`${url}/stats/api/send`, { method: 'POST', body: '{}' });
    assert.equal(send.status, 503);
    assert.equal(await (await fetch(`${url}/ok`)).text(), 'still up');
  } finally {
    isolatedServer.close();
  }
});

test('with no Umami configured, analytics is off', () => {
  const { analyticsProxy } = require('../lib/analyticsProxy');
  assert.equal(analyticsProxy(''), null);
});
