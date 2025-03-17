import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { DocumentTextIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useLanguage } from './Header';

const ChartForm = ({ tractateData }) => {
  const { language } = useLanguage();
  
  const [formData, setFormData] = useState({
    tractate: '',
    startDaf: 2,
    startAmud: 'a',
    endDaf: 10,
    endAmud: 'b',
    reviews: 3,
    format: 'excel',
    useHebrew: false
  });
  
  const [loading, setLoading] = useState(false);
  const [maxDaf, setMaxDaf] = useState(200);
  
  // Update max daf when tractate changes
  useEffect(() => {
    if (formData.tractate && tractateData[formData.tractate]) {
      setMaxDaf(tractateData[formData.tractate]);
      
      // If current end daf is greater than max, adjust it
      if (formData.endDaf > tractateData[formData.tractate]) {
        setFormData(prev => ({
          ...prev,
          endDaf: tractateData[formData.tractate]
        }));
      }
    }
  }, [formData.tractate, tractateData]);
  
  // Update useHebrew when language changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      useHebrew: language === 'he'
    }));
  }, [language]);
  
  // This is a test comment to verify hot-reloading is working
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.tractate) {
      toast.error(language === 'en' ? 'Please select a tractate' : 'אנא בחר מסכת');
      return;
    }
    
    // Validate daf range
    const startDafNum = parseInt(formData.startDaf);
    const endDafNum = parseInt(formData.endDaf);
    
    if (endDafNum < startDafNum || 
        (endDafNum === startDafNum && formData.endAmud === 'a' && formData.startAmud === 'b')) {
      toast.error(language === 'en' ? 'Ending Daf must be after Starting Daf' : 'דף סיום חייב להיות אחרי דף התחלה');
      return;
    }
    
    setLoading(true);
    
    try {
      // Generate array of daf pages
      const pages = generateDafArray(
        parseInt(formData.startDaf), 
        formData.startAmud, 
        parseInt(formData.endDaf), 
        formData.endAmud
      );
      
      // Prepare request data
      const requestData = {
        tractates: [formData.tractate],
        reviews: parseInt(formData.reviews),
        pages: pages,
        useHebrew: formData.useHebrew
      };
      
      // Determine endpoint based on format
      const endpoint = formData.format === 'pdf' ? '/api/create-pdf' : '/api/create-excel';
      
      // Make API request with explicit timeout and retry logic
      let retries = 0;
      const maxRetries = 2;
      let response;
      
      while (retries <= maxRetries) {
        try {
          response = await axios({
            url: endpoint,
            method: 'POST',
            data: requestData,
            responseType: 'blob',
            headers: {
              'Content-Type': 'application/json',
              'Accept': formData.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            timeout: 30000 // 30 second timeout
          });
          
          // If we get here, the request was successful
          break;
        } catch (err) {
          retries++;
          
          if (retries > maxRetries) {
            // Rethrow the error if we've exhausted our retries
            throw err;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
      
      // Check if the response is valid
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      // Create file name
      const fileName = `${formData.tractate}-chazara-chart.${formData.format === 'excel' ? 'xlsx' : 'pdf'}`;
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(language === 'en' ? 'Chart generated successfully!' : 'הטבלה נוצרה בהצלחה!');
    } catch (error) {
      console.error('Error generating chart:', error);
      
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request made but no response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      
      toast.error(language === 'en' ? 
        `Failed to generate chart: ${error.message}. Please try again.` : 
        `יצירת הטבלה נכשלה: ${error.message}. אנא נסה שוב.`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to generate array of daf pages
  const generateDafArray = (startDaf, startAmud, endDaf, endAmud) => {
    const pages = [];
    
    for (let daf = startDaf; daf <= endDaf; daf++) {
      // For first daf, check if we should include amud a
      if (daf === startDaf && startAmud === 'b') {
        pages.push(`${daf}b`);
      } 
      // For last daf, check if we should include amud b
      else if (daf === endDaf && endAmud === 'a') {
        pages.push(`${daf}a`);
      }
      // For all other cases, include both amudim
      else {
        pages.push(`${daf}a`);
        pages.push(`${daf}b`);
      }
    }
    
    return pages;
  };
  
  const labels = {
    en: {
      generateChart: 'Generate Your Chart',
      selectMasechet: 'Select Masechet',
      startingDaf: 'Starting Daf',
      endingDaf: 'Ending Daf',
      reviews: 'Number of Reviews',
      useHebrew: 'Use Hebrew letters for daf numbers',
      downloadFormat: 'Download Format',
      excel: 'Excel Spreadsheet',
      excelDesc: 'Editable format for digital use',
      pdf: 'PDF Document',
      pdfDesc: 'Printable format for physical use',
      generating: 'Generating...',
      generate: 'Generate Chart',
      footer: 'This will generate a chart for the selected tractate with columns for the date learned and each review session.'
    },
    he: {
      generateChart: 'צור את הטבלה שלך',
      selectMasechet: 'בחר מסכת',
      startingDaf: 'דף התחלה',
      endingDaf: 'דף סיום',
      reviews: 'מספר חזרות',
      useHebrew: 'השתמש באותיות עבריות למספרי דפים',
      downloadFormat: 'פורמט להורדה',
      excel: 'גיליון אקסל',
      excelDesc: 'פורמט לעריכה דיגיטלית',
      pdf: 'מסמך PDF',
      pdfDesc: 'פורמט להדפסה',
      generating: 'מייצר...',
      generate: 'צור טבלה',
      footer: 'זה ייצור טבלה עבור המסכת שנבחרה עם עמודות לתאריך הלימוד ולכל חזרה.'
    }
  };
  
  const t = labels[language === 'he' ? 'he' : 'en'];
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl text-primary-800">{t.generateChart}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tractate Selection */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="tractate" className="block text-sm font-medium text-gray-700 mb-1">
              {t.selectMasechet}
            </label>
            <select
              id="tractate"
              name="tractate"
              value={formData.tractate}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="" disabled>Choose a Masechet</option>
              {Object.keys(tractateData).sort().map(tractate => (
                <option key={tractate} value={tractate}>
                  {tractate} ({tractateData[tractate]} daf)
                </option>
              ))}
            </select>
          </div>
          
          {/* Starting Daf */}
          <div>
            <label htmlFor="startDaf" className="block text-sm font-medium text-gray-700 mb-1">
              {t.startingDaf}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="number"
                  id="startDaf"
                  name="startDaf"
                  min="2"
                  max={maxDaf}
                  value={formData.startDaf}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <select
                  id="startAmud"
                  name="startAmud"
                  value={formData.startAmud}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="a">א</option>
                  <option value="b">ב</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Ending Daf */}
          <div>
            <label htmlFor="endDaf" className="block text-sm font-medium text-gray-700 mb-1">
              {t.endingDaf}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="number"
                  id="endDaf"
                  name="endDaf"
                  min="2"
                  max={maxDaf}
                  value={formData.endDaf}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <select
                  id="endAmud"
                  name="endAmud"
                  value={formData.endAmud}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="a">א</option>
                  <option value="b">ב</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Number of Reviews */}
          <div>
            <label htmlFor="reviews" className="block text-sm font-medium text-gray-700 mb-1">
              {t.reviews}
            </label>
            <input
              type="number"
              id="reviews"
              name="reviews"
              min="1"
              max="10"
              value={formData.reviews}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          {/* Hebrew Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useHebrew"
              name="useHebrew"
              checked={formData.useHebrew}
              onChange={handleChange}
              className="form-checkbox"
            />
            <label htmlFor="useHebrew" className="ml-2 block text-sm text-gray-700">
              {t.useHebrew} (<span className="hebrew">א, ב, ג...</span>)
            </label>
          </div>
          
          {/* Format Selection */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t.downloadFormat}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${formData.format === 'excel' ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}`}>
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={formData.format === 'excel'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <div className="ml-3 flex items-center">
                  <DocumentTextIcon className="h-6 w-6 text-green-600 mr-2" />
                  <div>
                    <span className="block font-medium">{t.excel}</span>
                    <span className="block text-xs text-gray-500">{t.excelDesc}</span>
                  </div>
                </div>
              </label>
              
              <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${formData.format === 'pdf' ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}`}>
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={formData.format === 'pdf'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <div className="ml-3 flex items-center">
                  <DocumentArrowDownIcon className="h-6 w-6 text-red-600 mr-2" />
                  <div>
                    <span className="block font-medium">{t.pdf}</span>
                    <span className="block text-xs text-gray-500">{t.pdfDesc}</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button
            type="submit"
            className="btn btn-primary px-8 py-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.generating}
              </>
            ) : (
              t.generate
            )}
          </button>
        </div>
      </form>
      
      <div className="card-footer bg-gray-50">
        <p className="text-sm text-gray-600">
          {t.footer}
        </p>
      </div>
    </div>
  );
};

export default ChartForm; 