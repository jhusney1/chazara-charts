import React, { useContext } from 'react';
import { BookOpenIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

// Create a language context that can be used throughout the app
export const LanguageContext = React.createContext({
  language: 'en',
  toggleLanguage: () => {}
});

export const useLanguage = () => useContext(LanguageContext);

const Header = () => {
  // Use the context from the parent component instead of creating a new state
  const { language, toggleLanguage } = useLanguage();
  
  return (
    <header className="bg-gradient-to-r from-indigo-800 to-purple-700 shadow-lg text-white">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white p-2 rounded-lg shadow-md mr-4">
              <BookOpenIcon className="h-8 w-8 text-indigo-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold m-0">Chazara Charts</h1>
              <p className="text-xs text-indigo-200">Talmud Study Tracking</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            <nav className="hidden md:flex space-x-8">
              <a href="https://www.sefaria.org" target="_blank" rel="noopener noreferrer" className="text-white hover:text-indigo-200 transition-colors font-medium">
                Sefaria
              </a>
              <a href="https://dafyomi.org" target="_blank" rel="noopener noreferrer" className="text-white hover:text-indigo-200 transition-colors font-medium">
                Daf Yomi
              </a>
              <a href="https://www.alephbeta.org" target="_blank" rel="noopener noreferrer" className="text-white hover:text-indigo-200 transition-colors font-medium">
                Aleph Beta
              </a>
            </nav>
            
            <button 
              onClick={toggleLanguage}
              className="flex items-center bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-sm py-2 px-4 rounded-full shadow-md"
            >
              <GlobeAltIcon className="h-4 w-4 mr-2" />
              {language === 'en' ? (
                <><span className="hebrew font-bold">עִבְרִית</span> / English</>
              ) : (
                <>English / <span className="hebrew font-bold">עִבְרִית</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 