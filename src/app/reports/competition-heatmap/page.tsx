'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { 
  FileText, 
  CheckCircle,
  X,
  Calendar,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Target,
  Users
} from 'lucide-react';
import MetricCard from '@/app/components/MetricCard';
import StatsCards from './components/StatsCards';
import ModelComparison from './components/ModelComparison';
import PersonaTable from './components/PersonaTable';
import CompetitorChart from './components/CompetitorChart';
import ResponseDetailModal from './components/ResponseDetailModal';
import MentionTrends from './components/MentionTrends';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Interfaces
interface OverviewStats {
  totalResponses: number;
  inectaMentions: number;
  mentionRate: number;
  modelsTested: number;
  topCompetitor: string;
  topCompetitorMentions: number;
}

interface ModelStats {
  model: string;
  total: number;
  mentions: number;
  mentionRate: number;
}

interface PersonaRow {
  personaName: string;
  personaId: string;
  models: {
    [modelName: string]: {
      mentioned: boolean;
      mentionCount: number;
      responseId: string;
    }
  };
  totalMentions: number;
  totalResponses: number;
}

interface ResponseDetail {
  id: string;
  queryId: string;
  model: string;
  prompt: string;
  response: string;
  inectaMentioned: boolean;
  mentionCount: number;
  competitorsMentioned: Record<string, number>;
  date: string;
}

interface CompetitorMention {
  vendor: string;
  totalMentions: number;
  responsesMentionedIn: number;
}

interface InectaTrendData {
  execution_date: string;
  model: string;
  total_responses: number;
  inecta_mentions: number;
  mention_rate: number;
}

interface CompetitorTrendData {
  execution_date: string;
  vendor: string;
  total_mentions: number;
  model: string;
}

interface EmbeddingRow {
  id: string;
  content: string | null;
  metadata: {
    model_source?: string;
    inecta_mentioned?: boolean;
    mention_count?: number;
    persona_id?: string;
    persona_name?: string;
    prompt?: string;
    query_id?: string;
    execution_date?: string;
    vendor_mentions?: string | Record<string, number>; // Can be string (JSON) or object
  } | null;
}

// Helper function to get only the latest response per query_id + model_source
// Equivalent to SQL: ROW_NUMBER() OVER (PARTITION BY query_id, model_source ORDER BY execution_date DESC) = 1
function getLatestResponses(responses: EmbeddingRow[]): EmbeddingRow[] {
  // Group by query_id + model_source, keep only the latest by execution_date
  const grouped = new Map<string, EmbeddingRow>();
  
  responses.forEach((row) => {
    const queryId = row.metadata?.query_id;
    const modelSource = row.metadata?.model_source;
    const executionDate = row.metadata?.execution_date;
    
    if (!queryId || !modelSource) return;
    
    const key = `${queryId}::${modelSource}`;
    const existing = grouped.get(key);
    
    if (!existing) {
      grouped.set(key, row);
    } else {
      // Compare execution dates - keep the one with the latest date
      // Dates are in YYYY-MM-DD format, so string comparison works
      const existingDate = existing.metadata?.execution_date || '';
      const currentDate = executionDate || '';
      
      // If current date is later (or existing has no date), replace
      if (!existingDate || (currentDate && currentDate > existingDate)) {
        grouped.set(key, row);
      }
    }
  });
  
  return Array.from(grouped.values());
}

export default function InectaMentionsDashboard() {
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalResponses: 0,
    inectaMentions: 0,
    mentionRate: 0,
    modelsTested: 0,
    topCompetitor: 'N/A',
    topCompetitorMentions: 0
  });
  const [modelStats, setModelStats] = useState<ModelStats[]>([]);
  const [personaRows, setPersonaRows] = useState<PersonaRow[]>([]);
  const [competitorMentions, setCompetitorMentions] = useState<CompetitorMention[]>([]);
  const [allResponses, setAllResponses] = useState<EmbeddingRow[]>([]);
  const [inectaTrend, setInectaTrend] = useState<InectaTrendData[]>([]);
  const [competitorTrend, setCompetitorTrend] = useState<CompetitorTrendData[]>([]);
  const [modelFilter, setModelFilter] = useState<'all' | 'chatgpt' | 'gemini'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<PersonaRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase environment variables are not configured');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch Overview Stats
        const { data: overviewData, error: overviewError } = await supabase
          .rpc('get_mentions_overview');

        if (overviewError) {
          // Fallback: calculate manually
          const { data: allData } = await supabase
            .from('persona_response_embeddings')
            .select('metadata');

          if (allData) {
            const typedData = allData as EmbeddingRow[];
            // Filter to only latest responses per query_id + model_source
            const latestData = getLatestResponses(typedData);
            const total = latestData.length;
            const mentions = latestData.filter((r) => r.metadata?.inecta_mentioned === true).length;
            const models = new Set(latestData.map((r) => r.metadata?.model_source).filter(Boolean));
            
            // Get top competitor (excluding Inecta)
            const competitorCounts: Record<string, number> = {};
            latestData.forEach((r) => {
              let vendors: string | Record<string, number> | undefined = r.metadata?.vendor_mentions;
              
              // Handle vendor_mentions as string (needs JSON parse) or object
              if (typeof vendors === 'string' && vendors.trim() !== '') {
                try {
                  vendors = JSON.parse(vendors) as Record<string, number>;
                } catch (e) {
                  console.warn('Failed to parse vendor_mentions as JSON:', e);
                  return; // Skip this row if parsing fails
                }
              }
              
              if (vendors && typeof vendors === 'object') {
                Object.entries(vendors).forEach(([vendor, count]) => {
                  // Exclude Inecta from competitor counts
                  if (vendor && vendor.toLowerCase() !== 'inecta') {
                    competitorCounts[vendor] = (competitorCounts[vendor] || 0) + (Number(count) || 0);
                  }
                });
              }
            });
            const topCompetitor = Object.entries(competitorCounts)
              .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

            setOverviewStats({
              totalResponses: total,
              inectaMentions: mentions,
              mentionRate: total > 0 ? (mentions / total) * 100 : 0,
              modelsTested: models.size,
              topCompetitor,
              topCompetitorMentions: competitorCounts[topCompetitor] || 0
            });
          }
        } else if (overviewData && overviewData.length > 0) {
          const stats = overviewData[0];
          setOverviewStats({
            totalResponses: stats.total_responses || 0,
            inectaMentions: stats.inecta_mentions || 0,
            mentionRate: stats.mention_rate || 0,
            modelsTested: stats.models_tested || 0,
            topCompetitor: stats.top_competitor || 'N/A',
            topCompetitorMentions: stats.top_competitor_mentions || 0
          });
        }

        // 2. Fetch Model Stats
        const { data: modelData, error: modelError } = await supabase
          .from('persona_response_embeddings')
          .select('metadata');

        if (!modelError && modelData) {
          const typedModelData = modelData as EmbeddingRow[];
          // Filter to only latest responses per query_id + model_source
          const latestModelData = getLatestResponses(typedModelData);
          const modelMap: Record<string, { total: number; mentions: number }> = {};
          
          latestModelData.forEach((row) => {
            const model = row.metadata?.model_source;
            if (model) {
              if (!modelMap[model]) {
                modelMap[model] = { total: 0, mentions: 0 };
              }
              modelMap[model].total++;
              if (row.metadata?.inecta_mentioned === true) {
                modelMap[model].mentions++;
              }
            }
          });

          const modelStatsArray: ModelStats[] = Object.entries(modelMap).map(([model, stats]) => ({
            model,
            total: stats.total,
            mentions: stats.mentions,
            mentionRate: stats.total > 0 ? (stats.mentions / stats.total) * 100 : 0
          }));

          setModelStats(modelStatsArray.sort((a, b) => b.total - a.total));
        }

        // 3. Fetch Persona Breakdown
        const { data: personaData, error: personaError } = await supabase
          .from('persona_response_embeddings')
          .select('id, metadata, content');

        if (!personaError && personaData) {
          const typedPersonaData = personaData as EmbeddingRow[];
          // Filter to only latest responses per query_id + model_source
          const latestPersonaData = getLatestResponses(typedPersonaData);
          const personaMap: Record<string, PersonaRow> = {};

          latestPersonaData.forEach((row) => {
            const personaName = row.metadata?.persona_name;
            const personaId = row.metadata?.persona_id;
            const model = row.metadata?.model_source;
            
            if (personaName && personaId && model) {
              if (!personaMap[personaId]) {
                personaMap[personaId] = {
                  personaName,
                  personaId,
                  models: {},
                  totalMentions: 0,
                  totalResponses: 0
                };
              }

              const mentioned = row.metadata?.inecta_mentioned === true;
              const mentionCount = Number(row.metadata?.mention_count) || 0;

              personaMap[personaId].models[model] = {
                mentioned,
                mentionCount,
                responseId: row.id
              };

              personaMap[personaId].totalResponses++;
              if (mentioned) {
                personaMap[personaId].totalMentions++;
              }
            }
          });

          setPersonaRows(Object.values(personaMap));
          setAllResponses(latestPersonaData);
        }

        // 4. Fetch Competitor Mentions
        const { data: competitorData, error: competitorError } = await supabase
          .from('persona_response_embeddings')
          .select('metadata');

        if (!competitorError && competitorData) {
          const typedCompetitorData = competitorData as EmbeddingRow[];
          // Filter to only latest responses per query_id + model_source
          const latestCompetitorData = getLatestResponses(typedCompetitorData);
          const competitorMap: Record<string, { totalMentions: number; responsesMentionedIn: number }> = {};

          latestCompetitorData.forEach((row) => {
            let vendors: string | Record<string, number> | undefined = row.metadata?.vendor_mentions;
            
            // Handle vendor_mentions as string (needs JSON parse) or object
            if (typeof vendors === 'string' && vendors.trim() !== '') {
              try {
                vendors = JSON.parse(vendors) as Record<string, number>;
              } catch (e) {
                console.warn('Failed to parse vendor_mentions as JSON:', e);
                return; // Skip this row if parsing fails
              }
            }
            
            if (vendors && typeof vendors === 'object') {
              Object.entries(vendors).forEach(([vendor, count]) => {
                // Exclude Inecta from competitor counts
                if (vendor && vendor.toLowerCase() !== 'inecta') {
                  if (!competitorMap[vendor]) {
                    competitorMap[vendor] = { totalMentions: 0, responsesMentionedIn: 0 };
                  }
                  const mentionCount = Number(count) || 0;
                  competitorMap[vendor].totalMentions += mentionCount;
                  if (mentionCount > 0) {
                    competitorMap[vendor].responsesMentionedIn++;
                  }
                }
              });
            }
          });

          const competitorArray: CompetitorMention[] = Object.entries(competitorMap)
            .map(([vendor, stats]) => ({
              vendor,
              totalMentions: stats.totalMentions,
              responsesMentionedIn: stats.responsesMentionedIn
            }))
            .sort((a, b) => b.totalMentions - a.totalMentions)
            .slice(0, 10);

          setCompetitorMentions(competitorArray);
        }

        // 5. Fetch Inecta Trend Data (ALL historical data, not just latest)
        const { data: trendData, error: trendError } = await supabase
          .from('persona_response_embeddings')
          .select('metadata');

        if (!trendError && trendData) {
          const typedTrendData = trendData as EmbeddingRow[];
          
          // Group by execution_date AND model (use ALL data for trends, not filtered)
          const trendByDateModel = new Map<string, { total: number; mentions: number }>();
          
          typedTrendData.forEach((row) => {
            const date = row.metadata?.execution_date;
            const model = row.metadata?.model_source;
            if (date && model) {
              const key = `${date}::${model}`;
              if (!trendByDateModel.has(key)) {
                trendByDateModel.set(key, { total: 0, mentions: 0 });
              }
              const stats = trendByDateModel.get(key)!;
              stats.total++;
              if (row.metadata?.inecta_mentioned === true) {
                stats.mentions++;
              }
            }
          });
          
          const inectaTrendArray: InectaTrendData[] = Array.from(trendByDateModel.entries())
            .map(([key, stats]) => {
              const [date, model] = key.split('::');
              return {
                execution_date: date,
                model: model || '',
                total_responses: stats.total,
                inecta_mentions: stats.mentions,
                mention_rate: stats.total > 0 ? (stats.mentions / stats.total) * 100 : 0
              };
            })
            .sort((a, b) => {
              const dateCompare = a.execution_date.localeCompare(b.execution_date);
              if (dateCompare !== 0) return dateCompare;
              return a.model.localeCompare(b.model);
            });
          
          console.log('Inecta trend data:', inectaTrendArray);
          setInectaTrend(inectaTrendArray);
        } else if (trendError) {
          console.error('Error fetching trend data:', trendError);
        }

        // 6. Fetch Competitor Trend Data (Top 5, ALL historical data)
        const { data: competitorTrendData, error: competitorTrendError } = await supabase
          .from('persona_response_embeddings')
          .select('metadata');

        if (!competitorTrendError && competitorTrendData) {
          const typedCompetitorTrendData = competitorTrendData as EmbeddingRow[];
          
          // First, get top 5 vendors overall (from ALL data)
          const vendorTotals: Record<string, number> = {};
          
          typedCompetitorTrendData.forEach((row) => {
            let vendors: string | Record<string, number> | undefined = row.metadata?.vendor_mentions;
            
            if (typeof vendors === 'string' && vendors.trim() !== '') {
              try {
                vendors = JSON.parse(vendors) as Record<string, number>;
              } catch (e) {
                return;
              }
            }
            
            if (vendors && typeof vendors === 'object') {
              Object.entries(vendors).forEach(([vendor, count]) => {
                if (vendor && vendor.toLowerCase() !== 'inecta') {
                  vendorTotals[vendor] = (vendorTotals[vendor] || 0) + (Number(count) || 0);
                }
              });
            }
          });
          
          const top5Vendors = Object.entries(vendorTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([vendor]) => vendor);
          
          // Now get trend data for top 5 vendors by execution_date AND model
          const competitorTrendByDateModel = new Map<string, Record<string, number>>();
          
          typedCompetitorTrendData.forEach((row) => {
            const date = row.metadata?.execution_date;
            const model = row.metadata?.model_source;
            if (!date || !model) return;
            
            // Create composite key for date and model
            const dateModelKey = `${date}::${model}`;
            
            let vendors: string | Record<string, number> | undefined = row.metadata?.vendor_mentions;
            
            if (typeof vendors === 'string' && vendors.trim() !== '') {
              try {
                vendors = JSON.parse(vendors) as Record<string, number>;
              } catch (e) {
                return;
              }
            }
            
            if (vendors && typeof vendors === 'object') {
              if (!competitorTrendByDateModel.has(dateModelKey)) {
                competitorTrendByDateModel.set(dateModelKey, {});
              }
              const dateData = competitorTrendByDateModel.get(dateModelKey)!;
              
              Object.entries(vendors).forEach(([vendor, count]) => {
                if (vendor && vendor.toLowerCase() !== 'inecta' && top5Vendors.includes(vendor)) {
                  dateData[vendor] = (dateData[vendor] || 0) + (Number(count) || 0);
                }
              });
            }
          });
          
          const competitorTrendArray: CompetitorTrendData[] = [];
          competitorTrendByDateModel.forEach((vendors, dateModelKey) => {
            const [date, model] = dateModelKey.split('::');
            Object.entries(vendors).forEach(([vendor, mentions]) => {
              competitorTrendArray.push({
                execution_date: date,
                vendor,
                total_mentions: mentions,
                model: model || ''
              });
            });
          });
          
          competitorTrendArray.sort((a, b) => {
            const dateCompare = a.execution_date.localeCompare(b.execution_date);
            if (dateCompare !== 0) return dateCompare;
            return b.total_mentions - a.total_mentions;
          });
          
          console.log('Competitor trend data:', competitorTrendArray);
          setCompetitorTrend(competitorTrendArray);
        } else if (competitorTrendError) {
          console.error('Error fetching competitor trend data:', competitorTrendError);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handlePersonaClick = (persona: PersonaRow) => {
    setSelectedPersona(persona);
    setIsModalOpen(true);
  };

  const getPersonaResponses = (personaId: string): ResponseDetail[] => {
    // Filter to persona, then get only latest responses per query_id + model_source
    const personaResponses = allResponses.filter((r: EmbeddingRow) => r.metadata?.persona_id === personaId);
    const latestPersonaResponses = getLatestResponses(personaResponses);
    
    return latestPersonaResponses.map((r: EmbeddingRow) => ({
        id: r.id,
        queryId: r.metadata?.query_id || '',
        model: r.metadata?.model_source || '',
        prompt: r.metadata?.prompt || '',
        response: r.content || '',
        inectaMentioned: r.metadata?.inecta_mentioned === true,
        mentionCount: Number(r.metadata?.mention_count) || 0,
        competitorsMentioned: (() => {
          let vendors: string | Record<string, number> | undefined = r.metadata?.vendor_mentions;
          // Handle vendor_mentions as string (needs JSON parse) or object
          if (typeof vendors === 'string' && vendors.trim() !== '') {
            try {
              vendors = JSON.parse(vendors) as Record<string, number>;
            } catch (e) {
              console.warn('Failed to parse vendor_mentions as JSON:', e);
              return {};
            }
          }
          return (vendors && typeof vendors === 'object') 
            ? vendors as Record<string, number>
            : {};
        })(),
        date: r.metadata?.execution_date || ''
      }));
  };

  return (
    <div className="min-h-screen py-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-teal-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-text-primary via-accent-primary to-accent-success bg-clip-text text-transparent mb-2">
            Inecta AI Visibility Dashboard
          </h1>
          <p className="text-lg text-text-secondary">Track how AI models mention Inecta in buyer persona queries</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Loading dashboard data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card p-8 text-center">
            <div className="text-red-400 text-lg font-semibold mb-2 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Error Loading Data
            </div>
            <p className="text-gray-300">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Stats Cards */}
            <StatsCards stats={overviewStats} />

            {/* Model Comparison */}
            <div className="glass-card p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Model Performance
              </h2>
              <ModelComparison modelStats={modelStats} />
            </div>

            {/* Mention Trends */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Mention Trends
              </h2>
              <MentionTrends 
                inectaTrend={inectaTrend} 
                competitorTrend={competitorTrend}
                modelFilter={modelFilter}
                onModelFilterChange={setModelFilter}
              />
            </div>

            {/* Persona Breakdown */}
            <div className="glass-card p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Persona Breakdown
                <span className="text-sm text-gray-400 font-normal ml-2">(click row to view details)</span>
              </h2>
              <PersonaTable 
                personaRows={personaRows} 
                onPersonaClick={handlePersonaClick}
              />
            </div>

            {/* Competitor Mentions */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Competitor Mentions
                <span className="text-sm text-gray-400 font-normal ml-2">(who AI IS recommending)</span>
              </h2>
              <CompetitorChart competitors={competitorMentions} inectaMentions={overviewStats.inectaMentions} />
            </div>
          </>
        )}

        {/* Detail Modal */}
        {isModalOpen && selectedPersona && (
          <ResponseDetailModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedPersona(null);
            }}
            persona={selectedPersona}
            responses={getPersonaResponses(selectedPersona.personaId)}
          />
        )}
      </div>
    </div>
  );
}
