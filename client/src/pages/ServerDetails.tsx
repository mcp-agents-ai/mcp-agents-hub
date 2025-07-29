import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { MCPServer } from '../types';
import { Database, ChevronLeft, ExternalLink, Star, Download, BrainCircuit, FileSearch, Loader } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { MCPHostComponent } from '../components/MCPHostComponent';

export function ServerDetails() {
  const { hubId } = useParams<{ hubId: string }>();
  const { t, language } = useLanguage();
  const location = useLocation();
  const [server, setServer] = useState<MCPServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [lastFetchedLanguage, setLastFetchedLanguage] = useState<string | null>(null);

  useEffect(() => {
    // Rotate through loading icons
    if (loading) {
      const interval = setInterval(() => {
        setLoadingPhase((prev) => (prev + 1) % 3);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    async function fetchServerDetails() {
      try {
        setLoading(true);
        
        // Map component language to API locale format (already in the correct format)
        const localeMap: Record<string, string> = {
          en: 'en',
          'zh-hans': 'zh-hans',
          'zh-hant': 'zh-hant',
          ja: 'ja',
          es: 'es',
          de: 'de'
        };
        
        // Check URL query parameters first for locale
        const urlParams = new URLSearchParams(location.search);
        const urlLocale = urlParams.get('locale');
        
        // Use URL locale if present, otherwise use current language context
        const locale = urlLocale || localeMap[language];
        
        const response = await fetch(`/v1/hub/servers/${hubId}?locale=${locale}`);
        if (!response.ok) {
          throw new Error(t('details.fetchError'));
        }
        const data = await response.json();
        setServer(data);
        setLoading(false);
        // Store the language we just fetched for
        setLastFetchedLanguage(language);
      } catch (err) {
        setError(t('details.errorLoading'));
        setLoading(false);
        console.error('Error fetching server details:', err);
      }
    }

    if (hubId) {
      // Always fetch when hubId changes or if we don't have data yet
      if (!server || lastFetchedLanguage !== language) {
        fetchServerDetails();
      }
    }
  }, [hubId, t, language, location.search, server, lastFetchedLanguage]);

  // Get current loading icon based on phase
  const getLoadingIcon = () => {
    switch (loadingPhase) {
      case 0:
        return <Loader className="h-6 w-6 text-blue-600 animate-spin" />;
      case 1:
        return <BrainCircuit className="h-6 w-6 text-purple-600 animate-pulse" />;
      case 2:
        return <FileSearch className="h-6 w-6 text-green-600 animate-pulse" />;
      default:
        return <Database className="h-6 w-6 text-blue-600 animate-pulse" />;
    }
  };

  // Get current loading text based on phase
  const getLoadingText = () => {
    switch (loadingPhase) {
      case 0:
        return t('details.loading');
      case 1:
        return t('details.refreshingInfo').split('...')[0] + '...';
      case 2:
        return t('details.collectingInfo');
      default:
        return t('details.loading');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center justify-center px-4 sm:px-6 text-center">
          <div className="mb-6 w-20 h-20 relative">
            <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 border-opacity-50 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-2 border-transparent border-t-2 border-r-2 border-blue-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {getLoadingIcon()}
            </div>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-3">{getLoadingText()}</h3>
          <p className="text-gray-600 text-center max-w-md mx-auto transition-opacity duration-300">
            {loadingPhase === 0 && "Connecting to server..."}
            {loadingPhase === 1 && t('details.refreshingInfo')}
            {loadingPhase === 2 && t('details.collectingInfo')}
          </p>
          <div className="mt-6 flex space-x-2">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <p className="text-red-700">{error || t('details.serverNotFound')}</p>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
            ← {t('details.backToServers')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link 
        to="/" 
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="ml-1">{t('details.backToServers')}</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8">
          {/* Header section with responsive layout */}
          <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex flex-col items-center md:items-start md:flex-row">
              {server.logoUrl ? (
                <img src={server.logoUrl} alt={server.name} className="h-20 w-20 rounded-lg md:mr-6 mb-4 md:mb-0" />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-blue-100 flex items-center justify-center md:mr-6 mb-4 md:mb-0">
                  <Database className="h-10 w-10 text-blue-600" />
                </div>
              )}
              <div className="text-center md:text-left">
                <div className="flex flex-col items-center md:flex-row md:items-center">
                  <h1 className="text-3xl font-bold text-gray-900">{server.name}</h1>
                  {server.isRecommended && (
                    <span className="mt-2 md:mt-0 md:ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {t('server.recommended')}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{t('server.by')} {server.author}</p>
                
                <div className="flex items-center justify-center md:justify-start mt-2 space-x-4">
                  <div className="flex items-center text-gray-600">
                    <Star className="h-5 w-5 text-yellow-400 mr-1" />
                    <span>{(server.githubStars || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Download className="h-5 w-5 mr-1" />
                    <span>{(server.downloadCount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* GitHub link - styled with light background color */}
            <a
              href={server.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium self-center md:self-start px-3 py-1.5 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('details.viewOnGithub')}
            </a>
          </div>

          {/* Server Information in single row */}
          <div className="mt-8 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-start gap-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">{t('details.category')}:</span>
                  <span className="text-gray-900">{server.category ? t(`category.${server.category}`) : t('details.notSpecified')}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">{t('details.requiresApiKey')}:</span>
                  <span className="text-gray-900">{server.requiresApiKey ? t('common.yes') : t('common.no')}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">{t('details.createdAt')}:</span>
                  <span className="text-gray-900">{new Date(server.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">{t('details.updatedAt')}:</span>
                  <span className="text-gray-900">{new Date(server.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('details.description')}</h2>
            <p className="text-gray-700 leading-relaxed">{server.description}</p>
          </div>

          {/* MCP Host Component */}
          <MCPHostComponent server={server} className="mb-8" />

          {server.Installation_instructions && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('details.installationInstructions')}</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{server.Installation_instructions}</p>
              </div>
            </div>
          )}

          {server.Usage_instructions && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('details.usageInstructions')}</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 leading-relaxed">{server.Usage_instructions}</p>
              </div>
            </div>
          )}

          {server.features && server.features.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('details.features')}</h2>
              <ul className="list-disc pl-5 space-y-2">
                {server.features.map((feature, index) => (
                  <li key={index} className="text-gray-700">{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {server.prerequisites && server.prerequisites.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('details.prerequisites')}</h2>
              <ul className="list-disc pl-5 space-y-2">
                {server.prerequisites.map((prerequisite, index) => (
                  <li key={index} className="text-gray-700">{prerequisite}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('details.tags')}</h2>
            <div className="flex flex-wrap gap-2">
              {server.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {server.lastEnrichmentTime && (
            <div className="text-sm text-gray-500 mt-6">
              {t('details.lastUpdated')}: {new Date(server.lastEnrichmentTime).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}