# Chazara Charts

A modern web application for generating Excel spreadsheets and PDFs to track Talmud study reviews.

## Features

- Modern React frontend with Tailwind CSS
- Interactive web interface for generating Talmud study tracking charts
- Generate Excel files or PDFs for tracking your learning progress
- Customizable number of review columns
- Select specific daf ranges for your study plan
- Support for Hebrew or English daf numbering
- Complete tractate data with accurate page counts
- Dockerized for easy deployment

## Tech Stack

- **Frontend**: React, Tailwind CSS, Heroicons, Headless UI
- **Backend**: Node.js, Express
- **File Generation**: ExcelJS (Excel), PDFKit (PDF)
- **Containerization**: Docker, Docker Compose

## Prerequisites

- Docker installed on your machine
- Docker Compose (recommended)
- Node.js and npm (for local development)

## Getting Started

### Option 1: Using Docker Compose (Recommended for Production)

To build and run the application using Docker Compose:

```bash
# Build and start the container in production mode
docker compose up --build

# Or to run in detached mode (background)
docker compose up --build -d
```

To stop the container:
```bash
docker compose down
```

### Option 2: Development Mode with Hot Reloading

For development with hot reloading of both the server and client:

```bash
# Build and start the development containers
docker compose --profile dev up --build
```

This will start:
- The API server on port 3001
- The React development server on port 3002

Access the development application at http://localhost:3002

### Option 3: Local Development

To run the application locally without Docker:

1. Install server dependencies:
```bash
npm install
```

2. Install client dependencies:
```bash
cd client && npm install
```

3. Start both the server and client in development mode:
```bash
npm run dev-full
```

Or run them separately:
```bash
# Terminal 1 - Start the server
npm run dev

# Terminal 2 - Start the client
npm run client
```

## Using the Application

Once the application is running, you can access the web interface by navigating to:

```
http://localhost:3000
```

From the web interface, you can:
1. Select a Masechet (tractate) of Gemara
2. Specify the starting and ending Daf (page)
3. Choose the number of review columns
4. Select Hebrew or English daf numbering
5. Choose your preferred download format (Excel or PDF)
6. Generate and download your personalized chart

## API Endpoints

If you prefer to use the API directly:

### GET /api/tractates

Returns a list of all tractates with their page counts.

Example:
```bash
curl http://localhost:3000/api/tractates
```
### Chart endpoints

All six chart endpoints accept `POST` with a JSON body and stream back a file.

| Endpoint | Chart | Format |
|---|---|---|
| `POST /api/create-excel` | Gemara | `.xlsx` |
| `POST /api/create-pdf` | Gemara | `.pdf` |
| `POST /api/mishnayot-excel` | Mishnayot | `.xlsx` |
| `POST /api/mishnayot-pdf` | Mishnayot | `.pdf` |
| `POST /api/mishna-berura-excel` | Mishna Berura | `.xlsx` |
| `POST /api/mishna-berura-pdf` | Mishna Berura | `.pdf` |

Example:

```bash
curl -X POST http://localhost:3000/api/create-excel \
  -H 'Content-Type: application/json' \
  -d '{
    "tractates": ["Berachot"],
    "reviews": 3,
    "pages": ["2a", "2b", "3a", "3b"],
    "useHebrew": true,
    "columnsPerPage": 2,
    "includeDateColumn": true,
    "startDate": "2026-08-16"
  }' \
  --output chazara-chart.xlsx
```

### Request parameters

Shared by every chart endpoint:

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `pages` | string[] | **required** | Row labels in display order. Max 2000. |
| `reviews` | number | `3` | Review columns. Clamped to 1–10. |
| `columnsPerPage` | number | `1` | Side-by-side blocks. Clamped to 1–6. |
| `includeDateColumn` | boolean | `true` | Adds a date column. |
| `startDate` | string | today | `YYYY-MM-DD`, read as a local date. |
| `useHebrew` | boolean | `false` | Hebrew numerals instead of digits. |

Per chart type:

| Parameter | Required by | Notes |
|---|---|---|
| `tractates` | Gemara | Array; one worksheet/section per tractate. |
| `tractate` | Mishnayot | Tractate name. |
| `seder` | Mishnayot | Optional label. |
| `chaptersPerDay` | Mishnayot | `true` (default) labels rows "Chapter", else "Mishnah". |
| `topic` | Mishna Berura | Title of the chart. |
| `section` | Mishna Berura | Optional chelek label. |

Numeric fields are coerced and clamped server-side, so out-of-range or
string values are corrected rather than trusted. Invalid requests return
`400` with an `{ "error": ... }` body.

## Hebrew numerals

`useHebrew` renders row labels as Hebrew numerals. Numbers whose last two
digits are 15 or 16 use the ט"ו / ט"ז forms so no number spells a divine name.

PDF output needs a Hebrew-capable font, since the built-in PDF fonts are
WinAnsi encoded and cannot represent Hebrew. `assets/fonts/DejaVuSans.ttf`
ships with the project (Bitstream Vera licence, see
`assets/fonts/LICENSE.txt`). To use a different font, drop a `.ttf` into
`assets/fonts/` or set `HEBREW_FONT_PATH` to its location. If no font is
found the server logs a warning rather than emitting unreadable output.

## Testing

```bash
npm test
```

Runs the suite with Node's built-in test runner (no extra dependencies).
It covers all six endpoints end to end: column counts, pagination,
date handling across timezones, Hebrew conversion, and input validation.

## Shipping a change

Every push to `master` that passes CI is released automatically by
`.github/workflows/ci.yml`: the `build` job builds the production image on
GitHub's runners and pushes it to `ghcr.io/jhusney1/chazara-charts` tagged
with the short commit SHA, then the `deploy` job SSHes to the DigitalOcean
Droplet, pulls that tag, restarts the container, and verifies `/api/health`
reports the commit. The Droplet never builds, so a release takes seconds.
It needs the repository secrets `DEPLOY_SSH_KEY`, `DEPLOY_HOST`,
`DEPLOY_PATH` and the variable `PROD_URL`.

The `/ship` skill in `.claude/skills/ship/` drives the loop that leads
there: GitHub issue, `task/N-slug` branch, implement, `npm test` plus
client build plus `npm run smoke -- http://localhost:3002`, PR with CI,
then squash merge, which triggers the release.

`npm run release -- <sha>` rolls production back to any commit CI has
built, using the same server script (`scripts/deploy-remote.sh`) from your
machine with `deploy.env` (copy `deploy.env.example`). Add `--build` to
build on the Droplet instead when CI is unavailable; it is slow.

## Project layout

```
server.js            Startup and graceful shutdown
app.js               Express app and route definitions
lib/normalize.js     Request coercion, validation, date helpers
lib/excelChart.js    Shared Excel chart builder
lib/pdfChart.js      Shared PDF chart builder (pagination, fonts)
data/                Tractate/chart config and Hebrew numeral conversion
assets/fonts/        Hebrew-capable font for PDF output
test/                Test suite
client/              React front end
```
