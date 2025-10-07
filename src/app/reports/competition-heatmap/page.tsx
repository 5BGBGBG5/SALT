'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  Target, 
  Award, 
  BarChart3,
  Search,
  X,
  Eye
} from 'lucide-react';

// Use AiEO project credentials for this report since v_high_intent_prompt_mentions exists there
const supabase = createClient(
  process.env.NEXT_PUBLIC_AIEO_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY!
);

type PMRow = {
  id: number;
  execution_id: string;
  execution_date: string;
  execution_week: number;
  prompt_id: string;
  prompt_category: string;
  prompt_text: string;
  model_name: 'openai' | 'gemini' | 'grok';
  model_responses: string;
  inecta_mentions: number;
  inecta_sentiment: number;
  inecta_ranking?: number;
  citations?: Record<string, unknown>;
  vendors?: Record<string, unknown>;
  features?: Record<string, unknown>;
  verticals?: Record<string, unknown>;
  risk_flags?: Record<string, unknown>;
  alerts?: Record<string, unknown>;
  timestamp: string;
};

type WeeklyStats = {
  execution_week: number;
  model_name: string;
  total_responses: number;
  mention_count: number;
  mention_rate: number;
  avg_ranking: number;
};

type CategoryStats = {
  prompt_category: string;
  execution_week: number;
  total: number;
  mentions: number;
  mention_rate: number;
};

type PromptGroup = {
  category: string;
  text: string;
  models: Record<string, PMRow>;
};

type TrendData = {
  week: number;
  openai: number;
  gemini: number;
  grok: number;
};

const MODELS: PMRow['model_name'][] = ['openai','gemini','grok'];
const HI_CATS = ['generic','vertical','feature','head_to_head','comparison','variant'];

const MODEL_COLORS = {
  openai: '#10B981',
  gemini: '#3B82F6',
  grok: '#F59E0B'
};

export default function CompetitionHeatMapPage() {
  const [rows, setRows] = useState<PMRow[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [compareWeek, setCompareWeek] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [onlyMisses, setOnlyMisses] = useState(true);
  const [catFilter, setCatFilter] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptGroup | null>(null);

  // Fetch all data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch data from ai_responses table with debugging
        console.log('🔍 Fetching data from ai_responses table...');
        const dateFilter = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        console.log('📅 Date filter (12 weeks ago):', dateFilter);
        
        const { data: mainData, error: mainError } = await supabase
          .from('ai_responses')
          .select('*')
          .gte('execution_date', dateFilter)
          .order('execution_date', { ascending: false });
          
        console.log('📊 Raw data received:', mainData);
        console.log('📊 Data count:', mainData?.length || 0);
        
        if (mainError) {
          console.error('❌ Supabase error:', mainError);
          setError(`Database error: ${mainError.message}`);
          return;
        }
        
        // Also try to fetch without date filter to see if there's any data at all
        const { data: allData, error: allError } = await supabase
          .from('ai_responses')
          .select('*')
          .order('execution_date', { ascending: false })
          .limit(100);
          
        console.log('📊 All data sample (no date filter):', allData);
        console.log('📊 All data count:', allData?.length || 0);
        
        if (allError) {
          console.error('❌ Error fetching all data:', allError);
        }
        
        const processedRows = (mainData ?? []) as PMRow[];
        console.log('✅ Processed rows:', processedRows.length);
        
        // If no data with date filter, use all available data
        const finalRows = processedRows.length > 0 ? processedRows : (allData ?? []) as PMRow[];
        console.log('🎯 Final rows to use:', finalRows.length);
        
        setRows(finalRows);
        
        // Set default selected week to most recent
        if (finalRows.length > 0) {
          const maxWeek = Math.max(...finalRows.map(r => r.execution_week));
          console.log('📅 Setting selected week to:', maxWeek);
          setSelectedWeek(maxWeek);
        } else {
          console.log('⚠️ No data found - setting error message');
          setError('No data found in the ai_responses table. Please check if there are any AI response records in the database.');
        }

        // Calculate weekly stats
        const weeklyStatsMap = new Map<string, WeeklyStats>();
        
        finalRows.forEach(row => {
          const key = `${row.execution_week}-${row.model_name}`;
          if (!weeklyStatsMap.has(key)) {
            weeklyStatsMap.set(key, {
              execution_week: row.execution_week,
              model_name: row.model_name,
              total_responses: 0,
              mention_count: 0,
              mention_rate: 0,
              avg_ranking: 0
            });
          }
          
          const stats = weeklyStatsMap.get(key)!;
          // Every row in ai_responses represents a response, so count all
          stats.total_responses++;
          if (row.inecta_mentions > 0) {
            stats.mention_count++;
          }
        });

        // Calculate rates and averages
        const weeklyStatsArray = Array.from(weeklyStatsMap.values()).map(stats => ({
          ...stats,
          mention_rate: stats.total_responses > 0 ? (stats.mention_count / stats.total_responses) * 100 : 0,
          avg_ranking: stats.mention_count > 0 ? 
            finalRows
              .filter(r => r.execution_week === stats.execution_week && r.model_name === stats.model_name && r.inecta_mentions > 0 && r.inecta_ranking)
              .reduce((sum, r) => sum + (r.inecta_ranking || 0), 0) / stats.mention_count : 0
        }));

        setWeeklyStats(weeklyStatsArray);

        // Calculate category stats
        const categoryStatsMap = new Map<string, CategoryStats>();
        
        finalRows.forEach(row => {
          const key = `${row.prompt_category}-${row.execution_week}`;
          if (!categoryStatsMap.has(key)) {
            categoryStatsMap.set(key, {
              prompt_category: row.prompt_category,
              execution_week: row.execution_week,
              total: 0,
              mentions: 0,
              mention_rate: 0
            });
          }
          
          const stats = categoryStatsMap.get(key)!;
          // Every row represents a response
          stats.total++;
          if (row.inecta_mentions > 0) {
            stats.mentions++;
          }
        });

        const categoryStatsArray = Array.from(categoryStatsMap.values()).map(stats => ({
          ...stats,
          mention_rate: stats.total > 0 ? (stats.mentions / stats.total) * 100 : 0
        }));

        setCategoryStats(categoryStatsArray);
        
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Calculate trend data for chart
  const trendData = useMemo(() => {
    const weeks = Array.from(new Set(weeklyStats.map(s => s.execution_week))).sort();
    
    return weeks.map(week => {
      const weekData: TrendData = { week, openai: 0, gemini: 0, grok: 0 };
      
      MODELS.forEach(model => {
        const stats = weeklyStats.find(s => s.execution_week === week && s.model_name === model);
        weekData[model] = stats?.mention_rate || 0;
      });
      
      return weekData;
    });
  }, [weeklyStats]);

  // Calculate current week metrics
  const currentWeekMetrics = useMemo(() => {
    if (!selectedWeek || weeklyStats.length === 0) return null;
    
    const currentStats = weeklyStats.filter(s => s.execution_week === selectedWeek);
    const previousStats = weeklyStats.filter(s => s.execution_week === selectedWeek - 1);
    
    const currentMentionRate = currentStats.reduce((sum, s) => sum + s.mention_rate, 0) / currentStats.length || 0;
    const previousMentionRate = previousStats.reduce((sum, s) => sum + s.mention_rate, 0) / previousStats.length || 0;
    const mentionRateChange = currentMentionRate - previousMentionRate;
    
    const currentAvgRanking = currentStats.reduce((sum, s) => sum + s.avg_ranking, 0) / currentStats.filter(s => s.avg_ranking > 0).length || 0;
    const previousAvgRanking = previousStats.reduce((sum, s) => sum + s.avg_ranking, 0) / previousStats.filter(s => s.avg_ranking > 0).length || 0;
    const rankingChange = currentAvgRanking - previousAvgRanking;
    
    const bestModel = currentStats.reduce((best, current) => 
      current.mention_rate > best.mention_rate ? current : best, currentStats[0] || { model_name: 'N/A', mention_rate: 0 });
    
    return {
      currentMentionRate,
      mentionRateChange,
      currentAvgRanking,
      rankingChange,
      bestModel: bestModel?.model_name || 'N/A',
      bestModelRate: bestModel?.mention_rate || 0
    };
  }, [selectedWeek, weeklyStats]);

  // Calculate category performance
  const categoryPerformance = useMemo(() => {
    if (!selectedWeek) return [];
    
    const categories = Array.from(new Set(categoryStats.map(c => c.prompt_category)));
    
    return categories.map((category) => {
      const currentWeekStats = categoryStats.filter(c => c.prompt_category === category && c.execution_week === selectedWeek);
      const last4WeeksStats = categoryStats.filter(c => 
        c.prompt_category === category && 
        c.execution_week >= selectedWeek - 3 && 
        c.execution_week <= selectedWeek
      );
      
      const currentRate = currentWeekStats.reduce((sum, s) => sum + s.mention_rate, 0) / currentWeekStats.length || 0;
      const avgRate = last4WeeksStats.reduce((sum, s) => sum + s.mention_rate, 0) / last4WeeksStats.length || 0;
      const change = currentRate - avgRate;
      
      let trend = '→';
      if (change > 5) trend = '↑';
      else if (change > 1) trend = '↗';
      else if (change < -5) trend = '↓';
      else if (change < -1) trend = '↘';
      
      return {
        category,
        currentRate,
        avgRate,
        change,
        trend
      };
    }).sort((a, b) => b.currentRate - a.currentRate);
  }, [selectedWeek, categoryStats]);

  // Filter and group data for heat map
  const grouped = useMemo(() => {
    const filteredRows = selectedWeek ? rows.filter(r => r.execution_week === selectedWeek) : rows;
    
    // Group by prompt_id
    const map = new Map<string, PromptGroup>();
    for (const r of filteredRows) {
      if (!map.has(r.prompt_id)) {
        map.set(r.prompt_id, {
          category: r.prompt_category, 
          text: r.prompt_text, 
          models: {} as Record<string, PMRow>
        });
      }
      map.get(r.prompt_id)!.models[r.model_name] = r;
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
        return cell && cell.inecta_mentions === 0; // Has response but no Inecta mentions
      }));
    }
    
    // Sort: most misses first
    entries.sort((a, b) => {
      const missA = MODELS.filter(m => a[1].models[m] && a[1].models[m].inecta_mentions === 0).length;
      const missB = MODELS.filter(m => b[1].models[m] && b[1].models[m].inecta_mentions === 0).length;
      return missB - missA;
    });
    
    return entries;
  }, [rows, selectedWeek, onlyMisses, catFilter, q]);

  const availableWeeks = useMemo(() => {
    return Array.from(new Set(rows.map(r => r.execution_week))).sort((a, b) => b - a);
  }, [rows]);

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const formatChange = (change: number, isPercentage = false) => {
    const sign = change > 0 ? '+' : '';
    const suffix = isPercentage ? '%' : '';
    return `${sign}${change.toFixed(1)}${suffix}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading competition data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-red-400 text-lg font-semibold mb-2">⚠️ Error Loading Report</div>
          <p className="text-gray-300">{error}</p>
        </div>
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

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-teal-200 to-emerald-200 bg-clip-text text-transparent mb-2">
            Competition Heat Map
          </h1>
          <p className="text-gray-400 text-lg">
            Historical tracking and trend analysis of AI model responses mentioning Inecta
          </p>
        </motion.div>

        {/* Historical Stats Section */}
        {currentWeekMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-8 h-8 text-teal-400" />
                  {getTrendIcon(currentWeekMetrics.mentionRateChange)}
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {currentWeekMetrics.currentMentionRate.toFixed(1)}%
                </div>
                <div className="text-gray-400 text-sm mb-1">Current Week Mention Rate</div>
                <div className={`text-xs ${currentWeekMetrics.mentionRateChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatChange(currentWeekMetrics.mentionRateChange, true)} from last week
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                  {getTrendIcon(-currentWeekMetrics.rankingChange)}
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {currentWeekMetrics.currentAvgRanking.toFixed(1)}
                </div>
                <div className="text-gray-400 text-sm mb-1">Average Ranking When Mentioned</div>
                <div className={`text-xs ${currentWeekMetrics.rankingChange < 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatChange(-currentWeekMetrics.rankingChange)} from last week
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1 capitalize">
                  {currentWeekMetrics.bestModel}
                </div>
                <div className="text-gray-400 text-sm mb-1">Best Performing Model</div>
                <div className="text-xs text-yellow-400">
                  {currentWeekMetrics.bestModelRate.toFixed(1)}% mention rate
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {categoryPerformance[0]?.category || 'N/A'}
                </div>
                <div className="text-gray-400 text-sm mb-1">Top Category This Week</div>
                <div className="text-xs text-green-400">
                  {categoryPerformance[0]?.currentRate.toFixed(1) || 0}% mention rate
                </div>
              </div>
            </div>

            {/* Mention Rate Trend Chart */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-teal-400" />
                Mention Rate Trend (Last 12 Weeks)
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="week" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      label={{ value: 'Mention Rate (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Mention Rate']}
                      labelFormatter={(week) => `Week ${week}`}
                    />
                    <Legend />
                    {MODELS.map(model => (
                      <Line
                        key={model}
                        type="monotone"
                        dataKey={model}
                        stroke={MODEL_COLORS[model]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name={model.charAt(0).toUpperCase() + model.slice(1)}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Performance Table */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Category Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Category</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Current Week</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">4-Week Average</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Change</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
            {categoryPerformance.map((cat) => (
              <tr key={cat.category} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4 text-white font-medium capitalize">{cat.category}</td>
                        <td className="py-3 px-4 text-gray-300">{cat.currentRate.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-gray-300">{cat.avgRate.toFixed(1)}%</td>
                        <td className={`py-3 px-4 ${cat.change > 0 ? 'text-green-400' : cat.change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {formatChange(cat.change, true)}
                        </td>
                        <td className="py-3 px-4 text-2xl">{cat.trend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Heat Map Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Week Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              <select
                value={selectedWeek || ''}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-teal-500 transition-colors"
              >
                {availableWeeks.map(week => (
                  <option key={week} value={week}>Week {week}</option>
                ))}
              </select>
            </div>

            {/* Compare Mode Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-teal-500 focus:ring-teal-500"
              />
              <span className="text-gray-300">Compare Weeks</span>
            </label>

            {/* Compare Week Selector */}
            {compareMode && (
              <select
                value={compareWeek || ''}
                onChange={(e) => setCompareWeek(Number(e.target.value))}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-teal-500 transition-colors"
              >
                <option value="">Select week to compare</option>
                {availableWeeks.filter(w => w !== selectedWeek).map(week => (
                  <option key={week} value={week}>Week {week}</option>
                ))}
              </select>
            )}

            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Show Only Misses Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyMisses}
                onChange={(e) => setOnlyMisses(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-teal-500 focus:ring-teal-500"
              />
              <span className="text-gray-300">Show Only Misses</span>
            </label>
          </div>

          {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
            {HI_CATS.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setCatFilter(prev => 
                    prev.includes(cat) 
                      ? prev.filter(c => c !== cat)
                      : [...prev, cat]
                  );
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  catFilter.includes(cat)
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
            {catFilter.length > 0 && (
          <button
            onClick={() => setCatFilter([])}
                className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
                Clear Filters
          </button>
            )}
        </div>
        </motion.div>

        {/* Heat Map */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              AI Model Response Heat Map - Week {selectedWeek}
            </h3>
            <div className="text-gray-400 text-sm">
              {grouped.length} prompts shown
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No data found</div>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium min-w-96">Prompt</th>
                    {MODELS.map(model => (
                      <th key={model} className="text-center py-3 px-4 text-gray-300 font-medium capitalize min-w-24">
                        {model}
                      </th>
                    ))}
                    <th className="text-center py-3 px-4 text-gray-300 font-medium min-w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
                  {grouped.map(([promptId, group]) => (
                    <tr key={promptId} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="max-w-96">
                          <div className="text-white font-medium mb-1 line-clamp-2">
                            {group.text}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {group.category}
                          </div>
                        </div>
                    </td>
                      {MODELS.map(model => {
                        const cell = group.models[model];
                        let bgColor = 'bg-gray-600'; // No response
                        let textColor = 'text-gray-300';
                        let content = '—';
                        
                        if (cell) {
                          if (cell.inecta_mentions > 0) {
                            bgColor = 'bg-green-500';
                            textColor = 'text-white';
                            content = cell.inecta_ranking ? `#${cell.inecta_ranking}` : '✓';
                          } else {
                            bgColor = 'bg-red-500';
                            textColor = 'text-white';
                            content = '✗';
                          }
                        }
                        
                      return (
                          <td key={model} className="py-3 px-4 text-center">
                            <div 
                              className={`w-12 h-8 rounded flex items-center justify-center text-sm font-medium ${bgColor} ${textColor} mx-auto cursor-pointer hover:opacity-80 transition-opacity`}
                              title={cell ? 
                                (cell.inecta_mentions > 0 ? 
                                  `Mentioned (Rank: ${cell.inecta_ranking || 'N/A'})` : 
                                  'Not mentioned') : 
                                'No response'}
                            >
                              {content}
                          </div>
                        </td>
                        );
                      })}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedPrompt(group)}
                          className="p-2 text-gray-400 hover:text-teal-400 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                  </td>
                </tr>
                  ))}
            </tbody>
          </table>
        </div>
          )}
        </motion.div>

        {/* Legend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-300">Inecta Mentioned</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-300">Missed Opportunity</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
              <span className="text-gray-300">No Response</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Prompt Detail Modal */}
      <AnimatePresence>
        {selectedPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPrompt(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Prompt Details</h3>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Prompt Info */}
                <div>
                  <div className="text-gray-400 text-sm mb-2">Prompt Text</div>
                  <div className="text-white bg-gray-800/50 p-4 rounded-lg">
                    {selectedPrompt.text}
                  </div>
                  <div className="text-gray-400 text-sm mt-2 capitalize">
                    Category: {selectedPrompt.category}
                  </div>
                </div>

                {/* Model Responses */}
                <div>
                  <div className="text-gray-400 text-sm mb-4">Model Responses</div>
                  <div className="grid gap-4">
                    {MODELS.map(model => {
                      const response = selectedPrompt.models[model];
                      return (
                        <div key={model} className="bg-gray-800/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-white capitalize">{model}</div>
                            <div className="flex items-center gap-2">
                              {response ? (
                                response.inecta_mentions > 0 ? (
                                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                                    Mentioned {response.inecta_ranking ? `(#${response.inecta_ranking})` : ''}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                                    Not Mentioned
                                  </span>
                                )
                              ) : (
                                <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">
                                  No Response
                                </span>
                              )}
                            </div>
                          </div>
                          {response?.model_responses && (
                            <div className="text-gray-300 text-sm max-h-32 overflow-y-auto">
                              {response.model_responses}
                            </div>
                          )}
                          {!response && (
                            <div className="text-gray-500 text-sm italic">
                              No response available
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}