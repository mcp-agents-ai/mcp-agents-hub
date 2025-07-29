import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Download, ExternalLink, Database } from 'lucide-react';
import { MCPServer } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ServerCardProps {
  server: MCPServer;
}

export function ServerCard({ server }: ServerCardProps) {
  const { t, language } = useLanguage();
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link to={server.hubId ? `/server/${server.hubId}` : '#'} className="block p-6 flex flex-col h-full">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {server.logoUrl ? (
              <img src={server.logoUrl} alt={server.name} className="h-12 w-12 rounded-lg" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{server.name}</h3>
              <p className="text-sm text-gray-500">{t('server.by')} {server.author}</p>
            </div>
          </div>
          {server.isRecommended && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {t('server.recommended')}
            </span>
          )}
        </div>
        
        <p className="mt-4 text-gray-600 line-clamp-2">{server.description}</p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {server.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="mt-auto pt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span>{(server.githubStars || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Download className="h-4 w-4 mr-1" />
              <span>{(server.downloadCount || 0).toLocaleString()}</span>
            </div>
          </div>
          
          <a
            href={server.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('server.viewOnGithub')}
          </a>
        </div>
      </Link>
    </div>
  );
}