import React, { useState, useEffect } from 'react';
import { useLanguage } from '../Header';
import { 
  AdjustmentsHorizontalIcon,
  ChevronDoubleRightIcon,
  CalendarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { Tooltip, FormatSelection, GenerateButton, downloadChart } from './BaseChartForm';
import translations from './data/translations';
import mishnayotData from './data/mishnayotData';

// Helper function to create a range of numbers
const range = (start, end) => {
  const result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
};

const MishnayotChartForm = () => {
  const { language } = useLanguage();
  
  const [formData, setFormData] = useState({
    seder: '',
    tractate: '',
    startChapter: 1,
    startMishnah: 1,
    endChapter: 1,
    endMishnah: 1,
    reviews: 3,
    useHebrew: false,
    format: 'excel',
    columnsPerPage: 1,
    includeDateColumn: true,
    startDate: new Date().toISOString().split('T')[0],
    chaptersPerDay: true
  });
  
  const [loading, setLoading] = useState(false);
  const [maxChapters, setMaxChapters] = useState(1);
  const [maxMishnahStart, setMaxMishnahStart] = useState(10);
  const [maxMishnahEnd, setMaxMishnahEnd] = useState(10);
  
  // Get translation based on current language
  const t = translations[language === 'he' ? 'he' : 'en'];
  
  // Effect to update tractate options when seder changes
  useEffect(() => {
    if (formData.seder) {
      setFormData(prev => ({
        ...prev,
        tractate: '',
        startChapter: 1,
        startMishnah: 1,
        endChapter: 1,
        endMishnah: 1
      }));
    }
  }, [formData.seder]);
  
  // Effect to update chapter and mishnah options when tractate changes
  useEffect(() => {
    if (formData.seder && formData.tractate && mishnayotData[formData.seder][formData.tractate]) {
      const chapters = mishnayotData[formData.seder][formData.tractate];
      setMaxChapters(chapters);
      
      // Update end chapter to the last chapter of the masechet when a new masechet is selected
      setFormData(prev => ({
        ...prev,
        endChapter: chapters,
        startChapter: 1,
        startMishnah: 1,
        endMishnah: 1
      }));
    }
  }, [formData.tractate]);
  
  // Effect to handle mishnah count changes based on chapter selection
  useEffect(() => {
    // These are just placeholder values - in a real application you would fetch
    // the actual count of mishnayot for each chapter
    setMaxMishnahStart(10); 
    setMaxMishnahEnd(10);
  }, [formData.startChapter, formData.endChapter]);
  
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
      let currentChapter = parseInt(formData.startChapter);
      let currentMishnah = formData.chaptersPerDay ? 1 : parseInt(formData.startMishnah);
      const endChapter = parseInt(formData.endChapter);
      const endMishnah = formData.chaptersPerDay ? 10 : parseInt(formData.endMishnah);
      
      if (formData.chaptersPerDay) {
        // Chapter mode - include entire chapters
        for (let chapter = currentChapter; chapter <= endChapter; chapter++) {
          pages.push(`${chapter}`);
        }
      } else {
        // Mishnah mode - include individual mishnayot
        while (
          currentChapter < endChapter || 
          (currentChapter === endChapter && currentMishnah <= endMishnah)
        ) {
          pages.push(`${currentChapter}:${currentMishnah}`);
          
          // Move to next mishnah
          currentMishnah++;
          
          // Move to next chapter when we reach the end of the current chapter
          if (currentMishnah > maxMishnahStart) {
            currentMishnah = 1;
            currentChapter++;
          }
        }
      }
      
      // Prepare request data
      const requestData = {
        seder: formData.seder,
        tractate: formData.tractate,
        reviews: formData.reviews,
        pages: pages,
        useHebrew: formData.useHebrew,
        columnsPerPage: formData.columnsPerPage,
        includeDateColumn: formData.includeDateColumn,
        startDate: formData.startDate,
        chaptersPerDay: formData.chaptersPerDay
      };
      
      // Make API request based on format
      const endpoint = formData.format === 'excel' ? '/api/mishnayot-excel' : '/api/mishnayot-pdf';
      await downloadChart(
        endpoint, 
        requestData, 
        `${formData.tractate}-mishnayot-chart`, 
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
      <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-6 text-white">
        <h2 className="text-2xl font-bold">{t.mishnayotGenerator}</h2>
        <p className="text-yellow-100 mt-1 text-sm">{t.mishnayotFooter}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 gap-8">
          {/* Main Settings Section */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-amber-100">
            <h3 className="text-lg font-bold text-amber-800 mb-6 flex items-center">
              <ChevronDoubleRightIcon className="h-5 w-5 mr-2 text-amber-600" />
              {t.mainSettings}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seder Selection */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="seder" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.selectSeder}
                </label>
                <select
                  id="seder"
                  name="seder"
                  value={formData.seder}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  required
                >
                  <option value="" disabled>Choose a Seder</option>
                  {Object.keys(mishnayotData).map(seder => (
                    <option key={seder} value={seder}>{seder}</option>
                  ))}
                </select>
              </div>
              
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  required
                  disabled={!formData.seder}
                >
                  <option value="" disabled>Choose a Masechet</option>
                  {formData.seder && Object.keys(mishnayotData[formData.seder]).map(tractate => (
                    <option key={tractate} value={tractate}>
                      {tractate} ({mishnayotData[formData.seder][tractate]} {language === 'he' ? 'פרקים' : 'chapters'})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Learning Mode Toggle */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-2">
                  <label htmlFor="chaptersPerDay" className="block text-sm font-medium text-gray-700">
                    {t.chaptersPerDay}
                  </label>
                  <Tooltip text={t.tooltips.chaptersPerDay} />
                </div>
                
                <div 
                  className="relative inline-flex items-center cursor-pointer" 
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      chaptersPerDay: !prev.chaptersPerDay
                    }));
                  }}
                >
                  <input 
                    type="checkbox" 
                    id="chaptersPerDay" 
                    name="chaptersPerDay"
                    checked={formData.chaptersPerDay} 
                    onChange={handleChange} 
                    className="sr-only peer" 
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {formData.chaptersPerDay ? t.chapterMode : t.mishnahMode}
                  </span>
                </div>
              </div>
              
              {/* Starting Chapter/Mishnah */}
              <div>
                <label htmlFor="startChapter" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.startingChapter}
                </label>
                <select
                  id="startChapter"
                  name="startChapter"
                  value={formData.startChapter}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  required
                  disabled={!formData.tractate}
                >
                  {range(1, formData.tractate ? Math.min(maxChapters, formData.endChapter) : 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                
                {!formData.chaptersPerDay && (
                  <div className="mt-2">
                    <label htmlFor="startMishnah" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.startingMishnah}
                    </label>
                    <select
                      id="startMishnah"
                      name="startMishnah"
                      value={formData.startMishnah}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      required
                    >
                      {range(1, maxMishnahStart).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {/* Ending Chapter/Mishnah */}
              <div>
                <label htmlFor="endChapter" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.endingChapter}
                </label>
                <select
                  id="endChapter"
                  name="endChapter"
                  value={formData.endChapter}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  required
                  disabled={!formData.tractate}
                >
                  {range(formData.startChapter, formData.tractate ? maxChapters : 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                
                {!formData.chaptersPerDay && (
                  <div className="mt-2">
                    <label htmlFor="endMishnah" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.endingMishnah}
                    </label>
                    <select
                      id="endMishnah"
                      name="endMishnah"
                      value={formData.endMishnah}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      required
                    >
                      {range(1, maxMishnahEnd).map(num => (
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                >
                  {range(1, 10).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Chart Customization */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-amber-100">
            <h3 className="text-lg font-bold text-amber-800 mb-6 flex items-center">
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-amber-600" />
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
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded transition-all"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
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
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded transition-all"
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
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
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

export default MishnayotChartForm; 