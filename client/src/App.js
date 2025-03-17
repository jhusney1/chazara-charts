import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header, { LanguageContext } from './components/Header';
import ChartForm from './components/ChartForm';
import Footer from './components/Footer';
import axios from 'axios';

// Configure axios defaults
const API_URL = process.env.REACT_APP_API_URL || '';
axios.defaults.baseURL = API_URL;

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
      <div className="min-h-screen flex flex-col">
        <ToastContainer position="top-right" autoClose={5000} />
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-primary-800 mb-4">Chazara Charts</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Generate personalized Talmud study review charts to track your learning progress.
              </p>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
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