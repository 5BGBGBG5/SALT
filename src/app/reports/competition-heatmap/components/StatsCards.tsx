'use client';

import React from 'react';
import { FileText, CheckCircle, TrendingUp, Target } from 'lucide-react';
import MetricCard from '@/app/components/MetricCard';

interface OverviewStats {
  totalResponses: number;
  inectaMentions: number;
  mentionRate: number;
  modelsTested: number;
  topCompetitor: string;
  topCompetitorMentions: number;
}

interface StatsCardsProps {
  stats: OverviewStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <MetricCard
        title="Total Responses"
        value={stats.totalResponses}
        format="number"
        icon={<FileText className="w-8 h-8" />}
      />
      <MetricCard
        title="Inecta Mentions"
        value={stats.inectaMentions}
        format="number"
        icon={<CheckCircle className="w-8 h-8" />}
      />
      <MetricCard
        title="Mention Rate"
        value={stats.mentionRate}
        format="percentage"
        icon={<TrendingUp className="w-8 h-8" />}
      />
      <div className="glass-card p-6 relative overflow-hidden group cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-4 right-4 text-teal-400/30 group-hover:text-teal-400/50 transition-colors duration-300 animate-float">
          <Target className="w-8 h-8" />
        </div>
        <div className="relative z-10">
          <p className="text-gray-400 text-sm mb-2 font-medium">Top Competitor</p>
          <p className="text-3xl font-bold text-white mb-2">{stats.topCompetitor}</p>
          <p className="text-sm text-gray-400">{stats.topCompetitorMentions} mentions</p>
        </div>
      </div>
    </div>
  );
}

