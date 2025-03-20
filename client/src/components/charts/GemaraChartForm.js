import React, { useState, useEffect } from 'react';
import { useLanguage } from '../Header';
import { 
  AdjustmentsHorizontalIcon,
  ChevronDoubleRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Tooltip, FormatSelection, GenerateButton, downloadChart } from './BaseChartForm';
import translations from './data/translations';

// Helper function to create a range of numbers
const range = (start, end) => {
  const result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
};

const GemaraChartForm = ({ tractateData }) => {
  const { language } = useLanguage();
  
  const [formData, setFormData] = useState({
    tractate: '',
    startDaf: 2,
    startAmud: 'a',
    endDaf: 10,
    endAmud: 'b',
    reviews: 3,
    useHebrew: false,
    format: 'excel',
    columnsPerPage: 1,
    includeDateColumn: true,
    startDate: new Date().toISOString().split('T')[0],
    dafPerDay: true
  });
  
  const [loading, setLoading] = useState(false);
  const [maxDaf, setMaxDaf] = useState(10);
  
  useEffect(() => {
    if (formData.tractate && tractateData[formData.tractate]) {
      setMaxDaf(tractateData[formData.tractate]);
      
      // Update end daf to the last daf of the masechet when a new masechet is selected
      setFormData(prev => ({
        ...prev,
        endDaf: tractateData[formData.tractate]
      }));
    }
  }, [formData.tractate, tractateData]);
  
  // Get translation based on current language
  const t = translations[language === 'he' ? 'he' : 'en'];
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Generate array of pages based on selection
      const pages = [];
      let currentDaf = parseInt(formData.startDaf);
      let currentAmud = formData.startAmud;
      const endDaf = parseInt(formData.endDaf);
      const endAmud = formData.endAmud;
      
      while (
        currentDaf < endDaf || 
        (currentDaf === endDaf && (currentAmud === 'a' || endAmud === 'b'))
      ) {
        if (formData.dafPerDay) {
          // For dafPerDay, we group both amudim together
          pages.push(`${currentDaf}`);
          currentDaf++;
        } else {
          // Add each amud separately
          pages.push(`${currentDaf}${currentAmud}`);
          
          // Move to next amud
          if (currentAmud === 'a') {
            currentAmud = 'b';
          } else {
            currentAmud = 'a';
            currentDaf++;
          }
        }
      }
      
      // Add the final page if needed
      if (!formData.dafPerDay && currentDaf === endDaf && currentAmud === endAmud) {
        pages.push(`${currentDaf}${currentAmud}`);
      }
      
      // Prepare request data
      const requestData = {
        tractates: [formData.tractate],
        reviews: formData.reviews,
        pages: pages,
        useHebrew: formData.useHebrew,
        columnsPerPage: formData.columnsPerPage,
        includeDateColumn: formData.includeDateColumn,
        startDate: formData.startDate,
        dafPerDay: formData.dafPerDay
      };
      
      // Make API request based on format
      const endpoint = formData.format === 'excel' ? '/api/create-excel' : '/api/create-pdf';
      await downloadChart(
        endpoint, 
        requestData, 
        `${formData.tractate}-chazara-chart`, 
        formData.format, 
        setLoading
      );
      
    } catch (error) {
      console.error('Error generating chart:', error);
      alert('Error generating chart. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <h2 className="text-2xl font-bold">{t.generateChart}</h2>
        <p className="text-indigo-100 mt-1 text-sm">{t.footer}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 gap-8">
          {/* Main Settings Section */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
            <h3 className="text-lg font-bold text-indigo-800 mb-6 flex items-center">
              <ChevronDoubleRightIcon className="h-5 w-5 mr-2 text-indigo-600" />
              {t.mainSettings}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tractate Selection */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="tractate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.selectMasechet}
                </label>
                <select
                  id="tractate"
                  name="tractate"
                  value={formData.tractate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
              
              {/* Learning Mode Toggle */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-2">
                  <label htmlFor="dafPerDay" className="block text-sm font-medium text-gray-700">
                    {t.dafPerDay}
                  </label>
                  <Tooltip text={t.tooltips.dafPerDay} />
                </div>
                
                <div 
                  className="relative inline-flex items-center cursor-pointer" 
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      dafPerDay: !prev.dafPerDay
                    }));
                  }}
                >
                  <input 
                    type="checkbox" 
                    id="dafPerDay" 
                    name="dafPerDay"
                    checked={formData.dafPerDay} 
                    onChange={handleChange} 
                    className="sr-only peer" 
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {formData.dafPerDay ? t.dafMode : t.amudMode}
                  </span>
                </div>
              </div>
              
              {/* Starting Daf */}
              <div>
                <label htmlFor="startDaf" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.startingDaf}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className={formData.dafPerDay ? "col-span-3" : "col-span-2"}>
                    <select
                      id="startDaf"
                      name="startDaf"
                      value={formData.startDaf}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      required
                    >
                      {range(2, formData.tractate ? Math.min(maxDaf, formData.endDaf) : 10).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  {!formData.dafPerDay && (
                    <div>
                      <select
                        id="startAmud"
                        name="startAmud"
                        value={formData.startAmud}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      >
                        <option value="a">א</option>
                        <option value="b">ב</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Ending Daf */}
              <div>
                <label htmlFor="endDaf" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.endingDaf}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className={formData.dafPerDay ? "col-span-3" : "col-span-2"}>
                    <select
                      id="endDaf"
                      name="endDaf"
                      value={formData.endDaf}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      required
                    >
                      {range(formData.startDaf, maxDaf).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  {!formData.dafPerDay && (
                    <div>
                      <select
                        id="endAmud"
                        name="endAmud"
                        value={formData.endAmud}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      >
                        <option value="a">א</option>
                        <option value="b">ב</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Number of Reviews */}
              <div>
                <label htmlFor="reviews" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded transition-all"
                />
                <label htmlFor="useHebrew" className="ml-2 block text-sm text-gray-700">
                  {t.useHebrew} (<span className="hebrew">א, ב, ג...</span>)
                </label>
              </div>
            </div>
          </div>
          
          {/* Format Selection */}
          <FormatSelection 
            format={formData.format} 
            onChange={handleChange} 
            labels={translations} 
          />
          
          {/* Customization options */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
            <h3 className="text-lg font-bold text-indigo-800 mb-6 flex items-center">
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-indigo-600" />
              {t.customization}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Columns per Page */}
                <div>
                  <div className="flex items-center mb-2">
                    <label htmlFor="columnsPerPage" className="block text-sm font-medium text-gray-700">
                      {t.columnsPerPage}
                    </label>
                    <Tooltip text={t.tooltips.columnsPerPage} />
                  </div>
                  <select
                    id="columnsPerPage"
                    name="columnsPerPage"
                    value={formData.columnsPerPage}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                  </select>
                </div>
                
                {/* Date Column Options */}
                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="includeDateColumn"
                      name="includeDateColumn"
                      checked={formData.includeDateColumn}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded transition-all"
                    />
                    <label htmlFor="includeDateColumn" className="ml-2 block text-sm text-gray-700">
                      {t.includeDateColumn}
                    </label>
                    <Tooltip text={t.tooltips.includeDateColumn} />
                  </div>
                  
                  {formData.includeDateColumn && (
                    <div className="ml-6 mt-3 p-3 border border-indigo-100 rounded-lg bg-indigo-50">
                      <div className="flex items-center mb-2">
                        <CalendarIcon className="h-4 w-4 text-indigo-600 mr-2" />
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                          {t.startDate}
                        </label>
                        <Tooltip text={t.tooltips.startDate} />
                      </div>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <GenerateButton 
          loading={loading} 
          generatingText={t.generating} 
          generateText={t.generate} 
        />
      </form>
    </div>
  );
};

export default GemaraChartForm; 