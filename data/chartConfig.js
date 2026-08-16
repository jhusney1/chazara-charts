/**
 * Chart configuration defaults and constants
 */

// Limits applied to every incoming chart request. The UI should offer options
// within these bounds; the server enforces them regardless of what is sent.
const limits = {
  reviews: { min: 1, max: 10 },
  columnsPerPage: { min: 1, max: 6 },
  maxItems: 2000
};

// Default chart settings
const defaultChartSettings = {
  reviews: 3,
  columnsPerPage: 1,
  includeDateColumn: true,
  useHebrew: false,
  dafPerDay: true
};

// PDF chart styling.
// Every key referenced by the PDF renderer must exist here: an undefined font
// or size reaches PDFKit as `undefined` and throws mid-stream, which previously
// took the whole process down.
const pdfStyles = {
  // Colours
  primaryColor: '#4338ca',
  secondaryColor: '#f59e0b',
  lightGray: '#f3f4f6',
  darkGray: '#4b5563',
  white: '#ffffff',
  textColor: '#111827',
  borderColor: '#9ca3af',
  alternateRowColor: '#f3f4f6',
  headerFillColor: '#4338ca',
  headerTextColor: '#ffffff',

  // Fonts
  regularFont: 'Helvetica',
  boldFont: 'Helvetica-Bold',
  italicFont: 'Helvetica-Oblique',

  // Type sizes
  titleFontSize: 16,
  subtitleFontSize: 10,
  headerFontSize: 9,
  bodyFontSize: 8,
  footerFontSize: 8,

  // Geometry (points)
  pageMargin: 30,
  rowHeight: 16,
  headerRowHeight: 18,
  cellPadding: 3,
  titleBlockHeight: 46,
  footerHeight: 24,
  checkboxSize: 6
};

// Per-chart accent colours. Each chart type keeps its own identity while
// sharing one renderer.
const chartThemes = {
  gemara: {
    pdf: { headerFillColor: '#4338ca', alternateRowColor: '#f3f4f6' },
    excel: { headerColor: '4338CA', alternateRowColor: 'F3F4F6' }
  },
  mishnayot: {
    pdf: { headerFillColor: '#b45309', alternateRowColor: '#fef3c7' },
    excel: { headerColor: 'B45309', alternateRowColor: 'FEF3C7' }
  },
  mishnaBerura: {
    pdf: { headerFillColor: '#0d5c63', alternateRowColor: '#f0f7f4' },
    excel: { headerColor: '0D5C63', alternateRowColor: 'F0F7F4' }
  }
};

// Excel chart styling
const excelStyles = {
  headerColor: '4338CA',
  alternateRowColor: 'F3F4F6',
  // Column widths
  dafColumnWidth: 8,
  dateColumnWidth: 12,
  reviewColumnWidth: 6
};

// Print options
const printOptions = {
  // Excel print options
  excel: {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    horizontalCentered: true,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3
    }
  },
  // PDF print options
  pdf: {
    layout: 'landscape',
    margin: 30,
    size: 'A4'
  }
};

module.exports = {
  limits,
  defaultChartSettings,
  pdfStyles,
  chartThemes,
  excelStyles,
  printOptions
};
