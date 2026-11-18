import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../Header';
import {
  AdjustmentsHorizontalIcon,
  ChevronDoubleRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import {
  Tooltip,
  ChazaraDaysPicker,
  FormatSelection,
  GenerateButton,
  downloadChart,
  MAX_REVIEWS,
  COLUMNS_PER_PAGE_OPTIONS
} from './BaseChartForm';
import translations from './data/translations';
import ChartPreview from './ChartPreview';
import mishnaBeruraData, { simanInfo } from './data/mishnaBeruraData';
import SimanCombobox from './SimanCombobox';
import AmudCombobox from './AmudCombobox';
import { AMUD_COUNT, amudChalakim, amudInfo, amudLabel, amudStart } from './data/mishnaBeruraAmudim';

// Helper function to create a range of numbers
const range = (start, end) => {
  const result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
};

// The full siman range covered by the data, used to bound custom selections.
const SIMAN_BOUNDS = Object.values(mishnaBeruraData).reduce(
  (bounds, chelek) => {
    Object.values(chelek).forEach(({ start, end }) => {
      bounds.min = Math.min(bounds.min, start);
      bounds.max = Math.max(bounds.max, end);
    });
    return bounds;
  },
  { min: Infinity, max: 0 }
);

const MishnaBeruraChartForm = () => {
  const { language } = useLanguage();
  
  const [formData, setFormData] = useState({
    selectionMode: 'topic', // 'topic', 'book', 'custom', or 'amud'
    chelek: '',
    topic: '',
    startSiman: 1,
    endSiman: 1,
    // Amud Yomi mode: amudim of the 1-1750 cycle. amudChelek only prefills
    // the range; the range itself is what the chart is built from.
    amudChelek: '',
    startAmud: 1,
    endAmud: 1,
    reviews: 3,
    useHebrew: false,
    format: 'excel',
    columnsPerPage: 1,
    includeDateColumn: true,
    startDate: new Date().toISOString().split('T')[0],
    skipDays: [],
  });
  
  const [loading, setLoading] = useState(false);
  
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
    } else if (formData.selectionMode === 'amud') {
      setFormData(prev => ({
        ...prev,
        chelek: '',
        topic: '',
        amudChelek: '',
        startAmud: 1,
        endAmud: 1
      }));
    }
  }, [formData.selectionMode]);
  
  // Topics of the chosen chelek, derived each render so the list can never
  // lag behind the selection (holding it in state rendered the previous
  // book's topics against the new book's data and crashed).
  const topicsOfChelek = formData.chelek ? Object.keys(mishnaBeruraData[formData.chelek] || {}) : [];

  // Effect to reset the topic / siman range when chelek changes
  useEffect(() => {
    if (formData.chelek) {
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

      // Update siman ranges when a new topic is selected
      setFormData(prev => ({
        ...prev,
        startSiman: start,
        endSiman: end
      }));
    }
  }, [formData.topic, formData.chelek, formData.selectionMode]);

  // Keep the custom siman range coherent: end must never precede start.
  useEffect(() => {
    if (formData.selectionMode !== 'custom') return;

    setFormData(prev => {
      const start = parseInt(prev.startSiman, 10);
      const end = parseInt(prev.endSiman, 10);
      if (Number.isNaN(start) || Number.isNaN(end) || start <= end) return prev;
      return { ...prev, endSiman: prev.startSiman };
    });
  }, [formData.startSiman, formData.endSiman, formData.selectionMode]);

  // The same for the amud range.
  useEffect(() => {
    if (formData.selectionMode !== 'amud') return;

    setFormData(prev => {
      const start = parseInt(prev.startAmud, 10);
      const end = parseInt(prev.endAmud, 10);
      if (Number.isNaN(start) || Number.isNaN(end) || start <= end) return prev;
      return { ...prev, endAmud: prev.startAmud };
    });
  }, [formData.startAmud, formData.endAmud, formData.selectionMode]);

  // Choosing a chelek in Amud Yomi mode fills its whole amud range; editing
  // either end afterwards narrows it without losing the chelek's label.
  const handleAmudChelek = (e) => {
    const chelek = e.target.value;
    const range = amudChalakim.find((c) => c.chelek === chelek);
    setFormData(prev => ({
      ...prev,
      amudChelek: chelek,
      ...(range ? { startAmud: range.start, endAmud: range.end } : {})
    }));
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Builds the API request for the current selection. Shared by the download
  // and the live preview; returns null while the form is incomplete.
  const buildRequest = () => {
    if (formData.selectionMode === 'amud') return buildAmudRequest();
    if (formData.selectionMode === 'topic' && !formData.topic) return null;
    if (formData.selectionMode === 'book' && !formData.chelek) return null;

    // All three modes resolve to a siman range; clamp it to the real bounds.
    const startSiman = Math.max(
      Math.min(parseInt(formData.startSiman, 10) || SIMAN_BOUNDS.min, SIMAN_BOUNDS.max),
      SIMAN_BOUNDS.min
    );
    const endSiman = Math.max(
      Math.min(parseInt(formData.endSiman, 10) || startSiman, SIMAN_BOUNDS.max),
      startSiman
    );

    const pages = [];
    for (let siman = startSiman; siman <= endSiman; siman++) {
      pages.push(`${siman}`);
    }

    // Determine the display title and section label for each mode. A custom
    // range spans no single chelek, so it is labelled from the simanim it
    // actually covers rather than left blank.
    let topicName = formData.topic;
    let sectionName = formData.chelek;

    if (formData.selectionMode === 'book') {
      topicName = formData.chelek;
    } else if (formData.selectionMode === 'custom') {
      topicName = `Simanim ${startSiman}-${endSiman}`;
      const from = simanInfo(startSiman);
      const to = simanInfo(endSiman);
      if (from && to) {
        sectionName = from.chelek === to.chelek ? from.chelek : `${from.chelek} - ${to.chelek}`;
      } else {
        sectionName = 'Custom Range';
      }
    }

    // Prepare request data
    const requestData = {
      section: sectionName,
      topic: topicName,
      reviews: Number(formData.reviews),
      pages: pages,
      useHebrew: formData.useHebrew,
      columnsPerPage: Number(formData.columnsPerPage),
      includeDateColumn: formData.includeDateColumn,
      startDate: formData.startDate,
      skipDays: formData.skipDays
    };

    return {
      requestData,
      filename: `${topicName.replace(/\s+/g, '-').toLowerCase()}-mishna-berura-chart`,
      excelEndpoint: '/api/mishna-berura-excel',
      pdfEndpoint: '/api/mishna-berura-pdf'
    };
  };

  // Amud Yomi mode: one row per amud, labelled with where it starts.
  function buildAmudRequest() {
    const clamp = (value, low) => Math.max(Math.min(parseInt(value, 10) || low, AMUD_COUNT), low);
    const startAmud = clamp(formData.startAmud, 1);
    const endAmud = clamp(formData.endAmud, startAmud);

    const pages = [];
    for (let amud = startAmud; amud <= endAmud; amud++) {
      pages.push(amudLabel(amud));
    }

    const from = amudInfo(startAmud);
    const to = amudInfo(endAmud);
    // The topic doubles as the Excel sheet name, which may not contain ":",
    // so it names the amudim only; each row already shows its siman:se'if.
    const wholeChelek = amudChalakim.find((c) => c.start === startAmud && c.end === endAmud);
    const topicName = wholeChelek
      ? `${wholeChelek.chelek} - Amud Yomi`
      : `Amudim ${startAmud}-${endAmud}`;
    const sectionName = wholeChelek
      ? ''
      : from.chelek === to.chelek
        ? from.chelek
        : `${from.chelek} - ${to.chelek}`;

    return {
      requestData: {
        unit: 'amud',
        section: sectionName,
        topic: topicName,
        reviews: Number(formData.reviews),
        pages,
        useHebrew: formData.useHebrew,
        columnsPerPage: Number(formData.columnsPerPage),
        includeDateColumn: formData.includeDateColumn,
        startDate: formData.startDate,
        skipDays: formData.skipDays
      },
      filename: wholeChelek
        ? `${wholeChelek.chelek.replace(/\s+/g, '-').toLowerCase()}-amud-yomi-mishna-berura-chart`
        : `amudim-${startAmud}-${endAmud}-mishna-berura-chart`,
      excelEndpoint: '/api/mishna-berura-excel',
      pdfEndpoint: '/api/mishna-berura-pdf'
    };
  }

  // The preview re-renders from the same request the download will send.
  let previewRequest = null;
  try {
    previewRequest = buildRequest();
  } catch {
    previewRequest = null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const request = buildRequest();
      if (!request) {
        toast.error('Please complete the selection first.');
        setLoading(false);
        return;
      }

      await downloadChart(
        formData.format === 'excel' ? request.excelEndpoint : request.pdfEndpoint,
        request.requestData,
        request.filename,
        formData.format,
        setLoading
      );
    } catch (error) {
      // downloadChart reports its own failures; this covers errors thrown
      // while building the siman list.
      console.error('Error preparing chart request:', error);
      toast.error('Could not build the chart. Please check your selections.');
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.selectionMode === 'amud' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, selectionMode: 'amud' }))}
                  >
                    <div className="font-medium mb-1">Option 4</div>
                    <div className="text-sm text-gray-600">{t.amudYomiMode}</div>
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
                    {topicsOfChelek.map(topic => {
                      const { start, end, heName } = mishnaBeruraData[formData.chelek][topic];
                      return (
                        <option key={topic} value={topic}>
                          {topic} · {heName} ({start}-{end})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              
              {/* Custom Siman Range - only for Custom mode */}
              {formData.selectionMode === 'custom' && (
                <>
                  <div>
                    <label htmlFor="startSiman" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.startingSiman}
                    </label>
                    <SimanCombobox
                      id="startSiman"
                      name="startSiman"
                      value={Number(formData.startSiman)}
                      onChange={(startSiman) => setFormData(prev => ({ ...prev, startSiman }))}
                      labels={t}
                    />
                    {simanInfo(formData.startSiman) && (
                      <div className="mt-1 text-xs text-gray-500 hebrew">
                        {simanInfo(formData.startSiman).heName}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="endSiman" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.endingSiman}
                    </label>
                    <SimanCombobox
                      id="endSiman"
                      name="endSiman"
                      value={Number(formData.endSiman)}
                      onChange={(endSiman) => setFormData(prev => ({ ...prev, endSiman }))}
                      min={Number(formData.startSiman) || 1}
                      labels={t}
                    />
                    {simanInfo(formData.endSiman) && (
                      <div className="mt-1 text-xs text-gray-500 hebrew">
                        {simanInfo(formData.endSiman).heName}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Amud Yomi range - only for Amud mode */}
              {formData.selectionMode === 'amud' && (
                <>
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-sm text-gray-600 mb-4">{t.amudHint}</p>
                    <label htmlFor="amudChelek" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.amudChelek}
                    </label>
                    <select
                      id="amudChelek"
                      name="amudChelek"
                      value={formData.amudChelek}
                      onChange={handleAmudChelek}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    >
                      <option value="">-</option>
                      {amudChalakim.map(({ chelek, start, end }) => (
                        <option key={chelek} value={chelek}>
                          {chelek} · {t.amud} {start}-{end} ({t.siman} {amudStart(start)} - {amudStart(end)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="startAmud" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.startingAmud}
                    </label>
                    <AmudCombobox
                      id="startAmud"
                      name="startAmud"
                      value={Number(formData.startAmud)}
                      onChange={(startAmud) => setFormData(prev => ({ ...prev, startAmud }))}
                      labels={t}
                    />
                  </div>

                  <div>
                    <label htmlFor="endAmud" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.endingAmud}
                    </label>
                    <AmudCombobox
                      id="endAmud"
                      name="endAmud"
                      value={Number(formData.endAmud)}
                      onChange={(endAmud) => setFormData(prev => ({ ...prev, endAmud }))}
                      min={Number(formData.startAmud) || 1}
                      labels={t}
                    />
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
                  {range(1, MAX_REVIEWS).map(num => (
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
                  {COLUMNS_PER_PAGE_OPTIONS.map(num => (
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
                    <ChazaraDaysPicker
                      value={formData.skipDays}
                      onChange={(skipDays) => setFormData((prev) => ({ ...prev, skipDays }))}
                      labels={t}
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
          <ChartPreview request={previewRequest} format={formData.format} labels={t} />

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