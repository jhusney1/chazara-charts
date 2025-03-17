import React, { useState, useContext } from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';

// Create a language context that can be used throughout the app
export const LanguageContext = React.createContext({
  language: 'en',
  toggleLanguage: () => {}
});

export const useLanguage = () => useContext(LanguageContext);

const Header = () => {
  const [language, setLanguage] = useState('en');
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'he' : 'en');
  };
  
  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpenIcon className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-primary-800 m-0">Chazara Charts - Hot Reloading Test</h1>
                <p className="text-xs text-gray-500">Talmud Study Tracking</p>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <a href="https://www.sefaria.org" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary-600 transition-colors">
                Sefaria
              </a>
              <a href="https://dafyomi.org" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary-600 transition-colors">
                Daf Yomi
              </a>
              <a href="https://www.alephbeta.org" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary-600 transition-colors">
                Aleph Beta
              </a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleLanguage}
                className="btn btn-outline text-sm hidden md:block"
              >
                {language === 'en' ? (
                  <><span className="hebrew">עִבְרִית</span> / English</>
                ) : (
                  <>English / <span className="hebrew">עִבְרִית</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
    </LanguageContext.Provider>
  );
};

export default Header; 