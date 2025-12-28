'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  MessageSquare,
  Users,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Brain,
  FileText,
  Lightbulb,
} from 'lucide-react';
import MetricCard from '@/app/components/MetricCard';
import * as XLSX from 'xlsx';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Types
interface Conversation {
  conversation_id: string;
  started_at: string;
  city: string | null;
  country: string | null;
  status: string;
  lead_captured: boolean;
  visitor_email: string | null;
  visitor_name: string | null;
  meeting_booked: boolean;
  engagement_score: number | null;
  resolution_score: number | null;
  sentiment_score: number | null;
  lead_quality_score: number | null;
  visitor_intent: string | null;
  industry_segment: string | null;
  buyer_stage: string | null;
  questions_asked: string[] | null;
  topics_discussed: string[] | null;
  content_gaps: string[] | null;
  improvement_suggestions: string | null;
  analyzed_at: string | null;
  analysis_status: 'pending' | 'analyzed';
  lead_classification: string | null;
}

interface TimelineData {
  date: string;
  conversations: number;
  leads: number;
  avg_engagement: number;
  avg_resolution: number;
  lead_capture_rate: number;
}

interface IntentSummary {
  visitor_intent: string;
  count: number;
  avg_engagement: number;
  avg_lead_quality: number;
  leads_captured: number;
}

interface IndustrySummary {
  industry_segment: string;
  count: number;
  avg_engagement: number;
  avg_lead_quality: number;
}

interface ContentGap {
  gap: string;
  frequency: number;
}

interface Question {
  question: string;
  frequency: number;
}

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

// Main Component
export default function ChatbotAnalyticsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [intentSummary, setIntentSummary] = useState<IntentSummary[]>([]);
  const [industrySummary, setIndustrySummary] = useState<IndustrySummary[]>([]);
  const [contentGaps, setContentGaps] = useState<ContentGap[]>([]);
  const [topQuestions, setTopQuestions] = useState<Question[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [buyerStageFilter, setBuyerStageFilter] = useState<string>('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');

  // Stats
  const [stats, setStats] = useState({
    totalConversations: 0,
    leadsCaptured: 0,
    leadCaptureRate: 0,
    avgEngagementScore: 0,
    avgResolutionScore: 0,
    highPotentialLeads: 0,
    conversationsAnalyzed: 0,
    pendingAnalysis: 0
  });

  // Supabase client - use Inecta Intelligence database for Aimdoc data
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_INTEL_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_INTEL_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase Intelligence environment variables not configured');
    }
    return createClient(url, key);
  }, []);

  // Fetch summary stats
  const fetchStats = useCallback(async () => {
    try {
      const { data, error: statsError } = await supabase
        .from('aimdoc_full_analysis')
        .select('*');

      if (statsError) throw statsError;

      const total = data?.length || 0;
      const leads = data?.filter(c => c.lead_captured).length || 0;
      const leadRate = total > 0 ? (leads / total) * 100 : 0;
      const avgEngagement = data?.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / (data?.length || 1) || 0;
      const avgResolution = data?.reduce((sum, c) => sum + (c.resolution_score || 0), 0) / (data?.length || 1) || 0;
      const highPotential = data?.filter(c => 
        c.lead_classification === 'high_potential' || c.lead_classification === 'high_value_lead'
      ).length || 0;
      const analyzed = data?.filter(c => c.analysis_status === 'analyzed').length || 0;
      const pending = data?.filter(c => c.analysis_status === 'pending').length || 0;

      setStats({
        totalConversations: total,
        leadsCaptured: leads,
        leadCaptureRate: leadRate,
        avgEngagementScore: avgEngagement,
        avgResolutionScore: avgResolution,
        highPotentialLeads: highPotential,
        conversationsAnalyzed: analyzed,
        pendingAnalysis: pending
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [supabase]);

  // Fetch timeline data
  const fetchTimeline = useCallback(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error: timelineError } = await supabase
        .from('aimdoc_full_analysis')
        .select('started_at, lead_captured, engagement_score, resolution_score')
        .gte('started_at', thirtyDaysAgo.toISOString());

      if (timelineError) throw timelineError;

      // Group by date
      const dateMap = new Map<string, { conversations: number; leads: number; engagement: number[]; resolution: number[] }>();

      data?.forEach(item => {
        const date = new Date(item.started_at).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, { conversations: 0, leads: 0, engagement: [], resolution: [] });
        }
        const dayData = dateMap.get(date)!;
        dayData.conversations++;
        if (item.lead_captured) dayData.leads++;
        if (item.engagement_score) dayData.engagement.push(item.engagement_score);
        if (item.resolution_score) dayData.resolution.push(item.resolution_score);
      });

      const timeline: TimelineData[] = Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          conversations: data.conversations,
          leads: data.leads,
          avg_engagement: data.engagement.length > 0 
            ? data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length 
            : 0,
          avg_resolution: data.resolution.length > 0
            ? data.resolution.reduce((a, b) => a + b, 0) / data.resolution.length
            : 0,
          lead_capture_rate: data.conversations > 0 ? (data.leads / data.conversations) * 100 : 0
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setTimelineData(timeline);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    }
  }, [supabase]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const { data, error: convError } = await supabase
        .from('aimdoc_full_analysis')
        .select('*')
        .order('started_at', { ascending: false });

      if (convError) throw convError;

      setConversations(data || []);
      setFilteredConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    }
  }, [supabase]);

  // Fetch intent summary
  const fetchIntentSummary = useCallback(async () => {
    try {
      const { data, error: intentError } = await supabase
        .from('aimdoc_full_analysis')
        .select('visitor_intent, engagement_score, lead_quality_score, lead_captured');

      if (intentError) throw intentError;

      const intentMap = new Map<string, { count: number; engagement: number[]; quality: number[]; leads: number }>();

      data?.forEach(item => {
        if (!item.visitor_intent) return;
        if (!intentMap.has(item.visitor_intent)) {
          intentMap.set(item.visitor_intent, { count: 0, engagement: [], quality: [], leads: 0 });
        }
        const intentData = intentMap.get(item.visitor_intent)!;
        intentData.count++;
        if (item.engagement_score) intentData.engagement.push(item.engagement_score);
        if (item.lead_quality_score) intentData.quality.push(item.lead_quality_score);
        if (item.lead_captured) intentData.leads++;
      });

      const summary: IntentSummary[] = Array.from(intentMap.entries())
        .map(([intent, data]) => ({
          visitor_intent: intent,
          count: data.count,
          avg_engagement: data.engagement.length > 0 
            ? data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length 
            : 0,
          avg_lead_quality: data.quality.length > 0
            ? data.quality.reduce((a, b) => a + b, 0) / data.quality.length
            : 0,
          leads_captured: data.leads
        }))
        .sort((a, b) => b.count - a.count);

      setIntentSummary(summary);
    } catch (err) {
      console.error('Error fetching intent summary:', err);
    }
  }, [supabase]);

  // Fetch industry summary
  const fetchIndustrySummary = useCallback(async () => {
    try {
      const { data, error: industryError } = await supabase
        .from('aimdoc_full_analysis')
        .select('industry_segment, engagement_score, lead_quality_score');

      if (industryError) throw industryError;

      const industryMap = new Map<string, { count: number; engagement: number[]; quality: number[] }>();

      data?.forEach(item => {
        if (!item.industry_segment) return;
        if (!industryMap.has(item.industry_segment)) {
          industryMap.set(item.industry_segment, { count: 0, engagement: [], quality: [] });
        }
        const industryData = industryMap.get(item.industry_segment)!;
        industryData.count++;
        if (item.engagement_score) industryData.engagement.push(item.engagement_score);
        if (item.lead_quality_score) industryData.quality.push(item.lead_quality_score);
      });

      const summary: IndustrySummary[] = Array.from(industryMap.entries())
        .map(([industry, data]) => ({
          industry_segment: industry,
          count: data.count,
          avg_engagement: data.engagement.length > 0
            ? data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length
            : 0,
          avg_lead_quality: data.quality.length > 0
            ? data.quality.reduce((a, b) => a + b, 0) / data.quality.length
            : 0
        }))
        .sort((a, b) => b.count - a.count);

      setIndustrySummary(summary);
    } catch (err) {
      console.error('Error fetching industry summary:', err);
    }
  }, [supabase]);

  // Fetch content gaps
  const fetchContentGaps = useCallback(async () => {
    try {
      const { data, error: gapsError } = await supabase
        .from('aimdoc_full_analysis')
        .select('content_gaps')
        .not('content_gaps', 'is', null);

      if (gapsError) throw gapsError;

      const gapMap = new Map<string, number>();

      data?.forEach(item => {
        if (item.content_gaps && Array.isArray(item.content_gaps)) {
          item.content_gaps.forEach((gap: string) => {
            gapMap.set(gap, (gapMap.get(gap) || 0) + 1);
          });
        }
      });

      const gaps: ContentGap[] = Array.from(gapMap.entries())
        .map(([gap, frequency]) => ({ gap, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      setContentGaps(gaps);
    } catch (err) {
      console.error('Error fetching content gaps:', err);
    }
  }, [supabase]);

  // Fetch top questions
  const fetchTopQuestions = useCallback(async () => {
    try {
      const { data, error: questionsError } = await supabase
        .from('aimdoc_full_analysis')
        .select('questions_asked')
        .not('questions_asked', 'is', null);

      if (questionsError) throw questionsError;

      const questionMap = new Map<string, number>();

      data?.forEach(item => {
        if (item.questions_asked && Array.isArray(item.questions_asked)) {
          item.questions_asked.forEach((question: string) => {
            questionMap.set(question, (questionMap.get(question) || 0) + 1);
          });
        }
      });

      const questions: Question[] = Array.from(questionMap.entries())
        .map(([question, frequency]) => ({ question, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      setTopQuestions(questions);
    } catch (err) {
      console.error('Error fetching top questions:', err);
    }
  }, [supabase]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (messages[conversationId]) return;

    try {
      const { data, error: msgError } = await supabase
        .from('aimdoc_messages')
        .select('role, content, timestamp')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })
        .limit(3);

      if (msgError) throw msgError;

      setMessages(prev => ({
        ...prev,
        [conversationId]: (data || []).map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        }))
      }));
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [supabase, messages]);

  // Apply filters
  useEffect(() => {
    let filtered = [...conversations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.visitor_email?.toLowerCase().includes(query) ||
        c.city?.toLowerCase().includes(query) ||
        c.questions_asked?.some(q => q.toLowerCase().includes(query)) ||
        c.topics_discussed?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Intent filter
    if (intentFilter !== 'all') {
      filtered = filtered.filter(c => c.visitor_intent === intentFilter);
    }

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(c => c.industry_segment === industryFilter);
    }

    // Buyer stage filter
    if (buyerStageFilter !== 'all') {
      filtered = filtered.filter(c => c.buyer_stage === buyerStageFilter);
    }

    // Lead status filter
    if (leadStatusFilter !== 'all') {
      if (leadStatusFilter === 'converted') {
        filtered = filtered.filter(c => c.lead_captured);
      } else if (leadStatusFilter === 'high_potential') {
        filtered = filtered.filter(c => 
          c.lead_classification === 'high_potential' || c.lead_classification === 'high_value_lead'
        );
      } else if (leadStatusFilter === 'low_potential') {
        filtered = filtered.filter(c => 
          c.lead_classification !== 'high_potential' && 
          c.lead_classification !== 'high_value_lead' &&
          !c.lead_captured
        );
      }
    }

    setFilteredConversations(filtered);
    setCurrentPage(1);
  }, [conversations, searchQuery, intentFilter, industryFilter, buyerStageFilter, leadStatusFilter]);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchStats(),
          fetchTimeline(),
          fetchConversations(),
          fetchIntentSummary(),
          fetchIndustrySummary(),
          fetchContentGaps(),
          fetchTopQuestions()
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchStats, fetchTimeline, fetchConversations, fetchIntentSummary, fetchIndustrySummary, fetchContentGaps, fetchTopQuestions]);

  // Toggle row expansion
  const toggleRow = (conversationId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(conversationId)) {
        next.delete(conversationId);
      } else {
        next.add(conversationId);
        fetchMessages(conversationId);
      }
      return next;
    });
  };

  // Export to CSV
  const handleExport = () => {
    const exportData = filteredConversations.map(c => ({
      'Date': new Date(c.started_at).toLocaleDateString(),
      'Time': new Date(c.started_at).toLocaleTimeString(),
      'City': c.city || '',
      'Country': c.country || '',
      'Visitor Email': c.visitor_email || '',
      'Visitor Name': c.visitor_name || '',
      'Intent': c.visitor_intent || '',
      'Industry': c.industry_segment || '',
      'Buyer Stage': c.buyer_stage || '',
      'Lead Captured': c.lead_captured ? 'Yes' : 'No',
      'Lead Classification': c.lead_classification || '',
      'Engagement Score': c.engagement_score || '',
      'Resolution Score': c.resolution_score || '',
      'Sentiment Score': c.sentiment_score || '',
      'Lead Quality Score': c.lead_quality_score || '',
      'Meeting Booked': c.meeting_booked ? 'Yes' : 'No',
      'Analysis Status': c.analysis_status || ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chatbot Analytics');
    XLSX.writeFile(workbook, `chatbot-analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Pagination
  const paginatedConversations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredConversations.slice(start, start + itemsPerPage);
  }, [filteredConversations, currentPage]);

  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);

  // Get unique filter values
  const uniqueIntents = useMemo(() => {
    return Array.from(new Set(conversations.map(c => c.visitor_intent).filter(Boolean))) as string[];
  }, [conversations]);

  const uniqueIndustries = useMemo(() => {
    return Array.from(new Set(conversations.map(c => c.industry_segment).filter(Boolean))) as string[];
  }, [conversations]);

  const uniqueBuyerStages = useMemo(() => {
    return Array.from(new Set(conversations.map(c => c.buyer_stage).filter(Boolean))) as string[];
  }, [conversations]);

  // Color mappings
  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      'feature_question': '#3B82F6',
      'pricing_inquiry': '#10B981',
      'demo_request': '#8B5CF6',
      'support': '#F59E0B',
      'job_seeker': '#6B7280',
      'general_info': '#22D3EE',
      'no_interaction': '#9CA3AF'
    };
    return colors[intent] || '#6366F1';
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return '#6B7280';
    if (score >= 8) return '#10B981';
    if (score >= 6) return '#F59E0B';
    return '#EF4444';
  };

  const getCountryFlag = (country: string | null) => {
    if (!country) return '🌍';
    // Simple mapping - in production, use a proper library
    const flags: Record<string, string> = {
      'United States': '🇺🇸',
      'Canada': '🇨🇦',
      'United Kingdom': '🇬🇧',
      'Australia': '🇦🇺',
      'Germany': '🇩🇪',
      'France': '🇫🇷'
    };
    return flags[country] || '🌍';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-700/30 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent mb-2">
                Aimdoc Chatbot Analytics
              </h1>
              <p className="text-gray-400">
                {conversations.length > 0 && (
                  <>
                    Data from {new Date(Math.min(...conversations.map(c => new Date(c.started_at).getTime()))).toLocaleDateString()} to{' '}
                    {new Date(Math.max(...conversations.map(c => new Date(c.started_at).getTime()))).toLocaleDateString()}
                  </>
                )}
              </p>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Conversations"
            value={stats.totalConversations}
            icon={<MessageSquare className="w-6 h-6" />}
          />
          <MetricCard
            title="Leads Captured"
            value={stats.leadsCaptured}
            icon={<Users className="w-6 h-6" />}
          />
          <MetricCard
            title="Lead Capture Rate"
            value={stats.leadCaptureRate}
            format="percentage"
            icon={<Target className="w-6 h-6" />}
          />
          <MetricCard
            title="Avg Engagement Score"
            value={stats.avgEngagementScore.toFixed(1)}
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <MetricCard
            title="Avg Resolution Score"
            value={stats.avgResolutionScore.toFixed(1)}
            icon={<CheckCircle2 className="w-6 h-6" />}
          />
          <MetricCard
            title="High Potential Leads"
            value={stats.highPotentialLeads}
            icon={<Brain className="w-6 h-6" />}
          />
          <MetricCard
            title="Conversations Analyzed"
            value={stats.conversationsAnalyzed}
            icon={<FileText className="w-6 h-6" />}
          />
          <MetricCard
            title="Pending Analysis"
            value={stats.pendingAnalysis}
            icon={<Clock className="w-6 h-6" />}
          />
        </div>

        {/* Performance Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Performance Timeline (Last 30 Days)</h2>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="left" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="conversations" fill="#3B82F6" name="Conversations" />
                <Line yAxisId="right" type="monotone" dataKey="avg_engagement" stroke="#10B981" strokeWidth={2} name="Avg Engagement" />
                <Line yAxisId="right" type="monotone" dataKey="lead_capture_rate" stroke="#8B5CF6" strokeWidth={2} name="Lead Capture Rate %" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No timeline data available</div>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email, city, content..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Intent</label>
              <select
                value={intentFilter}
                onChange={(e) => setIntentFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Intents</option>
                {uniqueIntents.map(intent => (
                  <option key={intent} value={intent}>{intent.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Industries</option>
                {uniqueIndustries.map(industry => (
                  <option key={industry} value={industry}>{industry.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Buyer Stage</label>
              <select
                value={buyerStageFilter}
                onChange={(e) => setBuyerStageFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Stages</option>
                {uniqueBuyerStages.map(stage => (
                  <option key={stage} value={stage}>{stage.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Lead Status</label>
              <select
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All</option>
                <option value="converted">Converted</option>
                <option value="high_potential">High Potential</option>
                <option value="low_potential">Low Potential</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Insights Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Intent Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Visitor Intent Breakdown</h3>
            {intentSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={intentSummary.map(item => ({ ...item, name: item.visitor_intent, value: item.count }))}
                    dataKey="count"
                    nameKey="visitor_intent"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(props: { name?: string; value?: number; visitor_intent?: string; count?: number }) => {
                      const name = props.name || props.visitor_intent || '';
                      const value = props.value || props.count || 0;
                      return `${String(name).replace(/_/g, ' ')}: ${value}`;
                    }}
                  >
                    {intentSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getIntentColor(entry.visitor_intent)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No intent data</div>
            )}
          </motion.div>

          {/* Industry Segments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Industry Segments</h3>
            {industrySummary.length > 0 ? (
              <div className="space-y-3">
                {industrySummary.slice(0, 5).map((industry, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{industry.industry_segment.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{industry.count}</span>
                      <span className="text-xs text-gray-400">(Q: {industry.avg_lead_quality.toFixed(1)})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No industry data</div>
            )}
          </motion.div>

          {/* Buyer Stage Funnel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Buyer Stage Funnel</h3>
            {uniqueBuyerStages.length > 0 ? (
              <div className="space-y-4">
                {['awareness', 'consideration', 'decision'].map(stage => {
                  const count = conversations.filter(c => c.buyer_stage === stage).length;
                  const percentage = conversations.length > 0 ? (count / conversations.length) * 100 : 0;
                  return (
                    <div key={stage}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300 text-sm capitalize">{stage}</span>
                        <span className="text-white font-medium">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-teal-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No buyer stage data</div>
            )}
          </motion.div>
        </div>

        {/* Content Gaps & Questions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Content Gaps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Top Content Gaps</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {contentGaps.length > 0 ? (
                contentGaps.map((gap, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <span className="text-gray-300 text-sm flex-1">{gap.gap}</span>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                      {gap.frequency}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-8">No content gaps identified</div>
              )}
            </div>
          </motion.div>

          {/* Top Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Top Questions Asked</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {topQuestions.length > 0 ? (
                topQuestions.map((question, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-teal-500/10 rounded-lg border border-teal-500/20">
                    <span className="text-gray-300 text-sm flex-1">{question.question}</span>
                    <span className="px-2 py-1 bg-teal-500/20 text-teal-400 rounded text-xs font-medium">
                      {question.frequency}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-8">No questions data</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Conversations Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Conversations ({filteredConversations.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Date/Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Intent</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Industry</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Scores</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Lead Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Quality</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedConversations.map((conv) => {
                  const isExpanded = expandedRows.has(conv.conversation_id);
                  return (
                    <React.Fragment key={conv.conversation_id}>
                      <tr className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {new Date(conv.started_at).toLocaleDateString()} {new Date(conv.started_at).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {conv.city && conv.country ? (
                            <span className="flex items-center gap-1">
                              {getCountryFlag(conv.country)} {conv.city}, {conv.country}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {conv.visitor_intent ? (
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `${getIntentColor(conv.visitor_intent)}20`,
                                color: getIntentColor(conv.visitor_intent)
                              }}
                            >
                              {conv.visitor_intent.replace(/_/g, ' ')}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {conv.industry_segment?.replace(/_/g, ' ') || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {conv.engagement_score && (
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getScoreColor(conv.engagement_score) }}
                                />
                                <span className="text-xs text-gray-400">{conv.engagement_score}</span>
                              </div>
                            )}
                            {conv.resolution_score && (
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getScoreColor(conv.resolution_score) }}
                                />
                                <span className="text-xs text-gray-400">{conv.resolution_score}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {conv.lead_captured ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="w-4 h-4" /> Captured
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {conv.lead_quality_score ? (
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `${getScoreColor(conv.lead_quality_score)}20`,
                                color: getScoreColor(conv.lead_quality_score)
                              }}
                            >
                              {conv.lead_quality_score}/10
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleRow(conv.conversation_id)}
                            className="text-teal-400 hover:text-teal-300 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-6 bg-gray-800/30">
                            <div className="space-y-4">
                              {conv.improvement_suggestions && (
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-2">Improvement Suggestions</h4>
                                  <p className="text-gray-300 text-sm">{conv.improvement_suggestions}</p>
                                </div>
                              )}
                              {conv.questions_asked && conv.questions_asked.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-2">Questions Asked</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {conv.questions_asked.map((q, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-teal-500/20 text-teal-400 rounded text-xs">
                                        {q}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {conv.topics_discussed && conv.topics_discussed.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-2">Topics Discussed</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {conv.topics_discussed.map((t, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {conv.content_gaps && conv.content_gaps.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-2">Content Gaps</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {conv.content_gaps.map((gap, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                        {gap}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {messages[conv.conversation_id] && messages[conv.conversation_id].length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-2">Message Preview</h4>
                                  <div className="space-y-2">
                                    {messages[conv.conversation_id].map((msg, idx) => (
                                      <div key={idx} className="p-2 bg-gray-700/50 rounded text-xs">
                                        <span className="text-gray-400 font-medium">{msg.role}:</span>{' '}
                                        <span className="text-gray-300">{msg.content.substring(0, 200)}...</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>

        {/* Recommendations Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Actionable Recommendations
          </h3>
          <div className="space-y-4">
            <p className="text-gray-300">
              Based on {stats.conversationsAnalyzed} analyzed conversations:
            </p>
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Top Content Gaps to Address:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                {contentGaps.slice(0, 3).map((gap, idx) => (
                  <li key={idx}>{gap.gap} (mentioned {gap.frequency} times)</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Chatbot Training Priorities:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                {topQuestions.slice(0, 3).map((q, idx) => (
                  <li key={idx}>Address: &quot;{q.question}&quot; (asked {q.frequency} times)</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

