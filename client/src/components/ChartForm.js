import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  DocumentTextIcon, 
  DocumentArrowDownIcon,
  ChevronDoubleRightIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useLanguage } from './Header';
import {
  GemaraChartForm,
  MishnayotChartForm,
  MishnaBeruraChartForm
} from './charts';

// Chart types
export const CHART_TYPES = {
  GEMARA: 'gemara',
  MISHNAYOT: 'mishnayot',
  MISHNA_BERURA: 'mishna_berura'
};

const ChartForm = ({ tractateData }) => {
  const { language } = useLanguage();
  const [chartType, setChartType] = useState(CHART_TYPES.GEMARA);
  
  const [formData, setFormData] = useState({
    tractate: '',
    startDaf: 2,
    startAmud: 'a',
    endDaf: 10,
    endAmud: 'b',
    reviews: 3,
    format: 'excel',
    useHebrew: false,
    columnsPerPage: 1,
    includeDateColumn: true,
    startDate: new Date().toISOString().split('T')[0],
    dafPerDay: false
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
      // Generate array of daf pages based on dafPerDay setting
      const pages = formData.dafPerDay ? 
        generateDafArrayPerDay(
          parseInt(formData.startDaf), 
          formData.startAmud, 
          parseInt(formData.endDaf), 
          formData.endAmud
        ) :
        generateDafArray(
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
        useHebrew: formData.useHebrew,
        columnsPerPage: parseInt(formData.columnsPerPage),
        includeDateColumn: formData.includeDateColumn,
        startDate: formData.startDate,
        dafPerDay: formData.dafPerDay
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
  
  // Function to generate array of daf pages (one per day)
  const generateDafArrayPerDay = (startDaf, startAmud, endDaf, endAmud) => {
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
      // For all other cases, include both amudim as a single entry
      else {
        pages.push(`${daf}ab`);
      }
    }
    
    return pages;
  };
  
  const labels = {
    en: {
      selectChartType: 'Select Chart Type',
      gemara: 'Gemara',
      mishnayot: 'Mishnayot',
      mishnaBerura: 'Mishna Berura',
      gemaraDesc: 'Create a chart for Talmud study',
      mishnayotDesc: 'Create a chart for Mishnayot study',
      mishnaBeruraDesc: 'Create a chart for Mishna Berura study'
    },
    he: {
      selectChartType: 'בחר סוג טבלה',
      gemara: 'גמרא',
      mishnayot: 'משניות',
      mishnaBerura: 'משנה ברורה',
      gemaraDesc: 'צור טבלה ללימוד גמרא',
      mishnayotDesc: 'צור טבלה ללימוד משניות',
      mishnaBeruraDesc: 'צור טבלה ללימוד משנה ברורה'
    }
  };
  
  const t = labels[language === 'he' ? 'he' : 'en'];
  
  const handleChartTypeChange = (e) => {
    setChartType(e.target.value);
  };
  
  const renderChartForm = () => {
    switch (chartType) {
      case CHART_TYPES.GEMARA:
        return <GemaraChartForm tractateData={tractateData} />;
      case CHART_TYPES.MISHNAYOT:
        return <MishnayotChartForm />;
      case CHART_TYPES.MISHNA_BERURA:
        return <MishnaBeruraChartForm />;
      default:
        return <GemaraChartForm tractateData={tractateData} />;
    }
  };
  
  // Add this function to render tooltips with a more modern design
  const Tooltip = ({ text }) => (
    <div className="group relative flex items-center">
      <div className="ml-1 cursor-help">
        <QuestionMarkCircleIcon className="w-4 h-4 text-indigo-400 hover:text-indigo-600 transition-colors" />
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 w-64 rounded-lg bg-gray-900 text-white text-xs invisible group-hover:visible shadow-lg z-50 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2 border-8 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
  
  // Generate an array of numbers from min to max
  const range = (min, max) => {
    const result = [];
    for (let i = min; i <= max; i++) {
      result.push(i);
    }
    return result;
  };
  
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold">{t.selectChartType}</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label 
              className={`relative flex flex-col border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                chartType === CHART_TYPES.GEMARA ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="chartType"
                  value={CHART_TYPES.GEMARA}
                  checked={chartType === CHART_TYPES.GEMARA}
                  onChange={handleChartTypeChange}
                  className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 transition-all"
                />
                <div className="ml-3">
                  <span className="block font-medium text-gray-900">{t.gemara}</span>
                  <span className="block text-sm text-gray-500">{t.gemaraDesc}</span>
                </div>
              </div>
            </label>
            
            <label 
              className={`relative flex flex-col border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                chartType === CHART_TYPES.MISHNAYOT ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="chartType"
                  value={CHART_TYPES.MISHNAYOT}
                  checked={chartType === CHART_TYPES.MISHNAYOT}
                  onChange={handleChartTypeChange}
                  className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 transition-all"
                />
                <div className="ml-3">
                  <span className="block font-medium text-gray-900">{t.mishnayot}</span>
                  <span className="block text-sm text-gray-500">{t.mishnayotDesc}</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mt-2 -mr-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                {language === 'en' ? 'Coming Soon' : 'בקרוב'}
              </div>
            </label>
            
            <label 
              className={`relative flex flex-col border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                chartType === CHART_TYPES.MISHNA_BERURA ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="chartType"
                  value={CHART_TYPES.MISHNA_BERURA}
                  checked={chartType === CHART_TYPES.MISHNA_BERURA}
                  onChange={handleChartTypeChange}
                  className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 transition-all"
                />
                <div className="ml-3">
                  <span className="block font-medium text-gray-900">{t.mishnaBerura}</span>
                  <span className="block text-sm text-gray-500">{t.mishnaBeruraDesc}</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mt-2 -mr-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                {language === 'en' ? 'Coming Soon' : 'בקרוב'}
              </div>
            </label>
          </div>
        </div>
      </div>
      
      {renderChartForm()}
    </div>
  );
};

export default ChartForm; 