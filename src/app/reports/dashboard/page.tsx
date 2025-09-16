"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

export default function CompetitorIntelligenceDashboard() {
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetitors = async () => {
      try {
        const response = await fetch('/api/competitors/list');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch competitors: ${response.status}`);
        }
        
        const data = await response.json();
        setCompetitors(data.competitors || []);
      } catch (err) {
        console.error('Error fetching competitors:', err);
        setError('Failed to load competitor data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitors();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Competitor Intelligence Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Overview of your competitive landscape
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Loading competitors...</p>
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

        {/* Success State - Competitor Grid */}
        {!isLoading && !error && (
          <div>
            {competitors.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  No Competitors Found
                </h3>
                <p className="text-gray-400">
                  Start by uploading competitor data to see insights here.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-gray-400">
                    Found {competitors.length} competitor{competitors.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {competitors.map((competitor) => (
                    <Link
                      key={competitor}
                      href={`/reports/competitors/${encodeURIComponent(competitor)}`}
                      className="glass-card p-6 hover:scale-105 transition-all duration-300 group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Building2 className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-100 transition-colors truncate">
                            {competitor}
                          </h3>
                          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                            View intelligence
                          </p>
                        </div>
                      </div>
                      
                      {/* Subtle hover indicator */}
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
