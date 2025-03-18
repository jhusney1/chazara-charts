import React, { useState, useEffect } from 'react';
import { useLanguage } from '../Header';
import { 
  AdjustmentsHorizontalIcon,
  ChevronDoubleRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Tooltip, FormatSelection, GenerateButton, downloadChart } from './BaseChartForm';

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
    dafPerDay: false
  });
  
  const [loading, setLoading] = useState(false);
  const [maxDaf, setMaxDaf] = useState(10);
  
  useEffect(() => {
    if (formData.tractate && tractateData[formData.tractate]) {
      setMaxDaf(tractateData[formData.tractate]);
    }
  }, [formData.tractate, tractateData]);
  
  const labels = {
    en: {
      generateChart: 'Generate Your Gemara Chart',
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
      footer: 'This will generate a chart for the selected tractate with columns for the date learned and each review session.',
      columnsPerPage: 'Columns per Page',
      includeDateColumn: 'Include Date Column',
      startDate: 'Start Date',
      dafPerDay: 'One Daf per Day (instead of one Amud)',
      customization: 'Chart Customization',
      tooltips: {
        columnsPerPage: 'Determines how many columns to split your chart into on each page',
        includeDateColumn: 'Include a column for marking the date when each daf/amud was learned',
        startDate: 'If date column is included, start filling dates from this day',
        dafPerDay: 'When enabled, groups both sides (amudim) of each daf as a single row'
      }
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
      footer: 'זה ייצור טבלה עבור המסכת שנבחרה עם עמודות לתאריך הלימוד ולכל חזרה.',
      columnsPerPage: 'עמודות בכל דף',
      includeDateColumn: 'כלול עמודת תאריך',
      startDate: 'תאריך התחלה',
      dafPerDay: 'דף אחד ליום (במקום עמוד אחד)',
      customization: 'התאמה אישית של הטבלה',
      tooltips: {
        columnsPerPage: 'קובע לכמה עמודות לחלק את הטבלה שלך בכל עמוד',
        includeDateColumn: 'כלול עמודה לסימון התאריך שבו נלמד כל דף/עמוד',
        startDate: 'אם עמודת תאריך נכללת, התחל למלא תאריכים מיום זה',
        dafPerDay: 'כאשר מופעל, מקבץ את שני הצדדים (עמודים) של כל דף כשורה אחת'
      }
    }
  };
  
  const t = labels[language === 'he' ? 'he' : 'en'];
  
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
              {language === 'en' ? 'Main Settings' : 'הגדרות ראשיות'}
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
              
              {/* Starting Daf */}
              <div>
                <label htmlFor="startDaf" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.startingDaf}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
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
                </div>
              </div>
              
              {/* Ending Daf */}
              <div>
                <label htmlFor="endDaf" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.endingDaf}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
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
            labels={labels} 
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
                
                {/* Daf per Day Option */}
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="dafPerDay"
                      name="dafPerDay"
                      checked={formData.dafPerDay}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded transition-all"
                    />
                    <label htmlFor="dafPerDay" className="ml-2 block text-sm text-gray-700">
                      {t.dafPerDay}
                    </label>
                    <Tooltip text={t.tooltips.dafPerDay} />
                  </div>
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