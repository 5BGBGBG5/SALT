'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import SummaryCards from './components/SummaryCards';
import MqlSqlChart from './components/MqlSqlChart';
import MqlSqlTable from './components/MqlSqlTable';
import CompanyDrilldownModal from './components/CompanyDrilldownModal';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface MonthlyData {
  month: string;
  month_display: string;
  mql_count: number;
  sql_count: number;
  conversion_rate: number;
  updated_at: string;
}

interface SummaryStats {
  totalMQLs: number;
  totalSQLs: number;
  avgConversionRate: number;
  avgMonthlyMQLs: number;
  months: number;
}

export default function MarketingManagerWeeklyPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'6' | '12' | '24'>('12');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const filteredData = useMemo(() => {
    const monthsToShow = parseInt(dateRange);
    return monthlyData.slice(0, monthsToShow).reverse(); // Reverse to show oldest first
  }, [monthlyData, dateRange]);

  const summaryStats = useMemo((): SummaryStats => {
    if (filteredData.length === 0) {
      return {
        totalMQLs: 0,
        totalSQLs: 0,
        avgConversionRate: 0,
        avgMonthlyMQLs: 0,
        months: 0
      };
    }

    const totalMQLs = filteredData.reduce((sum, d) => sum + (d.mql_count || 0), 0);
    const totalSQLs = filteredData.reduce((sum, d) => sum + (d.sql_count || 0), 0);
    const avgConversionRate = filteredData.reduce((sum, d) => sum + (d.conversion_rate || 0), 0) / filteredData.length;
    const months = filteredData.length;
    const avgMonthlyMQLs = totalMQLs / months;

    return {
      totalMQLs,
      totalSQLs,
      avgConversionRate,
      avgMonthlyMQLs,
      months
    };
  }, [filteredData]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Use Inecta Intelligence Supabase connection
        const supabaseUrl = process.env.NEXT_PUBLIC_INTEL_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_INTEL_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Inecta Intelligence Supabase environment variables are not configured. Set NEXT_PUBLIC_INTEL_SUPABASE_URL and NEXT_PUBLIC_INTEL_SUPABASE_ANON_KEY.');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const monthsToFetch = parseInt(dateRange);
        const { data, error: fetchError } = await supabase
          .from('hubspot_mql_sql_monthly')
          .select('*')
          .order('month', { ascending: false })
          .limit(monthsToFetch);

        if (fetchError) {
          throw new Error(`Failed to fetch data: ${fetchError.message}`);
        }

        if (data && data.length > 0) {
          setMonthlyData(data as MonthlyData[]);
          // Get the most recent updated_at
          const latestUpdate = data[0]?.updated_at;
          setLastUpdated(latestUpdate || null);
        } else {
          setMonthlyData([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dateRange, refreshKey]);

  const handleRowClick = (month: string) => {
    setSelectedMonth(month);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMonth(null);
  };

  const getDateRangeText = () => {
    switch (dateRange) {
      case '6':
        return 'Last 6 Months';
      case '12':
        return 'Last 12 Months';
      case '24':
        return 'Last 24 Months';
      default:
        return 'Last 12 Months';
    }
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
            Marketing Manager Weekly
          </h1>
          <p className="text-lg text-text-secondary mb-2">MQL & SQL Performance Metrics</p>
          {lastUpdated && (
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {/* Controls Bar */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-300">Date Range:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as '6' | '12' | '24')}
                className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="6">Last 6 Months</option>
                <option value="12">Last 12 Months</option>
                <option value="24">Last 24 Months</option>
              </select>
            </div>
            <button
              onClick={() => {
                setRefreshKey(prev => prev + 1);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="h-4 bg-gray-700/50 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-700/50 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            <div className="glass-card p-6 animate-pulse">
              <div className="h-64 bg-gray-700/50 rounded"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card p-8 text-center">
            <div className="text-red-400 text-lg font-semibold mb-2 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Unable to load data
            </div>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setRefreshKey(prev => prev + 1);
              }}
              className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg transition-colors border border-teal-500/50"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Summary Cards */}
            <SummaryCards stats={summaryStats} dateRangeText={getDateRangeText()} />

            {/* Chart */}
            <div className="glass-card p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">MQL & SQL by Month</h2>
              <MqlSqlChart data={filteredData} />
            </div>

            {/* Table */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Monthly Performance</h2>
              <MqlSqlTable data={filteredData} onRowClick={handleRowClick} />
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && filteredData.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-gray-400 text-lg">No data available for selected period.</p>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && selectedMonth && (
          <CompanyDrilldownModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            month={selectedMonth}
          />
        )}
      </div>
    </div>
  );
}

