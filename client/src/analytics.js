/**
 * Analytics with Umami Cloud. See README "Analytics".
 *
 * The tracker sets no cookies and records page views (with country, region
 * and city) plus the events sent through track() below.
 */

const UMAMI_SCRIPT = 'https://cloud.umami.is/script.js';

// The website's ID in Umami Cloud (Settings -> Websites). Empty means
// analytics is off: no script is loaded and track() does nothing.
export const UMAMI_WEBSITE_ID = '97bbc990-bfa1-40ac-94cc-8906c5c7a653';

// Only these hostnames are recorded, so local development and preview
// builds never pollute the numbers.
const TRACKED_DOMAINS = 'chazaracharts.com,www.chazaracharts.com';

export function loadAnalytics() {
  if (!UMAMI_WEBSITE_ID || typeof document === 'undefined') return;
  if (document.querySelector('script[data-website-id]')) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = UMAMI_SCRIPT;
  script.setAttribute('data-website-id', UMAMI_WEBSITE_ID);
  script.setAttribute('data-domains', TRACKED_DOMAINS);
  document.head.appendChild(script);
}

/**
 * Records a named event with optional properties. Never throws: analytics
 * must not be able to break the page, and the script may be blocked or not
 * yet loaded.
 */
export function track(name, data) {
  try {
    if (typeof window !== 'undefined' && window.umami && typeof window.umami.track === 'function') {
      window.umami.track(name, data);
    }
  } catch {
    // Ignore: a failed analytics call is never the user's problem.
  }
}

/**
 * The chart a request was for, from its endpoint.
 */
function chartOf(endpoint) {
  if (endpoint.includes('mishna-berura')) return 'mishna-berura';
  if (endpoint.includes('mishnayot')) return 'mishnayot';
  return 'gemara';
}

/**
 * Event for a chart that was generated and downloaded: which chart, what
 * was reviewed, how it was laid out.
 */
export function trackChartGenerated(endpoint, requestData, format) {
  const chart = chartOf(endpoint);
  const what =
    requestData.topic ||
    requestData.tractate ||
    (Array.isArray(requestData.tractates) ? requestData.tractates.join(', ') : '') ||
    '';

  track('generate-chart', {
    chart,
    format,
    what: String(what).slice(0, 100),
    section: requestData.section || requestData.seder || '',
    unit: chart === 'mishna-berura' ? requestData.unit || 'siman' : '',
    rows: Array.isArray(requestData.pages) ? requestData.pages.length : 0,
    reviews: Number(requestData.reviews) || 0,
    hebrew: Boolean(requestData.useHebrew)
  });
}
