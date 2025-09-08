'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { KbSource } from '@/lib/supabase';
import { FileText, Building2, Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function BattlecardsPage() {
  const [battlecards, setBattlecards] = useState<KbSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBattlecards();
  }, []);

  const fetchBattlecards = async () => {
    try {
      const { data, error } = await supabase
        .from('kb_sources')
        .select('*')
        .eq('source_type', 'battlecard')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBattlecards(data || []);
    } catch (error) {
      console.error('Error fetching battlecards:', error);
      setError('Failed to load battlecards');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Battlecards</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchBattlecards}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Battlecards</h1>
          <p className="text-gray-400">
            Competitive intelligence documents for sales enablement
          </p>
        </div>
        
        {battlecards.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Battlecards Found</h2>
            <p className="text-gray-400 mb-6">
              Upload your first battlecard using the command palette (⌘K)
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
              <kbd className="px-2 py-1 text-xs bg-gray-700 rounded text-gray-300">⌘K</kbd>
              <span className="text-sm text-gray-400">then select "Upload battlecard"</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {battlecards.map((card) => (
              <div 
                key={card.id} 
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-teal-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-600/20 rounded-lg">
                      <FileText className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {card.title || 'Battlecard'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Building2 className="w-4 h-4" />
                        <span>{card.competitor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {card.verified ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/40" />
                    )}
                  </div>
                </div>

                {card.verticals && card.verticals.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2">Verticals:</div>
                    <div className="flex flex-wrap gap-2">
                      {card.verticals.map((vertical, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-teal-600/20 text-teal-300 rounded-full border border-teal-600/30"
                        >
                          {vertical}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(card.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs">
                    {card.verified ? 'Verified' : 'Pending'}
                  </div>
                </div>

                {card.url && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <a
                      href={card.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      View Source →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
              <span className="text-sm text-gray-300">
                {battlecards.length} battlecard{battlecards.length !== 1 ? 's' : ''} loaded
              </span>
            </div>
            <div className="w-px h-4 bg-gray-600"></div>
            <button
              onClick={fetchBattlecards}
              className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
