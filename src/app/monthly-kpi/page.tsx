'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { 
  Calendar, 
  Download, 
  RefreshCw
} from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

type MonthlyKPI = {
  month: string; // Format: "Jul-25"
  monthDate: Date; // For sorting
  posts_count: number;
  post_impressions: number | null;
  post_interactions: number;
  follower_growth: number | null;
  avg_ctr_percent: number | null;
  avg_engagement_percent: number | null;
  industry_breakdown: Record<string, number>;
  role_breakdown: Record<string, number>;
  company_size_breakdown: Record<string, number>;
};

// Removed unused type definitions

const formatMonth = (dateStr: string): string => {
  const date = new Date(dateStr);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = date.getFullYear().toString().slice(-2);
  return `${monthNames[date.getMonth()]}-${year}`;
};

const MonthlyKPITable = ({ 
  data, 
  isLoading, 
  error, 
  onExportToExcel,
  onRefresh 
}: { 
  data: MonthlyKPI[]; 
  isLoading: boolean; 
  error: string | null;
  onExportToExcel: () => void;
  onRefresh: () => void;
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300/20 rounded w-1/4"></div>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-300/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8">
        <div className="text-center">
          <div className="text-red-400 text-lg font-semibold mb-2">⚠️ Error Loading KPI Data</div>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass-card p-8">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">No KPI data available</div>
          <p className="text-gray-500">Try adjusting your date range or check if data exists for the selected period.</p>
        </div>
      </div>
    );
  }

  const months = data.map(d => d.month);

  return (
    <div className="glass-card p-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Monthly KPI Dashboard</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isRefreshing 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={onExportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="border-b border-teal-500/30">
              <th className="text-left py-3 px-4 text-gray-300 font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm min-w-[250px]">
                KPI Metric
              </th>
              {months.map(month => (
                <th key={month} className="text-center py-3 px-4 text-gray-300 font-medium min-w-[100px]">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-500/20">
            {/* LinkedIn Section Header */}
            <tr className="bg-teal-500/10">
              <td colSpan={months.length + 1} className="py-3 px-4 text-teal-300 font-semibold">
                📱 LinkedIn Metrics
              </td>
            </tr>

            {/* Posts Count */}
            <tr className="hover:bg-teal-500/5 transition-colors">
              <td className="py-3 px-4 text-white font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm">
                # Posts
              </td>
              {data.map(monthData => (
                <td key={monthData.month} className="py-3 px-4 text-center text-gray-300">
                  {monthData.posts_count}
                </td>
              ))}
            </tr>

            {/* Post Impressions */}
            <tr className="hover:bg-teal-500/5 transition-colors">
              <td className="py-3 px-4 text-white font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm">
                Post Impressions
              </td>
              {data.map(monthData => (
                <td key={monthData.month} className="py-3 px-4 text-center text-gray-400 italic">
                  Data Not Available
                </td>
              ))}
            </tr>

            {/* Post Interactions */}
            <tr className="hover:bg-teal-500/5 transition-colors">
              <td className="py-3 px-4 text-white font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm">
                Post Interactions
              </td>
              {data.map(monthData => (
                <td key={monthData.month} className="py-3 px-4 text-center text-gray-300">
                  {monthData.post_interactions}
                </td>
              ))}
            </tr>

            {/* Follower Growth */}
            <tr className="hover:bg-teal-500/5 transition-colors">
              <td className="py-3 px-4 text-white font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm">
                Follower Growth
              </td>
              {data.map(monthData => (
                <td key={monthData.month} className="py-3 px-4 text-center text-gray-400 italic">
                  Data Not Available
                </td>
              ))}
            </tr>

            {/* Average CTR % */}
            <tr className="hover:bg-teal-500/5 transition-colors">
              <td className="py-3 px-4 text-white font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm">
                Average CTR %
              </td>
              {data.map(monthData => (
                <td key={monthData.month} className="py-3 px-4 text-center text-gray-400 italic">
                  N/A
                </td>
              ))}
            </tr>

            {/* Average Engagement % */}
            <tr className="hover:bg-teal-500/5 transition-colors">
              <td className="py-3 px-4 text-white font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm">
                Average Engagement %
              </td>
              {data.map(monthData => (
                <td key={monthData.month} className="py-3 px-4 text-center text-gray-400 italic">
                  N/A
                </td>
              ))}
            </tr>

            {/* Lead vs Non-Lead */}
            <tr className="hover:bg-teal-500/5 transition-colors">
              <td className="py-3 px-4 text-white font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm">
                Engagement: Lead vs Non-Lead
              </td>
              {data.map(monthData => (
                <td key={monthData.month} className="py-3 px-4 text-center text-yellow-400 italic">
                  Classification Needed
                </td>
              ))}
            </tr>

            {/* Company Industry Section */}
            <tr className="bg-emerald-500/10">
              <td colSpan={months.length + 1} className="py-3 px-4 text-emerald-300 font-semibold">
                🏢 Engagement: Company Industry
              </td>
            </tr>

            {/* Industry breakdown rows */}
            {['Accounting', 'Biotechnology Research', 'Business Consulting and Services', 'Food and Beverage Manufacturing', 'Information Technology & Services', 'IT Services and IT Consulting', 'Software Development', 'Other/Blank'].map(industry => (
              <tr key={industry} className="hover:bg-teal-500/5 transition-colors">
                <td className="py-3 px-4 text-white font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm pl-8">
                  {industry}
                </td>
                {data.map(monthData => (
                  <td key={monthData.month} className="py-3 px-4 text-center text-gray-300">
                    {monthData.industry_breakdown[industry] || 0}
                  </td>
                ))}
              </tr>
            ))}

            {/* Role Section */}
            <tr className="bg-blue-500/10">
              <td colSpan={months.length + 1} className="py-3 px-4 text-blue-300 font-semibold">
                👔 Engagement: Role
              </td>
            </tr>

            {/* Role breakdown rows */}
            {['Director/Partner', 'President/CEO', 'CFO', 'Owner/VP', 'COO', 'CTO', 'Other'].map(role => (
              <tr key={role} className="hover:bg-teal-500/5 transition-colors">
                <td className="py-3 px-4 text-white font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm pl-8">
                  {role}
                </td>
                {data.map(monthData => (
                  <td key={monthData.month} className="py-3 px-4 text-center text-gray-300">
                    {monthData.role_breakdown[role] || 0}
                  </td>
                ))}
              </tr>
            ))}

            {/* Company Size Section */}
            <tr className="bg-purple-500/10">
              <td colSpan={months.length + 1} className="py-3 px-4 text-purple-300 font-semibold">
                📊 Engagement: Company Size
              </td>
            </tr>

            {/* Company size breakdown rows */}
            {['Small 0-50', 'Medium 51-200', 'Large 201-500', 'Industrial 501+', 'Unknown'].map(size => (
              <tr key={size} className="hover:bg-teal-500/5 transition-colors">
                <td className="py-3 px-4 text-white font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm pl-8">
                  {size}
                </td>
                {data.map(monthData => (
                  <td key={monthData.month} className="py-3 px-4 text-center text-gray-300">
                    {monthData.company_size_breakdown[size] || 0}
                  </td>
                ))}
              </tr>
            ))}

            {/* YouTube Section */}
            <tr className="bg-red-500/10">
              <td colSpan={months.length + 1} className="py-3 px-4 text-red-300 font-semibold">
                🎥 YouTube Metrics
              </td>
            </tr>
            <tr className="hover:bg-teal-500/5 transition-colors">
              <td className="py-3 px-4 text-white font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm">
                YouTube metrics coming soon
              </td>
              {data.map(monthData => (
                <td key={monthData.month} className="py-3 px-4 text-center text-gray-400 italic">
                  Coming Soon
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Data source indicator */}
      <div className="mt-4 text-xs text-teal-300/80">
        Data sources: <code>posts</code>, <code>v_post_engagement_v2</code>
      </div>
    </div>
  );
};

export default function MonthlyKPIPage() {
  const [kpiData, setKpiData] = useState<MonthlyKPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ 
    from: '2025-07-01', 
    to: new Date().toISOString().split('T')[0] 
  });

  const fetchKPIData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[MonthlyKPI] Starting data fetch...');
      
      // Use AiEO project credentials
      const aieoSupabaseUrl = process.env.NEXT_PUBLIC_AIEO_SUPABASE_URL;
      const aieoSupabaseKey = process.env.NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY;

      if (!aieoSupabaseUrl || !aieoSupabaseKey) {
        setError('AiEO Supabase is not configured. Set NEXT_PUBLIC_AIEO_SUPABASE_URL and NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY.');
        return;
      }

      const supabase = createClient(aieoSupabaseUrl, aieoSupabaseKey);

      // Fetch post counts by month
      console.log('[MonthlyKPI] Fetching post counts...');
      const { error: postError } = await supabase
        .rpc('get_monthly_post_counts', {
          start_date: dateRange.from,
          end_date: dateRange.to
        });

      if (postError) {
        console.error('[MonthlyKPI] Post data error:', postError);
        // Fallback to direct query if RPC doesn't exist
        const { data: fallbackPostData, error: fallbackPostError } = await supabase
          .from('posts')
          .select(`
            post_timestamp,
            like_count,
            comment_count,
            repost_count
          `)
          .eq('author_name', 'inecta - Food ERP')
          .eq('is_competitor', false)
          .gte('post_timestamp', dateRange.from)
          .lte('post_timestamp', dateRange.to);

        if (fallbackPostError) {
          throw new Error(`Failed to fetch post data: ${fallbackPostError.message}`);
        }

        // Process fallback data
        const postsByMonth = new Map<string, { count: number, interactions: number }>();
        
        (fallbackPostData || []).forEach(post => {
          const monthKey = new Date(post.post_timestamp).toISOString().slice(0, 7) + '-01';
          const existing = postsByMonth.get(monthKey) || { count: 0, interactions: 0 };
          existing.count++;
          existing.interactions += (post.like_count || 0) + (post.comment_count || 0) + (post.repost_count || 0);
          postsByMonth.set(monthKey, existing);
        });

        // Convert to expected format
        const processedPostData = Array.from(postsByMonth.entries()).map(([month, data]) => ({
          month,
          post_count: data.count,
          post_interactions: data.interactions
        }));

        console.log('[MonthlyKPI] Processed post data:', processedPostData);
      }

      // Fetch engagement data by month
      console.log('[MonthlyKPI] Fetching engagement data...');
      const { data: engagementData, error: engagementError } = await supabase
        .from('v_post_engagement_v2')
        .select(`
          engagement_timestamp,
          engagement_type,
          post_id,
          engager_company_industry,
          engager_job_title,
          engager_company_size
        `)
        .gte('engagement_timestamp', dateRange.from)
        .lte('engagement_timestamp', dateRange.to);

      if (engagementError) {
        throw new Error(`Failed to fetch engagement data: ${engagementError.message}`);
      }

      console.log('[MonthlyKPI] Raw engagement data count:', engagementData?.length || 0);

      // Filter for Inecta posts only by joining with posts table
      const { data: inectaPosts, error: inectaPostsError } = await supabase
        .from('posts')
        .select('id')
        .eq('author_name', 'inecta - Food ERP')
        .eq('is_competitor', false);

      if (inectaPostsError) {
        throw new Error(`Failed to fetch Inecta posts: ${inectaPostsError.message}`);
      }

      const inectaPostIds = new Set((inectaPosts || []).map(p => p.id));
      const filteredEngagementData = (engagementData || []).filter(e => inectaPostIds.has(e.post_id));

      console.log('[MonthlyKPI] Filtered engagement data count:', filteredEngagementData.length);

      // Process and aggregate data by month
      const monthlyData = new Map<string, MonthlyKPI>();

      // Initialize months in range
      const startDate = new Date(dateRange.from);
      const endDate = new Date(dateRange.to);
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const monthKey = currentDate.toISOString().slice(0, 7) + '-01';
        const monthLabel = formatMonth(monthKey);
        
        monthlyData.set(monthKey, {
          month: monthLabel,
          monthDate: new Date(monthKey),
          posts_count: 0,
          post_impressions: null,
          post_interactions: 0,
          follower_growth: null,
          avg_ctr_percent: null,
          avg_engagement_percent: null,
          industry_breakdown: {},
          role_breakdown: {},
          company_size_breakdown: {}
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Process engagement data
      filteredEngagementData.forEach(engagement => {
        const monthKey = new Date(engagement.engagement_timestamp).toISOString().slice(0, 7) + '-01';
        const monthData = monthlyData.get(monthKey);
        
        if (monthData) {
          monthData.post_interactions++;

          // Industry breakdown
          const industry = engagement.engager_company_industry || 'Other/Blank';
          monthData.industry_breakdown[industry] = (monthData.industry_breakdown[industry] || 0) + 1;

          // Role breakdown
          const jobTitle = (engagement.engager_job_title || '').toLowerCase();
          let roleCategory = 'Other';
          
          if (jobTitle.includes('director') || jobTitle.includes('partner') || jobTitle.includes('head of')) {
            roleCategory = 'Director/Partner';
          } else if (jobTitle.includes('president') || jobTitle.includes('ceo') || jobTitle.includes('chief executive')) {
            roleCategory = 'President/CEO';
          } else if (jobTitle.includes('cfo') || jobTitle.includes('chief financial')) {
            roleCategory = 'CFO';
          } else if (jobTitle.includes('owner') || jobTitle.includes('vp') || jobTitle.includes('vice president') || jobTitle.includes('founder')) {
            roleCategory = 'Owner/VP';
          } else if (jobTitle.includes('coo') || jobTitle.includes('chief operating')) {
            roleCategory = 'COO';
          } else if (jobTitle.includes('cto') || jobTitle.includes('chief technical') || jobTitle.includes('chief technology')) {
            roleCategory = 'CTO';
          }

          monthData.role_breakdown[roleCategory] = (monthData.role_breakdown[roleCategory] || 0) + 1;

          // Company size breakdown
          const companySize = engagement.engager_company_size;
          let sizeCategory = 'Unknown';
          
          if (companySize) {
            if (['0-1 employees', '2-10 employees', '11-50 employees'].includes(companySize)) {
              sizeCategory = 'Small 0-50';
            } else if (companySize === '51-200 employees') {
              sizeCategory = 'Medium 51-200';
            } else if (companySize === '201-500 employees') {
              sizeCategory = 'Large 201-500';
            } else if (['501-1,000 employees', '1,001-5,000 employees', '10,001+ employees'].includes(companySize)) {
              sizeCategory = 'Industrial 501+';
            }
          }

          monthData.company_size_breakdown[sizeCategory] = (monthData.company_size_breakdown[sizeCategory] || 0) + 1;
        }
      });

      // Get post counts (fallback method since we might not have the RPC)
      const { data: postCounts, error: postCountError } = await supabase
        .from('posts')
        .select('post_timestamp')
        .eq('author_name', 'inecta - Food ERP')
        .eq('is_competitor', false)
        .gte('post_timestamp', dateRange.from)
        .lte('post_timestamp', dateRange.to);

      if (!postCountError && postCounts) {
        postCounts.forEach(post => {
          const monthKey = new Date(post.post_timestamp).toISOString().slice(0, 7) + '-01';
          const monthData = monthlyData.get(monthKey);
          if (monthData) {
            monthData.posts_count++;
          }
        });
      }

      const result = Array.from(monthlyData.values()).sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime());
      
      console.log('[MonthlyKPI] Final processed data:', result);
      setKpiData(result);

    } catch (err) {
      console.error('[MonthlyKPI] Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load KPI data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  const handleExportToExcel = () => {
    try {
      console.log('[MonthlyKPI] Starting Excel export...');
      
      if (kpiData.length === 0) {
        alert('No data to export. Please wait for data to load.');
        return;
      }

      // Prepare data for Excel export
      const exportData: Record<string, string | number>[] = [];

      // LinkedIn section
      exportData.push({ 'KPI Metric': 'LinkedIn Metrics', ...kpiData.reduce((acc, d) => ({ ...acc, [d.month]: '' }), {}) });
      
      exportData.push({ 
        'KPI Metric': '# Posts', 
        ...kpiData.reduce((acc, d) => ({ ...acc, [d.month]: d.posts_count }), {}) 
      });
      
      exportData.push({ 
        'KPI Metric': 'Post Impressions', 
        ...kpiData.reduce((acc, d) => ({ ...acc, [d.month]: 'Data Not Available' }), {}) 
      });
      
      exportData.push({ 
        'KPI Metric': 'Post Interactions', 
        ...kpiData.reduce((acc, d) => ({ ...acc, [d.month]: d.post_interactions }), {}) 
      });

      // Industry breakdown
      exportData.push({ 'KPI Metric': 'Engagement: Company Industry', ...kpiData.reduce((acc, d) => ({ ...acc, [d.month]: '' }), {}) });
      
      ['Accounting', 'Biotechnology Research', 'Business Consulting and Services', 'Food and Beverage Manufacturing', 'Information Technology & Services', 'IT Services and IT Consulting', 'Software Development', 'Other/Blank'].forEach(industry => {
        exportData.push({
          'KPI Metric': `  ${industry}`,
          ...kpiData.reduce((acc, d) => ({ ...acc, [d.month]: d.industry_breakdown[industry] || 0 }), {})
        });
      });

      // Role breakdown
      exportData.push({ 'KPI Metric': 'Engagement: Role', ...kpiData.reduce((acc, d) => ({ ...acc, [d.month]: '' }), {}) });
      
      ['Director/Partner', 'President/CEO', 'CFO', 'Owner/VP', 'COO', 'CTO', 'Other'].forEach(role => {
        exportData.push({
          'KPI Metric': `  ${role}`,
          ...kpiData.reduce((acc, d) => ({ ...acc, [d.month]: d.role_breakdown[role] || 0 }), {})
        });
      });

      // Company size breakdown
      exportData.push({ 'KPI Metric': 'Engagement: Company Size', ...kpiData.reduce((acc, d) => ({ ...acc, [d.month]: '' }), {}) });
      
      ['Small 0-50', 'Medium 51-200', 'Large 201-500', 'Industrial 501+', 'Unknown'].forEach(size => {
        exportData.push({
          'KPI Metric': `  ${size}`,
          ...kpiData.reduce((acc, d) => ({ ...acc, [d.month]: d.company_size_breakdown[size] || 0 }), {})
        });
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly KPI Report');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `monthly-kpi-report-${currentDate}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);
      
      console.log('[MonthlyKPI] Excel export completed successfully');
      alert(`Excel file exported successfully!\nFilename: ${filename}\nRows exported: ${exportData.length}`);
      
    } catch (error) {
      console.error('[MonthlyKPI] Excel export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to export Excel file: ${errorMessage}`);
    }
  };

  useEffect(() => {
    fetchKPIData();
  }, [fetchKPIData]);

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
        {Array.from({ length: 15 }).map((_, i) => (
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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-teal-200 to-emerald-200 bg-clip-text text-transparent">
            Monthly KPI Dashboard
          </h2>
          <p className="mt-2 text-gray-300">
            Track LinkedIn engagement metrics, industry insights, and performance trends over time.
          </p>
          <div className="mt-1 text-xs text-teal-300/80">
            Data sources: <code>posts</code>, <code>v_post_engagement_v2</code>
          </div>
        </motion.div>

        {/* Date Range Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-teal-400" />
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-teal-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-teal-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MonthlyKPITable 
            data={kpiData}
            isLoading={isLoading}
            error={error}
            onExportToExcel={handleExportToExcel}
            onRefresh={fetchKPIData}
          />
        </motion.div>
      </div>
    </div>
  );
}
