/**
 * Shared PDF chart builder.
 *
 * Replaces three separate renderers, two of which had no pagination at all:
 * they computed row Y positions unbounded, so PDFKit auto-broke the page on
 * every text call past the margin while the cell borders kept drawing at off
 * page coordinates. A 103 row Mishna Berura chart produced 169 pages of
 * scattered fragments.
 *
 * Here the page geometry is computed up front, rows are laid out a page at a
 * time, and nothing is ever drawn outside the content box.
 */

const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const { convertToHebrew } = require('../data/hebrewUtils');
const { pdfStyles } = require('../data/chartConfig');
const { formatDate, scheduleDates } = require('./normalize');
const { splitIntoColumns, toEntries } = require('./excelChart');

// A Hebrew-capable TrueType font. The PDF standard 14 fonts are WinAnsi
// encoded and cannot represent Hebrew at all: every Hebrew daf number came out
// as an unrenderable raw codepoint. Any .ttf dropped in fonts/ is picked up.
const FONT_DIRS = [
  path.join(__dirname, '..', 'assets', 'fonts'),
  path.join(__dirname, '..', 'fonts')
];
const HEBREW_FONT_CANDIDATES = [
  'DejaVuSans.ttf',
  'OpenSansHebrew-Regular.ttf',
  'NotoSansHebrew-Regular.ttf'
];
const HEBREW_FONT_NAME = 'HebrewFont';
const HEBREW_PATTERN = /[֐-׿]/;

let hebrewFontPathCache;

/**
 * Locates a usable Hebrew font, or null if none is installed.
 * Zero-byte files are ignored: fonts/ previously held a 0 byte placeholder
 * from an abandoned download, which would fail at register time.
 */
function findHebrewFont() {
  if (hebrewFontPathCache !== undefined) return hebrewFontPathCache;

  hebrewFontPathCache = null;

  // HEBREW_FONT_PATH lets a deployment point at a font outside the repo.
  const candidates = process.env.HEBREW_FONT_PATH
    ? [process.env.HEBREW_FONT_PATH]
    : FONT_DIRS.flatMap((dir) => HEBREW_FONT_CANDIDATES.map((name) => path.join(dir, name)));

  for (const candidatePath of candidates) {
    try {
      if (fs.statSync(candidatePath).size > 0) {
        hebrewFontPathCache = candidatePath;
        break;
      }
    } catch {
      // Not present; try the next candidate.
    }
  }

  return hebrewFontPathCache;
}

/**
 * Creates a PDF document with page buffering enabled so footers and page
 * numbers can be stamped once the total page count is known.
 */
function createChartDocument({ title, subject }) {
  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margin: pdfStyles.pageMargin,
    bufferPages: true,
    autoFirstPage: true,
    info: {
      Title: title,
      Author: 'Chazara Charts',
      Subject: subject,
      Creator: 'Chazara Charts'
    }
  });

  const fontPath = findHebrewFont();
  if (fontPath) {
    try {
      doc.registerFont(HEBREW_FONT_NAME, fontPath);
      doc._hasHebrewFont = true;
    } catch (error) {
      console.warn(`Could not register Hebrew font at ${fontPath}: ${error.message}`);
      doc._hasHebrewFont = false;
    }
  } else {
    doc._hasHebrewFont = false;
  }

  return doc;
}

/**
 * Chooses a font that can actually represent the given text.
 */
function fontFor(doc, text, { bold = false } = {}) {
  if (HEBREW_PATTERN.test(String(text))) {
    if (doc._hasHebrewFont) return HEBREW_FONT_NAME;
    // No Hebrew font available: Helvetica renders these as garbage, so warn
    // once rather than silently emitting an unreadable chart.
    if (!doc._warnedMissingHebrewFont) {
      doc._warnedMissingHebrewFont = true;
      console.warn(
        'Hebrew text requested but no Hebrew font found in fonts/. ' +
          'Hebrew characters will not render correctly in the PDF.'
      );
    }
  }

  return bold ? pdfStyles.boldFont : pdfStyles.regularFont;
}

/**
 * Draws one line of text clipped to a cell, never triggering an auto page break.
 */
function drawCellText(doc, text, x, y, width, height, { bold = false, size, color } = {}) {
  const value = text === null || text === undefined ? '' : String(text);
  if (!value) return;

  const fontSize = size || pdfStyles.bodyFontSize;

  doc
    .font(fontFor(doc, value, { bold }))
    .fontSize(fontSize)
    .fillColor(color || pdfStyles.textColor)
    .text(value, x + pdfStyles.cellPadding, y + (height - fontSize) / 2, {
      width: Math.max(width - pdfStyles.cellPadding * 2, 1),
      align: 'center',
      lineBreak: false,
      ellipsis: true
    });
}

/**
 * Computes the usable content box for a landscape page.
 */
function computeLayout(doc, { columnsPerPage, includeDateColumn, reviews }) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = pdfStyles.pageMargin;

  const contentTop = pdfStyles.titleBlockHeight;
  // Everything must finish above the footer, which itself sits inside the
  // bottom margin. Drawing past this is what spawned blank trailing pages.
  const footerTop = pageHeight - margin - pdfStyles.footerHeight;
  const contentBottom = footerTop - 6;

  const blockWidth = (pageWidth - margin * 2) / columnsPerPage;
  const cellCount = 1 + (includeDateColumn ? 1 : 0) + reviews;

  // Give the item and date columns a little more room than the review boxes.
  const itemWidth = blockWidth * (includeDateColumn ? 0.16 : 0.22);
  const dateWidth = includeDateColumn ? blockWidth * 0.26 : 0;
  const reviewWidth = (blockWidth - itemWidth - dateWidth) / Math.max(reviews, 1);

  const rowsPerPage = Math.max(
    Math.floor((contentBottom - contentTop - pdfStyles.headerRowHeight) / pdfStyles.rowHeight),
    1
  );

  return {
    margin,
    pageWidth,
    pageHeight,
    contentTop,
    contentBottom,
    footerTop,
    blockWidth,
    cellCount,
    itemWidth,
    dateWidth,
    reviewWidth,
    rowsPerPage
  };
}

/**
 * Draws the coloured title band at the top of a page.
 */
function drawTitleBand(doc, layout, { title, subtitle, theme, continued }) {
  const headerFill = theme.headerFillColor || pdfStyles.headerFillColor;

  doc.rect(0, 0, layout.pageWidth, pdfStyles.titleBlockHeight - 6).fill(headerFill);

  const heading = continued ? `${title} (continued)` : title;

  doc
    .font(fontFor(doc, heading, { bold: true }))
    .fontSize(pdfStyles.titleFontSize)
    .fillColor(pdfStyles.headerTextColor)
    .text(heading, layout.margin, 10, {
      width: layout.pageWidth - layout.margin * 2 - 190,
      lineBreak: false,
      ellipsis: true
    });

  if (subtitle) {
    doc
      .font(pdfStyles.italicFont)
      .fontSize(pdfStyles.subtitleFontSize)
      .fillColor(pdfStyles.headerTextColor)
      .text(subtitle, layout.pageWidth - layout.margin - 190, 14, {
        width: 190,
        align: 'right',
        lineBreak: false,
        ellipsis: true
      });
  }
}

/**
 * Draws the header row of one column block.
 */
function drawBlockHeader(doc, layout, blockX, headers, theme) {
  const headerFill = theme.headerFillColor || pdfStyles.headerFillColor;
  const y = layout.contentTop;

  doc.rect(blockX, y, layout.blockWidth, pdfStyles.headerRowHeight).fill(headerFill);

  let x = blockX;

  headers.forEach((header) => {
    drawCellText(doc, header.label, x, y, header.width, pdfStyles.headerRowHeight, {
      bold: true,
      size: pdfStyles.headerFontSize,
      color: pdfStyles.headerTextColor
    });
    x += header.width;
  });
}

/**
 * Renders a paginated chart into an existing document.
 *
 * @param {PDFDocument} doc
 * @param {object}   options
 * @param {string[]} options.items
 * @param {number}   options.reviews
 * @param {number}   options.columnsPerPage
 * @param {boolean}  options.includeDateColumn
 * @param {Date}     options.startDate
 * @param {number[]} [options.skipDays]
 * @param {boolean}  options.useHebrew
 * @param {string}   options.title
 * @param {string}   [options.subtitle]
 * @param {string}   options.itemHeader
 * @param {string}   [options.dateHeader]
 * @param {string}   [options.reviewHeader]
 * @param {boolean}  [options.checkboxes]
 * @param {object}   [options.theme]
 * @param {boolean}  [options.startOnNewPage]
 */
function renderChart(doc, options) {
  const {
    items,
    reviews,
    columnsPerPage,
    includeDateColumn,
    startDate,
    skipDays = [],
    useHebrew,
    title,
    subtitle,
    itemHeader,
    dateHeader = 'Date',
    reviewHeader = '',
    checkboxes = false,
    theme = {},
    startOnNewPage = false
  } = options;

  if (startOnNewPage) doc.addPage();

  const layout = computeLayout(doc, { columnsPerPage, includeDateColumn, reviews });
  const alternateRow = theme.alternateRowColor || pdfStyles.alternateRowColor;
  const headingFill = theme.headingFillColor || pdfStyles.headingFillColor;

  const headers = [{ label: itemHeader, width: layout.itemWidth, kind: 'item' }];
  if (includeDateColumn) {
    headers.push({ label: dateHeader, width: layout.dateWidth, kind: 'date' });
  }
  for (let i = 1; i <= reviews; i++) {
    headers.push({
      label: reviewHeader ? `${reviewHeader} ${i}` : `${i}`,
      width: layout.reviewWidth,
      kind: 'review'
    });
  }

  const entries = toEntries(items);
  const dates = scheduleDates(startDate, entries.filter((entry) => !entry.heading).length, skipDays);
  const blocks = splitIntoColumns(entries, columnsPerPage);
  const longestBlock = blocks.reduce((max, block) => Math.max(max, block.items.length), 0);
  const pageCount = Math.max(Math.ceil(longestBlock / layout.rowsPerPage), 1);

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    if (pageIndex > 0) doc.addPage();

    drawTitleBand(doc, layout, { title, subtitle, theme, continued: pageIndex > 0 });

    blocks.forEach((block, blockIndex) => {
      const blockX = layout.margin + blockIndex * layout.blockWidth;

      drawBlockHeader(doc, layout, blockX, headers, theme);

      const sliceStart = pageIndex * layout.rowsPerPage;
      const pageItems = block.items.slice(sliceStart, sliceStart + layout.rowsPerPage);

      pageItems.forEach((entry, rowOffset) => {
        const absoluteIndex = sliceStart + rowOffset;
        const y = layout.contentTop + pdfStyles.headerRowHeight + rowOffset * pdfStyles.rowHeight;

        if (entry.heading) {
          // A perek boundary: one tinted band across the block, no cells.
          doc.rect(blockX, y, layout.blockWidth, pdfStyles.rowHeight).fill(headingFill);
          doc
            .rect(blockX, y, layout.blockWidth, pdfStyles.rowHeight)
            .lineWidth(0.5)
            .strokeColor(pdfStyles.borderColor)
            .stroke();
          drawCellText(doc, entry.label, blockX, y, layout.blockWidth, pdfStyles.rowHeight, {
            bold: true
          });
          return;
        }

        const rowDate = dates[entry.dayIndex];

        if (absoluteIndex % 2 === 0) {
          doc.rect(blockX, y, layout.blockWidth, pdfStyles.rowHeight).fill(alternateRow);
        }

        let x = blockX;

        headers.forEach((header) => {
          doc
            .rect(x, y, header.width, pdfStyles.rowHeight)
            .lineWidth(0.5)
            .strokeColor(pdfStyles.borderColor)
            .stroke();

          if (header.kind === 'item') {
            drawCellText(doc, useHebrew ? convertToHebrew(entry.label) : entry.label, x, y, header.width, pdfStyles.rowHeight);
          } else if (header.kind === 'date') {
            drawCellText(doc, formatDate(rowDate), x, y, header.width, pdfStyles.rowHeight);
          } else if (checkboxes) {
            const size = pdfStyles.checkboxSize;
            doc
              .rect(
                x + header.width / 2 - size / 2,
                y + pdfStyles.rowHeight / 2 - size / 2,
                size,
                size
              )
              .lineWidth(0.5)
              .strokeColor(pdfStyles.borderColor)
              .stroke();
          }

          x += header.width;
        });
      });
    });
  }
}

/**
 * Stamps a footer and "Page N of M" on every buffered page, then flushes.
 * Must be called before doc.end().
 */
function finalizeDocument(doc, footerText) {
  const range = doc.bufferedPageRange();
  const margin = pdfStyles.pageMargin;

  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);

    const y = doc.page.height - margin - pdfStyles.footerHeight + 6;
    const width = doc.page.width - margin * 2;

    doc
      .font(pdfStyles.italicFont)
      .fontSize(pdfStyles.footerFontSize)
      .fillColor(pdfStyles.darkGray)
      .text(footerText, margin, y, { width, align: 'left', lineBreak: false, ellipsis: true });

    doc
      .font(pdfStyles.regularFont)
      .fontSize(pdfStyles.footerFontSize)
      .fillColor(pdfStyles.darkGray)
      .text(`Page ${i + 1} of ${range.count}`, margin, y, {
        width,
        align: 'right',
        lineBreak: false
      });
  }

  doc.flushPages();
}

module.exports = {
  createChartDocument,
  renderChart,
  finalizeDocument,
  findHebrewFont,
  computeLayout
};
