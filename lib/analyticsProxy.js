/**
 * Serves the self-hosted Umami tracker through the app's own domain.
 *
 *   /stats/script.js    -> Umami /script.js   (the tracker)
 *   /stats/api/send     -> Umami /api/send    (where the tracker posts events)
 *
 * The tracker posts to the folder its script was loaded from, so loading it
 * from /stats/script.js sends every event to /stats/api/send. Visitors'
 * browsers only ever talk to this site; Umami itself is not public except
 * for its dashboard (see deploy/nginx/).
 *
 * Umami geolocates a visitor from X-Real-IP or X-Forwarded-For, which nginx
 * sets in front of the app. Those headers are passed through untouched, and
 * xfwd appends this hop to X-Forwarded-For as a fallback.
 *
 * With UMAMI_URL unset (tests, local development) the routes do not exist.
 * If Umami is down, the routes answer 503 with an empty body instead of
 * erroring: analytics must never affect the site itself.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

const PUBLIC_PREFIX = '/stats';
const PROXIED_PATHS = [`${PUBLIC_PREFIX}/script.js`, `${PUBLIC_PREFIX}/api/send`];

function analyticsProxy(target = process.env.UMAMI_URL) {
  if (!target) return null;

  return createProxyMiddleware({
    target,
    pathFilter: (path) => PROXIED_PATHS.includes(path),
    pathRewrite: (path) => path.slice(PUBLIC_PREFIX.length),
    changeOrigin: true,
    xfwd: true,
    proxyTimeout: 5000,
    timeout: 5000,
    on: {
      error: (error, req, res) => {
        console.warn(`Analytics proxy: ${req.method} ${req.url} failed (${error.code || error.message})`);
        // `res` is a socket rather than a response when an upgrade fails.
        if (typeof res.writeHead !== 'function') return;
        if (!res.headersSent) res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end();
      }
    }
  });
}

module.exports = { analyticsProxy, PROXIED_PATHS };
