import React, { useState } from 'react';
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

const labels = {
  en: {
    selectChartType: 'Select Chart Type',
    gemara: 'Gemara',
    mishnayot: 'Mishnayot',
    mishnaBerura: 'Mishna Berura',
    gemaraDesc: 'Create a chart for Talmud study',
    mishnayotDesc: 'Create a chart for Mishnayot study',
    mishnaBeruraDesc: 'Create a chart for Mishna Berura study',
    beta: 'Beta Version'
  },
  he: {
    selectChartType: 'בחר סוג טבלה',
    gemara: 'גמרא',
    mishnayot: 'משניות',
    mishnaBerura: 'משנה ברורה',
    gemaraDesc: 'צור טבלה ללימוד גמרא',
    mishnayotDesc: 'צור טבלה ללימוד משניות',
    mishnaBeruraDesc: 'צור טבלה ללימוד משנה ברורה',
    beta: 'בקרוב'
  }
};

const ChartForm = ({ tractateData }) => {
  const { language } = useLanguage();
  const [chartType, setChartType] = useState(CHART_TYPES.GEMARA);

  const t = labels[language === 'he' ? 'he' : 'en'];

  const options = [
    { value: CHART_TYPES.GEMARA, label: t.gemara, description: t.gemaraDesc, beta: false },
    { value: CHART_TYPES.MISHNAYOT, label: t.mishnayot, description: t.mishnayotDesc, beta: true },
    {
      value: CHART_TYPES.MISHNA_BERURA,
      label: t.mishnaBerura,
      description: t.mishnaBeruraDesc,
      beta: true
    }
  ];

  const renderChartForm = () => {
    switch (chartType) {
      case CHART_TYPES.MISHNAYOT:
        return <MishnayotChartForm />;
      case CHART_TYPES.MISHNA_BERURA:
        return <MishnaBeruraChartForm />;
      case CHART_TYPES.GEMARA:
      default:
        return <GemaraChartForm tractateData={tractateData} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold">{t.selectChartType}</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map(option => (
              <label
                key={option.value}
                className={`relative flex flex-col border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  chartType === option.value
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="chartType"
                    value={option.value}
                    checked={chartType === option.value}
                    onChange={e => setChartType(e.target.value)}
                    className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 transition-all"
                  />
                  <div className="ml-3">
                    <span className="block font-medium text-gray-900">{option.label}</span>
                    <span className="block text-sm text-gray-500">{option.description}</span>
                  </div>
                </div>
                {option.beta && (
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                    {t.beta}
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>
      </div>

      {renderChartForm()}
    </div>
  );
};

export default ChartForm;
