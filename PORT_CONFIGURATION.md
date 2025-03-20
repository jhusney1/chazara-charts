# Port Configuration for Chazara Charts

This document explains the standardized port configuration for the Chazara Charts application.

## Standard Ports

The application uses the following standard ports:

| Service | Environment | Port | Description |
|---------|-------------|------|-------------|
| React Client | Development | 3000 | Standard React development server port |
| Node API | Development | 3001 | API server in development mode |
| Full App | Production | 3000 | Unified server serving both API and static files |

## Development Mode

In development mode, two separate servers run simultaneously:

1. **React Development Server**: Runs on port 3000
   - Provides hot reloading
   - Serves the client-side application

2. **API Server**: Runs on port 3001
   - Serves the API endpoints
   - The React app communicates with this server via proxy

The proxy configuration in `client/package.json` allows the React app to make API calls to the development server without CORS issues:

```json
"proxy": "http://localhost:3001"
```

## Production Mode

In production mode, a single Express server handles both the API and serves the static React build files:

- Server runs on port 3000
- API endpoints are available at `/api/*`
- Static files are served from `client/build`

## Docker Configuration

The Docker Compose configuration reflects this port setup:

- `react-dev`: Maps host port 3000 to container port 3000
- `api-dev`: Maps host port 3001 to container port 3001
- `app` (production): Maps host port 3000 to container port 3000

## Environment Variables

- `PORT`: Sets the server port (3000 for production, 3001 for development)
- `REACT_APP_API_URL`: In development, points to the API server (`http://localhost:3001`)

## Running the Application

### Development Mode

```bash
# Run API server on port 3001
npm run dev

# In another terminal, run React dev server on port 3000
npm run client

# Or run both concurrently
npm run dev-full
```

### Production Mode

```bash
# Build React app
npm run client-build

# Run production server on port 3000
npm start

# Or use Docker
docker-compose up app
```

## Accessing the Application

- Development React App: http://localhost:3000
- Development API: http://localhost:3001
- Production (unified): http://localhost:3000 