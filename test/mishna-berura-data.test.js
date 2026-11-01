/**
 * Guards the Mishna Berura data shipped to the client: the six volumes must
 * be contiguous, every siman 1-697 must belong to exactly one topic, and the
 * volume boundaries must follow the standard six-volume edition.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadClientData() {
  const file = path.join(__dirname, '..', 'client', 'src', 'components', 'charts', 'data', 'mishnaBeruraData.js');
  const source = fs
    .readFileSync(file, 'utf8')
    .replace(/export const (\w+) =/g, 'const $1 = exports.$1 =')
    .replace(/export default (\w+);/, 'exports.default = $1;');
  const sandbox = { exports: {} };
  vm.runInNewContext(source, sandbox);
  return sandbox.exports;
}

const { default: data, simanIndex, simanInfo } = loadClientData();

test('volumes follow the standard six-volume edition', () => {
  const bounds = Object.fromEntries(
    Object.entries(data).map(([chelek, topics]) => {
      const ranges = Object.values(topics);
      return [chelek, [Math.min(...ranges.map((r) => r.start)), Math.max(...ranges.map((r) => r.end))]];
    })
  );
  assert.deepEqual(bounds, {
    'Chelek 1': [1, 127],
    'Chelek 2': [128, 241],
    'Chelek 3': [242, 344],
    'Chelek 4': [345, 428],
    'Chelek 5': [429, 494],
    'Chelek 6': [495, 697]
  });
});

test('every siman 1-697 belongs to exactly one topic, in order', () => {
  let expected = 1;
  for (const topics of Object.values(data)) {
    for (const [topic, { start, end, heName }] of Object.entries(topics)) {
      assert.equal(start, expected, `${topic} should start at ${expected}`);
      assert.ok(end >= start, `${topic} has an empty range`);
      assert.ok(heName && /[֐-׿]/.test(heName), `${topic} is missing a Hebrew name`);
      expected = end + 1;
    }
  }
  assert.equal(expected, 698);
  assert.equal(simanIndex.length, 697);
});

test('simanInfo resolves a siman to its chelek and topic', () => {
  // Spread into this realm: objects built inside the vm have a foreign prototype.
  assert.deepEqual({ ...simanInfo(127) }, { siman: 127, chelek: 'Chelek 1', topic: 'Laws of Prayer', heName: 'הלכות תפילה' });
  assert.equal(simanInfo(128).chelek, 'Chelek 2');
  assert.equal(simanInfo(300).topic, 'Laws of Shabbat');
  assert.equal(simanInfo('697').topic, 'Laws of Purim');
  assert.equal(simanInfo(698), undefined);
  assert.equal(simanInfo(0), undefined);
});
