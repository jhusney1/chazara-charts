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

// Helper function to get all simanim in a chelek
const getAllSimanimInChelek = (chelek) => {
  let allSimanim = [];
  Object.values(mishnaBeruraData[chelek]).forEach(topic => {
    allSimanim = [...allSimanim, ...range(topic.start, topic.end)];
  });
  return allSimanim;
};

// Helper to get the topic for a specific siman
const getTopicForSiman = (siman) => {
  for (const chelek in mishnaBeruraData) {
    for (const topic in mishnaBeruraData[chelek]) {
      const { start, end } = mishnaBeruraData[chelek][topic];
      if (siman >= start && siman <= end) {
        return { topic, chelek };
      }
    }
  }
  return null;
};

const MishnaBeruraChartForm = () => {
  const { language } = useLanguage();
  
  const [formData, setFormData] = useState({
    selectionMode: 'topic', // 'topic', 'book', or 'custom'
    chelek: '',
    topic: '',
    startSiman: 1,
    endSiman: 1,
    reviews: 3,
    useHebrew: false,
    format: 'excel',
    columnsPerPage: 1,
    includeDateColumn: true,
    startDate: new Date().toISOString().split('T')[0],
  });
  
  const [loading, setLoading] = useState(false);
  const [simanRange, setSimanRange] = useState({ start: 1, end: 1 });
  const [allTopics, setAllTopics] = useState([]);
  
  // Get translation based on current language
  const t = translations[language === 'he' ? 'he' : 'en'];
  
  // Effect to handle selection mode changes
  useEffect(() => {
    if (formData.selectionMode === 'topic') {
      setFormData(prev => ({
        ...prev,
        chelek: '',
        topic: '',
        startSiman: 1,
        endSiman: 1
      }));
    } else if (formData.selectionMode === 'book') {
      setFormData(prev => ({
        ...prev,
        topic: '',
        chelek: '',
        startSiman: 1,
        endSiman: 1
      }));
    } else if (formData.selectionMode === 'custom') {
      setFormData(prev => ({
        ...prev,
        chelek: '',
        topic: '',
      }));
    }
  }, [formData.selectionMode]);
  
  // Effect to update topic options when chelek changes in topic mode
  useEffect(() => {
    if (formData.chelek) {
      const topics = Object.keys(mishnaBeruraData[formData.chelek]);
      setAllTopics(topics);
      
      if (formData.selectionMode === 'book') {
        // If in book mode, set the siman range to cover the entire chelek
        let minSiman = Infinity;
        let maxSiman = 0;
        
        Object.values(mishnaBeruraData[formData.chelek]).forEach(topic => {
          minSiman = Math.min(minSiman, topic.start);
          maxSiman = Math.max(maxSiman, topic.end);
        });
        
        setFormData(prev => ({
          ...prev,
          startSiman: minSiman,
          endSiman: maxSiman
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          topic: '',
        }));
      }
    }
  }, [formData.chelek, formData.selectionMode]);
  
  // Effect to update siman options when topic changes
  useEffect(() => {
    if (formData.selectionMode === 'topic' && formData.chelek && formData.topic && mishnaBeruraData[formData.chelek][formData.topic]) {
      const { start, end } = mishnaBeruraData[formData.chelek][formData.topic];
      setSimanRange({ start, end });
      
      // Update siman ranges when a new topic is selected
      setFormData(prev => ({
        ...prev,
        startSiman: start,
        endSiman: end
      }));
    }
  }, [formData.topic, formData.selectionMode]);
  
  // Effect to validate custom siman range
  useEffect(() => {
    if (formData.selectionMode === 'custom') {
      // Make sure startSiman <= endSiman
      if (parseInt(formData.startSiman) > parseInt(formData.endSiman)) {
        setFormData(prev => ({
          ...prev,
          endSiman: formData.startSiman
        }));
      }
    }
  }, [formData.startSiman, formData.selectionMode]);
  
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
      let startSiman, endSiman;
      
      if (formData.selectionMode === 'topic') {
        // Topic mode - use the selected topic's siman range
        startSiman = parseInt(formData.startSiman);
        endSiman = parseInt(formData.endSiman);
      } else if (formData.selectionMode === 'book') {
        // Book mode - get all simanim in the selected chelek
        startSiman = parseInt(formData.startSiman);
        endSiman = parseInt(formData.endSiman);
      } else {
        // Custom mode - use the custom siman range
        startSiman = parseInt(formData.startSiman);
        endSiman = parseInt(formData.endSiman);
      }
      
      // Include simanim in the selected range
      for (let siman = startSiman; siman <= endSiman; siman++) {
        pages.push(`${siman}`);
      }
      
      // Determine the topic name for display
      let topicName = formData.topic;
      if (formData.selectionMode === 'book') {
        topicName = formData.chelek;
      } else if (formData.selectionMode === 'custom') {
        topicName = `Simanim ${startSiman}-${endSiman}`;
      }
      
      // Prepare request data
      const requestData = {
        section: formData.chelek,
        topic: topicName,
        reviews: formData.reviews,
        pages: pages,
        useHebrew: formData.useHebrew,
        columnsPerPage: formData.columnsPerPage,
        includeDateColumn: formData.includeDateColumn,
        startDate: formData.startDate
      };
      
      console.log('Sending request data:', JSON.stringify(requestData, null, 2));
      
      // Make API request based on format
      const endpoint = formData.format === 'excel' ? '/api/mishna-berura-excel' : '/api/mishna-berura-pdf';
      await downloadChart(
        endpoint, 
        requestData, 
        `${topicName.replace(/\s+/g, '-').toLowerCase()}-mishna-berura-chart`, 
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
              {/* Selection Mode */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Review Generation Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.selectionMode === 'topic' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, selectionMode: 'topic' }))}
                  >
                    <div className="font-medium mb-1">Option 1</div>
                    <div className="text-sm text-gray-600">Choose one topic to review</div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.selectionMode === 'book' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, selectionMode: 'book' }))}
                  >
                    <div className="font-medium mb-1">Option 2</div>
                    <div className="text-sm text-gray-600">Choose a book (Chelek) to review</div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.selectionMode === 'custom' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, selectionMode: 'custom' }))}
                  >
                    <div className="font-medium mb-1">Option 3</div>
                    <div className="text-sm text-gray-600">Choose any siman range</div>
                  </div>
                </div>
              </div>
              
              {/* Book (Chelek) Selection - for Topic and Book modes */}
              {(formData.selectionMode === 'topic' || formData.selectionMode === 'book') && (
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="chelek" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Book (Chelek)
                  </label>
                  <select
                    id="chelek"
                    name="chelek"
                    value={formData.chelek}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    required
                  >
                    <option value="" disabled>Choose a Book</option>
                    {Object.keys(mishnaBeruraData).map(chelek => (
                      <option key={chelek} value={chelek}>{chelek}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Topic Selection - only for Topic mode */}
              {formData.selectionMode === 'topic' && formData.chelek && (
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
                  >
                    <option value="" disabled>Choose a Topic</option>
                    {allTopics.map(topic => (
                      <option key={topic} value={topic}>
                        {topic} ({mishnaBeruraData[formData.chelek][topic].start}-{mishnaBeruraData[formData.chelek][topic].end})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Custom Siman Range - only for Custom mode */}
              {formData.selectionMode === 'custom' && (
                <>
                  <div>
                    <label htmlFor="startSiman" className="block text-sm font-medium text-gray-700 mb-2">
                      Starting Siman
                    </label>
                    <input
                      type="number"
                      id="startSiman"
                      name="startSiman"
                      min="1"
                      max="697"
                      value={formData.startSiman}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      required
                    />
                    {formData.startSiman && (
                      <div className="mt-1 text-xs text-gray-500">
                        {getTopicForSiman(formData.startSiman) ? 
                          `From: ${getTopicForSiman(formData.startSiman).topic} (${getTopicForSiman(formData.startSiman).chelek})` : 
                          ''}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="endSiman" className="block text-sm font-medium text-gray-700 mb-2">
                      Ending Siman
                    </label>
                    <input
                      type="number"
                      id="endSiman"
                      name="endSiman"
                      min={formData.startSiman}
                      max="697"
                      value={formData.endSiman}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      required
                    />
                    {formData.endSiman && (
                      <div className="mt-1 text-xs text-gray-500">
                        {getTopicForSiman(formData.endSiman) ? 
                          `To: ${getTopicForSiman(formData.endSiman).topic} (${getTopicForSiman(formData.endSiman).chelek})` : 
                          ''}
                      </div>
                    )}
                  </div>
                </>
              )}
              
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