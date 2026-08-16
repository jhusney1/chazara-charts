const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Proxies API calls from the CRA dev server to the Express API.
 *
 * This runs inside the dev server (Node), not the browser, so the target may
 * be a Docker service name. Browser-side code must always use relative /api
 * paths so they arrive here.
 *
 * Override with API_PROXY_TARGET when the API is not on localhost:3001, e.g.
 * the docker-compose dev profile sets it to http://api-dev:3001.
 */
module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.API_PROXY_TARGET || 'http://localhost:3001',
      changeOrigin: true
    })
  );
};
