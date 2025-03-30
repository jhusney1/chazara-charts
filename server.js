const express = require('express');
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Import data modules
const tractateData = require('./data/tractateData');
const { convertToHebrew } = require('./data/hebrewUtils');
const { defaultChartSettings, pdfStyles, excelStyles, printOptions } = require('./data/chartConfig');

const app = express();

// Port configuration
// In production: Uses port 3000
// In development: Uses port 3001 to avoid conflict with React's dev server (port 3000)
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001);

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,  // Disable CSP for now
}));
app.use(compression());
app.use(morgan('dev'));

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
} else {
  // In development, we need to serve the client/src files through the React development server
  // The React app will be served separately on port 3000
  console.log('Running in development mode - API server only');
  
  // Still serve static files from client/public for development testing
  app.use(express.static(path.join(__dirname, 'client/public')));
}

// API endpoint to get tractate data
app.get('/api/tractates', (req, res) => {
  res.json(tractateData);
});

// Routes
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  } else {
    // In development, we'll just send a message indicating this is the API server
    res.send(`
      <h1>Chazara Charts API Server</h1>
      <p>This is the API server running on port ${PORT}.</p>
      <p>The React development server should be running separately.</p>
      <p>API endpoints available:</p>
      <ul>
        <li><a href="/api/tractates">/api/tractates</a> - Get list of tractates</li>
        <li>/api/create-excel - Generate Excel file for Gemara (POST)</li>
        <li>/api/create-pdf - Generate PDF file for Gemara (POST)</li>
        <li>/api/mishnayot-excel - Generate Excel file for Mishnayot (POST)</li>
        <li>/api/mishnayot-pdf - Generate PDF file for Mishnayot (POST)</li>
        <li>/api/mishna-berura-excel - Generate Excel file for Mishna Berura (POST)</li>
        <li>/api/mishna-berura-pdf - Generate PDF file for Mishna Berura (POST)</li>
      </ul>
    `);
  }
});

app.post('/api/create-excel', async (req, res) => {
  try {
    // Merge default settings with request body
    const { 
      tractates = [], 
      reviews = defaultChartSettings.reviews, 
      pages = [], 
      useHebrew = defaultChartSettings.useHebrew,
      columnsPerPage = defaultChartSettings.columnsPerPage,
      includeDateColumn = defaultChartSettings.includeDateColumn,
      startDate = new Date().toISOString().split('T')[0],
      dafPerDay = defaultChartSettings.dafPerDay
    } = req.body;
    
    if (!tractates.length) {
      return res.status(400).json({ error: 'Please provide at least one tractate' });
    }
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Chazara Charts';
    workbook.lastModifiedBy = 'Chazara Charts API';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Limit columns per page to prevent memory issues
    const columnsPerPageValue = Math.min(parseInt(columnsPerPage), 5);
    
    // Create a worksheet for each tractate
    tractates.forEach(tractate => {
      const worksheet = workbook.addWorksheet(tractate);
      
      // Calculate how many items each column should contain
      const itemsPerColumn = Math.ceil(pages.length / columnsPerPageValue);
      
      // Track the current column position
      let currentColumn = 1;
      
      // Create all columns
      for (let colIndex = 0; colIndex < columnsPerPageValue; colIndex++) {
        // Define headers for this column set
        const headers = [];
        headers.push(`Daf`);
        
        if (includeDateColumn) {
          headers.push(`Date`);
        }
        
        for (let i = 1; i <= reviews; i++) {
          headers.push(`${i}`);
        }
        
        // Add the headers to the correct columns
        for (let i = 0; i < headers.length; i++) {
          const cell = worksheet.getCell(1, currentColumn);
          cell.value = headers[i];
          cell.font = { bold: true, color: { argb: 'FFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: excelStyles.headerColor }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          
          // Set column width
          if (i === 0) {
            worksheet.getColumn(currentColumn).width = excelStyles.dafColumnWidth;
          } else if (includeDateColumn && i === 1) {
            worksheet.getColumn(currentColumn).width = excelStyles.dateColumnWidth;
          } else {
            worksheet.getColumn(currentColumn).width = excelStyles.reviewColumnWidth;
          }
          
          currentColumn++;
        }
        
        // Calculate which pages go in this column
        const startIndex = colIndex * itemsPerColumn;
        const endIndex = Math.min(startIndex + itemsPerColumn, pages.length);
        const columnPages = pages.slice(startIndex, endIndex);
        
        // Starting date for this column
        let currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + startIndex);
        
        // Reset column position for data rows
        currentColumn = currentColumn - headers.length;
        
        // Add data for this column
        columnPages.forEach((page, rowIndex) => {
          const row = rowIndex + 2; // +2 because row 1 is headers
          
          // Add daf
          const dafCell = worksheet.getCell(row, currentColumn);
          dafCell.value = useHebrew ? convertToHebrew(page) : page;
          
          // Current data column position
          let dataColumn = currentColumn + 1;
          
          // Add date if enabled
          if (includeDateColumn) {
            const dateCell = worksheet.getCell(row, dataColumn);
            dateCell.value = currentDate.toLocaleDateString();
            currentDate.setDate(currentDate.getDate() + 1);
            dataColumn++;
          }
          
          // Style the row
          const rowStyle = {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowIndex % 2 === 0 ? excelStyles.alternateRowColor : 'FFFFFF' }
            }
          };
          
          // Apply borders and styling to all cells in the row
          const totalCols = includeDateColumn ? reviews + 2 : reviews + 1;
          
          for (let i = 0; i < totalCols; i++) {
            const cell = worksheet.getCell(row, currentColumn + i);
            
            // Add borders only to data cells
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            // Center align all cells
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            
            // Add alternating row colors
            if (rowIndex % 2 === 0) {
              cell.fill = rowStyle.fill;
            }
          }
        });
        
        // Move to next set of columns
        currentColumn = currentColumn + headers.length;
      }
      
      // Remove any borders from cells beyond the actual data area
      for (let row = 1; row <= worksheet.rowCount; row++) {
        // Find the maximum column used by actual data
        const headerLength = includeDateColumn ? reviews + 2 : reviews + 1;
        const maxDataColumn = columnsPerPageValue * headerLength;
        
        // Remove borders from any cells beyond the data area
        for (let col = maxDataColumn + 1; col <= worksheet.columnCount; col++) {
          const cell = worksheet.getCell(row, col);
          if (cell && cell.border) {
            cell.border = undefined;
          }
        }
      }
      
      // Set print options
      worksheet.pageSetup = printOptions.excel;
      
      // Freeze the header row
      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
      ];
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${tractates[0]}-chazara-chart.xlsx"`);
    
    // Write the workbook
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).json({ error: 'Failed to generate Excel file', details: error.message });
  }
});

// PDF Generation endpoint
app.post('/api/create-pdf', async (req, res) => {
  try {
    // Merge default settings with request body
    const { 
      tractates = [], 
      reviews = defaultChartSettings.reviews, 
      pages = [], 
      useHebrew = defaultChartSettings.useHebrew,
      columnsPerPage = defaultChartSettings.columnsPerPage,
      includeDateColumn = defaultChartSettings.includeDateColumn,
      startDate = new Date().toISOString().split('T')[0],
      dafPerDay = defaultChartSettings.dafPerDay
    } = req.body;
    
    if (!tractates.length) {
      return res.status(400).json({ error: 'Please provide at least one tractate' });
    }
    
    // Create a new PDF document with specified print options
    const doc = new PDFDocument({
      ...printOptions.pdf,
      info: {
        Title: `${tractates[0]} Chazara Chart`,
        Author: 'Chazara Charts',
        Subject: 'Talmud Study Review Chart',
        Keywords: 'talmud, study, review, chart',
        Creator: 'Chazara Charts Application'
      }
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${tractates[0]}-chazara-chart.pdf"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Access PDF styling colors
    const { primaryColor, secondaryColor, lightGray, darkGray, white } = pdfStyles;
    
    // Handle each tractate
    tractates.forEach((tractate, tractateIndex) => {
      // Add a new page for each tractate except the first one
      if (tractateIndex > 0) {
        doc.addPage();
      }
      
      // Add header
      doc.rect(0, 0, doc.page.width, 40)
         .fill(primaryColor);
      
      // Add title
      doc.fillColor(white)
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(`${tractate} - Chazara Chart`, 30, 12);
      
      // Add date
      const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      doc.fontSize(10)
         .text(`Generated on ${today}`, doc.page.width - 200, 15);
      
      // Calculate column width based on columnsPerPage
      const totalWidth = doc.page.width - 60; // Total available width
      const contentWidth = totalWidth / parseInt(columnsPerPage);
      
      // Define pages to display
      const pagesToDisplay = pages.length > 0 ? pages : [];
      
      // Add table for each column
      for (let colIndex = 0; colIndex < parseInt(columnsPerPage); colIndex++) {
        const colXOffset = 30 + (colIndex * contentWidth);
        
        let yPos = 50; // Start y position
        
        // Calculate width for each subcolumn
        const dafColWidth = contentWidth * 0.1;
        const dateColWidth = includeDateColumn ? contentWidth * 0.15 : 0;
        const remainingWidth = contentWidth - dafColWidth - dateColWidth;
        const reviewColWidth = remainingWidth / reviews;
        
        // Draw header row
        doc.rect(colXOffset, yPos, contentWidth, 20)
           .fill(primaryColor);
        
        // Add column headers
        let xPos = colXOffset;
        
        // Draw header text
        doc.fillColor(white)
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('Daf', xPos + 2, yPos + 6, { width: dafColWidth - 4, align: 'center' });
        
        xPos += dafColWidth;
        
        if (includeDateColumn) {
          doc.text('Date', xPos + 2, yPos + 6, { width: dateColWidth - 4, align: 'center' });
          xPos += dateColWidth;
        }
        
        for (let i = 1; i <= reviews; i++) {
          doc.text(`${i}`, xPos + 2, yPos + 6, { width: reviewColWidth - 4, align: 'center' });
          xPos += reviewColWidth;
        }
        
        // Move to next row
        yPos += 20;
        
        // Calculate how many items each column should contain
        const itemsPerColumn = Math.ceil(pages.length / parseInt(columnsPerPage));
        const startIndex = colIndex * itemsPerColumn;
        const endIndex = Math.min(startIndex + itemsPerColumn, pages.length);
        const columnPages = pages.slice(startIndex, endIndex);
        
        // Starting date for this column
        let currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + startIndex);
        
        // Draw rows for this column
        columnPages.forEach((page, rowIndex) => {
          // Set alternating row color
          const rowColor = rowIndex % 2 === 0 ? lightGray : white;
          
          // Draw row background
          doc.rect(colXOffset, yPos, contentWidth, 16)
             .fill(rowColor);
          
          // Reset x position for this row
          xPos = colXOffset;
          
          // Draw daf cell
          doc.fillColor(darkGray)
             .fontSize(8)
             .font('Helvetica')
             .text(useHebrew ? convertToHebrew(page) : page, xPos + 2, yPos + 4, { width: dafColWidth - 4, align: 'center' });
          
          // Draw border for daf cell
          doc.rect(xPos, yPos, dafColWidth, 16)
             .stroke(darkGray);
          
          xPos += dafColWidth;
          
          // Draw date cell if needed
          if (includeDateColumn) {
            doc.text(currentDate.toLocaleDateString(), xPos + 2, yPos + 4, { width: dateColWidth - 4, align: 'center' });
            doc.rect(xPos, yPos, dateColWidth, 16)
               .stroke(darkGray);
            
            xPos += dateColWidth;
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Draw review cells
          for (let i = 0; i < reviews; i++) {
            // Draw cell border
            doc.rect(xPos, yPos, reviewColWidth, 16)
               .stroke(darkGray);
            
            // Draw checkbox
            const checkboxSize = 5;
            const checkboxX = xPos + (reviewColWidth / 2) - (checkboxSize / 2);
            const checkboxY = yPos + 8 - (checkboxSize / 2);
            
            doc.rect(checkboxX, checkboxY, checkboxSize, checkboxSize)
               .stroke(darkGray);
            
            xPos += reviewColWidth;
          }
          
          // Move to next row
          yPos += 16;
          
          // Check if we need a new page
          if (yPos > doc.page.height - 50 && rowIndex < columnPages.length - 1) {
            doc.addPage();
            yPos = 50;
            
            // Add header to new page
            doc.rect(0, 0, doc.page.width, 40)
               .fill(primaryColor);
            
            doc.fillColor(white)
               .fontSize(18)
               .font('Helvetica-Bold')
               .text(`${tractate} - Chazara Chart (Continued)`, 30, 12);
          }
        });
      }
      
      // Add page number at the bottom of each page
      doc.fillColor(darkGray)
         .fontSize(8)
         .font('Helvetica')
         .text(
           `Page ${doc.bufferedPageRange().start + 1} | Chazara Charts`,
           30, 
           doc.page.height - 20, 
           { align: 'center', width: doc.page.width - 60 }
         );
    });
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF file:', error);
    res.status(500).json({ error: 'Failed to generate PDF file', details: error.message });
  }
});

// Mishnayot Excel Generation endpoint
app.post('/api/mishnayot-excel', async (req, res) => {
  try {
    // Merge default settings with request body
    const { 
      seder = '',
      tractate = '', 
      reviews = defaultChartSettings.reviews, 
      pages = [], 
      useHebrew = defaultChartSettings.useHebrew,
      columnsPerPage = defaultChartSettings.columnsPerPage,
      includeDateColumn = defaultChartSettings.includeDateColumn,
      startDate = new Date().toISOString().split('T')[0],
      chaptersPerDay = true
    } = req.body;
    
    if (!seder || !tractate) {
      return res.status(400).json({ error: 'Please provide both seder and tractate' });
    }
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Chazara Charts';
    workbook.lastModifiedBy = 'Chazara Charts API';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Create a worksheet for the tractate
    const worksheet = workbook.addWorksheet(tractate);
    
    // Limit columns per page to prevent memory issues
    const columnsPerPageValue = Math.min(parseInt(columnsPerPage), 5);
    
    // Calculate how many items each column should contain
    const itemsPerColumn = Math.ceil(pages.length / columnsPerPageValue);
    
    // Track the current column position
    let currentColumn = 1;
    
    // Create all columns
    for (let colIndex = 0; colIndex < columnsPerPageValue; colIndex++) {
      // Define headers for this column set
      const headers = [];
      headers.push(chaptersPerDay ? 'Chapter' : 'Mishnah');
      
      if (includeDateColumn) {
        headers.push(`Date`);
      }
      
      for (let i = 1; i <= reviews; i++) {
        headers.push(`${i}`);
      }
      
      // Add the headers to the correct columns
      for (let i = 0; i < headers.length; i++) {
        const cell = worksheet.getCell(1, currentColumn);
        cell.value = headers[i];
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: excelStyles.headerColor }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Set column width
        if (i === 0) {
          worksheet.getColumn(currentColumn).width = excelStyles.dafColumnWidth;
        } else if (includeDateColumn && i === 1) {
          worksheet.getColumn(currentColumn).width = excelStyles.dateColumnWidth;
        } else {
          worksheet.getColumn(currentColumn).width = excelStyles.reviewColumnWidth;
        }
        
        currentColumn++;
      }
      
      // Calculate which pages go in this column
      const startIndex = colIndex * itemsPerColumn;
      const endIndex = Math.min(startIndex + itemsPerColumn, pages.length);
      const columnPages = pages.slice(startIndex, endIndex);
      
      // Starting date for this column
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + startIndex);
      
      // Reset column position for data rows
      currentColumn = currentColumn - headers.length;
      
      // Add data for this column
      columnPages.forEach((page, rowIndex) => {
        const row = rowIndex + 2; // +2 because row 1 is headers
        
        // Add chapter/mishnah
        const itemCell = worksheet.getCell(row, currentColumn);
        itemCell.value = useHebrew ? convertToHebrew(page) : page;
        
        // Current data column position
        let dataColumn = currentColumn + 1;
        
        // Add date if enabled
        if (includeDateColumn) {
          const dateCell = worksheet.getCell(row, dataColumn);
          dateCell.value = currentDate.toLocaleDateString();
          currentDate.setDate(currentDate.getDate() + 1);
          dataColumn++;
        }
        
        // Style the row
        const rowStyle = {
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowIndex % 2 === 0 ? excelStyles.alternateRowColor : 'FFFFFF' }
          }
        };
        
        // Apply borders and styling to all cells in the row
        const totalCols = includeDateColumn ? reviews + 2 : reviews + 1;
        
        for (let i = 0; i < totalCols; i++) {
          const cell = worksheet.getCell(row, currentColumn + i);
          
          // Add borders only to data cells
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Center align all cells
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          
          // Add alternating row colors
          if (rowIndex % 2 === 0) {
            cell.fill = rowStyle.fill;
          }
        }
      });
      
      // Move to next set of columns
      currentColumn = currentColumn + headers.length;
    }
    
    // Remove any borders from cells beyond the actual data area
    for (let row = 1; row <= worksheet.rowCount; row++) {
      // Find the maximum column used by actual data
      const headerLength = includeDateColumn ? reviews + 2 : reviews + 1;
      const maxDataColumn = columnsPerPageValue * headerLength;
      
      // Remove borders from any cells beyond the data area
      for (let col = maxDataColumn + 1; col <= worksheet.columnCount; col++) {
        const cell = worksheet.getCell(row, col);
        if (cell && cell.border) {
          cell.border = undefined;
        }
      }
    }
    
    // Set print options
    worksheet.pageSetup = printOptions.excel;
    
    // Freeze the header row
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
    ];
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${tractate}-mishnayot-chart.xlsx"`);
    
    // Write the workbook
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error generating Mishnayot Excel file:', error);
    res.status(500).json({ error: 'Failed to generate Excel file', details: error.message });
  }
});

// Mishnayot PDF Generation endpoint
app.post('/api/mishnayot-pdf', async (req, res) => {
  try {
    // Merge default settings with request body
    const { 
      seder = '',
      tractate = '', 
      reviews = defaultChartSettings.reviews, 
      pages = [], 
      useHebrew = defaultChartSettings.useHebrew,
      columnsPerPage = defaultChartSettings.columnsPerPage,
      includeDateColumn = defaultChartSettings.includeDateColumn,
      startDate = new Date().toISOString().split('T')[0],
      chaptersPerDay = true
    } = req.body;
    
    if (!seder || !tractate) {
      return res.status(400).json({ error: 'Please provide both seder and tractate' });
    }
    
    // Create a PDF document
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: pdfStyles.pageMargin,
      info: {
        Title: `${tractate} Mishnayot Chart`,
        Author: 'Chazara Charts',
        Subject: 'Mishnayot Learning Chart'
      }
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${tractate}-mishnayot-chart.pdf"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Title
    doc.fontSize(pdfStyles.titleFontSize)
       .font(pdfStyles.boldFont)
       .text(`${tractate} Mishnayot Chart`, {
         align: 'center'
       });
    
    doc.moveDown();
    
    // Calculate how many items each column should contain
    const columnsPerPageValue = parseInt(columnsPerPage);
    const itemsPerColumn = Math.ceil(pages.length / columnsPerPageValue);
    
    // Calculate measurements for the table
    const pageWidth = doc.page.width - 2 * pdfStyles.pageMargin;
    const pageHeight = doc.page.height - 2 * pdfStyles.pageMargin - pdfStyles.titleFontSize - 30;
    
    const columnWidth = pageWidth / columnsPerPageValue;
    const rowHeight = pdfStyles.rowHeight;
    
    // Calculate number of columns in each section
    const reviewCols = reviews;
    const dateCols = includeDateColumn ? 1 : 0;
    const totalCols = 1 + dateCols + reviewCols; // 1 for the page/item column
    
    // Column widths
    const cellWidth = columnWidth / totalCols;
    
    // Process each column set
    for (let colSet = 0; colSet < columnsPerPageValue; colSet++) {
      // Calculate which pages go in this column
      const startIndex = colSet * itemsPerColumn;
      const endIndex = Math.min(startIndex + itemsPerColumn, pages.length);
      const columnPages = pages.slice(startIndex, endIndex);
      
      // Starting date for this column
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + startIndex);
      
      // X position for this column set
      const colX = pdfStyles.pageMargin + colSet * columnWidth;
      
      // Draw column headers
      doc.font(pdfStyles.boldFont)
         .fontSize(pdfStyles.headerFontSize);
      
      // Header cells
      const headerCells = [chaptersPerDay ? 'Chapter' : 'Mishnah'];
      
      if (includeDateColumn) {
        headerCells.push('Date');
      }
      
      for (let i = 1; i <= reviews; i++) {
        headerCells.push(`${i}`);
      }
      
      // Draw headers
      headerCells.forEach((text, i) => {
        const x = colX + i * cellWidth;
        doc.fillColor(pdfStyles.headerTextColor)
           .rect(x, pdfStyles.pageMargin + pdfStyles.titleFontSize + 30, cellWidth, rowHeight)
           .fill();
        
        doc.fillColor(pdfStyles.headerFillColor)
           .text(
             text,
             x + pdfStyles.cellPadding,
             pdfStyles.pageMargin + pdfStyles.titleFontSize + 30 + pdfStyles.cellPadding,
             {
               width: cellWidth - 2 * pdfStyles.cellPadding,
               height: rowHeight - 2 * pdfStyles.cellPadding,
               align: 'center'
             }
           );
      });
      
      // Draw data rows
      doc.font(pdfStyles.regularFont)
         .fontSize(pdfStyles.bodyFontSize);
      
      columnPages.forEach((page, rowIndex) => {
        const y = pdfStyles.pageMargin + pdfStyles.titleFontSize + 30 + rowHeight * (rowIndex + 1);
        
        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.fillColor(pdfStyles.alternateRowColor)
             .rect(colX, y, columnWidth, rowHeight)
             .fill();
        }
        
        // Draw item cell
        doc.fillColor(pdfStyles.textColor)
           .rect(colX, y, cellWidth, rowHeight)
           .strokeColor(pdfStyles.borderColor)
           .stroke();
        
        doc.text(
          useHebrew ? convertToHebrew(page) : page,
          colX + pdfStyles.cellPadding,
          y + pdfStyles.cellPadding,
          {
            width: cellWidth - 2 * pdfStyles.cellPadding,
            height: rowHeight - 2 * pdfStyles.cellPadding,
            align: 'center'
          }
        );
        
        // Current x position for data cells
        let currX = colX + cellWidth;
        
        // Draw date cell if enabled
        if (includeDateColumn) {
          doc.rect(currX, y, cellWidth, rowHeight)
             .strokeColor(pdfStyles.borderColor)
             .stroke();
          
          doc.text(
            currentDate.toLocaleDateString(),
            currX + pdfStyles.cellPadding,
            y + pdfStyles.cellPadding,
            {
              width: cellWidth - 2 * pdfStyles.cellPadding,
              height: rowHeight - 2 * pdfStyles.cellPadding,
              align: 'center'
            }
          );
          
          // Increment date
          currentDate.setDate(currentDate.getDate() + 1);
          
          currX += cellWidth;
        }
        
        // Draw review cells
        for (let i = 0; i < reviews; i++) {
          doc.rect(currX, y, cellWidth, rowHeight)
             .strokeColor(pdfStyles.borderColor)
             .stroke();
          
          currX += cellWidth;
        }
      });
    }
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating Mishnayot PDF file:', error);
    res.status(500).json({ error: 'Failed to generate PDF file', details: error.message });
  }
});

// Mishna Berura Excel Generation endpoint
app.post('/api/mishna-berura-excel', async (req, res) => {
  try {
    console.log('Received request for Mishna Berura Excel:', JSON.stringify(req.body, null, 2));
    
    // Merge default settings with request body
    const { 
      section = '',
      topic = '', 
      reviews = defaultChartSettings.reviews, 
      pages = [], 
      useHebrew = defaultChartSettings.useHebrew,
      columnsPerPage = defaultChartSettings.columnsPerPage,
      includeDateColumn = defaultChartSettings.includeDateColumn,
      startDate = new Date().toISOString().split('T')[0]
    } = req.body;
    
    if (!section || !topic) {
      return res.status(400).json({ error: 'Please provide both section and topic' });
    }
    
    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: 'No valid pages provided' });
    }
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Chazara Charts';
    workbook.lastModifiedBy = 'Chazara Charts API';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Create a worksheet for the topic
    const worksheetName = topic.substring(0, 31); // Excel limits worksheet names to 31 chars
    const worksheet = workbook.addWorksheet(worksheetName);
    
    // Add section information at the top
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Mishna Berura: ${topic} (${section})`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };
    
    // Add study instructions
    worksheet.mergeCells('A2:H2');
    const instructionsCell = worksheet.getCell('A2');
    instructionsCell.value = 'Learning & Review Tracking Chart - Check off each box after completing a review';
    instructionsCell.font = { italic: true, size: 10 };
    instructionsCell.alignment = { horizontal: 'center' };
    
    // Start the actual chart content from row 4
    const headerRow = 4;
    
    // Limit columns per page to prevent memory issues
    const columnsPerPageValue = Math.min(parseInt(columnsPerPage) || 1, 5);
    
    // Calculate how many items each column should contain
    const itemsPerColumn = Math.ceil(pages.length / columnsPerPageValue);
    
    // Track the current column position
    let currentColumn = 1;
    
    // Create all columns
    for (let colIndex = 0; colIndex < columnsPerPageValue; colIndex++) {
      // Define headers for this column set
      const headers = [];
      headers.push(`Siman`);
      
      if (includeDateColumn) {
        headers.push(`Date Learned`);
      }
      
      for (let i = 1; i <= reviews; i++) {
        headers.push(`Review ${i}`);
      }
      
      // Add the headers to the correct columns
      for (let i = 0; i < headers.length; i++) {
        const cell = worksheet.getCell(headerRow, currentColumn);
        cell.value = headers[i];
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0D5C63' } // Teal color for headers
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Set column width
        if (i === 0) {
          worksheet.getColumn(currentColumn).width = excelStyles.dafColumnWidth;
        } else if (includeDateColumn && i === 1) {
          worksheet.getColumn(currentColumn).width = excelStyles.dateColumnWidth;
        } else {
          worksheet.getColumn(currentColumn).width = excelStyles.reviewColumnWidth;
        }
        
        currentColumn++;
      }
      
      // Calculate which pages go in this column
      const startIndex = colIndex * itemsPerColumn;
      const endIndex = Math.min(startIndex + itemsPerColumn, pages.length);
      const columnPages = pages.slice(startIndex, endIndex);
      
      // Starting date for this column
      let currentDate = new Date(startDate);
      if (isNaN(currentDate.getTime())) {
        currentDate = new Date(); // Use current date if invalid date provided
      }
      currentDate.setDate(currentDate.getDate() + startIndex);
      
      // Reset column position for data rows
      currentColumn = currentColumn - headers.length;
      
      // Add data for this column
      columnPages.forEach((page, rowIndex) => {
        const row = rowIndex + headerRow + 1; // +headerRow+1 because headers are at position headerRow
        
        // Add siman number
        const simanCell = worksheet.getCell(row, currentColumn);
        try {
          simanCell.value = useHebrew ? convertToHebrew(page) : page;
        } catch (error) {
          console.error('Error converting page number:', error);
          simanCell.value = page; // Fallback to original value if conversion fails
        }
        
        // Current data column position
        let dataColumn = currentColumn + 1;
        
        // Add date if enabled
        if (includeDateColumn) {
          const dateCell = worksheet.getCell(row, dataColumn);
          try {
            dateCell.value = currentDate.toLocaleDateString();
          } catch (error) {
            console.error('Error formatting date:', error);
            dateCell.value = ''; // Empty cell if date formatting fails
          }
          currentDate.setDate(currentDate.getDate() + 1);
          dataColumn++;
        }
        
        // Style the row
        const rowStyle = {
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowIndex % 2 === 0 ? 'F0F7F4' : 'FFFFFF' } // Light teal for alternating rows
          }
        };
        
        // Apply borders and styling to all cells in the row
        const totalCols = includeDateColumn ? reviews + 2 : reviews + 1;
        
        for (let i = 0; i < totalCols; i++) {
          const cell = worksheet.getCell(row, currentColumn + i);
          
          // Add borders only to data cells
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Center align all cells
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          
          // Add alternating row colors
          if (rowIndex % 2 === 0) {
            cell.fill = rowStyle.fill;
          }
          
          // Add checkbox symbol for review columns
          if (i >= (includeDateColumn ? 2 : 1)) {
            cell.value = '☐';
          }
        }
      });
      
      // Move to next set of columns
      currentColumn = currentColumn + headers.length;
    }
    
    // Remove any borders from cells beyond the actual data area
    for (let row = 1; row <= worksheet.rowCount; row++) {
      // Find the maximum column used by actual data
      const headerLength = includeDateColumn ? reviews + 2 : reviews + 1;
      const maxDataColumn = columnsPerPageValue * headerLength;
      
      // Remove borders from any cells beyond the data area
      for (let col = maxDataColumn + 1; col <= worksheet.columnCount; col++) {
        const cell = worksheet.getCell(row, col);
        if (cell && cell.border) {
          cell.border = undefined;
        }
      }
    }
    
    // Add footer with instructions
    const footerRow = worksheet.rowCount + 2;
    worksheet.mergeCells(`A${footerRow}:H${footerRow}`);
    const footerCell = worksheet.getCell(`A${footerRow}`);
    footerCell.value = 'Generated by Chazara Charts - Track your progress through Mishna Berura';
    footerCell.font = { italic: true, size: 10 };
    footerCell.alignment = { horizontal: 'center' };
    
    // Set print options
    worksheet.pageSetup = printOptions.excel;
    
    // Freeze the header row
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: headerRow, activeCell: `A${headerRow+1}` }
    ];
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${topic.replace(/\s+/g, '-').toLowerCase()}-mishna-berura-chart.xlsx"`);
    
    // Write the workbook
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error generating Mishna Berura Excel file:', error);
    res.status(500).json({ error: 'Failed to generate Excel file', details: error.message, stack: error.stack });
  }
});

// Mishna Berura PDF Generation endpoint
app.post('/api/mishna-berura-pdf', async (req, res) => {
  try {
    console.log('Received request for Mishna Berura PDF:', JSON.stringify(req.body, null, 2));
    
    // Merge default settings with request body
    const { 
      section = '',
      topic = '', 
      reviews = defaultChartSettings.reviews, 
      pages = [], 
      useHebrew = defaultChartSettings.useHebrew,
      columnsPerPage = defaultChartSettings.columnsPerPage,
      includeDateColumn = defaultChartSettings.includeDateColumn,
      startDate = new Date().toISOString().split('T')[0]
    } = req.body;
    
    if (!section || !topic) {
      return res.status(400).json({ error: 'Please provide both section and topic' });
    }
    
    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: 'No valid pages provided' });
    }
    
    // Create a PDF document
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 50, // Use a simple numeric margin if pdfStyles.pageMargin is causing issues
      info: {
        Title: `${topic} Mishna Berura Chart`,
        Author: 'Chazara Charts',
        Subject: 'Mishna Berura Learning Chart'
      }
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${topic.replace(/\s+/g, '-').toLowerCase()}-mishna-berura-chart.pdf"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    try {
      // Title with more context
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(`Mishna Berura: ${topic} (${section})`, {
           align: 'center'
         });
      
      // Add subtitle with instructions
      doc.fontSize(10)
         .font('Helvetica-Oblique')
         .text('Learning & Review Tracking Chart - Check off each box after completing a review', {
           align: 'center'
         });
      
      doc.moveDown(2);
      
      // Calculate how many items each column should contain
      const columnsPerPageValue = parseInt(columnsPerPage) || 1;
      const itemsPerColumn = Math.ceil(pages.length / columnsPerPageValue);
      
      // Calculate measurements for the table
      const pageWidth = doc.page.width - 100; // 50 margin on each side
      const pageHeight = doc.page.height - 150; // Allow room for title and footer
      
      const columnWidth = pageWidth / columnsPerPageValue;
      const rowHeight = 20; // Fixed row height
      
      // Calculate number of columns in each section
      const reviewCols = parseInt(reviews) || 3;
      const dateCols = includeDateColumn ? 1 : 0;
      const totalCols = 1 + dateCols + reviewCols; // 1 for the siman column
      
      // Column widths
      const cellWidth = columnWidth / totalCols;
      
      // Process each column set
      for (let colSet = 0; colSet < columnsPerPageValue; colSet++) {
        // Calculate which pages go in this column
        const startIndex = colSet * itemsPerColumn;
        const endIndex = Math.min(startIndex + itemsPerColumn, pages.length);
        const columnPages = pages.slice(startIndex, endIndex);
        
        // Starting date for this column
        let currentDate = new Date(startDate);
        if (isNaN(currentDate.getTime())) {
          currentDate = new Date(); // Use current date if invalid date provided
        }
        currentDate.setDate(currentDate.getDate() + startIndex);
        
        // X position for this column set
        const colX = 50 + colSet * columnWidth;
        
        // Draw column headers
        doc.font('Helvetica-Bold')
           .fontSize(10);
        
        // Header cells
        const headerCells = ['Siman'];
        
        if (includeDateColumn) {
          headerCells.push('Date Learned');
        }
        
        for (let i = 1; i <= reviewCols; i++) {
          headerCells.push(`Review ${i}`);
        }
        
        // Draw headers
        headerCells.forEach((text, i) => {
          const x = colX + i * cellWidth;
          doc.fillColor('#0D5C63') // Teal header background
             .rect(x, 120, cellWidth, rowHeight)
             .fill();
          
          doc.fillColor('#FFFFFF') // White text on teal
             .text(
               text,
               x + 3,
               120 + 6,
               {
                 width: cellWidth - 6,
                 align: 'center'
               }
             );
        });
        
        // Draw data rows
        doc.font('Helvetica')
           .fontSize(9);
        
        columnPages.forEach((page, rowIndex) => {
          const y = 120 + rowHeight * (rowIndex + 1);
          
          // Alternate row colors
          if (rowIndex % 2 === 0) {
            doc.fillColor('#F0F7F4') // Light teal for alternating rows
               .rect(colX, y, columnWidth, rowHeight)
               .fill();
          }
          
          // Draw siman cell
          doc.fillColor('#000000')
             .rect(colX, y, cellWidth, rowHeight)
             .strokeColor('#444444')
             .stroke();
          
          try {
            doc.text(
              useHebrew ? convertToHebrew(page) : page,
              colX + 3,
              y + 6,
              {
                width: cellWidth - 6,
                align: 'center'
              }
            );
          } catch (error) {
            console.error('Error rendering page number:', error);
            doc.text(
              String(page),
              colX + 3,
              y + 6,
              {
                width: cellWidth - 6,
                align: 'center'
              }
            );
          }
          
          // Current x position for data cells
          let currX = colX + cellWidth;
          
          // Draw date cell if enabled
          if (includeDateColumn) {
            doc.rect(currX, y, cellWidth, rowHeight)
               .strokeColor('#444444')
               .stroke();
            
            try {
              doc.text(
                currentDate.toLocaleDateString(),
                currX + 3,
                y + 6,
                {
                  width: cellWidth - 6,
                  align: 'center'
                }
              );
            } catch (error) {
              console.error('Error formatting date:', error);
              // Skip date if there's an error
            }
            
            // Increment date
            currentDate.setDate(currentDate.getDate() + 1);
            
            currX += cellWidth;
          }
          
          // Draw review cells
          for (let i = 0; i < reviewCols; i++) {
            doc.rect(currX, y, cellWidth, rowHeight)
               .strokeColor('#444444')
               .stroke();
               
            // Add a checkbox symbol in each review cell
            const checkboxSize = 8;
            const checkboxX = currX + (cellWidth/2) - (checkboxSize/2);
            const checkboxY = y + (rowHeight/2) - (checkboxSize/2);
            
            doc.rect(checkboxX, checkboxY, checkboxSize, checkboxSize)
               .stroke();
            
            currX += cellWidth;
          }
        });
      }
      
      // Add footer
      const footerY = doc.page.height - 30;
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .text(
           'Generated by Chazara Charts - Track your progress through Mishna Berura',
           50,
           footerY,
           { 
             width: doc.page.width - 100,
             align: 'center'
           }
         );
      
      // Add page numbers
      doc.fontSize(8)
         .font('Helvetica')
         .text(
           `Page ${doc._pageNumber} | ${new Date().toLocaleDateString()}`,
           50,
           footerY - 15,
           { 
             width: doc.page.width - 100,
             align: 'right'
           }
         );
      
    } catch (innerError) {
      console.error('Error during PDF generation:', innerError);
      // If an error occurs during PDF generation, we need to end the document
      // so the response doesn't hang
      doc.text(`Error generating PDF: ${innerError.message}`, 100, 100);
    }
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating Mishna Berura PDF file:', error);
    // If we've already piped to the response, we can't send a JSON error
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF file', details: error.message, stack: error.stack });
    }
  }
});

// Helper function to generate default pages (first 10 pages)
function generateDefaultPages() {
  const pages = [];
  for (let i = 1; i <= 10; i++) {
    pages.push({ daf: `${i}a` });
    pages.push({ daf: `${i}b` });
  }
  return pages;
}

// Catch-all route to serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log('React dev server should be running separately on port 3000');
  }
}); 