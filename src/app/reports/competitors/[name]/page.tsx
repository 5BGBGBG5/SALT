"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Tag, Calendar, ExternalLink, Building2, BarChart3 } from 'lucide-react';

// TypeScript interface matching the kb_sources table structure
interface Source {
  id: string;
  source_type: string;
  title: string;
  competitor: string;
  verticals: string[];
  url?: string;
  verified: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export default function CompetitorDetailPage() {
  const params = useParams();
  const [sources, setSources] = useState<Source[]>([]);
  const [competitorName, setCompetitorName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Decode the competitor name from URL params
  useEffect(() => {
    if (params?.name) {
      const decodedName = decodeURIComponent(params.name as string);
      setCompetitorName(decodedName);
    }
  }, [params?.name]);

  // Fetch competitor data when competitorName is set
  useEffect(() => {
    const fetchCompetitorData = async () => {
      if (!competitorName) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/competitors/${encodeURIComponent(competitorName)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch competitor data: ${response.status}`);
        }
        
        const data = await response.json();
        setSources(data.sources || []);
      } catch (err) {
        console.error('Error fetching competitor data:', err);
        setError('Failed to load competitor intelligence data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitorData();
  }, [competitorName]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Helper function to get unique verticals
  const getUniqueVerticals = () => {
    const allVerticals = sources.flatMap(source => source.verticals || []);
    return Array.from(new Set(allVerticals)).filter(Boolean);
  };

  // Helper function to get source type badge color
  const getSourceTypeBadgeColor = (sourceType: string) => {
    switch (sourceType.toLowerCase()) {
      case 'battlecard':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'website':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'document':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Building2 className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">
              {competitorName || 'Loading...'}
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Intelligence sources and competitive analysis
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Loading competitor intelligence...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="glass-card p-8 text-center">
            <div className="text-red-400 text-lg font-semibold mb-2">
              ⚠️ Error Loading Data
            </div>
            <p className="text-gray-300">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 btn-primary"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Success State */}
        {!isLoading && !error && (
          <>
            {sources.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  No Intelligence Sources Found
                </h3>
                <p className="text-gray-400">
                  No intelligence sources found for <span className="text-cyan-400 font-semibold">{competitorName}</span>.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Upload competitor data to see insights here.
                </p>
              </div>
            ) : (
              <>
                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="glass-card p-6">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-cyan-400" />
                      <div>
                        <h3 className="text-2xl font-bold text-white">{sources.length}</h3>
                        <p className="text-gray-400">Total Sources</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass-card p-6">
                    <div className="flex items-center space-x-3">
                      <Tag className="w-8 h-8 text-green-400" />
                      <div>
                        <h3 className="text-2xl font-bold text-white">{getUniqueVerticals().length}</h3>
                        <p className="text-gray-400">Unique Verticals</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass-card p-6">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-8 h-8 text-purple-400" />
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          {sources.filter(s => s.verified).length}
                        </h3>
                        <p className="text-gray-400">Verified Sources</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verticals Overview */}
                {getUniqueVerticals().length > 0 && (
                  <div className="glass-card p-6 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Tag className="w-5 h-5 mr-2 text-cyan-400" />
                      Market Verticals
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {getUniqueVerticals().map((vertical) => (
                        <span
                          key={vertical}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm border border-cyan-500/30"
                        >
                          {vertical}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources Grid */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-white mb-4">
                    Intelligence Sources ({sources.length})
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sources.map((source) => (
                      <div key={source.id} className="glass-card p-6 hover:scale-[1.02] transition-all duration-300">
                        {/* Source Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                              {source.title || 'Untitled Source'}
                            </h3>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getSourceTypeBadgeColor(source.source_type)}`}>
                                {source.source_type}
                              </span>
                              {source.verified && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-medium">
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                          <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        </div>

                        {/* Source Details */}
                        <div className="space-y-3">
                          {/* Created Date */}
                          <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(source.created_at)}
                          </div>

                          {/* URL */}
                          {source.url && (
                            <div className="flex items-center text-sm">
                              <ExternalLink className="w-4 h-4 mr-2 text-gray-400" />
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 transition-colors truncate"
                              >
                                {source.url}
                              </a>
                            </div>
                          )}

                          {/* Verticals */}
                          {source.verticals && source.verticals.length > 0 && (
                            <div>
                              <div className="flex items-center text-sm text-gray-400 mb-2">
                                <Tag className="w-4 h-4 mr-2" />
                                Verticals:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {source.verticals.map((vertical, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs"
                                  >
                                    {vertical}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
