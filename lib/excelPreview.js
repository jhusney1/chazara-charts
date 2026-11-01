/**
 * Serializes a chart workbook into a plain grid the client can render as a
 * spreadsheet. Built from the very same ExcelJS workbook the download
 * streams, so the preview cannot drift from the file.
 */

/**
 * "FFE0E7FF" -> "#e0e7ff". ExcelJS colours are ARGB; the alpha byte is dropped.
 */
function argbToHex(argb) {
  if (!argb || typeof argb !== 'string') return null;
  const rgb = argb.length === 8 ? argb.slice(2) : argb;
  return `#${rgb.toLowerCase()}`;
}

/**
 * "C" -> 3, "AA" -> 27.
 */
function columnNumber(letters) {
  let n = 0;
  for (const letter of letters) n = n * 26 + (letter.charCodeAt(0) - 64);
  return n;
}

/**
 * Maps each merge's top-left address to its span, e.g. { A2: { colSpan: 3, rowSpan: 1 } }.
 */
function mergeSpans(worksheet) {
  const spans = {};
  const merges = (worksheet.model && worksheet.model.merges) || [];

  for (const range of merges) {
    const match = String(range).match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!match) continue;
    const [, fromCol, fromRow, toCol, toRow] = match;
    spans[`${fromCol}${fromRow}`] = {
      colSpan: columnNumber(toCol) - columnNumber(fromCol) + 1,
      rowSpan: Number(toRow) - Number(fromRow) + 1
    };
  }

  return spans;
}

/**
 * @param {import('exceljs').Workbook} workbook
 * @returns {{sheetName: string, rowCount: number, columnCount: number,
 *            columnWidths: number[], frozenRows: number, rows: Array<Array<object|null>>}}
 *   `rows[r][c]` is null for a cell covered by a merge; otherwise
 *   { v, b, fill, color, align, colSpan, rowSpan }.
 */
function workbookToGrid(workbook) {
  const worksheet = workbook.worksheets[0];
  const rowCount = worksheet.rowCount;
  const columnCount = worksheet.columnCount;
  const spans = mergeSpans(worksheet);

  const columnWidths = Array.from(
    { length: columnCount },
    (_, index) => worksheet.getColumn(index + 1).width || 9
  );

  const rows = [];
  for (let r = 1; r <= rowCount; r++) {
    const cells = [];
    for (let c = 1; c <= columnCount; c++) {
      const cell = worksheet.getCell(r, c);

      if (cell.isMerged && cell.master.address !== cell.address) {
        cells.push(null);
        continue;
      }

      const span = spans[cell.address] || { colSpan: 1, rowSpan: 1 };
      const fill = cell.fill && cell.fill.fgColor ? argbToHex(cell.fill.fgColor.argb) : null;
      const font = cell.font || {};

      cells.push({
        v: cell.text === undefined || cell.text === null ? '' : String(cell.text),
        b: Boolean(font.bold),
        fill,
        color: font.color ? argbToHex(font.color.argb) : null,
        align: (cell.alignment && cell.alignment.horizontal) || null,
        colSpan: span.colSpan,
        rowSpan: span.rowSpan
      });
    }
    rows.push(cells);
  }

  const view = worksheet.views && worksheet.views[0];

  return {
    sheetName: worksheet.name,
    rowCount,
    columnCount,
    columnWidths,
    frozenRows: view && view.state === 'frozen' ? view.ySplit || 0 : 0,
    rows
  };
}

module.exports = { workbookToGrid, argbToHex, columnNumber };
