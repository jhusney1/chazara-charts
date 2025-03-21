import React, { useState, useEffect } from 'react';
import { useLanguage } from '../Header';
import { 
  AdjustmentsHorizontalIcon,
  ChevronDoubleRightIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Tooltip, FormatSelection, GenerateButton, downloadChart } from './BaseChartForm';
import translations from './data/translations';
import mishnaBeruraData from './data/mishnaBeruraData';

// Helper function to create a range of numbers
const range = (start, end) => {
  const result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
};

const MishnaBeruraChartForm = () => {
  const { language } = useLanguage();
  
  const [formData, setFormData] = useState({
    section: '',
    topic: '',
    startSiman: 1,
    startSeif: 1,
    endSiman: 1,
    endSeif: 1,
    reviews: 3,
    useHebrew: false,
    format: 'excel',
    columnsPerPage: 1,
    includeDateColumn: true,
    startDate: new Date().toISOString().split('T')[0],
    simanPerDay: true
  });
  
  const [loading, setLoading] = useState(false);
  const [simanRange, setSimanRange] = useState({ start: 1, end: 1 });
  const [maxSeifStart, setMaxSeifStart] = useState(10);
  const [maxSeifEnd, setMaxSeifEnd] = useState(10);
  
  // Get translation based on current language
  const t = translations[language === 'he' ? 'he' : 'en'];
  
  // Effect to update topic options when section changes
  useEffect(() => {
    if (formData.section) {
      setFormData(prev => ({
        ...prev,
        topic: '',
        startSiman: 1,
        startSeif: 1,
        endSiman: 1,
        endSeif: 1
      }));
    }
  }, [formData.section]);
  
  // Effect to update siman options when topic changes
  useEffect(() => {
    if (formData.section && formData.topic && mishnaBeruraData[formData.section][formData.topic]) {
      const { start, end } = mishnaBeruraData[formData.section][formData.topic];
      setSimanRange({ start, end });
      
      // Update siman ranges when a new topic is selected
      setFormData(prev => ({
        ...prev,
        startSiman: start,
        endSiman: end,
        startSeif: 1,
        endSeif: 1
      }));
    }
  }, [formData.topic]);
  
  // Effect to handle se'if count changes based on siman selection
  useEffect(() => {
    // These are just placeholder values - in a real application you would fetch
    // the actual count of se'ifim for each siman
    setMaxSeifStart(10); 
    setMaxSeifEnd(10);
  }, [formData.startSiman, formData.endSiman]);
  
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
      let currentSiman = parseInt(formData.startSiman);
      let currentSeif = formData.simanPerDay ? 1 : parseInt(formData.startSeif);
      const endSiman = parseInt(formData.endSiman);
      const endSeif = formData.simanPerDay ? 10 : parseInt(formData.endSeif);
      
      if (formData.simanPerDay) {
        // Siman mode - include entire simanim
        for (let siman = currentSiman; siman <= endSiman; siman++) {
          pages.push(`${siman}`);
        }
      } else {
        // Se'if mode - include individual se'ifim
        while (
          currentSiman < endSiman || 
          (currentSiman === endSiman && currentSeif <= endSeif)
        ) {
          pages.push(`${currentSiman}:${currentSeif}`);
          
          // Move to next se'if
          currentSeif++;
          
          // Move to next siman when we reach the end of the current siman
          if (currentSeif > maxSeifStart) {
            currentSeif = 1;
            currentSiman++;
          }
        }
      }
      
      // Prepare request data
      const requestData = {
        section: formData.section,
        topic: formData.topic,
        reviews: formData.reviews,
        pages: pages,
        useHebrew: formData.useHebrew,
        columnsPerPage: formData.columnsPerPage,
        includeDateColumn: formData.includeDateColumn,
        startDate: formData.startDate,
        simanPerDay: formData.simanPerDay
      };
      
      // Make API request based on format
      const endpoint = formData.format === 'excel' ? '/api/mishna-berura-excel' : '/api/mishna-berura-pdf';
      await downloadChart(
        endpoint, 
        requestData, 
        `${formData.topic.replace(/\s+/g, '-').toLowerCase()}-mishna-berura-chart`, 
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
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <h2 className="text-2xl font-bold">{t.mishnaBeruraGenerator}</h2>
        <p className="text-emerald-100 mt-1 text-sm">{t.mishnaBeruraFooter}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 gap-8">
          {/* Main Settings Section */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-100">
            <h3 className="text-lg font-bold text-emerald-800 mb-6 flex items-center">
              <ChevronDoubleRightIcon className="h-5 w-5 mr-2 text-emerald-600" />
              {t.mainSettings}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Section Selection */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.selectSection}
                </label>
                <select
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  required
                >
                  <option value="" disabled>Choose a Section</option>
                  {Object.keys(mishnaBeruraData).map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
              
              {/* Topic Selection */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.selectTopic}
                </label>
                <select
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  required
                  disabled={!formData.section}
                >
                  <option value="" disabled>Choose a Topic</option>
                  {formData.section && Object.keys(mishnaBeruraData[formData.section]).map(topic => (
                    <option key={topic} value={topic}>
                      {topic} ({mishnaBeruraData[formData.section][topic].start}-{mishnaBeruraData[formData.section][topic].end})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Learning Mode Toggle */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-2">
                  <label htmlFor="simanPerDay" className="block text-sm font-medium text-gray-700">
                    {t.simanPerDay}
                  </label>
                  <Tooltip text={t.tooltips.simanPerDay} />
                </div>
                
                <div 
                  className="relative inline-flex items-center cursor-pointer" 
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      simanPerDay: !prev.simanPerDay
                    }));
                  }}
                >
                  <input 
                    type="checkbox" 
                    id="simanPerDay" 
                    name="simanPerDay"
                    checked={formData.simanPerDay} 
                    onChange={handleChange} 
                    className="sr-only peer" 
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {formData.simanPerDay ? t.simanMode : t.seifMode}
                  </span>
                </div>
              </div>
              
              {/* Starting Siman/Se'if */}
              <div>
                <label htmlFor="startSiman" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.startingSiman}
                </label>
                <select
                  id="startSiman"
                  name="startSiman"
                  value={formData.startSiman}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  required
                  disabled={!formData.topic}
                >
                  {range(simanRange.start, Math.min(simanRange.end, formData.endSiman)).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                
                {!formData.simanPerDay && (
                  <div className="mt-2">
                    <label htmlFor="startSeif" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.startingSeif}
                    </label>
                    <select
                      id="startSeif"
                      name="startSeif"
                      value={formData.startSeif}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      required
                    >
                      {range(1, maxSeifStart).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {/* Ending Siman/Se'if */}
              <div>
                <label htmlFor="endSiman" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.endingSiman}
                </label>
                <select
                  id="endSiman"
                  name="endSiman"
                  value={formData.endSiman}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  required
                  disabled={!formData.topic}
                >
                  {range(formData.startSiman, simanRange.end).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                
                {!formData.simanPerDay && (
                  <div className="mt-2">
                    <label htmlFor="endSeif" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.endingSeif}
                    </label>
                    <select
                      id="endSeif"
                      name="endSeif"
                      value={formData.endSeif}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      required
                    >
                      {range(1, maxSeifEnd).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {/* Number of Reviews */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="reviews" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.reviews}
                </label>
                <select
                  id="reviews"
                  name="reviews"
                  value={formData.reviews}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  {range(1, 10).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Chart Customization */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-100">
            <h3 className="text-lg font-bold text-emerald-800 mb-6 flex items-center">
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-emerald-600" />
              {t.customization}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hebrew numbering */}
              <div className="flex items-center">
                <input
                  id="useHebrew"
                  name="useHebrew"
                  type="checkbox"
                  checked={formData.useHebrew}
                  onChange={handleChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded transition-all"
                />
                <label htmlFor="useHebrew" className="ml-2 block text-sm text-gray-700">
                  {t.useHebrew}
                </label>
              </div>
              
              {/* Columns Per Page */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  {[1, 2, 3, 4].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              
              {/* Date Column */}
              <div className="flex items-center">
                <input
                  id="includeDateColumn"
                  name="includeDateColumn"
                  type="checkbox"
                  checked={formData.includeDateColumn}
                  onChange={handleChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded transition-all"
                />
                <label htmlFor="includeDateColumn" className="ml-2 block text-sm text-gray-700">
                  {t.includeDateColumn}
                </label>
                <Tooltip text={t.tooltips.includeDateColumn} />
              </div>
              
              {/* Start Date */}
              {formData.includeDateColumn && (
                <div>
                  <div className="flex items-center mb-2">
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      {t.startDate}
                    </label>
                    <Tooltip text={t.tooltips.startDate} />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Format Selection */}
          <FormatSelection 
            format={formData.format} 
            onChange={handleChange} 
            labels={{
              en: {
                downloadFormat: t.downloadFormat,
                excel: t.excel,
                excelDesc: t.excelDesc,
                pdf: t.pdf,
                pdfDesc: t.pdfDesc
              },
              he: {
                downloadFormat: t.downloadFormat,
                excel: t.excel,
                excelDesc: t.excelDesc,
                pdf: t.pdf,
                pdfDesc: t.pdfDesc
              }
            }}
          />
          
          {/* Generate Button */}
          <GenerateButton 
            loading={loading} 
            generatingText={t.generating} 
            generateText={t.generate} 
          />
        </div>
      </form>
    </div>
  );
};

export default MishnaBeruraChartForm; 