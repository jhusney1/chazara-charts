/**
 * Perek (chapter) boundaries for the Gemara chart.
 *
 * A perek is not a daf: it is a heading row inserted before the first daf of
 * the chapter, with no date and no review cells. The data comes from Sefaria
 * via scripts/fetch-perakim.mjs and is committed, so nothing here touches the
 * network.
 */

const perakimData = require('../data/perakimData');
const { numberToHebrew } = require('../data/hebrewUtils');

/**
 * Perakim for a tractate, in order. Empty when unknown (Middot and Kinnim
 * have no gemara and Sefaria has no daf layout for them).
 */
function perakimFor(tractate) {
  return perakimData[tractate] || [];
}

/**
 * Display label for a perek heading row.
 */
function perekLabel(perek, useHebrew) {
  return useHebrew
    ? `פרק ${numberToHebrew(perek.number)} - ${perek.heName}`
    : `Perek ${perek.number} - ${perek.name}`;
}

/**
 * Inserts a heading entry before the page each perek begins on.
 *
 * Pages are the labels the form produces: "13" in daf mode or "13a" / "13b"
 * in amud mode. A perek starting on 13a is placed before "13" or "13a"; one
 * starting on 25b goes before "25b", or before "25" in daf mode since that
 * daf contains it. Pages are returned unchanged when the tractate has no
 * perek data, so the chart is never worse than before.
 *
 * @param {string[]} pages
 * @param {string} tractate
 * @param {boolean} useHebrew
 * @returns {Array<string|{heading: true, label: string}>}
 */
function withPerakim(pages, tractate, useHebrew) {
  const perakim = perakimFor(tractate);
  if (!perakim.length) return pages;

  const items = [];

  for (const page of pages) {
    const match = String(page).match(/^(\d+)([ab])?$/);

    if (match) {
      const daf = Number(match[1]);
      const amud = match[2];

      for (const perek of perakim) {
        if (perek.daf === daf && (amud === undefined || amud === perek.amud)) {
          items.push({ heading: true, label: perekLabel(perek, useHebrew) });
        }
      }
    }

    items.push(page);
  }

  return items;
}

module.exports = { perakimFor, perekLabel, withPerakim };
