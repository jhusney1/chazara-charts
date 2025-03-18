import React from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-r from-indigo-900 to-purple-900 py-10 text-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Chazara Charts</h3>
            <p className="text-indigo-200 text-sm">
              A tool to help you track your Talmud study progress and review schedule.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.sefaria.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-200 hover:text-white transition-colors"
                >
                  Sefaria
                </a>
              </li>
              <li>
                <a 
                  href="https://dafyomi.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-200 hover:text-white transition-colors"
                >
                  Daf Yomi Resources
                </a>
              </li>
              <li>
                <a 
                  href="https://www.alephbeta.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-200 hover:text-white transition-colors"
                >
                  Aleph Beta
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">About</h3>
            <p className="text-indigo-200 text-sm">
              Chazara Charts was created to help students of Talmud better organize their review schedule.
            </p>
          </div>
        </div>
        
        <div className="mt-10 pt-8 border-t border-indigo-800 text-center">
          <p className="flex items-center justify-center text-sm text-indigo-300">
            Made with <HeartIcon className="h-4 w-4 text-red-400 mx-1" /> for the Talmud learning community &copy; {currentYear}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 