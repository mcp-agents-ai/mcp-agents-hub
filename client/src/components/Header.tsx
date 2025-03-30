import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage, SupportedLanguage } from '../contexts/LanguageContext';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false); // State for language dropdown
  const { language, setLanguage, t } = useLanguage();

  // Function to close the menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Function to toggle language
  const toggleLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setIsLangMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#4F46E5" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="h-8 w-8"
            >
              <path d="M12 2v20M2 12h20M7 17l10-10M7 7l10 10"/>
            </svg>
            <h1 className="ml-3 text-2xl font-bold text-gray-900">{t('home.title')}</h1>
          </div>
          
          <div className="flex items-center">
            <button
              className="md:hidden text-gray-600 hover:text-gray-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            
            {/* Mobile menu - absolutely positioned for better layout */}
            <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden absolute top-20 right-0 left-0 bg-white shadow-md z-10`}>
              <div className="px-4 py-3 space-y-2">
                {/* Language switcher for mobile */}
                <div className="border-b border-gray-100 pb-2 mb-2">
                  <div className="text-gray-700 font-medium text-base py-2">{t('language.label')} / 语言 / 言語 / Idioma</div>
                  <div className="flex flex-wrap space-x-2 mt-1">
                    <button
                      className={`px-3 py-1 rounded text-sm ${language === 'en' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => toggleLanguage('en')}
                    >
                      English
                    </button>
                    <button
                      className={`px-3 py-1 rounded text-sm ${language === 'zhHans' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => toggleLanguage('zhHans')}
                    >
                      简体中文
                    </button>
                    <button
                      className={`px-3 py-1 rounded text-sm ${language === 'zhHant' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => toggleLanguage('zhHant')}
                    >
                      繁體中文
                    </button>
                    <button
                      className={`px-3 py-1 rounded text-sm ${language === 'ja' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => toggleLanguage('ja')}
                    >
                      日本語
                    </button>
                    <button
                      className={`px-3 py-1 rounded text-sm ${language === 'es' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => toggleLanguage('es')}
                    >
                      Español
                    </button>
                    <button
                      className={`px-3 py-1 rounded text-sm ${language === 'de' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                      onClick={() => toggleLanguage('de')}
                    >
                      Deutsch
                    </button>
                  </div>
                </div>
                
                {/* Mobile menu navigation items */}
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-indigo-600 font-medium text-base flex items-center py-2 border-b border-gray-100"
                  onClick={closeMenu}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth="1.5" 
                    stroke="currentColor" 
                    className="w-5 h-5 mr-2"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" 
                    />
                  </svg>
                  {t('nav.home')}
                </Link>
                <Link 
                  to="/docs" 
                  className="text-gray-700 hover:text-indigo-600 font-medium text-base flex items-center py-2 border-b border-gray-100"
                  onClick={closeMenu}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth="1.5" 
                    stroke="currentColor" 
                    className="w-5 h-5 mr-2"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" 
                    />
                  </svg>
                  {t('nav.docs')}
                </Link>
                <Link 
                  to="/about" 
                  className="text-gray-700 hover:text-indigo-600 font-medium text-base flex items-center py-2 border-b border-gray-100"
                  onClick={closeMenu}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth="1.5" 
                    stroke="currentColor" 
                    className="w-5 h-5 mr-2"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" 
                    />
                  </svg>
                  {t('nav.about')}
                </Link>
                <a
                  href="https://github.com/mcp-agents-ai/mcp-agents-hub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-indigo-600 font-medium text-base flex items-center py-2"
                  onClick={closeMenu}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="w-5 h-5 mr-2"
                  >
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  {t('nav.github')}
                </a>
              </div>
            </div>
            
            {/* Desktop menu */}
            <nav className="hidden md:flex items-center space-x-8">
              {/* Navigation links */}
              <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.5" 
                  stroke="currentColor" 
                  className="w-5 h-5 mr-1"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" 
                  />
                </svg>
                {t('nav.home')}
              </Link>
              <Link to="/docs" className="text-gray-700 hover:text-indigo-600 font-medium flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.5" 
                  stroke="currentColor" 
                  className="w-5 h-5 mr-1"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" 
                  />
                </svg>
                {t('nav.docs')}
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-indigo-600 font-medium flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.5" 
                  stroke="currentColor" 
                  className="w-5 h-5 mr-1"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" 
                  />
                </svg>
                {t('nav.about')}
              </Link>
              <a
                href="https://github.com/mcp-agents-ai/mcp-agents-hub"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-indigo-600 font-medium flex items-center"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-5 h-5 mr-1"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
                {t('nav.github')}
              </a>
              
              {/* Language switcher for desktop - moved to the end of the navigation */}
              <div className="relative">
                <button 
                  className="flex items-center text-gray-700 hover:text-indigo-600 font-medium"
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth="1.5" 
                    stroke="currentColor" 
                    className="w-5 h-5 mr-1"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" 
                    />
                  </svg>
                  {language === 'en' ? 'English' : 
                    language === 'zhHans' ? '简体中文' : 
                    language === 'zhHant' ? '繁體中文' : 
                    language === 'es' ? 'Español' : 
                    language === 'de' ? 'Deutsch' : '日本語'}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth="1.5" 
                    stroke="currentColor" 
                    className="w-4 h-4 ml-1"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5" 
                    />
                  </svg>
                </button>
                {/* Language dropdown menu */}
                {isLangMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                    <div className="py-1">
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${language === 'en' ? 'bg-gray-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => toggleLanguage('en')}
                      >
                        English
                      </button>
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${language === 'zhHans' ? 'bg-gray-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => toggleLanguage('zhHans')}
                      >
                        简体中文 (Simplified Chinese)
                      </button>
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${language === 'zhHant' ? 'bg-gray-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => toggleLanguage('zhHant')}
                      >
                        繁體中文 (Traditional Chinese)
                      </button>
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${language === 'ja' ? 'bg-gray-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => toggleLanguage('ja')}
                      >
                        日本語 (Japanese)
                      </button>
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${language === 'es' ? 'bg-gray-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => toggleLanguage('es')}
                      >
                        Español
                      </button>
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${language === 'de' ? 'bg-gray-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => toggleLanguage('de')}
                      >
                        Deutsch
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}