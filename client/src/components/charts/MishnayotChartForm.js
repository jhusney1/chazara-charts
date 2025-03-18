import React from 'react';
import { useLanguage } from '../Header';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const MishnayotChartForm = () => {
  const { language } = useLanguage();
  
  const labels = {
    en: {
      title: 'Mishnayot Chart Generator',
      comingSoon: 'Coming Soon',
      description: 'The Mishnayot chart generator will allow you to create customized learning and review charts for Mishnayot study.',
      features: [
        'Select specific Sedarim and Masechet',
        'Choose chapter and Mishna ranges',
        'Customize review schedule',
        'Multiple export formats',
        'Hebrew or English options'
      ]
    },
    he: {
      title: 'מחולל טבלאות משניות',
      comingSoon: 'בקרוב',
      description: 'מחולל טבלאות המשניות יאפשר לך ליצור טבלאות למידה וחזרה מותאמות אישית ללימוד משניות.',
      features: [
        'בחירת סדרים ומסכתות ספציפיות',
        'בחירת טווחי פרקים ומשניות',
        'התאמה אישית של לוח הזמנים לחזרה',
        'מספר פורמטים לייצוא',
        'אפשרויות בעברית או באנגלית'
      ]
    }
  };
  
  const t = labels[language === 'he' ? 'he' : 'en'];
  
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-6 text-white">
        <h2 className="text-2xl font-bold">{t.title}</h2>
        <div className="inline-block mt-2 px-2 py-1 bg-white text-amber-600 text-sm font-bold rounded-full">
          {t.comingSoon}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col items-center text-center p-8">
          <BookOpenIcon className="h-24 w-24 text-amber-500 mb-6" />
          <p className="text-lg text-gray-600 mb-8 max-w-2xl">
            {t.description}
          </p>
          
          <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 w-full max-w-md">
            <h3 className="text-amber-700 font-bold mb-4">
              {language === 'en' ? 'Planned Features' : 'תכונות מתוכננות'}
            </h3>
            <ul className="space-y-2 text-left">
              {t.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-amber-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MishnayotChartForm; 