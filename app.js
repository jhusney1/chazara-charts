const path = require('path');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const pkg = require('./package.json');
const tractateData = require('./data/tractateData');
const { chartThemes } = require('./data/chartConfig');
const {
  ValidationError,
  requireString,
  normalizeChartRequest,
  safeFilename,
  toBool
} = require('./lib/normalize');
const { buildChartWorkbook } = require('./lib/excelChart');
const { withPerakim } = require('./lib/perakim');
const perakimData = require('./data/perakimData');
const { createChartDocument, renderChart, finalizeDocument } = require('./lib/pdfChart');

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '1mb' }));
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan(isProduction ? 'combined' : 'dev'));

if (isProduction) {
  app.use(express.static(path.join(__dirname, 'client/build')));
} else {
  app.use(express.static(path.join(__dirname, 'client/public')));
}

app.get('/api/tractates', (req, res) => {
  res.json(tractateData);
});

// Perek boundaries per tractate, used by the client to group the daf
// dropdowns. See data/perakimData.js.
app.get('/api/perakim', (req, res) => {
  res.json(perakimData);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: pkg.version, commit: process.env.GIT_SHA || 'unknown' });
});

/**
 * Streams a workbook as an .xlsx download.
 */
async function sendWorkbook(res, workbook, filename) {
  res.setHeader('Content-Type', XLSX_MIME);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Streams a chart as a .pdf download.
 *
 * Once PDFKit is piped to the response the headers are already committed, so a
 * later failure cannot be reported as JSON. Previously that produced a write
 * after end on an unhandled 'error' event, which exited the process. Here the
 * document is rendered fully before piping, so any error is thrown while a
 * JSON response is still possible.
 */
function sendPdf(res, filename, build) {
  const doc = build();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

  doc.on('error', (error) => {
    console.error('PDF stream error:', error);
    res.destroy(error);
  });

  doc.pipe(res);
  doc.end();
}

/**
 * Wraps an async route so rejections reach the error middleware instead of
 * becoming unhandled rejections (which terminate the process on Node 15+).
 */
function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

/* -------------------------------------------------------------------------- */
/* Gemara                                                                     */
/* -------------------------------------------------------------------------- */

function gemaraChartOptions(body) {
  const settings = normalizeChartRequest(body);
  const tractates = Array.isArray(body.tractates) ? body.tractates.filter(Boolean) : [];

  if (!tractates.length) {
    throw new ValidationError('Please provide at least one tractate');
  }

  // Opt-in so existing API callers get exactly the rows they sent.
  const includePerakim = toBool(body.includePerakim, false);

  /**
   * Row items for one tractate: the requested pages, with a perek heading
   * before the first daf of each chapter when asked for.
   */
  const itemsFor = (tractate) =>
    includePerakim ? withPerakim(settings.items, tractate, settings.useHebrew) : settings.items;

  return { settings, tractates, itemsFor };
}

app.post(
  '/api/create-excel',
  asyncRoute(async (req, res) => {
    const { settings, tractates, itemsFor } = gemaraChartOptions(req.body);

    const workbook = buildChartWorkbook({
      ...settings,
      items: itemsFor(tractates[0]),
      sheetName: tractates[0],
      itemHeader: 'Daf',
      theme: chartThemes.gemara.excel
    });

    await sendWorkbook(res, workbook, `${safeFilename(tractates[0])}-chazara-chart`);
  })
);

app.post(
  '/api/create-pdf',
  asyncRoute(async (req, res) => {
    const { settings, tractates, itemsFor } = gemaraChartOptions(req.body);

    sendPdf(res, `${safeFilename(tractates[0])}-chazara-chart`, () => {
      const doc = createChartDocument({
        title: `${tractates[0]} Chazara Chart`,
        subject: 'Talmud Study Review Chart'
      });

      tractates.forEach((tractate, index) => {
        renderChart(doc, {
          ...settings,
          items: itemsFor(tractate),
          title: `${tractate} - Chazara Chart`,
          itemHeader: 'Daf',
          checkboxes: true,
          theme: chartThemes.gemara.pdf,
          startOnNewPage: index > 0
        });
      });

      finalizeDocument(doc, 'Chazara Charts - track your Talmud review');
      return doc;
    });
  })
);

/* -------------------------------------------------------------------------- */
/* Mishnayot                                                                  */
/* -------------------------------------------------------------------------- */

function mishnayotChartOptions(body) {
  const settings = normalizeChartRequest(body);
  const tractate = requireString(body.tractate, 'a tractate');
  const seder = typeof body.seder === 'string' ? body.seder.trim() : '';
  const byChapter = body.chaptersPerDay !== false;

  return {
    settings,
    tractate,
    seder,
    itemHeader: byChapter ? 'Chapter' : 'Mishnah'
  };
}

app.post(
  '/api/mishnayot-excel',
  asyncRoute(async (req, res) => {
    const { settings, tractate, seder, itemHeader } = mishnayotChartOptions(req.body);

    const workbook = buildChartWorkbook({
      ...settings,
      sheetName: tractate,
      title: seder ? `Mishnayot: ${tractate} (${seder})` : `Mishnayot: ${tractate}`,
      itemHeader,
      theme: chartThemes.mishnayot.excel
    });

    await sendWorkbook(res, workbook, `${safeFilename(tractate)}-mishnayot-chart`);
  })
);

app.post(
  '/api/mishnayot-pdf',
  asyncRoute(async (req, res) => {
    const { settings, tractate, seder, itemHeader } = mishnayotChartOptions(req.body);

    sendPdf(res, `${safeFilename(tractate)}-mishnayot-chart`, () => {
      const doc = createChartDocument({
        title: `${tractate} Mishnayot Chart`,
        subject: 'Mishnayot Learning Chart'
      });

      renderChart(doc, {
        ...settings,
        title: seder ? `${tractate} Mishnayot Chart (${seder})` : `${tractate} Mishnayot Chart`,
        itemHeader,
        checkboxes: true,
        theme: chartThemes.mishnayot.pdf
      });

      finalizeDocument(doc, 'Chazara Charts - track your Mishnayot review');
      return doc;
    });
  })
);

/* -------------------------------------------------------------------------- */
/* Mishna Berura                                                              */
/* -------------------------------------------------------------------------- */

function mishnaBeruraChartOptions(body) {
  const settings = normalizeChartRequest(body);
  const topic = requireString(body.topic, 'a topic or siman range');
  // `section` is descriptive metadata, not a requirement. Making it mandatory
  // broke the custom siman range mode, which has no single parent chelek.
  const section = typeof body.section === 'string' ? body.section.trim() : '';

  return { settings, topic, section };
}

app.post(
  '/api/mishna-berura-excel',
  asyncRoute(async (req, res) => {
    const { settings, topic, section } = mishnaBeruraChartOptions(req.body);

    const workbook = buildChartWorkbook({
      ...settings,
      sheetName: topic,
      title: section ? `Mishna Berura: ${topic} (${section})` : `Mishna Berura: ${topic}`,
      subtitle: 'Learning & Review Tracking Chart - check off each box after completing a review',
      itemHeader: 'Siman',
      dateHeader: 'Date Learned',
      reviewHeader: 'Review',
      footer: 'Generated by Chazara Charts - track your progress through Mishna Berura',
      checkboxes: true,
      theme: chartThemes.mishnaBerura.excel
    });

    await sendWorkbook(res, workbook, `${safeFilename(topic)}-mishna-berura-chart`);
  })
);

app.post(
  '/api/mishna-berura-pdf',
  asyncRoute(async (req, res) => {
    const { settings, topic, section } = mishnaBeruraChartOptions(req.body);

    sendPdf(res, `${safeFilename(topic)}-mishna-berura-chart`, () => {
      const doc = createChartDocument({
        title: `${topic} Mishna Berura Chart`,
        subject: 'Mishna Berura Learning Chart'
      });

      renderChart(doc, {
        ...settings,
        title: section ? `Mishna Berura: ${topic} (${section})` : `Mishna Berura: ${topic}`,
        subtitle: 'Check off each box after a review',
        itemHeader: 'Siman',
        dateHeader: 'Date Learned',
        reviewHeader: 'Review',
        checkboxes: true,
        theme: chartThemes.mishnaBerura.pdf
      });

      finalizeDocument(doc, 'Chazara Charts - track your progress through Mishna Berura');
      return doc;
    });
  })
);

/* -------------------------------------------------------------------------- */

if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Central error handler. Validation problems are the client's to fix; anything
// else is logged in full server-side and reported without a stack trace, which
// previously leaked internal paths to callers.
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }

  console.error(`Unhandled error on ${req.method} ${req.path}:`, error);

  if (res.headersSent) {
    return res.destroy(error);
  }

  return res.status(500).json({ error: 'Failed to generate the chart. Please try again.' });
});

module.exports = app;
