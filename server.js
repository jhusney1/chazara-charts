const express = require('express');
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const app = express();

// Port configuration
// In production: Uses port 3000
// In development: Uses port 3001 to avoid conflict with React's dev server (port 3000)
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001);

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
    },
  },
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

// Talmud tractate data with page counts
const tractateData = {
  "Berachot": 64,
  "Shabbat": 157,
  "Eruvin": 105,
  "Pesachim": 121,
  "Shekalim": 22,
  "Yoma": 88,
  "Sukkah": 56,
  "Beitzah": 40,
  "Rosh Hashanah": 35,
  "Taanit": 31,
  "Megillah": 32,
  "Moed Katan": 29,
  "Chagigah": 27,
  "Yevamot": 122,
  "Ketubot": 112,
  "Nedarim": 91,
  "Nazir": 66,
  "Sotah": 49,
  "Gittin": 90,
  "Kiddushin": 82,
  "Bava Kamma": 119,
  "Bava Metzia": 119,
  "Bava Batra": 176,
  "Sanhedrin": 113,
  "Makkot": 24,
  "Shevuot": 49,
  "Avodah Zarah": 76,
  "Horayot": 14,
  "Zevachim": 120,
  "Menachot": 110,
  "Chullin": 142,
  "Bechorot": 61,
  "Arachin": 34,
  "Temurah": 34,
  "Keritot": 28,
  "Meilah": 22,
  "Tamid": 33,
  "Middot": 41,
  "Kinnim": 25,
  "Niddah": 73
};

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
        <li>/api/create-excel - Generate Excel file (POST)</li>
        <li>/api/create-pdf - Generate PDF file (POST)</li>
      </ul>
    `);
  }
});

app.post('/api/create-excel', async (req, res) => {
  try {
    const { 
      tractates = [], 
      reviews = 3, 
      pages = [], 
      useHebrew = false,
      columnsPerPage = 1,
      includeDateColumn = true,
      startDate = new Date().toISOString().split('T')[0],
      dafPerDay = false
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
    
    // Create a worksheet for each tractate
    tractates.forEach(tractate => {
      const worksheet = workbook.addWorksheet(tractate);
      
      // Calculate how many items each column should contain
      const columnsPerPageValue = parseInt(columnsPerPage);
      const itemsPerColumn = Math.ceil(pages.length / columnsPerPageValue);
      
      // Create all columns
      for (let colIndex = 0; colIndex < columnsPerPageValue; colIndex++) {
        // Calculate starting column for this section
        const colOffset = colIndex * (includeDateColumn ? reviews + 2 : reviews + 1);
        
        // Define headers for this column set
        const headers = [];
        headers.push(`Daf ${colIndex + 1}`); // Add column number to distinguish multiple daf columns
        
        if (includeDateColumn) {
          headers.push(`Date ${colIndex + 1}`);
        }
        
        for (let i = 1; i <= reviews; i++) {
          headers.push(`${i} ${colIndex + 1}`);
        }
        
        // Add the headers to the correct columns
        for (let i = 0; i < headers.length; i++) {
          const cell = worksheet.getCell(1, colOffset + i + 1);
          cell.value = headers[i];
          cell.font = { bold: true, color: { argb: 'FFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4338CA' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          
          // Set column width
          if (i === 0) {
            worksheet.getColumn(colOffset + i + 1).width = 6; // Daf column
          } else if (includeDateColumn && i === 1) {
            worksheet.getColumn(colOffset + i + 1).width = 10; // Date column
          } else {
            worksheet.getColumn(colOffset + i + 1).width = 6; // Review columns
          }
        }
        
        // Calculate which pages go in this column
        const startIndex = colIndex * itemsPerColumn;
        const endIndex = Math.min(startIndex + itemsPerColumn, pages.length);
        const columnPages = pages.slice(startIndex, endIndex);
        
        // Starting date for this column
        let currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + startIndex);
        
        // Add data for this column
        columnPages.forEach((page, rowIndex) => {
          const row = rowIndex + 2; // +2 because row 1 is headers
          
          // Add daf
          const dafCell = worksheet.getCell(row, colOffset + 1);
          dafCell.value = page;
          
          // Add date if enabled
          if (includeDateColumn) {
            const dateCell = worksheet.getCell(row, colOffset + 2);
            dateCell.value = currentDate.toLocaleDateString();
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Style the row
          const rowStyle = {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowIndex % 2 === 0 ? 'F3F4F6' : 'FFFFFF' }
            }
          };
          
          // Apply borders and styling to all cells in the row
          const totalCols = includeDateColumn ? reviews + 2 : reviews + 1;
          
          for (let i = 0; i < totalCols; i++) {
            const cell = worksheet.getCell(row, colOffset + i + 1);
            
            // Add borders
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
      }
      
      // Set print options
      worksheet.pageSetup = {
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
      };
      
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
    const { 
      tractates = [], 
      reviews = 3, 
      pages = [], 
      useHebrew = false,
      columnsPerPage = 1,
      includeDateColumn = true,
      startDate = new Date().toISOString().split('T')[0],
      dafPerDay = false
    } = req.body;
    
    if (!tractates.length) {
      return res.status(400).json({ error: 'Please provide at least one tractate' });
    }
    
    // Create a new PDF document
    const doc = new PDFDocument({ 
      layout: 'landscape',
      margin: 30,
      size: 'A4',
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
    
    // Define colors
    const primaryColor = '#4338ca';
    const secondaryColor = '#f59e0b';
    const lightGray = '#f3f4f6';
    const darkGray = '#4b5563';
    const white = '#ffffff';
    
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
             .text(page, xPos + 2, yPos + 4, { width: dafColWidth - 4, align: 'center' });
          
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

// Helper function to generate default pages (first 10 pages)
function generateDefaultPages() {
  const pages = [];
  for (let i = 1; i <= 10; i++) {
    pages.push({ daf: `${i}a` });
    pages.push({ daf: `${i}b` });
  }
  return pages;
}

// Helper function to convert numbers to Hebrew letters
function convertToHebrew(input) {
  // Extract the number and amud part (if present)
  const match = input.match(/(\d+)([ab])?/);
  if (!match) return input;
  
  const num = parseInt(match[1]);
  const amud = match[2]; // This might be undefined if no amud is specified
  
  // Hebrew letters with their numerical values
  const hebrewNumerals = [
    { value: 400, letter: 'ת' },
    { value: 300, letter: 'ש' },
    { value: 200, letter: 'ר' },
    { value: 100, letter: 'ק' },
    { value: 90, letter: 'צ' },
    { value: 80, letter: 'פ' },
    { value: 70, letter: 'ע' },
    { value: 60, letter: 'ס' },
    { value: 50, letter: 'נ' },
    { value: 40, letter: 'מ' },
    { value: 30, letter: 'ל' },
    { value: 20, letter: 'כ' },
    { value: 10, letter: 'י' },
    { value: 9, letter: 'ט' },
    { value: 8, letter: 'ח' },
    { value: 7, letter: 'ז' },
    { value: 6, letter: 'ו' },
    { value: 5, letter: 'ה' },
    { value: 4, letter: 'ד' },
    { value: 3, letter: 'ג' },
    { value: 2, letter: 'ב' },
    { value: 1, letter: 'א' }
  ];
  
  let hebrewNum = '';
  let remaining = num;
  
  // Convert the number to Hebrew letters
  for (const { value, letter } of hebrewNumerals) {
    while (remaining >= value) {
      hebrewNum += letter;
      remaining -= value;
    }
  }
  
  return hebrewNum;
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