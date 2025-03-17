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
const PORT = process.env.PORT || 3000;

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
  // The React app will be served separately on port 3031
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
    const { tractates = [], reviews = 3, pages = [], useHebrew = false } = req.body;
    
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
      
      // Define column headers directly
      const headers = ['Daf', 'Date'];
      for (let i = 1; i <= reviews; i++) {
        headers.push(`${i}`);
      }
      
      // Add the header row
      worksheet.addRow(headers);
      
      // Set column widths - make them narrower to fit more on a page
      worksheet.getColumn(1).width = 6; // Daf column
      worksheet.getColumn(2).width = 10; // Date column
      
      // Set widths for review columns - make them square-like
      for (let i = 3; i <= reviews + 2; i++) {
        worksheet.getColumn(i).width = 6;
      }
      
      // Add data for the requested pages
      if (pages.length > 0) {
        pages.forEach(page => {
          // Extract the daf number and amud
          const match = page.match(/(\d+)([ab])/);
          if (match) {
            const dafNum = match[1];
            const amud = match[2];
            
            // If Hebrew is requested, convert the page number and add appropriate dots
            let displayPage;
            if (useHebrew) {
              const hebrewNum = convertToHebrew(dafNum);
              displayPage = amud === 'a' ? `· ${hebrewNum}` : `: ${hebrewNum}`;
            } else {
              displayPage = page;
            }
            
            const rowData = [displayPage];
            // Add empty cells for date and reviews
            for (let i = 0; i < reviews + 1; i++) {
              rowData.push('');
            }
            worksheet.addRow(rowData);
          } else {
            // If the page format is not recognized, just display as is
            const displayPage = useHebrew ? convertToHebrew(page) : page;
            const rowData = [displayPage];
            for (let i = 0; i < reviews + 1; i++) {
              rowData.push('');
            }
            worksheet.addRow(rowData);
          }
        });
      } else {
        // Add all pages for the tractate
        const maxPages = tractateData[tractate] || 20;
        for (let i = 1; i <= maxPages; i++) {
          // For Hebrew, use dots to indicate amud: one dot (.) for amud alef, two dots (:) for amud bet
          const amudA = useHebrew ? `. ${convertToHebrew(i.toString())}` : `${i}a`;
          const amudB = useHebrew ? `: ${convertToHebrew(i.toString())}` : `${i}b`;
          
          // Add row for amud A
          const rowDataA = [amudA];
          for (let j = 0; j < reviews + 1; j++) {
            rowDataA.push('');
          }
          worksheet.addRow(rowDataA);
          
          // Add row for amud B
          const rowDataB = [amudB];
          for (let j = 0; j < reviews + 1; j++) {
            rowDataB.push('');
          }
          worksheet.addRow(rowDataB);
        }
      }
      
      // Style the header row - simple styling
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4338CA' } // Match the PDF primary color
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }; // White text
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Add borders to all cells and center-align them
      const totalRows = worksheet.rowCount;
      const totalCols = reviews + 2; // Daf + Date + Review columns
      
      for (let row = 1; row <= totalRows; row++) {
        // Set row height to be smaller
        worksheet.getRow(row).height = 15;
        
        for (let col = 1; col <= totalCols; col++) {
          const cell = worksheet.getCell(row, col);
          
          // Add borders
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Center align all cells
          cell.alignment = { 
            vertical: 'middle', 
            horizontal: col === 1 ? 'center' : 'center' // Center all columns
          };
          
          // For review columns (col > 2), add a checkbox-like format
          if (row > 1 && col > 2) {
            // Make these cells look like they're meant for checkmarks
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
          
          // Add alternating row colors
          if (row > 1 && row % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F3F4F6' } // Light gray for even rows
            };
          }
        }
      }
      
      // Set print options to fit more on a page
      worksheet.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, // Auto fit to height
        paperSize: 9, // A4
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
    
    // Set the response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${tractates[0]}-chazara-chart.xlsx"`);
    
    // Write the workbook to the response
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
    const { tractates = [], reviews = 3, pages = [], useHebrew = false } = req.body;
    
    if (!tractates.length) {
      return res.status(400).json({ error: 'Please provide at least one tractate' });
    }
    
    // Create a new PDF document with UTF-8 encoding
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
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${tractates[0]}-chazara-chart.pdf"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Define colors
    const primaryColor = '#4338ca'; // Indigo 700
    const secondaryColor = '#f59e0b'; // Amber 500
    const lightGray = '#f3f4f6'; // Gray 100
    const darkGray = '#4b5563'; // Gray 600
    const white = '#ffffff';
    
    // Helper function to draw a book icon
    const drawBookIcon = (x, y, size = 40) => {
      // Save the current graphics state
      doc.save();
      
      // Book cover
      doc.rect(x, y, size, size * 0.8)
         .fillColor(secondaryColor)
         .fill();
      
      // Book spine
      doc.rect(x - size * 0.1, y + size * 0.1, size * 0.1, size * 0.6)
         .fillColor(primaryColor)
         .fill();
      
      // Book pages (white lines)
      doc.lineWidth(1)
         .strokeColor(white);
      
      for (let i = 1; i <= 5; i++) {
        const lineY = y + (size * 0.2) + (i * size * 0.1);
        doc.moveTo(x + size * 0.2, lineY)
           .lineTo(x + size * 0.8, lineY)
           .stroke();
      }
      
      // Restore the graphics state
      doc.restore();
    };
    
    // For each tractate, create a table
    tractates.forEach((tractate, tractateIndex) => {
      // Add a new page for each tractate except the first one
      if (tractateIndex > 0) {
        doc.addPage();
      }
      
      // Add simple header
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
      
      // Move down to start the table
      const startY = 50; // Reduced from 100
      let yPos = startY;
      
      // Calculate column widths - make them narrower to fit more
      const pageWidth = doc.page.width - 60; // Accounting for margins
      const dafColWidth = pageWidth * 0.08; // Even smaller
      const dateColWidth = pageWidth * 0.12; // Even smaller
      const reviewColWidth = pageWidth * 0.06; // Make review columns square-like
      
      // Starting position
      let xPos = 30;
      
      // Draw header row
      doc.rect(xPos, yPos, pageWidth, 25) // Reduced height
         .fill(primaryColor);
      
      // Reset position for text
      doc.fillColor(white);
      
      // Draw header text
      doc.font('Helvetica-Bold')
         .fontSize(10) // Even smaller font
         .text('Daf', xPos + 5, yPos + 8, { width: dafColWidth - 10, align: 'center' });
      
      xPos += dafColWidth;
      
      doc.text('Date', xPos + 5, yPos + 8, { width: dateColWidth - 10, align: 'center' });
      
      xPos += dateColWidth;
      
      for (let i = 1; i <= reviews; i++) {
        doc.text(`${i}`, xPos + 5, yPos + 8, { width: reviewColWidth - 10, align: 'center' });
        xPos += reviewColWidth;
      }
      
      // Calculate remaining width for second set of columns
      const remainingWidth = pageWidth - (dafColWidth + dateColWidth + (reviewColWidth * reviews));
      
      // If we have enough space, add a second set of columns
      if (remainingWidth > 100 && tractateData[tractate] > 20) {
        // Add a small gap
        xPos += 10;
        
        // Draw second set of headers
        doc.text('Daf', xPos + 5, yPos + 8, { width: dafColWidth - 10, align: 'center' });
        
        xPos += dafColWidth;
        
        doc.text('Date', xPos + 5, yPos + 8, { width: dateColWidth - 10, align: 'center' });
        
        xPos += dateColWidth;
        
        for (let i = 1; i <= reviews; i++) {
          doc.text(`${i}`, xPos + 5, yPos + 8, { width: reviewColWidth - 10, align: 'center' });
          xPos += reviewColWidth;
        }
      }
      
      // Move to next row
      yPos += 25; // Reduced height
      
      // Get pages to display
      const pagesToDisplay = [];
      
      if (pages.length > 0) {
        // Use provided pages
        pages.forEach(page => {
          pagesToDisplay.push({ daf: page });
        });
      } else {
        // Generate default pages
        const maxPages = tractateData[tractate] || 20;
        for (let i = 1; i <= maxPages; i++) {
          pagesToDisplay.push({ daf: `${i}a` });
          pagesToDisplay.push({ daf: `${i}b` });
        }
      }
      
      // Calculate how many rows we can fit on a page
      const rowHeight = 18; // Even smaller height
      const availableHeight = doc.page.height - yPos - 30; // Available space minus footer
      const rowsPerPage = Math.floor(availableHeight / rowHeight);
      
      // Determine if we should use two columns
      const useDoubleColumns = remainingWidth > 100 && tractateData[tractate] > 20;
      const pagesPerRow = useDoubleColumns ? 2 : 1;
      const maxRowsOnPage = Math.min(rowsPerPage, Math.ceil(pagesToDisplay.length / pagesPerRow));
      
      // Draw data rows
      for (let rowIndex = 0; rowIndex < maxRowsOnPage; rowIndex++) {
        xPos = 30;
        
        // Process first column
        if (rowIndex < pagesToDisplay.length) {
          const page = pagesToDisplay[rowIndex];
          const rowColor = rowIndex % 2 === 0 ? lightGray : white;
          
          // Draw row background
          doc.rect(xPos, yPos, dafColWidth + dateColWidth + (reviewColWidth * reviews), rowHeight)
             .fill(rowColor);
          
          // Draw daf number
          doc.fillColor(darkGray)
             .font('Helvetica')
             .fontSize(9) // Smaller font
             .text(page.daf, xPos + 5, yPos + 5, { width: dafColWidth - 10, align: 'center' });
          
          // Draw cell border
          doc.rect(xPos, yPos, dafColWidth, rowHeight)
             .stroke(darkGray);
          
          xPos += dafColWidth;
          
          // Draw date placeholder
          doc.rect(xPos, yPos, dateColWidth, rowHeight)
             .stroke(darkGray);
          
          xPos += dateColWidth;
          
          // Draw review columns with simple checkboxes
          for (let i = 1; i <= reviews; i++) {
            // Draw cell border
            doc.rect(xPos, yPos, reviewColWidth, rowHeight)
               .stroke(darkGray);
            
            // Draw simple checkbox in center of cell
            const checkboxX = xPos + (reviewColWidth / 2) - 3;
            const checkboxY = yPos + (rowHeight / 2) - 3;
            
            doc.rect(checkboxX, checkboxY, 6, 6)
               .stroke(darkGray);
            
            xPos += reviewColWidth;
          }
          
          // If using double columns and we have a second page to display
          if (useDoubleColumns && rowIndex + maxRowsOnPage < pagesToDisplay.length) {
            // Add a small gap
            xPos += 10;
            
            const secondPage = pagesToDisplay[rowIndex + maxRowsOnPage];
            
            // Draw row background for second column
            doc.rect(xPos, yPos, dafColWidth + dateColWidth + (reviewColWidth * reviews), rowHeight)
               .fill(rowColor);
            
            // Draw daf number for second column
            doc.fillColor(darkGray)
               .font('Helvetica')
               .fontSize(9)
               .text(secondPage.daf, xPos + 5, yPos + 5, { width: dafColWidth - 10, align: 'center' });
            
            // Draw cell border
            doc.rect(xPos, yPos, dafColWidth, rowHeight)
               .stroke(darkGray);
            
            xPos += dafColWidth;
            
            // Draw date placeholder
            doc.rect(xPos, yPos, dateColWidth, rowHeight)
               .stroke(darkGray);
            
            xPos += dateColWidth;
            
            // Draw review columns with simple checkboxes
            for (let i = 1; i <= reviews; i++) {
              // Draw cell border
              doc.rect(xPos, yPos, reviewColWidth, rowHeight)
                 .stroke(darkGray);
              
              // Draw simple checkbox in center of cell
              const checkboxX = xPos + (reviewColWidth / 2) - 3;
              const checkboxY = yPos + (rowHeight / 2) - 3;
              
              doc.rect(checkboxX, checkboxY, 6, 6)
                 .stroke(darkGray);
              
              xPos += reviewColWidth;
            }
          }
        }
        
        // Move to next row
        yPos += rowHeight;
      }
      
      // Add more pages if needed
      if (pagesToDisplay.length > (useDoubleColumns ? maxRowsOnPage * 2 : maxRowsOnPage)) {
        const remainingPages = pagesToDisplay.slice(useDoubleColumns ? maxRowsOnPage * 2 : maxRowsOnPage);
        let currentPage = 0;
        
        while (currentPage < remainingPages.length) {
          doc.addPage();
          
          // Add simple header for continuation page
          doc.rect(0, 0, doc.page.width, 30)
             .fill(primaryColor);
          
          // Add title to new page
          doc.fillColor(white)
             .fontSize(14)
             .font('Helvetica-Bold')
             .text(`${tractate} - Continued`, 30, 10);
          
          // Reset position
          yPos = 40;
          xPos = 30;
          
          // Draw header row
          doc.rect(xPos, yPos, pageWidth, 25)
             .fill(primaryColor);
          
          // Reset position for text
          doc.fillColor(white);
          
          // Draw header text
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .text('Daf', xPos + 5, yPos + 8, { width: dafColWidth - 10, align: 'center' });
          
          xPos += dafColWidth;
          
          doc.text('Date', xPos + 5, yPos + 8, { width: dateColWidth - 10, align: 'center' });
          
          xPos += dateColWidth;
          
          for (let i = 1; i <= reviews; i++) {
            doc.text(`${i}`, xPos + 5, yPos + 8, { width: reviewColWidth - 10, align: 'center' });
            xPos += reviewColWidth;
          }
          
          // If using double columns, add second set of headers
          if (useDoubleColumns) {
            // Add a small gap
            xPos += 10;
            
            // Draw second set of headers
            doc.text('Daf', xPos + 5, yPos + 8, { width: dafColWidth - 10, align: 'center' });
            
            xPos += dafColWidth;
            
            doc.text('Date', xPos + 5, yPos + 8, { width: dateColWidth - 10, align: 'center' });
            
            xPos += dateColWidth;
            
            for (let i = 1; i <= reviews; i++) {
              doc.text(`${i}`, xPos + 5, yPos + 8, { width: reviewColWidth - 10, align: 'center' });
              xPos += reviewColWidth;
            }
          }
          
          // Move to next row
          yPos += 25;
          
          // Draw rows for this page
          for (let rowIndex = 0; rowIndex < maxRowsOnPage && currentPage < remainingPages.length; rowIndex++) {
            xPos = 30;
            
            // Process first column
            const page = remainingPages[currentPage++];
            const rowColor = rowIndex % 2 === 0 ? lightGray : white;
            
            // Draw row background
            doc.rect(xPos, yPos, dafColWidth + dateColWidth + (reviewColWidth * reviews), rowHeight)
               .fill(rowColor);
            
            // Draw daf number
            doc.fillColor(darkGray)
               .font('Helvetica')
               .fontSize(9)
               .text(page.daf, xPos + 5, yPos + 5, { width: dafColWidth - 10, align: 'center' });
            
            // Draw cell border
            doc.rect(xPos, yPos, dafColWidth, rowHeight)
               .stroke(darkGray);
            
            xPos += dafColWidth;
            
            // Draw date placeholder
            doc.rect(xPos, yPos, dateColWidth, rowHeight)
               .stroke(darkGray);
            
            xPos += dateColWidth;
            
            // Draw review columns with simple checkboxes
            for (let i = 1; i <= reviews; i++) {
              // Draw cell border
              doc.rect(xPos, yPos, reviewColWidth, rowHeight)
                 .stroke(darkGray);
              
              // Draw simple checkbox in center of cell
              const checkboxX = xPos + (reviewColWidth / 2) - 3;
              const checkboxY = yPos + (rowHeight / 2) - 3;
              
              doc.rect(checkboxX, checkboxY, 6, 6)
                 .stroke(darkGray);
              
              xPos += reviewColWidth;
            }
            
            // If using double columns and we have a second page to display
            if (useDoubleColumns && currentPage < remainingPages.length) {
              // Add a small gap
              xPos += 10;
              
              const secondPage = remainingPages[currentPage++];
              
              // Draw row background for second column
              doc.rect(xPos, yPos, dafColWidth + dateColWidth + (reviewColWidth * reviews), rowHeight)
                 .fill(rowColor);
              
              // Draw daf number for second column
              doc.fillColor(darkGray)
                 .font('Helvetica')
                 .fontSize(9)
                 .text(secondPage.daf, xPos + 5, yPos + 5, { width: dafColWidth - 10, align: 'center' });
              
              // Draw cell border
              doc.rect(xPos, yPos, dafColWidth, rowHeight)
                 .stroke(darkGray);
              
              xPos += dafColWidth;
              
              // Draw date placeholder
              doc.rect(xPos, yPos, dateColWidth, rowHeight)
                 .stroke(darkGray);
              
              xPos += dateColWidth;
              
              // Draw review columns with simple checkboxes
              for (let i = 1; i <= reviews; i++) {
                // Draw cell border
                doc.rect(xPos, yPos, reviewColWidth, rowHeight)
                   .stroke(darkGray);
                
                // Draw simple checkbox in center of cell
                const checkboxX = xPos + (reviewColWidth / 2) - 3;
                const checkboxY = yPos + (rowHeight / 2) - 3;
                
                doc.rect(checkboxX, checkboxY, 6, 6)
                   .stroke(darkGray);
                
                xPos += reviewColWidth;
              }
            }
            
            // Move to next row
            yPos += rowHeight;
          }
          
          // Add simple footer with page numbers
          const pageCount = Math.ceil(pagesToDisplay.length / (useDoubleColumns ? maxRowsOnPage * 2 : maxRowsOnPage));
          const currentPageNum = Math.floor(currentPage / (useDoubleColumns ? maxRowsOnPage * 2 : maxRowsOnPage)) + 1;
          
          doc.fillColor(darkGray)
             .fontSize(8)
             .font('Helvetica')
             .text(
               `Page ${currentPageNum} of ${pageCount} | Chazara Charts`,
               30, 
               doc.page.height - 20, 
               { align: 'center', width: doc.page.width - 60 }
             );
        }
      } else {
        // Add simple footer with page numbers for first page
        const pageCount = Math.ceil(pagesToDisplay.length / (useDoubleColumns ? maxRowsOnPage * 2 : maxRowsOnPage));
        
        doc.fillColor(darkGray)
           .fontSize(8)
           .font('Helvetica')
           .text(
             `Page 1 of ${pageCount} | Chazara Charts`,
             30, 
             doc.page.height - 20, 
             { align: 'center', width: doc.page.width - 60 }
           );
      }
    });
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF file:', error);
    res.status(500).json({ error: 'Failed to generate PDF file' });
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
}); 