'use client';

import React from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart
} from 'recharts';

interface PipelineData {
  month: string;
  month_display: string;
  deals_created: number;
  pipeline_value: number;
  deals_won: number;
  revenue_won: number;
  deals_lost: number;
  revenue_lost: number;
  avg_deal_size: number;
}

interface PipelineChartProps {
  data: PipelineData[];
}

export default function PipelineChart({ data }: PipelineChartProps) {
  // Format data for chart - convert month to "Jan 24" format
  const chartData = data.map((item) => {
    const [year, month] = item.month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month, 10) - 1;
    const monthShort = monthNames[monthIndex];
    const yearShort = year.slice(-2);
    
    return {
      month: `${monthShort} ${yearShort}`,
      monthFull: item.month_display,
      'Pipeline Value': item.pipeline_value || 0,
      'Deals Won': item.deals_won || 0
    };
  });

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">
                {entry.name === 'Pipeline Value' 
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(entry.value)
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="month"
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          yAxisId="left"
          stroke="#9CA3AF" 
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => {
            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
            return `$${value}`;
          }}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          stroke="#9CA3AF" 
          style={{ fontSize: '12px' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ color: '#9CA3AF' }}
          iconType="square"
        />
        <Bar 
          yAxisId="left"
          dataKey="Pipeline Value" 
          fill="#3B82F6" 
          name="Pipeline Value" 
          radius={[4, 4, 0, 0]} 
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="Deals Won" 
          stroke="#10B981" 
          strokeWidth={2}
          name="Deals Won"
          dot={{ fill: '#10B981', r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

