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
# Build and start the container
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
# Build and start the development container
docker compose --profile dev up --build
```

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

### POST /api/create-excel

Generates an Excel file based on the provided parameters.

Example using cURL:
```bash
curl -X POST \
  http://localhost:3000/api/create-excel \
  -H 'Content-Type: application/json' \
  -d '{
    "tractates": ["Berachot"],
    "reviews": 3,
    "pages": ["2a", "2b", "3a", "3b", "4a", "4b"],
    "useHebrew": true
  }' \
  --output chazara-chart.xlsx
```

### POST /api/create-pdf

Generates a PDF file based on the provided parameters.

Example using cURL:
```bash
curl -X POST \
  http://localhost:3000/api/create-pdf \
  -H 'Content-Type: application/json' \
  -d '{
    "tractates": ["Berachot"],
    "reviews": 3,
    "pages": ["2a", "2b", "3a", "3b", "4a", "4b"],
    "useHebrew": true
  }' \
  --output chazara-chart.pdf
```

## Request Body Parameters

- `tractates` (required): An array of tractate names to include in the file
- `reviews` (optional, default: 3): The number of review columns to include
- `pages` (optional): An array of specific daf pages to include (e.g., ["2a", "2b", "3a"]). If not provided, defaults to the first 10 pages.
- `useHebrew` (optional, default: false): Whether to use Hebrew letters for daf numbers 