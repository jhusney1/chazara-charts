import React from 'react';

/**
 * 1 -> A, 27 -> AA
 */
const columnLetter = (n) => {
  let letters = '';
  let value = n;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }
  return letters;
};

// Excel column widths are in "characters"; roughly 7px each plus padding.
const widthPx = (width) => Math.round(width * 7 + 6);

/**
 * Renders a grid from /api/...-excel-preview as a spreadsheet: column letters,
 * row numbers, gridlines, fills, bold and merged cells, and a sheet tab.
 */
const ExcelGridPreview = ({ grid, className = '' }) => {
  if (!grid) return null;

  const columns = Array.from({ length: grid.columnCount }, (_, index) => index + 1);

  return (
    <div className={`rounded-lg border border-gray-300 bg-white overflow-hidden flex flex-col ${className}`}>
      <div className="flex-1 overflow-auto">
        <table
          className="border-collapse text-[12px] leading-tight"
          style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}
        >
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-20 bg-gray-100 border border-gray-300 w-8" />
              {columns.map((column) => (
                <th
                  key={column}
                  className="sticky top-0 z-10 bg-gray-100 border border-gray-300 text-gray-600 font-normal text-center"
                  style={{ minWidth: widthPx(grid.columnWidths[column - 1] || 9) }}
                >
                  {columnLetter(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((cells, rowIndex) => (
              <tr key={rowIndex}>
                <td className="sticky left-0 z-10 bg-gray-100 border border-gray-300 text-gray-600 text-center px-1">
                  {rowIndex + 1}
                </td>
                {cells.map((cell, cellIndex) => {
                  if (cell === null) return null; // covered by a merge
                  return (
                    <td
                      key={cellIndex}
                      colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                      rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                      className="border border-gray-300 px-1.5 py-0.5 whitespace-nowrap"
                      style={{
                        backgroundColor: cell.fill || undefined,
                        color: cell.color || undefined,
                        fontWeight: cell.b ? 700 : 400,
                        textAlign: cell.align || 'left'
                      }}
                    >
                      {cell.v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 bg-gray-100 border-t border-gray-300 px-2 py-1 text-[11px] text-gray-600">
        <span className="bg-white border border-gray-300 border-b-0 rounded-t px-3 py-0.5 text-green-700 font-semibold">
          {grid.sheetName}
        </span>
        <span className="text-gray-400">+</span>
      </div>
    </div>
  );
};

export default ExcelGridPreview;
