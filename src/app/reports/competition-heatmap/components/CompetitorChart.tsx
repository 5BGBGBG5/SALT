'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CompetitorMention {
  vendor: string;
  totalMentions: number;
  responsesMentionedIn: number;
}

interface CompetitorChartProps {
  competitors: CompetitorMention[];
  inectaMentions: number;
}

export default function CompetitorChart({ competitors, inectaMentions }: CompetitorChartProps) {
  // Prepare data for chart - include Inecta
  const chartData = [
    ...competitors.map(c => ({
      vendor: c.vendor,
      mentions: c.totalMentions,
      type: 'competitor'
    })),
    {
      vendor: 'Inecta',
      mentions: inectaMentions,
      type: 'inecta'
    }
  ].sort((a, b) => b.mentions - a.mentions);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        vendor: string;
        mentions: number;
      };
    }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{data.vendor}</p>
          <p className="text-sm text-gray-300">
            Total Mentions: <span className="font-semibold text-white">{data.mentions}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No competitor data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Horizontal Bar Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <YAxis 
            type="category" 
            dataKey="vendor" 
            stroke="#9CA3AF" 
            style={{ fontSize: '12px' }}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="mentions" 
            fill="#3B82F6"
            radius={[0, 4, 4, 0]}
            name="Mentions"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* List View */}
      <div className="space-y-2">
        {chartData.map((item, index) => {
          const maxMentions = Math.max(...chartData.map(d => d.mentions));
          const percentage = (item.mentions / maxMentions) * 100;
          const isInecta = item.vendor === 'Inecta';
          
          return (
            <motion.div
              key={item.vendor}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4"
            >
              <div className="w-32 text-sm text-gray-300 font-medium">{item.vendor}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.05 }}
                  className={`h-full ${
                    isInecta 
                      ? 'bg-teal-500' 
                      : 'bg-blue-500'
                  } rounded-full flex items-center justify-end pr-2`}
                >
                  {percentage > 10 && (
                    <span className="text-xs font-semibold text-white">{item.mentions}</span>
                  )}
                </motion.div>
                {percentage <= 10 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-300">
                    {item.mentions}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

