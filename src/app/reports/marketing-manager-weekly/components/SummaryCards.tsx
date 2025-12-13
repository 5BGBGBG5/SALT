'use client';

import React from 'react';
import { Users, Target, TrendingUp, BarChart3 } from 'lucide-react';
import MetricCard from '@/app/components/MetricCard';

interface SummaryStats {
  totalMQLs: number;
  totalSQLs: number;
  avgConversionRate: number;
  avgMonthlyMQLs: number;
  months: number;
}

interface SummaryCardsProps {
  stats: SummaryStats;
  dateRangeText: string;
}

export default function SummaryCards({ stats, dateRangeText }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div>
        <MetricCard
          title="Total MQLs"
          value={stats.totalMQLs}
          format="number"
          icon={<Users className="w-8 h-8" />}
        />
        <p className="text-xs text-gray-400 text-center mt-2">in {dateRangeText.toLowerCase()}</p>
      </div>
      <div>
        <MetricCard
          title="Total SQLs"
          value={stats.totalSQLs}
          format="number"
          icon={<Target className="w-8 h-8" />}
        />
        <p className="text-xs text-gray-400 text-center mt-2">in {dateRangeText.toLowerCase()}</p>
      </div>
      <div>
        <MetricCard
          title="Avg Conversion Rate"
          value={stats.avgConversionRate}
          format="percentage"
          icon={<TrendingUp className="w-8 h-8" />}
        />
        <p className="text-xs text-gray-400 text-center mt-2">SQL/MQL</p>
      </div>
      <div>
        <MetricCard
          title="Avg Monthly MQLs"
          value={Math.round(stats.avgMonthlyMQLs)}
          format="number"
          icon={<BarChart3 className="w-8 h-8" />}
        />
        <p className="text-xs text-gray-400 text-center mt-2">per month</p>
      </div>
    </div>
  );
}

