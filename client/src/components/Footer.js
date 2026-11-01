import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-indigo-900 to-purple-900 py-10 text-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Chazara Charts</h3>
            <p className="text-indigo-200 text-sm">
              Printable chazara charts for Gemara, Mishnayos and Mishna Berura.
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
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">About</h3>
            <p className="text-indigo-200 text-sm">
              Built to help yeshiva bachurim and anyone learning seriously keep up with their chazara. Pick what you're learning, print the chart, and mark off each review so you always know where you hold.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 