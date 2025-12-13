'use client';

import React from 'react';
import { motion } from 'framer-motion';

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

interface PipelineTableProps {
  data: PipelineData[];
}

export default function PipelineTable({ data }: PipelineTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const calculateWinRate = (won: number, lost: number) => {
    const total = won + lost;
    if (total === 0) return 0;
    return (won / total) * 100;
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Month</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Deals Created</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Pipeline Value</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Deals Won</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Revenue Won</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const winRate = calculateWinRate(row.deals_won || 0, row.deals_lost || 0);
            return (
              <motion.tr
                key={row.month}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-white">{row.month_display}</td>
                <td className="py-3 px-4 text-sm text-gray-300 text-right">{row.deals_created || 0}</td>
                <td className="py-3 px-4 text-sm text-gray-300 text-right">{formatCurrency(row.pipeline_value || 0)}</td>
                <td className="py-3 px-4 text-sm text-gray-300 text-right">{row.deals_won || 0}</td>
                <td className="py-3 px-4 text-sm text-gray-300 text-right">{formatCurrency(row.revenue_won || 0)}</td>
                <td className="py-3 px-4 text-sm text-gray-300 text-right">
                  {winRate.toFixed(1)}%
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

