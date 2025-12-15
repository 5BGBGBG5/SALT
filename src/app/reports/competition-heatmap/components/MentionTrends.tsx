'use client';

import React from 'react';
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
import { TrendingUp } from 'lucide-react';

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

interface MentionTrendsProps {
  inectaTrend: InectaTrendData[];
  competitorTrend: CompetitorTrendData[];
  modelFilter: 'all' | 'chatgpt' | 'gemini';
  onModelFilterChange: (filter: 'all' | 'chatgpt' | 'gemini') => void;
}

const COMPETITOR_COLORS: Record<string, string> = {
  'Aptean': '#EF4444',
  'Sage': '#F59E0B',
  'NetSuite': '#3B82F6',
  'Infor': '#8B5CF6',
  'Microsoft Dynamics': '#EC4899',
  'Microsoft': '#EC4899', // Alias
  'Dynamics': '#EC4899', // Alias
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

interface CompetitorTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const InectaTrendTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{formatDate(label || '')}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value?.toFixed(1)}%</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CompetitorTrendTooltip = ({ active, payload, label }: CompetitorTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{formatDate(label || '')}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MentionTrends({ inectaTrend, competitorTrend, modelFilter, onModelFilterChange }: MentionTrendsProps) {
  // Filter data based on model filter
  const filteredInectaTrend = React.useMemo(() => {
    if (modelFilter === 'all') return inectaTrend;
    const modelMatch = modelFilter === 'chatgpt' ? 'chatgpt' : 'gemini';
    return inectaTrend.filter(item => 
      item.model?.toLowerCase().includes(modelMatch)
    );
  }, [inectaTrend, modelFilter]);

  const filteredCompetitorTrend = React.useMemo(() => {
    if (modelFilter === 'all') return competitorTrend;
    const modelMatch = modelFilter === 'chatgpt' ? 'chatgpt' : 'gemini';
    return competitorTrend.filter(item => 
      item.model?.toLowerCase().includes(modelMatch)
    );
  }, [competitorTrend, modelFilter]);

  // Prepare competitor trend data - group by date
  const competitorDataByDate = React.useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    
    filteredCompetitorTrend.forEach(item => {
      if (!dateMap.has(item.execution_date)) {
        dateMap.set(item.execution_date, {});
      }
      const dateData = dateMap.get(item.execution_date)!;
      dateData[item.vendor] = item.total_mentions;
    });
    
    // Get all unique vendors
    const vendors = new Set(competitorTrend.map(item => item.vendor));
    
    // Convert to array format
    return Array.from(dateMap.entries()).map(([date, vendors]) => ({
      execution_date: date,
      ...vendors
    }));
  }, [competitorTrend]);
  
  // Get unique vendors for legend
  const vendors = React.useMemo(() => {
    return Array.from(new Set(filteredCompetitorTrend.map(item => item.vendor)));
  }, [filteredCompetitorTrend]);
  
  // Prepare Inecta trend data - pivot by model
  const inectaChartData = React.useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    
    filteredInectaTrend.forEach(item => {
      if (!dateMap.has(item.execution_date)) {
        dateMap.set(item.execution_date, {});
      }
      const dateData = dateMap.get(item.execution_date)!;
      // Use friendly names
      const modelName = item.model?.toLowerCase().includes('gemini') ? 'Gemini' : 'ChatGPT';
      dateData[modelName] = item.mention_rate;
    });
    
    return Array.from(dateMap.entries())
      .map(([date, models]) => ({
        execution_date: date,
        date_display: formatDate(date),
        ...models
      }))
      .sort((a, b) => a.execution_date.localeCompare(b.execution_date));
  }, [filteredInectaTrend]);
  
  const competitorChartData = React.useMemo(() => {
    return competitorDataByDate.map(item => ({
      ...item,
      date_display: formatDate(item.execution_date)
    }));
  }, [competitorDataByDate]);
  
  const maxMentionRate = filteredInectaTrend.length > 0 
    ? Math.max(...filteredInectaTrend.map(d => d.mention_rate), 0)
    : 0;
  const goalLine = Math.max(10, Math.ceil(maxMentionRate / 5) * 5); // Round up to nearest 5, min 10

  return (
    <div className="space-y-6">
      {/* Model Filter Toggle */}
      <div className="flex items-center gap-4">
        <span className="text-gray-400 text-sm font-medium">Filter by Model:</span>
        <div className="flex gap-2">
          <button
            onClick={() => onModelFilterChange('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              modelFilter === 'all' 
                ? 'bg-teal-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Models
          </button>
          <button
            onClick={() => onModelFilterChange('chatgpt')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              modelFilter === 'chatgpt' 
                ? 'bg-teal-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ChatGPT
          </button>
          <button
            onClick={() => onModelFilterChange('gemini')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              modelFilter === 'gemini' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Gemini
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inecta Mention Rate Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            Inecta Mention Rate Over Time
          </h3>
        {!filteredInectaTrend || filteredInectaTrend.length === 0 || inectaChartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={inectaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date_display" 
                stroke="#9CA3AF" 
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#9CA3AF" 
                style={{ fontSize: '12px' }}
                domain={[0, Math.max(goalLine, maxMentionRate * 1.2)]}
                label={{ value: 'Mention Rate %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
              />
              <Tooltip content={<InectaTrendTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="ChatGPT" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="ChatGPT"
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="Gemini" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Gemini"
                connectNulls={false}
              />
              {/* Goal line */}
              <Line 
                type="monotone" 
                dataKey={() => goalLine} 
                stroke="#F59E0B" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name={`Goal (${goalLine}%)`}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Competitor Trends Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Top Competitor Mentions Over Time
        </h3>
        {!filteredCompetitorTrend || filteredCompetitorTrend.length === 0 || competitorChartData.length === 0 || vendors.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No competitor trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={competitorChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date_display" 
                stroke="#9CA3AF" 
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#9CA3AF" 
                style={{ fontSize: '12px' }}
                label={{ value: 'Total Mentions', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
              />
              <Tooltip content={<CompetitorTrendTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                iconType="line"
              />
              {vendors.map((vendor, index) => {
                const color = COMPETITOR_COLORS[vendor] || `hsl(${(index * 60) % 360}, 70%, 50%)`;
                return (
                  <Line
                    key={vendor}
                    type="monotone"
                    dataKey={vendor}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={vendor}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      </div>
    </div>
  );
}

