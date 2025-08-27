'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Competition Heat Map</h1>
        <p className="mt-2 text-lg text-gray-600">
          Analyze AI model responses and identify where Inecta is mentioned vs. missed opportunities
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-2">
          {HI_CATS.map(cat => {
            const active = catFilter.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => setCatFilter(p => active ? p.filter(x=>x!==cat) : [...p, cat])}
                className={`px-3 py-1 rounded-full text-sm border transition ${
                  active ? 'bg-blue-600 text-white border-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'
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
          className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search prompts…"
          value={q}
          onChange={e=>setQ(e.target.value)}
        />
      </div>

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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 w-[120px] font-semibold text-gray-900">Category</th>
                <th className="text-left p-4 font-semibold text-gray-900">Prompt</th>
                {MODELS.map(m => (
                  <th key={m} className="text-center p-4 w-[120px] font-semibold text-gray-900 capitalize">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map(([promptId, v]) => {
                return (
                  <tr key={promptId} className="border-b border-gray-100 hover:bg-gray-50">
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
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-gray-700">Green = Inecta mentioned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-gray-700">Red = Model answered but didn&apos;t mention Inecta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
            <span className="text-gray-700">Gray = No response</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Filter by categories or search prompts to focus on specific areas. Use &quot;Show only misses&quot; to identify opportunities where AI models responded but didn&apos;t mention Inecta.
        </p>
      </div>
    </div>
  );
}
