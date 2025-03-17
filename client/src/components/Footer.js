import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              &copy; {currentYear} Chazara Charts | Talmud Study Tools
            </p>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors text-sm">
              About
            </a>
            <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors text-sm">
              Privacy
            </a>
            <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors text-sm">
              Terms
            </a>
            <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors text-sm">
              Contact
            </a>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This tool is designed to help with Talmud study and review. All tractate information is based on standard Vilna Shas pagination.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 