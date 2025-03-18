import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header, { LanguageContext } from './components/Header';
import ChartForm from './components/ChartForm';
import Footer from './components/Footer';
import axios from 'axios';

// Configure axios defaults
// In development: API runs on port 3001
// In production: API and client are served from the same origin
const API_URL = process.env.REACT_APP_API_URL || '';
axios.defaults.baseURL = API_URL;

// Log the API URL for debugging purposes
console.log('API URL:', API_URL || 'Same origin');

function App() {
  const [tractateData, setTractateData] = useState({});
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'he' : 'en');
  };

  useEffect(() => {
    // Fetch tractate data from the API
    const fetchTractateData = async () => {
      try {
        const response = await axios.get('/api/tractates');
        setTractateData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tractate data:', error);
        toast.error('Failed to load tractate data');
        setLoading(false);
      }
    };

    fetchTractateData();
  }, []);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <ToastContainer 
          position="top-right" 
          autoClose={5000} 
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={language === 'he'}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName="rounded-lg shadow-lg"
        />
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="mb-4 flex justify-center">
                <div className="relative">
                  <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 inline-block">
                    Chazara Charts
                  </h1>
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
                </div>
              </div>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Generate personalized Talmud study review charts to track your learning progress.
              </p>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-4 border-t-indigo-600"></div>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <div className="h-8 w-8 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            ) : (
              <ChartForm tractateData={tractateData} />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </LanguageContext.Provider>
  );
}

export default App; 