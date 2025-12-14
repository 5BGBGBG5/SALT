'use client';

import React from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
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
  total_responses: number;
  inecta_mentions: number;
  mention_rate: number;
}

interface CompetitorTrendData {
  execution_date: string;
  vendor: string;
  total_mentions: number;
}

interface MentionTrendsProps {
  inectaTrend: InectaTrendData[];
  competitorTrend: CompetitorTrendData[];
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
    payload: InectaTrendData & { date_display: string };
    value: number;
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
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{formatDate(label || '')}</p>
        <p className="text-sm text-teal-400">
          Mention Rate: <span className="font-semibold">{data.mention_rate.toFixed(1)}%</span>
        </p>
        <p className="text-sm text-gray-400">
          Mentions: {data.inecta_mentions} / {data.total_responses} responses
        </p>
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

export default function MentionTrends({ inectaTrend, competitorTrend }: MentionTrendsProps) {
  // Prepare competitor trend data - group by date
  const competitorDataByDate = React.useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    
    competitorTrend.forEach(item => {
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
    return Array.from(new Set(competitorTrend.map(item => item.vendor)));
  }, [competitorTrend]);
  
  // Prepare Inecta trend data with formatted dates
  const inectaChartData = React.useMemo(() => {
    return inectaTrend.map(item => ({
      ...item,
      date_display: formatDate(item.execution_date)
    }));
  }, [inectaTrend]);
  
  const competitorChartData = React.useMemo(() => {
    return competitorDataByDate.map(item => ({
      ...item,
      date_display: formatDate(item.execution_date)
    }));
  }, [competitorDataByDate]);
  
  const maxMentionRate = Math.max(...inectaTrend.map(d => d.mention_rate), 0);
  const goalLine = Math.max(10, Math.ceil(maxMentionRate / 5) * 5); // Round up to nearest 5, min 10

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inecta Mention Rate Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-400" />
          Inecta Mention Rate Over Time
        </h3>
        {inectaChartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={inectaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorMentionRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
              <Area 
                type="monotone" 
                dataKey="mention_rate" 
                stroke="#10B981" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMentionRate)"
                name="Mention Rate"
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
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Competitor Trends Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Top Competitor Mentions Over Time
        </h3>
        {competitorChartData.length === 0 || vendors.length === 0 ? (
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
  );
}

