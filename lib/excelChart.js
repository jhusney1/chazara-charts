/**
 * Shared Excel chart builder.
 *
 * All three chart types (Gemara, Mishnayot, Mishna Berura) produce the same
 * grid: an item column, an optional date column, and N review columns, split
 * into `columnsPerPage` side-by-side blocks. This used to be three near
 * identical 180-line copies, which is why a bug fixed in one never reached
 * the other two.
 */

const ExcelJS = require('exceljs');

const { convertToHebrew } = require('../data/hebrewUtils');
const { excelStyles, printOptions } = require('../data/chartConfig');
const { formatDate, scheduleDates } = require('./normalize');

const THIN_BORDER = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' }
};

const CENTERED = { vertical: 'middle', horizontal: 'center' };

/**
 * Splits items into `columnCount` roughly equal consecutive blocks.
 */
function splitIntoColumns(items, columnCount) {
  const perColumn = Math.ceil(items.length / columnCount);
  const blocks = [];

  for (let index = 0; index < columnCount; index++) {
    const start = index * perColumn;
    blocks.push({ startIndex: start, items: items.slice(start, start + perColumn) });
  }

  return blocks;
}

/**
 * Normalizes chart items into entries the renderers can share.
 *
 * An item is either a plain label ("13", "13a", "3:7") or a heading
 * ({ heading: true, label }) such as a perek boundary. Headings take a row but
 * no date: `dayIndex` counts only real items, so the date column continues
 * uninterrupted across them.
 */
function toEntries(items) {
  let dayIndex = 0;

  return items.map((item) => {
    if (item && typeof item === 'object' && item.heading) {
      return { label: String(item.label || ''), heading: true, dayIndex: null };
    }
    return { label: String(item), heading: false, dayIndex: dayIndex++ };
  });
}

/**
 * Builds the header labels for one block.
 */
function buildHeaders({ itemHeader, includeDateColumn, reviews, dateHeader, reviewHeader }) {
  const headers = [itemHeader];

  if (includeDateColumn) headers.push(dateHeader);

  for (let i = 1; i <= reviews; i++) {
    headers.push(reviewHeader ? `${reviewHeader} ${i}` : `${i}`);
  }

  return headers;
}

/**
 * Builds a workbook for one chart.
 *
 * @param {object}   options
 * @param {string}   options.sheetName          Worksheet name (trimmed to Excel's 31 char limit)
 * @param {string[]} options.items              Row labels, already in display order
 * @param {number}   options.reviews            Number of review columns (must be a number)
 * @param {number}   options.columnsPerPage     Side-by-side blocks
 * @param {boolean}  options.includeDateColumn
 * @param {Date}     options.startDate
 * @param {number[]} [options.skipDays]         Weekdays (0 = Sunday) that get no new item
 * @param {boolean}  options.useHebrew
 * @param {string}   options.itemHeader         Label for the first column, e.g. "Daf"
 * @param {string}   [options.dateHeader]
 * @param {string}   [options.reviewHeader]     Prefix for review columns, e.g. "Review"
 * @param {string}   [options.title]            Merged title row above the grid
 * @param {string}   [options.subtitle]
 * @param {string}   [options.footer]
 * @param {boolean}  [options.checkboxes]       Pre-fill review cells with an empty checkbox
 * @param {object}   [options.theme]            { headerColor, alternateRowColor } ARGB
 * @returns {ExcelJS.Workbook}
 */
function buildChartWorkbook(options) {
  const {
    sheetName,
    items,
    reviews,
    columnsPerPage,
    includeDateColumn,
    startDate,
    skipDays = [],
    useHebrew,
    itemHeader,
    dateHeader = 'Date',
    reviewHeader = '',
    title,
    subtitle,
    footer,
    checkboxes = false,
    theme = {}
  } = options;

  const headerColor = theme.headerColor || excelStyles.headerColor;
  const alternateRowColor = theme.alternateRowColor || excelStyles.alternateRowColor;
  const headingRowColor = theme.headingRowColor || excelStyles.headingRowColor;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Chazara Charts';
  workbook.lastModifiedBy = 'Chazara Charts';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(String(sheetName).substring(0, 31));

  const headers = buildHeaders({
    itemHeader,
    includeDateColumn,
    reviews,
    dateHeader,
    reviewHeader
  });
  const blockWidth = headers.length;
  const totalWidth = blockWidth * columnsPerPage;

  // Optional title / subtitle block above the grid.
  let headerRow = 1;

  if (title) {
    worksheet.mergeCells(1, 1, 1, Math.max(totalWidth, 2));
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };
    headerRow = 2;
  }

  if (subtitle) {
    worksheet.mergeCells(headerRow, 1, headerRow, Math.max(totalWidth, 2));
    const subtitleCell = worksheet.getCell(headerRow, 1);
    subtitleCell.value = subtitle;
    subtitleCell.font = { italic: true, size: 10 };
    subtitleCell.alignment = { horizontal: 'center' };
    headerRow += 1;
  }

  if (title || subtitle) headerRow += 1; // blank spacer row

  const entries = toEntries(items);
  const dates = scheduleDates(startDate, entries.filter((entry) => !entry.heading).length, skipDays);
  const blocks = splitIntoColumns(entries, columnsPerPage);

  blocks.forEach((block, blockIndex) => {
    const firstColumn = blockIndex * blockWidth + 1;

    // Header cells for this block.
    headers.forEach((label, offset) => {
      const columnIndex = firstColumn + offset;
      const cell = worksheet.getCell(headerRow, columnIndex);

      cell.value = label;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } };
      cell.alignment = CENTERED;
      cell.border = THIN_BORDER;

      if (offset === 0) {
        worksheet.getColumn(columnIndex).width = excelStyles.dafColumnWidth;
      } else if (includeDateColumn && offset === 1) {
        worksheet.getColumn(columnIndex).width = excelStyles.dateColumnWidth;
      } else {
        worksheet.getColumn(columnIndex).width = excelStyles.reviewColumnWidth;
      }
    });

    // Data rows for this block.
    block.items.forEach((entry, rowOffset) => {
      const rowIndex = headerRow + 1 + rowOffset;
      const isAlternate = rowOffset % 2 === 0;

      if (entry.heading) {
        // One merged, tinted cell across the block: a label, not a daf.
        worksheet.mergeCells(rowIndex, firstColumn, rowIndex, firstColumn + blockWidth - 1);
        const cell = worksheet.getCell(rowIndex, firstColumn);
        cell.value = entry.label;
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headingRowColor } };
        cell.alignment = CENTERED;
        cell.border = THIN_BORDER;
        return;
      }

      const rowDate = dates[entry.dayIndex];

      for (let offset = 0; offset < blockWidth; offset++) {
        const cell = worksheet.getCell(rowIndex, firstColumn + offset);

        if (offset === 0) {
          cell.value = useHebrew ? convertToHebrew(entry.label) : entry.label;
        } else if (includeDateColumn && offset === 1) {
          cell.value = formatDate(rowDate);
        } else if (checkboxes) {
          cell.value = '☐';
        }

        cell.border = THIN_BORDER;
        cell.alignment = CENTERED;

        if (isAlternate) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: alternateRowColor }
          };
        }
      }
    });
  });

  if (footer) {
    const footerRow = worksheet.rowCount + 2;
    worksheet.mergeCells(footerRow, 1, footerRow, Math.max(totalWidth, 2));
    const footerCell = worksheet.getCell(footerRow, 1);
    footerCell.value = footer;
    footerCell.font = { italic: true, size: 10 };
    footerCell.alignment = { horizontal: 'center' };
  }

  worksheet.pageSetup = printOptions.excel;
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: headerRow, activeCell: `A${headerRow + 1}` }
  ];

  return workbook;
}

module.exports = { buildChartWorkbook, splitIntoColumns, toEntries };
