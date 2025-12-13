'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

interface MonthlyData {
  month: string;
  month_display: string;
  mql_count: number;
  sql_count: number;
  conversion_rate: number;
}

interface MqlSqlTableProps {
  data: MonthlyData[];
  onRowClick: (month: string) => void;
}

export default function MqlSqlTable({ data, onRowClick }: MqlSqlTableProps) {
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
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">MQLs</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">SQLs</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Conversion Rate</th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <motion.tr
              key={row.month}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
              onClick={() => onRowClick(row.month)}
            >
              <td className="py-3 px-4 text-sm text-white">{row.month_display}</td>
              <td className="py-3 px-4 text-sm text-gray-300 text-right">{row.mql_count || 0}</td>
              <td className="py-3 px-4 text-sm text-gray-300 text-right">{row.sql_count || 0}</td>
              <td className="py-3 px-4 text-sm text-gray-300 text-right">
                {row.conversion_rate ? `${row.conversion_rate.toFixed(1)}%` : '0%'}
              </td>
              <td className="py-3 px-4 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(row.month);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg transition-colors border border-teal-500/50 text-xs"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


