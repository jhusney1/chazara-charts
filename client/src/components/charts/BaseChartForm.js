import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../Header';
import { 
  DocumentTextIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

// Tooltip component for helping users understand form fields
export const Tooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(true), 100);
  };
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(false), 300);
  };
  
  return (
    <div className="relative ml-1 inline-block">
      <button
        type="button"
        className="text-gray-400 hover:text-indigo-500 focus:outline-none focus:text-indigo-500"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        aria-label="Additional information"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-.25 3.75a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v3.5a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75v-3.5z" clipRule="evenodd" />
        </svg>
      </button>
      
      {show && (
        <div 
          ref={tooltipRef}
          className="absolute left-0 top-0 transform -translate-y-full -translate-x-1/4 mt-[-8px] w-48 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {text}
          <div className="absolute left-[10px] transform top-full w-2 h-2 bg-gray-800 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

// Format Selection component
export const FormatSelection = ({ format, onChange, labels }) => {
  const { language } = useLanguage();
  const t = labels[language === 'he' ? 'he' : 'en'];
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
      <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center">
        <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-indigo-600" />
        {t.downloadFormat}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${format === 'excel' ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-300'}`}>
          <input
            type="radio"
            name="format"
            value="excel"
            checked={format === 'excel'}
            onChange={onChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 transition-all"
          />
          <div className="ml-3 flex items-center">
            <DocumentTextIcon className="h-10 w-10 text-green-600 mr-4" />
            <div>
              <span className="block font-medium">{t.excel}</span>
              <span className="block text-xs text-gray-500">{t.excelDesc}</span>
            </div>
          </div>
        </label>
        
        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${format === 'pdf' ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-300'}`}>
          <input
            type="radio"
            name="format"
            value="pdf"
            checked={format === 'pdf'}
            onChange={onChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 transition-all"
          />
          <div className="ml-3 flex items-center">
            <DocumentArrowDownIcon className="h-10 w-10 text-red-600 mr-4" />
            <div>
              <span className="block font-medium">{t.pdf}</span>
              <span className="block text-xs text-gray-500">{t.pdfDesc}</span>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};

// Generate Chart Button component
export const GenerateButton = ({ loading, generatingText, generateText }) => {
  return (
    <div className="mt-8 text-center">
      <button
        type="submit"
        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {generatingText}
          </>
        ) : (
          generateText
        )}
      </button>
    </div>
  );
};

// Common chart download functionality
export const downloadChart = async (endpoint, requestData, filename, format, setLoading) => {
  try {
    const response = await axios({
      url: endpoint,
      method: 'POST',
      data: requestData,
      responseType: 'blob'
    });
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `${filename}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error) {
    console.error('Error generating chart:', error);
    alert('Error generating chart. Please try again.');
    return false;
  } finally {
    setLoading(false);
  }
};

export default {
  Tooltip,
  FormatSelection,
  GenerateButton,
  downloadChart
}; 