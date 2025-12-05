'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { 
  FileText, 
  Search, 
  ChevronDown,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  X,
  Calendar,
  Users,
  Target,
  BarChart3,
  X as CloseIcon,
  Eye
} from 'lucide-react';
import MetricCard from '@/app/components/MetricCard';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper to safely parse JSONB data
function safeParseJSON<T>(data: T | string | null | undefined): T | null {
  if (!data) return null;
  if (typeof data === 'object' && data !== null) return data as T;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return null;
    }
  }
  return null;
}

// Keyword filtering utilities
const FILTERED_KEYWORDS = [
  'https', 'http', 'www', 'source', 'overview', 'features', 'solutions',
  'contact', 'about', 'home', 'page', 'click', 'learn', 'more', 'read', 'multi'
];

function filterKeywords(keywords: Record<string, number> | undefined): Record<string, number> {
  if (!keywords || typeof keywords !== 'object') return {};
  const filtered: Record<string, number> = {};
  for (const [keyword, count] of Object.entries(keywords)) {
    const lowerKeyword = keyword.toLowerCase();
    if (FILTERED_KEYWORDS.includes(lowerKeyword)) continue;
    if (keyword.length <= 2) continue;
    if (/^\d+$/.test(keyword)) continue;
    if (count < 1) continue;
    filtered[keyword] = count;
  }
  return filtered;
}

function filterUseCases(useCases: string[] | undefined): string[] {
  if (!useCases || !Array.isArray(useCases)) return [];
  return useCases
    .filter(useCase => {
      const lowerCase = useCase.toLowerCase();
      return !FILTERED_KEYWORDS.includes(lowerCase) && useCase.length > 2;
    })
    .slice(0, 10);
}

// Interfaces
interface RawAiResponse {
  execution_id: string;
  prompt_text: string;
  model_responses: string; // Note: N8N saves this as 'model_responses'
}

interface ContentGapReport {
  id: string;
  query_id: string;
  persona_id: string;
  persona_name: string;
  target_page_url: string;
  page_title: string;
  priority_score: number;
  similarity_score: number;
  execution_date: string;
  execution_id: string;
  suggested_faqs: Array<{ question: string; answer: string }> | string | null;
  suggested_tldr: string | null;
  missing_features: { missing_keywords: Record<string, number>; similarity_score: number } | string | null;
  terminology_gaps: { missing_keywords: Record<string, number>; similarity_score: number } | string | null;
  missing_use_cases: { missing: string[] } | string | null;
  competitive_gaps: Record<string, number> | string | null;
  priority_actions: { priority: number; actions: string[] } | string | null;
  inecta_mentioned: boolean;
  inecta_mention_count: number;
  created_at: string;
  // Merged fields
  prompt_text: string | null;
  ai_response: string | null;
}

interface ReportStats {
  total_reports: number;
  high_priority: number;
  avg_similarity: number;
  inecta_mentions: number;
}

// Helper function to highlight "Inecta" in text
const highlightInecta = (text: string | null): React.ReactNode => {
  if (!text) return <span className="text-gray-400 italic">N/A</span>;
  
  const regex = /(inecta)/gi;
  const parts: string[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(match[0]);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return (
    <span>
      {parts.map((part, index) => {
        const isInecta = /^inecta$/i.test(part);
        return isInecta ? (
          <mark key={index} className="bg-yellow-400/50 text-yellow-100 px-1 rounded">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

// Analysis Drawer Component
const AnalysisDrawer = ({ 
  report, 
  isOpen, 
  onClose 
}: { 
  report: ContentGapReport | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'gaps' | 'raw'>('gaps');
  
  if (!report || !isOpen) return null;

  const getFilteredFeatures = (report: ContentGapReport): Record<string, number> => {
    const missingFeatures = report.missing_features;
    if (!missingFeatures || typeof missingFeatures !== 'object') return {};
    const keywords = missingFeatures.missing_keywords;
    if (!keywords || typeof keywords !== 'object') return {};
    const filtered = filterKeywords(keywords);
    if (Object.keys(filtered).length === 0) {
      const sorted = Object.entries(keywords)
        .filter(([keyword]) => keyword.length > 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
      return Object.fromEntries(sorted);
    }
    return filtered;
  };

  const getFilteredTerminology = (report: ContentGapReport): Record<string, number> => {
    const terminologyGaps = report.terminology_gaps;
    if (!terminologyGaps || typeof terminologyGaps !== 'object') return {};
    const keywords = terminologyGaps.missing_keywords;
    if (!keywords || typeof keywords !== 'object') return {};
    const filtered = filterKeywords(keywords);
    if (Object.keys(filtered).length === 0) {
      const sorted = Object.entries(keywords)
        .filter(([keyword]) => keyword.length > 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
      return Object.fromEntries(sorted);
    }
    return filtered;
  };

  const getFilteredUseCases = (report: ContentGapReport): string[] => {
    const useCasesData = report.missing_use_cases;
    if (!useCasesData || typeof useCasesData !== 'object') return [];
    const useCases = useCasesData.missing;
    if (!useCases || !Array.isArray(useCases)) return [];
    return filterUseCases(useCases);
  };

  const faqs = Array.isArray(report.suggested_faqs) ? report.suggested_faqs : [];
  const filteredFeatures = getFilteredFeatures(report);
  const filteredTerminology = getFilteredTerminology(report);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
      
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-4xl bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-y-auto border-l border-gray-700"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-700">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                {report.page_title || 'Untitled Page'}
              </h2>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{report.persona_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(report.execution_date).toLocaleDateString()}</span>
                </div>
                {report.inecta_mentioned ? (
                  <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/50">
                    <CheckCircle className="w-3 h-3" />
                    Inecta Mentioned
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/50">
                    <X className="w-3 h-3" />
                    No Inecta
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <CloseIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('gaps')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'gaps' ? 'bg-teal-500 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              Content Gaps
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'raw' ? 'bg-teal-500 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              Raw Data
            </button>
          </div>

          {activeTab === 'gaps' ? (
            <div className="space-y-6">
              {report.suggested_tldr && (
                <div className="glass-card p-4">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Suggested TL;DR
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{report.suggested_tldr}</p>
                </div>
              )}
              {faqs.length > 0 && (
                <div className="glass-card p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">❓ Suggested FAQs ({faqs.length})</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {faqs.map((faq, idx) => (
                      <div key={idx} className="p-3 bg-gray-800/50 rounded border border-gray-700">
                        <p className="text-sm font-medium text-white mb-1">Q: {faq.question}</p>
                        <p className="text-xs text-gray-400">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
               {Object.keys(filteredFeatures).length > 0 && (
                <div className="glass-card p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">🔧 Missing Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(filteredFeatures).sort((a, b) => b[1] - a[1]).map(([keyword, count]) => (
                      <span key={keyword} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/50 flex items-center gap-1">
                        <strong>{keyword}</strong><span className="text-blue-400/70">×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {Object.keys(filteredTerminology).length > 0 && (
                <div className="glass-card p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">📚 Terminology Gaps</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(filteredTerminology).sort((a, b) => b[1] - a[1]).map(([keyword, count]) => (
                      <span key={keyword} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded border border-yellow-500/50 flex items-center gap-1">
                        <strong>{keyword}</strong><span className="text-yellow-400/70">×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="glass-card p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Prompt Used</h3>
                <div className="bg-gray-950/50 p-4 rounded-lg border border-gray-700 overflow-x-auto">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {report.prompt_text && report.prompt_text.trim() ? report.prompt_text : <span className="text-gray-400 italic">No prompt text found in database for this ID.</span>}
                  </pre>
                </div>
              </div>
              <div className="glass-card p-4">
                <h3 className="text-lg font-semibold text-white mb-3">AI Response</h3>
                <div className="bg-gray-950/50 p-4 rounded-lg border border-gray-700 overflow-x-auto">
                  <div className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {report.ai_response && report.ai_response.trim() ? highlightInecta(report.ai_response) : <span className="text-gray-400 italic">No response text found in database for this ID.</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default function GeoSimilaritiesPage() {
  const [reports, setReports] = useState<ContentGapReport[]>([]);
  const [stats, setStats] = useState<ReportStats>({ total_reports: 0, high_priority: 0, avg_similarity: 0, inecta_mentions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedUrl, setSelectedUrl] = useState('');
  const [latestExecutionDate, setLatestExecutionDate] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<ContentGapReport | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const personas = useMemo(() => Array.from(new Set(reports.map(r => r.persona_name).filter(Boolean))).sort(), [reports]);
  const urls = useMemo(() => Array.from(new Set(reports.map(r => r.target_page_url).filter(Boolean))).sort(), [reports]);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError(null);

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) throw new Error('Supabase environment variables are not configured');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: latestDateData, error: dateError } = await supabase
          .from('content_gap_reports')
          .select('execution_date')
          .order('execution_date', { ascending: false })
          .limit(1);

        if (dateError) {
            if (dateError.code === '42P01') throw new Error('The content_gap_reports table does not exist.');
            console.error('Date fetch error:', dateError);
        }

        const latestDate = latestDateData?.[0]?.execution_date;
        setLatestExecutionDate(latestDate || '');

        if (!latestDate) {
          setLoading(false);
          return;
        }

        // 1. Fetch the Reports (Metadata)
        const { data: reportsData, error: fetchError } = await supabase
          .from('content_gap_reports')
          .select('*')
          .eq('execution_date', latestDate)
          .order('priority_score', { ascending: false });

        if (fetchError) throw new Error(`Failed to fetch reports: ${fetchError.message}`);
        
        const rawReports = (reportsData || []) as ContentGapReport[];

        // 2. Normalize the date string for the JSON filter
        // The table might return a timestamp, but the metadata JSON likely has YYYY-MM-DD
        const dateString = new Date(latestDate).toISOString().split('T')[0];

        // 3. Fetch Raw Text from 'persona_response_embeddings'
        // Use arrow syntax ->> to check the execution_date field inside the metadata JSON
        let rawTexts: Array<{ content: string | null; metadata: Record<string, unknown> | null }> = [];
        
        const { data: rawData, error: rawError } = await supabase
            .from('persona_response_embeddings')
            .select('content, metadata')
            // This is the robust filter:
            .filter('metadata->>execution_date', 'eq', dateString);
        
        if (!rawError && rawData) {
            rawTexts = rawData as Array<{ content: string | null; metadata: Record<string, unknown> | null }>;
        } else {
            console.warn('Could not fetch raw texts from embeddings:', rawError);
        }

        // 4. Merge Data
        const parsedReports: ContentGapReport[] = rawReports.map(report => {
          // Find matching raw text by checking metadata.execution_id
          const rawMatch = rawTexts.find(r => {
            if (!r.metadata || typeof r.metadata !== 'object') return false;
            return String(r.metadata.query_id) === report.query_id;  // ← Unique per persona query
          });

          return {
            ...report,
            suggested_faqs: safeParseJSON(report.suggested_faqs),
            missing_features: safeParseJSON(report.missing_features),
            terminology_gaps: safeParseJSON(report.terminology_gaps),
            missing_use_cases: safeParseJSON(report.missing_use_cases),
            competitive_gaps: safeParseJSON(report.competitive_gaps),
            priority_actions: safeParseJSON(report.priority_actions),
            // Map the joined data
            prompt_text: rawMatch?.metadata?.prompt || null,
            ai_response: rawMatch?.content || null 
          } as ContentGapReport;
        });

        setReports(parsedReports);

        setStats({
          total_reports: parsedReports.length,
          high_priority: parsedReports.filter(r => r.priority_score >= 4).length,
          avg_similarity: parsedReports.length > 0 ? parsedReports.reduce((sum, r) => sum + (r.similarity_score * 100), 0) / parsedReports.length : 0,
          inecta_mentions: parsedReports.filter(r => r.inecta_mentioned).length
        });

      } catch (err) {
        console.error('Error fetching reports:', err);
        setError(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      if (activeTab === 'high' && report.priority_score < 4) return false;
      if (activeTab === 'medium' && report.priority_score !== 3) return false;
      if (activeTab === 'low' && report.priority_score > 2) return false;
      if (selectedPriority) {
        if (selectedPriority === 'high' && report.priority_score < 4) return false;
        if (selectedPriority === 'medium' && report.priority_score !== 3) return false;
        if (selectedPriority === 'low' && report.priority_score > 2) return false;
      }
      if (selectedPersona && report.persona_name !== selectedPersona) return false;
      if (selectedUrl && report.target_page_url !== selectedUrl) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const missingFeatures = (report.missing_features && typeof report.missing_features === 'object' && 'missing_keywords' in report.missing_features) ? Object.keys(report.missing_features.missing_keywords) : [];
        const terminologyGaps = (report.terminology_gaps && typeof report.terminology_gaps === 'object' && 'missing_keywords' in report.terminology_gaps) ? Object.keys(report.terminology_gaps.missing_keywords) : [];
        const useCases = (report.missing_use_cases && typeof report.missing_use_cases === 'object' && 'missing' in report.missing_use_cases && Array.isArray(report.missing_use_cases.missing)) ? report.missing_use_cases.missing : [];
        const faqs = Array.isArray(report.suggested_faqs) ? report.suggested_faqs : [];
        const searchableText = [
          report.page_title, report.persona_name, report.suggested_tldr,
          ...missingFeatures, ...terminologyGaps, ...useCases,
          ...(faqs.map(faq => `${faq.question} ${faq.answer}`))
        ].join(' ').toLowerCase();
        if (!searchableText.includes(searchLower)) return false;
      }
      return true;
    });
  }, [reports, activeTab, searchTerm, selectedPersona, selectedPriority, selectedUrl]);

  const getPriorityBadgeColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (priority === 3) return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    return 'bg-green-500/20 text-green-400 border-green-500/50';
  };

  const getFilteredFeatures = (report: ContentGapReport): Record<string, number> => {
    const missingFeatures = report.missing_features;
    if (!missingFeatures || typeof missingFeatures !== 'object') return {};
    const keywords = missingFeatures.missing_keywords;
    if (!keywords || typeof keywords !== 'object') return {};
    const filtered = filterKeywords(keywords);
    if (Object.keys(filtered).length === 0) {
      const sorted = Object.entries(keywords).filter(([keyword]) => keyword.length > 2).sort((a, b) => b[1] - a[1]).slice(0, 15);
      return Object.fromEntries(sorted);
    }
    return filtered;
  };
  const getFilteredTerminology = (report: ContentGapReport): Record<string, number> => {
    const terminologyGaps = report.terminology_gaps;
    if (!terminologyGaps || typeof terminologyGaps !== 'object') return {};
    const keywords = terminologyGaps.missing_keywords;
    if (!keywords || typeof keywords !== 'object') return {};
    const filtered = filterKeywords(keywords);
    if (Object.keys(filtered).length === 0) {
      const sorted = Object.entries(keywords).filter(([keyword]) => keyword.length > 2).sort((a, b) => b[1] - a[1]).slice(0, 15);
      return Object.fromEntries(sorted);
    }
    return filtered;
  };
  const getFilteredUseCases = (report: ContentGapReport): string[] => {
    const useCasesData = report.missing_use_cases;
    if (!useCasesData || typeof useCasesData !== 'object') return [];
    const useCases = useCasesData.missing;
    if (!useCases || !Array.isArray(useCases)) return [];
    return filterUseCases(useCases);
  };

  return (
    <div className="min-h-screen py-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-teal-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-text-primary via-accent-primary to-accent-success bg-clip-text text-transparent mb-2">GEO Similarities Report</h1>
          {latestExecutionDate && (
            <p className="text-lg text-text-secondary flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Week of {new Date(latestExecutionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Loading reports...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="glass-card p-8 text-center">
            <div className="text-red-400 text-lg font-semibold mb-2">⚠️ Error Loading Data</div>
            <p className="text-gray-300">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard title="Total Reports" value={stats.total_reports} format="number" icon={<FileText className="w-8 h-8" />} />
              <MetricCard title="High Priority" value={stats.high_priority} format="number" icon={<AlertCircle className="w-8 h-8" />} />
              <MetricCard title="Avg Similarity" value={stats.avg_similarity} format="percentage" icon={<BarChart3 className="w-8 h-8" />} />
              <MetricCard title="Inecta Mentions" value={`${stats.inecta_mentions}/${stats.total_reports}`} format="number" icon={<CheckCircle className="w-8 h-8" />} />
            </div>

            <div className="glass-card p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" placeholder="Search by page title, persona, keywords..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div className="relative">
                  <select value={selectedPersona} onChange={(e) => setSelectedPersona(e.target.value)} className="appearance-none pl-4 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[180px]">
                    <option value="">All Personas</option>
                    {personas.map(persona => <option key={persona} value={persona}>{persona}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className="appearance-none pl-4 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[150px]">
                    <option value="">All Priorities</option>
                    <option value="high">High (4-5)</option>
                    <option value="medium">Medium (3)</option>
                    <option value="low">Low (1-2)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={selectedUrl} onChange={(e) => setSelectedUrl(e.target.value)} className="appearance-none pl-4 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[200px]">
                    <option value="">All URLs</option>
                    {urls.map(url => <option key={url} value={url} title={url}>{url.length > 40 ? `${url.substring(0, 40)}...` : url}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button onClick={() => setActiveTab('all')} className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`}>All Reports ({reports.length})</button>
              <button onClick={() => setActiveTab('high')} className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'high' ? 'bg-red-500 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`}>🔴 High ({stats.high_priority})</button>
              <button onClick={() => setActiveTab('medium')} className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'medium' ? 'bg-orange-500 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`}>🟡 Medium ({reports.filter(r => r.priority_score === 3).length})</button>
              <button onClick={() => setActiveTab('low')} className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'low' ? 'bg-green-500 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`}>🟢 Low ({reports.filter(r => r.priority_score <= 2).length})</button>
            </div>

            {filteredReports.length === 0 ? (
              <div className="glass-card p-8 text-center"><p className="text-gray-400 text-lg">No reports found matching your filters.</p></div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredReports.map((report) => {
                  const faqs = Array.isArray(report.suggested_faqs) ? report.suggested_faqs : [];
                  const filteredFeatures = getFilteredFeatures(report);
                  const filteredTerminology = getFilteredTerminology(report);
                  const filteredUseCases = getFilteredUseCases(report);
                  const missingKeywordsCount = Object.keys(filteredFeatures).length;
                  const terminologyCount = Object.keys(filteredTerminology).length;
                  const useCasesCount = filteredUseCases.length;
                  const displayUrl = report.target_page_url ? (report.target_page_url.length > 50 ? `${report.target_page_url.substring(0, 50)}...` : report.target_page_url) : 'N/A';

                  return (
                    <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="glass-card p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-teal-400 flex-shrink-0" />
                            <h3 className="text-base font-semibold text-white line-clamp-1 truncate" title={report.page_title || 'Untitled Page'}>{report.page_title || 'Untitled Page'}</h3>
                          </div>
                          <div className="text-xs text-gray-400 truncate mb-2" title={report.target_page_url || 'N/A'}>{displayUrl}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-gray-400"><Users className="w-3 h-3" /><span>{report.persona_name}</span></div>
                            <span className="text-xs text-blue-400">{Math.round(report.similarity_score * 100)}% Similarity</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityBadgeColor(report.priority_score)}`}>{report.priority_score >= 4 ? 'High' : report.priority_score === 3 ? 'Medium' : 'Low'} ({report.priority_score})</span>
                          {report.inecta_mentioned ? (
                            <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/50"><CheckCircle className="w-3 h-3" /> Inecta</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/50"><X className="w-3 h-3" /> No Inecta</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3 text-xs">
                        {faqs.length > 0 && <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded border border-gray-600">{faqs.length} FAQs</span>}
                        {missingKeywordsCount > 0 && <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/50">{missingKeywordsCount} Missing Keywords</span>}
                        {terminologyCount > 0 && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/50">{terminologyCount} Terminology Gaps</span>}
                        {useCasesCount > 0 && <span className="px-2 py-1 bg-teal-500/20 text-teal-300 rounded border border-teal-500/50">{useCasesCount} Use Cases</span>}
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-gray-700">
                        <button onClick={() => { setSelectedReport(report); setIsDrawerOpen(true); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg transition-colors text-sm font-medium border border-teal-500/50">
                          <Eye className="w-4 h-4" /> View Analysis
                        </button>
                        {report.target_page_url && (
                          <a href={report.target_page_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors text-sm font-medium border border-gray-600">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            <AnalysisDrawer report={selectedReport} isOpen={isDrawerOpen} onClose={() => { setIsDrawerOpen(false); setSelectedReport(null); }} />
          </>
        )}
      </div>
    </div>
  );
}