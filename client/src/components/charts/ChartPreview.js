import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { EyeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const DEBOUNCE_MS = 600;

/**
 * Live print preview.
 *
 * Renders the chart through the same PDF endpoint the download uses, so the
 * preview is exactly what will print. Refreshes (debounced) whenever the
 * request changes. The server reports page and row counts in response
 * headers so the user can judge whether the chart fits before downloading.
 *
 * @param {object|null} request  { pdfEndpoint, requestData } or null while the form is incomplete
 * @param {string}      format   'excel' or 'pdf'; Excel previews the printable layout too
 * @param {object}      labels   translation strings
 */
const ChartPreview = ({ request, format, labels }) => {
  const [state, setState] = useState({ url: null, pages: null, rows: null, loading: false, error: null });
  const urlRef = useRef(null);

  // A stable string lets the effect ignore re-renders that change nothing.
  const requestKey = request ? JSON.stringify([request.pdfEndpoint, request.requestData]) : null;

  useEffect(() => {
    if (!requestKey) {
      setState({ url: null, pages: null, rows: null, loading: false, error: null });
      return undefined;
    }

    let cancelled = false;
    const [endpoint, requestData] = JSON.parse(requestKey);

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const timer = setTimeout(async () => {
      try {
        const response = await axios({
          url: endpoint,
          method: 'POST',
          data: requestData,
          responseType: 'blob',
          timeout: 30000
        });
        if (cancelled) return;

        if ((response.headers['content-type'] || '').includes('application/json')) {
          const json = JSON.parse(await response.data.text());
          throw new Error(json.error || 'Unknown server error');
        }

        if (urlRef.current) window.URL.revokeObjectURL(urlRef.current);
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        urlRef.current = url;

        setState({
          url,
          pages: Number(response.headers['x-chart-pages']) || null,
          rows: Number(response.headers['x-chart-rows']) || null,
          loading: false,
          error: null
        });
      } catch (error) {
        if (cancelled) return;
        let message = error.message;
        if (error.response && error.response.data instanceof Blob) {
          try {
            message = JSON.parse(await error.response.data.text()).error || message;
          } catch {
            // Keep the generic message.
          }
        }
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [requestKey]);

  // Release the last blob when the panel unmounts.
  useEffect(() => () => {
    if (urlRef.current) window.URL.revokeObjectURL(urlRef.current);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-lg font-bold text-indigo-800 flex items-center">
          <EyeIcon className="h-5 w-5 mr-2 text-indigo-600" />
          {labels.preview}
        </h3>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {state.loading && (
            <span className="flex items-center text-indigo-600">
              <span className="h-3 w-3 mr-2 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              {labels.previewLoading}
            </span>
          )}
          {!state.loading && state.pages !== null && (
            <span>
              <strong>{state.pages}</strong> {labels.previewPages}
              {state.rows !== null && (
                <>
                  {' · '}
                  <strong>{state.rows}</strong> {labels.previewRows}
                </>
              )}
            </span>
          )}
          {state.url && (
            <a
              href={state.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
              {labels.previewOpen}
            </a>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {format === 'excel' ? labels.previewExcelNote : labels.previewHint}
      </p>

      {state.error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-3">
          {labels.previewError}: {state.error}
        </div>
      )}

      {state.url ? (
        <iframe
          title={labels.preview}
          src={`${state.url}#toolbar=0&navpanes=0&view=FitH`}
          className={`w-full h-[28rem] rounded-lg border border-gray-200 bg-gray-50 transition-opacity ${
            state.loading ? 'opacity-50' : 'opacity-100'
          }`}
        />
      ) : (
        <div className="w-full h-40 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
          {state.loading ? labels.previewLoading : labels.previewEmpty}
        </div>
      )}
    </div>
  );
};

export default ChartPreview;
