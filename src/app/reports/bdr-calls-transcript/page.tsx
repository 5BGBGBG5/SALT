"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Calendar, 
  Users, 
  TrendingUp, 
  Eye, 
  ExternalLink, 
  Filter,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
  BarChart3,
  Clock,
  MessageSquare
} from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import { 
  HSEngagement, 
  HSOwner, 
  fetchHSEngagements, 
  fetchHSOwners,
  OUTCOME_COLORS,
  OUTCOME_LABELS 
} from '../../../lib/supabase/discovery-bot';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Filters {
  ownerId: string;
  timePeriod: string;
}


const TIME_PERIODS = [
  { value: 'all', label: 'All Time' },
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
];

export default function BDRCallsTranscriptPage() {
  // State management
  const [engagements, setEngagements] = useState<HSEngagement[]>([]);
  const [owners, setOwners] = useState<HSOwner[]>([]);
  const [filters, setFilters] = useState<Filters>({
    ownerId: 'all',
    timePeriod: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<HSEngagement | null>(null);
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [engagementsData, ownersData] = await Promise.all([
          fetchHSEngagements(),
          fetchHSOwners()
        ]);
        
        // The outcome field already exists and has data, no mapping needed
        const mappedEngagements = engagementsData;
        
        setEngagements(mappedEngagements);
        setOwners(ownersData);
      } catch (err) {
        console.error('Error loading BDR calls data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter engagements based on current filters
  const filteredEngagements = useMemo(() => {
    let filtered = [...engagements];

    // Filter by owner
    if (filters.ownerId !== 'all') {
      filtered = filtered.filter(eng => eng.hubspot_owner_id === parseInt(filters.ownerId));
    }

    // Filter by time period
    if (filters.timePeriod !== 'all') {
      const days = parseInt(filters.timePeriod);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(eng => {
        const engagementDate = new Date(eng.created_at); // Use created_at instead
        return engagementDate >= cutoffDate;
      });
    }

    return filtered;
  }, [engagements, filters]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalCalls = filteredEngagements.length;
    // Count follow_up_scheduled outcomes as "meetings booked"
    const meetingsBooked = filteredEngagements.filter(eng => {
      return eng.outcome === 'follow_up_scheduled';
    }).length;
    const conversionRate = totalCalls > 0 ? (meetingsBooked / totalCalls) * 100 : 0;

    return {
      totalCalls,
      meetingsBooked,
      conversionRate
    };
  }, [filteredEngagements]);

  // Calculate outcome distribution
  const outcomeDistribution = useMemo(() => {
    const outcomeCounts: Record<string, number> = {};
    
    filteredEngagements.forEach(eng => {
      const outcome = eng.outcome || 'unknown';
      outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
    });

    const total = filteredEngagements.length;
    
    return Object.entries(outcomeCounts)
      .map(([outcome, count]) => ({
        outcome,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredEngagements]);

  // Format call length (already in seconds)
  const formatCallLength = (seconds: number | null): string => {
    if (!seconds || seconds === 0) return 'N/A';
    return `${seconds}s`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get outcome badge color
  const getOutcomeBadgeColor = (outcome: string | null | undefined): string => {
    if (!outcome) return 'bg-gray-500';
    return OUTCOME_COLORS[outcome as keyof typeof OUTCOME_COLORS] || 'bg-gray-500';
  };

  // Get outcome label
  const getOutcomeLabel = (outcome: string | null | undefined): string => {
    if (!outcome) return 'Not Analyzed';
    return OUTCOME_LABELS[outcome as keyof typeof OUTCOME_LABELS] || outcome;
  };

  // Format objections array
  const formatObjections = (objections: string[] | null): string => {
    if (!objections || objections.length === 0) return '-';
    return objections.join(', ');
  };

  // Handle filter changes
  const handleOwnerChange = (ownerId: string) => {
    setFilters(prev => ({ ...prev, ownerId }));
    setIsOwnerDropdownOpen(false);
  };

  const handleTimeChange = (timePeriod: string) => {
    setFilters(prev => ({ ...prev, timePeriod }));
    setIsTimeDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading BDR calls data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">BDR Calls Transcript</h1>
        <p className="text-gray-400">Track and analyze BDR call performance and outcomes</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-teal-400" />
            <span className="text-white font-medium">Filters:</span>
          </div>

          {/* Owner Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white hover:border-teal-500 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>
                {filters.ownerId === 'all' 
                  ? 'All Owners' 
                  : owners.find(o => o.hubspot_owner_id === parseInt(filters.ownerId))?.owner_name || 'Unknown Owner'
                }
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOwnerDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isOwnerDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-64 glass-card py-2 z-50"
                >
                  <button
                    onClick={() => handleOwnerChange('all')}
                    className={`block w-full text-left px-4 py-2 hover:bg-teal-500/10 transition-colors ${
                      filters.ownerId === 'all' ? 'text-teal-400 bg-teal-500/10' : 'text-gray-300'
                    }`}
                  >
                    All Owners
                  </button>
                  {owners.map(owner => (
                    <button
                      key={owner.hubspot_owner_id}
                      onClick={() => handleOwnerChange(owner.hubspot_owner_id.toString())}
                      className={`block w-full text-left px-4 py-2 hover:bg-teal-500/10 transition-colors ${
                        filters.ownerId === owner.hubspot_owner_id.toString() ? 'text-teal-400 bg-teal-500/10' : 'text-gray-300'
                      }`}
                    >
                      {owner.owner_name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time Period Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white hover:border-teal-500 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>
                {TIME_PERIODS.find(p => p.value === filters.timePeriod)?.label || 'All Time'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isTimeDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-48 glass-card py-2 z-50"
                >
                  {TIME_PERIODS.map(period => (
                    <button
                      key={period.value}
                      onClick={() => handleTimeChange(period.value)}
                      className={`block w-full text-left px-4 py-2 hover:bg-teal-500/10 transition-colors ${
                        filters.timePeriod === period.value ? 'text-teal-400 bg-teal-500/10' : 'text-gray-300'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <MetricCard
          title="Total Calls"
          value={kpis.totalCalls}
          icon={<Phone className="w-8 h-8" />}
          format="number"
        />
        <MetricCard
          title="Meetings Booked"
          value={kpis.meetingsBooked}
          icon={<Calendar className="w-8 h-8" />}
          format="number"
        />
        <MetricCard
          title="Conversion Rate"
          value={kpis.conversionRate}
          icon={<TrendingUp className="w-8 h-8" />}
          format="percentage"
        />
      </motion.div>

      {/* Call Outcomes Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-teal-400" />
          <h2 className="text-xl font-semibold text-white">Call Outcomes</h2>
        </div>

        {outcomeDistribution.length > 0 ? (
          <div className="space-y-4">
            {outcomeDistribution.map((outcome, index) => (
              <motion.div
                key={outcome.outcome}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-32 text-sm text-gray-300 font-medium">
                  {getOutcomeLabel(outcome.outcome)}
                </div>
                <div className="flex-1 relative">
                  <div className="h-8 bg-gray-800 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${outcome.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full ${getOutcomeBadgeColor(outcome.outcome)} opacity-80`}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-white font-medium">{outcome.count}</span>
                    <span className="text-gray-300 text-sm">{outcome.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Voicemail Insight */}
            {outcomeDistribution.find(o => o.outcome === 'voicemail') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
              >
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium">Insight</span>
                </div>
                <p className="text-gray-300 text-sm">
                  {outcomeDistribution.find(o => o.outcome === 'voicemail')?.percentage.toFixed(1)}% of calls resulted in voicemail. 
                  Consider adjusting call timing or follow-up strategies.
                </p>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No outcome data available for the selected filters.
          </div>
        )}
      </motion.div>

      {/* Recent Calls Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Phone className="w-6 h-6 text-teal-400" />
          <h2 className="text-xl font-semibold text-white">Recent Calls</h2>
          <span className="text-gray-400 text-sm">({filteredEngagements.length} calls)</span>
        </div>

        {filteredEngagements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Outcome</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Call Length</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Discovery Questions</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Objections</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEngagements.map((engagement, index) => (
                  <motion.tr
                    key={engagement.hubspot_engagement_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-300">
                      {formatDate(engagement.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getOutcomeBadgeColor(engagement.outcome)}`}>
                        {getOutcomeLabel(engagement.outcome)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {formatCallLength(engagement.call_length)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {engagement.discovery_question_count || 0}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {formatObjections(engagement.objections_identified)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedTranscript(engagement)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No calls found</h3>
            <p className="text-gray-400">No calls found for the selected filters.</p>
          </div>
        )}
      </motion.div>

      {/* Transcript Modal */}
      <AnimatePresence>
        {selectedTranscript && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTranscript(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Call Transcript</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{formatDate(selectedTranscript.created_at)}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getOutcomeBadgeColor(selectedTranscript.outcome)}`}>
                      {getOutcomeLabel(selectedTranscript.outcome)}
                    </span>
                    <span>{formatCallLength(selectedTranscript.call_length)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTranscript(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Call Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Discovery Questions</div>
                  <div className="text-white font-semibold">{selectedTranscript.discovery_question_count || 0}</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Objections Identified</div>
                  <div className="text-white font-semibold">{formatObjections(selectedTranscript.objections_identified)}</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Talk Time Ratio</div>
                  <div className="text-white font-semibold">
                    {selectedTranscript.talk_time_ratio ? `${(selectedTranscript.talk_time_ratio * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Transcript Content */}
              <div className="bg-gray-800/30 p-4 rounded-lg mb-6">
                <h4 className="text-white font-medium mb-3">Transcript</h4>
                <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed max-h-96 overflow-y-auto">
                  {selectedTranscript.call_transcript || 'Transcript not available'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {selectedTranscript.call_recording_url && (
                  <a
                    href={selectedTranscript.call_recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Listen to Recording
                  </a>
                )}
                <button
                  onClick={() => setSelectedTranscript(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
