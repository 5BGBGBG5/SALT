'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

// Use AiEO project credentials for this report since v_high_intent_prompt_mentions exists there
const supabase = createClient(
  process.env.NEXT_PUBLIC_AIEO_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY!
);

type PMRow = {
  ai_response_id: number;
  execution_week: number;
  execution_date: string;
  prompt_id: string;
  prompt_category: string;
  prompt_text: string;
  model: 'openai' | 'gemini' | 'claude' | 'grok';
  responded: boolean;
  inecta_mentioned: boolean;
};

type PromptGroup = {
  category: string;
  text: string;
  models: Record<string, PMRow>;
};

const MODELS: PMRow['model'][] = ['openai','gemini','claude','grok'];
const HI_CATS = ['generic','vertical','feature','head_to_head','comparison','variant'];

export default function CompetitionHeatMapPage() {
  const [rows, setRows] = useState<PMRow[]>([]);
  const [onlyMisses, setOnlyMisses] = useState(true);
  const [catFilter, setCatFilter] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('v_high_intent_prompt_mentions')
          .select('*', { count: 'exact' });
          
        if (error) {
          console.error('Supabase error:', error);
          setError(`Database error: ${error.message}`);
          return;
        }
        
        setRows((data ?? []) as PMRow[]);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grouped = useMemo(() => {
    // Group by prompt_id
    const map = new Map<string, PromptGroup>();
    for (const r of rows) {
      if (!map.has(r.prompt_id)) {
        map.set(r.prompt_id, {
          category: r.prompt_category, 
          text: r.prompt_text, 
          models: {} as Record<string, PMRow>
        });
      }
      map.get(r.prompt_id)!.models[r.model] = r;
    }
    // Filter logic
    let entries = [...map.entries()];
    if (catFilter.length) {
      entries = entries.filter(([, v]) => catFilter.includes(v.category));
    }
    if (q.trim()) {
      const needle = q.toLowerCase();
      entries = entries.filter(([, v]) => v.text.toLowerCase().includes(needle) || v.category.toLowerCase().includes(needle));
    }
    if (onlyMisses) {
      entries = entries.filter(([, v]) => MODELS.some(m => {
        const cell = v.models[m];
        return cell?.responded && !cell?.inecta_mentioned;
      }));
    }
    // Sort: most misses first
    entries.sort((a, b) => {
      const missA = MODELS.filter(m => a[1].models[m]?.responded && !a[1].models[m]?.inecta_mentioned).length;
      const missB = MODELS.filter(m => b[1].models[m]?.responded && !b[1].models[m]?.inecta_mentioned).length;
      return missB - missA;
    });
    return entries;
  }, [rows, onlyMisses, catFilter, q]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading competition data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Report</h2>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-teal-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/30 rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pb-6"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-teal-200 to-emerald-200 bg-clip-text text-transparent">
            Competition Heat Map
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Analyze AI model responses and identify where Inecta is mentioned vs. missed opportunities
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-4"
        >
        <div className="flex flex-wrap gap-2">
          {HI_CATS.map(cat => {
            const active = catFilter.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => setCatFilter(p => active ? p.filter(x=>x!==cat) : [...p, cat])}
                className={`px-3 py-1 rounded-full text-sm border transition ${
                  active ? 'bg-teal-500 text-white border-teal-600' : 'bg-gray-800/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {cat}
              </button>
            )
          })}
          <button
            onClick={() => setCatFilter([])}
            className="px-3 py-1 rounded-full text-sm border bg-white border-gray-300 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>

        <div className="flex-1" />

        <label className="inline-flex items-center gap-2 text-sm">
          <input 
            type="checkbox" 
            checked={onlyMisses} 
            onChange={e=>setOnlyMisses(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show only misses
        </label>

          <input
            className="glass-input px-3 py-2 rounded-md border border-teal-500/20 text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Search prompts…"
            value={q}
            onChange={e=>setQ(e.target.value)}
          />
        </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{grouped.length}</div>
          <div className="text-sm text-gray-600">Total Prompts</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {grouped.filter(([, v]) => 
              MODELS.some(m => v.models[m]?.responded && v.models[m]?.inecta_mentioned)
            ).length}
          </div>
          <div className="text-sm text-gray-600">With Mentions</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {grouped.filter(([, v]) => 
              MODELS.some(m => v.models[m]?.responded && !v.models[m]?.inecta_mentioned)
            ).length}
          </div>
          <div className="text-sm text-gray-600">Missed Opportunities</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{rows.length}</div>
          <div className="text-sm text-gray-600">Total Responses</div>
        </div>
      </div>

        {/* Matrix */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-table overflow-hidden"
        >
        <div className="overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="border-b border-teal-500/20">
              <tr>
                <th className="text-left p-4 w-[120px] font-semibold text-white">Category</th>
                <th className="text-left p-4 font-semibold text-white">Prompt</th>
                {MODELS.map(m => (
                  <th key={m} className="text-center p-4 w-[120px] font-semibold text-white capitalize">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map(([promptId, v]) => {
                return (
                  <tr key={promptId} className="border-b border-teal-500/10 hover:bg-teal-500/5 transition-colors">
                    <td className="p-4 align-top">
                      <span className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700">
                        {v.category}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <div className="max-w-3xl leading-6 text-gray-900">{v.text}</div>
                      <div className="mt-2 text-xs text-gray-500">ID: {promptId}</div>
                    </td>
                    {MODELS.map(m => {
                      const cell = v.models[m];
                      let status: 'noresp' | 'miss' | 'hit' = 'noresp';
                      if (cell?.responded) status = cell.inecta_mentioned ? 'hit' : 'miss';
                      const color =
                        status === 'hit'   ? 'bg-green-100 border-green-200 text-green-800' :
                        status === 'miss'  ? 'bg-red-100 border-red-200 text-red-800' :
                                             'bg-gray-100 border-gray-200 text-gray-600';
                      const label =
                        status === 'hit'  ? 'Mentioned' :
                        status === 'miss' ? 'No mention' : 'No response';
                      return (
                        <td key={m} className="p-4 text-center align-top">
                          <div title={label} className={`inline-block px-3 py-1 rounded-md border text-xs font-medium ${color}`}>
                            {label}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {grouped.length === 0 && (
                <tr>
                  <td colSpan={2 + MODELS.length} className="p-8 text-center text-gray-500">
                    No data found. Try adjusting your filters or search terms.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </motion.div>

        {/* Legend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="glass-card p-4"
        >
          <h3 className="font-medium text-white mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-gray-300">Green = Inecta mentioned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-gray-300">Red = Model answered but didn&apos;t mention Inecta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
            <span className="text-gray-300">Gray = No response</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Filter by categories or search prompts to focus on specific areas. Use &quot;Show only misses&quot; to identify opportunities where AI models responded but didn&apos;t mention Inecta.
        </p>
        </motion.div>
      </div>
    </div>
  );
}
