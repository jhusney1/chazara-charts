/**
 * Chart configuration defaults and constants
 */

// Default chart settings
const defaultChartSettings = {
  reviews: 3,
  columnsPerPage: 1,
  includeDateColumn: true,
  useHebrew: false,
  dafPerDay: true
};

// PDF chart styling
const pdfStyles = {
  primaryColor: '#4338ca',
  secondaryColor: '#f59e0b', 
  lightGray: '#f3f4f6',
  darkGray: '#4b5563',
  white: '#ffffff'
};

// Excel chart styling
const excelStyles = {
  headerColor: '4338CA',
  alternateRowColor: 'F3F4F6',
  // Column widths
  dafColumnWidth: 6,
  dateColumnWidth: 10,
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
  defaultChartSettings,
  pdfStyles,
  excelStyles,
  printOptions
}; 