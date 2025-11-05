'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { 
  FileText, 
  Search, 
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  X,
  Calendar,
  Users,
  Target,
  BarChart3
} from 'lucide-react';
import MetricCard from '@/app/components/MetricCard';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper to safely parse JSONB data that might be returned as strings from Supabase
function safeParseJSON<T>(data: T | string | null | undefined): T | null {
  if (!data) return null;
  
  // If it's already an object, return it
  if (typeof data === 'object' && data !== null) {
    return data as T;
  }
  
  // If it's a string, try to parse it
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
  // Technical/URL terms
  'https', 'http', 'www',
  
  // Generic/vague terms
  'source', 'overview', 'features', 'solutions',
  
  // Navigation terms
  'contact', 'about', 'home', 'page',
  
  // Common words that aren't meaningful
  'click', 'learn', 'more', 'read', 'multi',
  
  // Add competitor names if you want to filter them
  // 'aptean', 'sap', 'oracle'
];

function filterKeywords(keywords: Record<string, number> | undefined): Record<string, number> {
  if (!keywords || typeof keywords !== 'object') return {};
  
  const filtered: Record<string, number> = {};
  
  for (const [keyword, count] of Object.entries(keywords)) {
    const lowerKeyword = keyword.toLowerCase();
    
    // Skip filtered terms
    if (FILTERED_KEYWORDS.includes(lowerKeyword)) continue;
    
    // Skip very short words
    if (keyword.length <= 2) continue;
    
    // Skip numbers only
    if (/^\d+$/.test(keyword)) continue;
    
    // Show keywords that appear at least once (relaxed from 2 to show more results)
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
    .slice(0, 10); // Limit to top 10
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
  suggested_faqs: Array<{
    question: string;
    answer: string;
  }> | string | null;
  suggested_tldr: string | null;
  missing_features: {
    missing_keywords: Record<string, number>;
    similarity_score: number;
  } | string | null;
  terminology_gaps: {
    missing_keywords: Record<string, number>;
    similarity_score: number;
  } | string | null;
  missing_use_cases: {
    missing: string[];
  } | string | null;
  competitive_gaps: Record<string, number> | string | null;
  priority_actions: {
    priority: number;
    actions: string[];
  } | string | null;
  inecta_mentioned: boolean;
  inecta_mention_count: number;
  created_at: string;
}

interface ReportStats {
  total_reports: number;
  high_priority: number;
  avg_similarity: number;
  inecta_mentions: number;
}

export default function GeoSimilaritiesPage() {
  const [reports, setReports] = useState<ContentGapReport[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    total_reports: 0,
    high_priority: 0,
    avg_similarity: 0,
    inecta_mentions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [latestExecutionDate, setLatestExecutionDate] = useState<string>('');

  // Get unique personas from reports
  const personas = useMemo(() => {
    const uniquePersonas = Array.from(new Set(reports.map(r => r.persona_name).filter(Boolean)));
    return uniquePersonas.sort();
  }, [reports]);

  // Fetch reports from Supabase
  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError(null);

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase environment variables are not configured');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get latest execution date
        const { data: latestDateData, error: dateError } = await supabase
          .from('content_gap_reports')
          .select('execution_date')
          .order('execution_date', { ascending: false })
          .limit(1);

        if (dateError) {
          console.error('Error fetching latest execution date:', dateError);
          // If table doesn't exist, show a helpful message
          if (dateError.code === '42P01' || dateError.message.includes('does not exist')) {
            throw new Error('The content_gap_reports table does not exist in the database. Please ensure the table is created first.');
          }
        }

        const latestDate = latestDateData && latestDateData.length > 0 
          ? latestDateData[0].execution_date 
          : null;
        setLatestExecutionDate(latestDate || '');

        if (!latestDate) {
          setReports([]);
          setStats({
            total_reports: 0,
            high_priority: 0,
            avg_similarity: 0,
            inecta_mentions: 0
          });
          setLoading(false);
          return;
        }

        // Fetch reports for latest execution date
        const { data, error: fetchError } = await supabase
          .from('content_gap_reports')
          .select(`
            id,
            query_id,
            persona_id,
            persona_name,
            target_page_url,
            page_title,
            priority_score,
            similarity_score,
            execution_date,
            execution_id,
            suggested_faqs,
            suggested_tldr,
            missing_features,
            terminology_gaps,
            missing_use_cases,
            competitive_gaps,
            priority_actions,
            inecta_mentioned,
            inecta_mention_count,
            created_at
          `)
          .eq('execution_date', latestDate)
          .order('priority_score', { ascending: false })
          .order('similarity_score', { ascending: true });

        if (fetchError) {
          throw new Error(`Failed to fetch reports: ${fetchError.message}`);
        }

        const reportsData = (data || []) as ContentGapReport[];
        
        // Parse JSONB fields that might be strings
        const parsedReports = reportsData.map(report => ({
          ...report,
          suggested_faqs: safeParseJSON(report.suggested_faqs),
          missing_features: safeParseJSON(report.missing_features),
          terminology_gaps: safeParseJSON(report.terminology_gaps),
          missing_use_cases: safeParseJSON(report.missing_use_cases),
          competitive_gaps: safeParseJSON(report.competitive_gaps),
          priority_actions: safeParseJSON(report.priority_actions),
        }));
        
        // Debug: Log first report to see data structure AFTER parsing
        if (parsedReports.length > 0) {
          const firstReport = parsedReports[0];
          console.log('Sample report data (after parsing):', {
            id: firstReport.id,
            has_missing_features: !!firstReport.missing_features,
            has_terminology_gaps: !!firstReport.terminology_gaps,
            has_missing_use_cases: !!firstReport.missing_use_cases,
            missing_features_type: typeof firstReport.missing_features,
            missing_features_keys: firstReport.missing_features?.missing_keywords ? Object.keys(firstReport.missing_features.missing_keywords).length : 0,
            terminology_keys: firstReport.terminology_gaps?.missing_keywords ? Object.keys(firstReport.terminology_gaps.missing_keywords).length : 0,
            use_cases_count: firstReport.missing_use_cases?.missing ? firstReport.missing_use_cases.missing.length : 0,
            // Log actual data for debugging
            missing_features_sample: firstReport.missing_features?.missing_keywords ? Object.keys(firstReport.missing_features.missing_keywords).slice(0, 3) : [],
            terminology_sample: firstReport.terminology_gaps?.missing_keywords ? Object.keys(firstReport.terminology_gaps.missing_keywords).slice(0, 3) : [],
            use_cases_sample: firstReport.missing_use_cases?.missing ? firstReport.missing_use_cases.missing.slice(0, 3) : []
          });
        }
        
        setReports(parsedReports);

        // Calculate stats
        const totalReports = parsedReports.length;
        const highPriority = parsedReports.filter(r => r.priority_score >= 4).length;
        const avgSimilarity = parsedReports.length > 0
          ? parsedReports.reduce((sum, r) => sum + (r.similarity_score * 100), 0) / parsedReports.length
          : 0;
        const inectaMentions = parsedReports.filter(r => r.inecta_mentioned).length;

        setStats({
          total_reports: totalReports,
          high_priority: highPriority,
          avg_similarity: avgSimilarity,
          inecta_mentions: inectaMentions
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

  // Filter reports based on active filters
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Tab filter
      if (activeTab === 'high' && report.priority_score < 4) return false;
      if (activeTab === 'medium' && report.priority_score !== 3) return false;
      if (activeTab === 'low' && report.priority_score > 2) return false;

      // Priority dropdown filter
      if (selectedPriority) {
        if (selectedPriority === 'high' && report.priority_score < 4) return false;
        if (selectedPriority === 'medium' && report.priority_score !== 3) return false;
        if (selectedPriority === 'low' && report.priority_score > 2) return false;
      }

      // Persona filter
      if (selectedPersona && report.persona_name !== selectedPersona) return false;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        
        // Safely extract keywords from missing_features
        const missingFeatures = (report.missing_features && typeof report.missing_features === 'object' && 'missing_keywords' in report.missing_features)
          ? Object.keys(report.missing_features.missing_keywords) 
          : [];
        
        // Safely extract keywords from terminology_gaps
        const terminologyGaps = (report.terminology_gaps && typeof report.terminology_gaps === 'object' && 'missing_keywords' in report.terminology_gaps)
          ? Object.keys(report.terminology_gaps.missing_keywords) 
          : [];
        
        // Safely extract use cases
        const useCases = (report.missing_use_cases && typeof report.missing_use_cases === 'object' && 'missing' in report.missing_use_cases && Array.isArray(report.missing_use_cases.missing))
          ? report.missing_use_cases.missing
          : [];
        
        const faqs = Array.isArray(report.suggested_faqs) ? report.suggested_faqs : [];
        
        const searchableText = [
          report.page_title,
          report.persona_name,
          report.suggested_tldr,
          ...missingFeatures,
          ...terminologyGaps,
          ...useCases,
          ...(faqs.map(faq => `${faq.question} ${faq.answer}`))
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchLower)) return false;
      }

      return true;
    });
  }, [reports, activeTab, searchTerm, selectedPersona, selectedPriority]);

  const toggleCardExpansion = (reportId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPriorityBadgeColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (priority === 3) return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    return 'bg-green-500/20 text-green-400 border-green-500/50';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return 'High';
    if (priority === 3) return 'Medium';
    return 'Low';
  };

  const getMissingKeywords = (report: ContentGapReport): string[] => {
    const missingFeatures = report.missing_features;
    if (!missingFeatures) return [];
    
    // Handle different possible structures
    if (typeof missingFeatures === 'object' && 'missing_keywords' in missingFeatures) {
      const missingKeywords = missingFeatures.missing_keywords;
      if (typeof missingKeywords === 'object' && missingKeywords !== null) {
        return Object.keys(missingKeywords).slice(0, 10);
      }
    }
    
    // If missing_features is directly an object with keywords
    if (typeof missingFeatures === 'object' && missingFeatures !== null) {
      const keys = Object.keys(missingFeatures).filter(k => k !== 'similarity_score');
      if (keys.length > 0) {
        return keys.slice(0, 10);
      }
    }
    
    return [];
  };

  const getFilteredFeatures = (report: ContentGapReport): Record<string, number> => {
    const missingFeatures = report.missing_features;
    if (!missingFeatures || typeof missingFeatures !== 'object') return {};
    
    // Get the missing_keywords object
    const keywords = missingFeatures.missing_keywords;
    if (!keywords || typeof keywords !== 'object') return {};
    
    // Filter the keywords
    const filtered = filterKeywords(keywords);
    
    // If filtering removed everything, show at least some keywords (unfiltered, top 15)
    if (Object.keys(filtered).length === 0) {
      const sorted = Object.entries(keywords)
        .filter(([keyword]) => keyword.length > 2) // Still filter very short words
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
      return Object.fromEntries(sorted);
    }
    
    return filtered;
  };

  const getFilteredTerminology = (report: ContentGapReport): Record<string, number> => {
    const terminologyGaps = report.terminology_gaps;
    if (!terminologyGaps || typeof terminologyGaps !== 'object') return {};
    
    // Get the missing_keywords object
    const keywords = terminologyGaps.missing_keywords;
    if (!keywords || typeof keywords !== 'object') return {};
    
    // Filter the keywords
    const filtered = filterKeywords(keywords);
    
    // If filtering removed everything, show at least some keywords (unfiltered, top 15)
    if (Object.keys(filtered).length === 0) {
      const sorted = Object.entries(keywords)
        .filter(([keyword]) => keyword.length > 2) // Still filter very short words
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

  return (
    <div className="min-h-screen py-6 relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-teal-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-text-primary via-accent-primary to-accent-success bg-clip-text text-transparent mb-2">
            GEO Similarities Report
          </h1>
          {latestExecutionDate && (
            <p className="text-lg text-text-secondary flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Week of {formatDate(latestExecutionDate)}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Loading reports...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card p-8 text-center">
            <div className="text-red-400 text-lg font-semibold mb-2">
              ⚠️ Error Loading Data
            </div>
            <p className="text-gray-300">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Reports"
                value={stats.total_reports}
                format="number"
                icon={<FileText className="w-8 h-8" />}
              />
              <MetricCard
                title="High Priority"
                value={stats.high_priority}
                format="number"
                icon={<AlertCircle className="w-8 h-8" />}
              />
              <MetricCard
                title="Avg Similarity"
                value={stats.avg_similarity}
                format="percentage"
                icon={<BarChart3 className="w-8 h-8" />}
              />
              <MetricCard
                title="Inecta Mentions"
                value={`${stats.inecta_mentions}/${stats.total_reports}`}
                format="number"
                icon={<CheckCircle className="w-8 h-8" />}
              />
            </div>

            {/* Filters Bar */}
            <div className="glass-card p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by page title, persona, keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Persona Filter */}
                <div className="relative">
                  <select
                    value={selectedPersona}
                    onChange={(e) => setSelectedPersona(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[180px]"
                  >
                    <option value="">All Personas</option>
                    {personas.map(persona => (
                      <option key={persona} value={persona}>{persona}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>

                {/* Priority Filter */}
                <div className="relative">
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[150px]"
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High (4-5)</option>
                    <option value="medium">Medium (3)</option>
                    <option value="low">Low (1-2)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Priority Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                All Reports ({reports.length})
              </button>
              <button
                onClick={() => setActiveTab('high')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'high'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                🔴 High ({stats.high_priority})
              </button>
              <button
                onClick={() => setActiveTab('medium')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'medium'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                🟡 Medium ({reports.filter(r => r.priority_score === 3).length})
              </button>
              <button
                onClick={() => setActiveTab('low')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'low'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                🟢 Low ({reports.filter(r => r.priority_score <= 2).length})
              </button>
            </div>

            {/* Reports Grid */}
            {filteredReports.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-gray-400 text-lg">No reports found matching your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredReports.map((report) => {
                  const isExpanded = expandedCards.has(report.id);
                  const missingKeywords = getMissingKeywords(report);
                  const faqs = Array.isArray(report.suggested_faqs) ? report.suggested_faqs : [];

                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="glass-card p-6"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-teal-400" />
                            <h3 className="text-lg font-semibold text-white line-clamp-2">
                              {report.page_title || 'Untitled Page'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1 text-sm text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>{report.persona_name}</span>
                            </div>
                            <span className="text-sm text-blue-400">
                              {Math.round(report.similarity_score * 100)}% Similarity
                            </span>
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
                        <span className={`px-3 py-1 rounded text-xs font-semibold border ${getPriorityBadgeColor(report.priority_score)}`}>
                          {getPriorityLabel(report.priority_score)} ({report.priority_score})
                        </span>
                      </div>

                      {/* TL;DR Section */}
                      {report.suggested_tldr && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Suggested TL;DR:
                          </h4>
                          <p className="text-sm text-gray-400 leading-relaxed">
                            {report.suggested_tldr}
                          </p>
                        </div>
                      )}

                      {/* Missing Keywords */}
                      {missingKeywords.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">
                            🔑 Missing Keywords:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {missingKeywords.map((keyword, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded border border-gray-600"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FAQs Section */}
                      {faqs.length > 0 && (
                        <div className="mb-4">
                          <button
                            onClick={() => toggleCardExpansion(report.id)}
                            className="flex items-center justify-between w-full text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                          >
                            <span>❓ Suggested FAQs ({faqs.length})</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
                              {faqs.map((faq, idx) => (
                                <div key={idx} className="p-3 bg-gray-800/50 rounded border border-gray-700">
                                  <p className="text-sm font-medium text-white mb-1">
                                    Q: {faq.question}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    A: {faq.answer}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Missing Features Section */}
                      {(() => {
                        const filteredFeatures = getFilteredFeatures(report);
                        const featuresCount = Object.keys(filteredFeatures).length;
                        
                        if (featuresCount === 0) return null;
                        
                        return (
                          <div className="mb-4">
                            <button
                              onClick={() => toggleCardExpansion(`${report.id}-features`)}
                              className="flex items-center justify-between w-full text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                            >
                              <span>🔧 Missing Features ({featuresCount})</span>
                              {expandedCards.has(`${report.id}-features`) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            {expandedCards.has(`${report.id}-features`) && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-400 mb-2">
                                  Key features mentioned in AI responses but missing from this page:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(filteredFeatures)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 15)
                                    .map(([keyword, count]) => (
                                      <span
                                        key={keyword}
                                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/50 flex items-center gap-1"
                                      >
                                        <strong>{keyword}</strong>
                                        <span className="text-blue-400/70">×{count}</span>
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Terminology Gaps Section */}
                      {(() => {
                        const filteredTerminology = getFilteredTerminology(report);
                        const terminologyCount = Object.keys(filteredTerminology).length;
                        
                        if (terminologyCount === 0) return null;
                        
                        return (
                          <div className="mb-4">
                            <button
                              onClick={() => toggleCardExpansion(`${report.id}-terminology`)}
                              className="flex items-center justify-between w-full text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                            >
                              <span>📚 Terminology Gaps ({terminologyCount})</span>
                              {expandedCards.has(`${report.id}-terminology`) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            {expandedCards.has(`${report.id}-terminology`) && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-400 mb-2">
                                  Industry terms used by AI but not present on your page:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(filteredTerminology)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 15)
                                    .map(([keyword, count]) => (
                                      <span
                                        key={keyword}
                                        className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded border border-yellow-500/50 flex items-center gap-1"
                                      >
                                        <strong>{keyword}</strong>
                                        <span className="text-yellow-400/70">×{count}</span>
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Missing Use Cases Section */}
                      {(() => {
                        const filteredUseCasesData = getFilteredUseCases(report);
                        
                        if (filteredUseCasesData.length === 0) return null;
                        
                        return (
                          <div className="mb-4">
                            <button
                              onClick={() => toggleCardExpansion(`${report.id}-usecases`)}
                              className="flex items-center justify-between w-full text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                            >
                              <span>💼 Missing Use Cases ({filteredUseCasesData.length})</span>
                              {expandedCards.has(`${report.id}-usecases`) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            {expandedCards.has(`${report.id}-usecases`) && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-400 mb-2">
                                  Important use cases/themes to address on this page:
                                </p>
                                <div className="space-y-2">
                                  {filteredUseCasesData.map((useCase, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-start gap-2 p-2 bg-gray-800/50 rounded border border-gray-700"
                                    >
                                      <span className="text-teal-400 font-bold text-sm">•</span>
                                      <span className="text-sm text-gray-300 capitalize">{useCase}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                        {report.target_page_url && (
                          <a
                            href={report.target_page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg transition-colors text-sm font-medium border border-teal-500/50"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Page
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}