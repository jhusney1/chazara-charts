import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { EyeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import ExcelGridPreview from './ExcelGridPreview';

const DEBOUNCE_MS = 600;

const EMPTY = { url: null, grid: null, pages: null, rows: null, columns: null, loading: false, error: null };

/**
 * Live preview of the file about to be downloaded.
 *
 * PDF: rendered through the same PDF endpoint the download uses, so it is
 * exactly what will print; the server reports page and row counts in headers.
 * Excel: the server builds the same workbook and returns it as a grid
 * (…-excel-preview), rendered here as a spreadsheet.
 *
 * Refreshes (debounced) whenever the request or the format changes.
 *
 * @param {object|null} request  { pdfEndpoint, excelEndpoint, requestData } or null while incomplete
 * @param {string}      format   'excel' or 'pdf'
 * @param {object}      labels   translation strings
 */
const ChartPreview = ({ request, format, labels }) => {
  const [state, setState] = useState(EMPTY);
  const urlRef = useRef(null);

  const isExcel = format === 'excel';
  const endpoint = request ? (isExcel ? `${request.excelEndpoint}-preview` : request.pdfEndpoint) : null;
  // A stable string lets the effect ignore re-renders that change nothing.
  const requestKey = request ? JSON.stringify([endpoint, request.requestData]) : null;

  useEffect(() => {
    if (!requestKey) {
      setState(EMPTY);
      return undefined;
    }

    let cancelled = false;
    const [url, requestData] = JSON.parse(requestKey);
    const excel = url.endsWith('-excel-preview');

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const timer = setTimeout(async () => {
      try {
        const response = await axios({
          url,
          method: 'POST',
          data: requestData,
          responseType: excel ? 'json' : 'blob',
          timeout: 30000
        });
        if (cancelled) return;

        if (excel) {
          const grid = response.data;
          setState({
            url: null,
            grid,
            pages: null,
            rows: grid.rowCount,
            columns: grid.columnCount,
            loading: false,
            error: null
          });
          return;
        }

        if ((response.headers['content-type'] || '').includes('application/json')) {
          const json = JSON.parse(await response.data.text());
          throw new Error(json.error || 'Unknown server error');
        }

        if (urlRef.current) window.URL.revokeObjectURL(urlRef.current);
        const objectUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        urlRef.current = objectUrl;

        setState({
          url: objectUrl,
          grid: null,
          pages: Number(response.headers['x-chart-pages']) || null,
          rows: Number(response.headers['x-chart-rows']) || null,
          columns: null,
          loading: false,
          error: null
        });
      } catch (error) {
        if (cancelled) return;
        let message = error.message;
        const data = error.response && error.response.data;
        if (data instanceof Blob) {
          try {
            message = JSON.parse(await data.text()).error || message;
          } catch {
            // Keep the generic message.
          }
        } else if (data && data.error) {
          message = data.error;
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

  const hasContent = Boolean(state.url || state.grid);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-lg font-bold text-indigo-800 flex items-center">
          <EyeIcon className="h-5 w-5 mr-2 text-indigo-600" />
          {isExcel ? labels.previewExcel : labels.preview}
        </h3>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {state.loading && (
            <span className="flex items-center text-indigo-600">
              <span className="h-3 w-3 mr-2 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              {labels.previewLoading}
            </span>
          )}
          {!state.loading && state.rows !== null && (
            <span>
              {state.pages !== null && (
                <>
                  <strong>{state.pages}</strong> {state.pages === 1 ? labels.previewPage : labels.previewPages}
                  {' · '}
                </>
              )}
              <strong>{state.rows}</strong> {labels.previewRows}
              {state.columns !== null && (
                <>
                  {' · '}
                  <strong>{state.columns}</strong> {labels.previewColumns}
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
        {isExcel ? labels.previewExcelNote : labels.previewHint}
      </p>

      {state.error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-3">
          {labels.previewError}: {state.error}
        </div>
      )}

      {hasContent ? (
        <div className={`transition-opacity ${state.loading ? 'opacity-50' : 'opacity-100'}`}>
          {state.grid ? (
            <ExcelGridPreview grid={state.grid} className="h-[28rem]" />
          ) : (
            <iframe
              title={labels.preview}
              src={`${state.url}#toolbar=0&navpanes=0&view=FitH`}
              className="w-full h-[28rem] rounded-lg border border-gray-200 bg-gray-50"
            />
          )}
        </div>
      ) : (
        <div className="w-full h-40 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
          {state.loading ? labels.previewLoading : labels.previewEmpty}
        </div>
      )}
    </div>
  );
};

export default ChartPreview;
