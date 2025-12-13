'use client';

import React from 'react';
import { DollarSign, TrendingUp, Package, Target } from 'lucide-react';
import MetricCard from '@/app/components/MetricCard';

interface PipelineSummaryStats {
  totalPipelineGenerated: number;
  totalRevenueWon: number;
  avgDealSize: number;
  winRate: number;
}

interface PipelineSummaryCardsProps {
  stats: PipelineSummaryStats;
  dateRangeText: string;
}

export default function PipelineSummaryCards({ stats, dateRangeText }: PipelineSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div>
        <MetricCard
          title="Total Pipeline Generated"
          value={stats.totalPipelineGenerated}
          format="currency"
          icon={<DollarSign className="w-8 h-8" />}
        />
        <p className="text-xs text-gray-400 text-center mt-2">in {dateRangeText.toLowerCase()}</p>
      </div>
      <div>
        <MetricCard
          title="Total Revenue Won"
          value={stats.totalRevenueWon}
          format="currency"
          icon={<TrendingUp className="w-8 h-8" />}
        />
        <p className="text-xs text-gray-400 text-center mt-2">in {dateRangeText.toLowerCase()}</p>
      </div>
      <div>
        <MetricCard
          title="Average Deal Size"
          value={stats.avgDealSize}
          format="currency"
          icon={<Package className="w-8 h-8" />}
        />
        <p className="text-xs text-gray-400 text-center mt-2">per deal</p>
      </div>
      <div>
        <MetricCard
          title="Win Rate"
          value={stats.winRate}
          format="percentage"
          icon={<Target className="w-8 h-8" />}
        />
        <p className="text-xs text-gray-400 text-center mt-2">won / (won + lost)</p>
      </div>
    </div>
  );
}

