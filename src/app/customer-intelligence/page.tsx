'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { 
  Download, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Types
type IndustryVertical = 'all' | 'seafood' | 'meat' | 'dairy' | 'produce' | 'bakery' | 'beverage' | 'other';

interface FeatureRecommendation {
  feature_code: string;
  feature_name: string;
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number;
  reasoning: string;
  evidence: string[];
  priority_rank: number;
}

interface CustomerData {
  id: string;
  internal_id: string;
  company_name: string;
  industry_vertical: string;
  overall_confidence_score: number;
  feature_analysis_reasoning: string;
  recommended_features_summary: {
    features: string[];
    sales_talking_points: string[];
  };
  analyzed_at: string;
  recommendations: FeatureRecommendation[];
}

interface Feature {
  feature_code: string;
  feature_name: string;
}

// Main Component
export default function CustomerIntelligencePage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [industryFilter, setIndustryFilter] = useState<IndustryVertical>('all');
  const [featureFilter, setFeatureFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const aieoSupabaseUrl = process.env.NEXT_PUBLIC_AIEO_SUPABASE_URL;
      const aieoSupabaseKey = process.env.NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY;

      if (!aieoSupabaseUrl || !aieoSupabaseKey) {
        setError('AiEO Supabase is not configured. Set NEXT_PUBLIC_AIEO_SUPABASE_URL and NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY.');
        setIsLoading(false);
        return;
      }

      const supabase = createClient(aieoSupabaseUrl, aieoSupabaseKey);

      console.log('[CustomerIntelligence] Fetching customer data...');

      // Fetch customers with recommendations
      const { data: customerData, error: customerError } = await supabase
        .from('ci_customers')
        .select(`
          id,
          internal_id,
          company_name,
          industry_vertical,
          overall_confidence_score,
          feature_analysis_reasoning,
          recommended_features_summary,
          analyzed_at
        `)
        .eq('enrichment_status', 'analyzed')
        .order('company_name', { ascending: true });

      if (customerError) {
        throw customerError;
      }

      // Fetch recommendations
      const { data: recommendationsData, error: recommendationsError } = await supabase
        .from('ci_feature_recommendations')
        .select('*')
        .order('priority_rank', { ascending: true });

      if (recommendationsError) {
        throw recommendationsError;
      }

      // Fetch features for filter
      const { data: featuresData, error: featuresError } = await supabase
        .from('ci_inecta_features')
        .select('feature_code, feature_name')
        .eq('is_active', true)
        .order('feature_name', { ascending: true });

      if (featuresError) {
        console.warn('[CustomerIntelligence] Could not fetch features:', featuresError);
      } else {
        setFeatures(featuresData || []);
      }

      // Combine customers with their recommendations
      const customersWithRecommendations: CustomerData[] = (customerData || []).map(customer => ({
        ...customer,
        recommendations: (recommendationsData || [])
          .filter(rec => rec.customer_id === customer.id)
          .map(rec => ({
            feature_code: rec.feature_code,
            feature_name: rec.feature_name,
            confidence: rec.confidence as 'high' | 'medium' | 'low',
            confidence_score: rec.confidence_score,
            reasoning: rec.reasoning,
            evidence: Array.isArray(rec.evidence) ? rec.evidence : [],
            priority_rank: rec.priority_rank
          }))
      }));

      setCustomers(customersWithRecommendations);
      setFilteredCustomers(customersWithRecommendations);
      console.log('[CustomerIntelligence] Loaded', customersWithRecommendations.length, 'customers');
    } catch (err) {
      console.error('[CustomerIntelligence] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customer intelligence data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...customers];

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(c => 
        c.industry_vertical?.toLowerCase() === industryFilter.toLowerCase()
      );
    }

    // Feature filter
    if (featureFilter !== 'all') {
      filtered = filtered.filter(c => 
        c.recommendations.some(rec => rec.feature_code === featureFilter)
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, industryFilter, featureFilter]);

  // Toggle customer expansion
  const toggleCustomer = (customerId: string) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  // Export to Excel
  const handleExportToExcel = () => {
    try {
      const exportData: Array<{
        'Company Name': string;
        'Internal ID': string;
        'Industry': string;
        'Overall Confidence Score': number;
        'Feature Code': string;
        'Feature Name': string;
        'Feature Confidence': string;
        'Feature Reasoning': string;
        'Priority Rank': number | string;
        'Analysis Date': string;
      }> = [];

      filteredCustomers.forEach(customer => {
        if (customer.recommendations.length === 0) {
          // Customer with no recommendations
          exportData.push({
            'Company Name': customer.company_name,
            'Internal ID': customer.internal_id,
            'Industry': customer.industry_vertical || '',
            'Overall Confidence Score': customer.overall_confidence_score || 0,
            'Feature Code': '',
            'Feature Name': '',
            'Feature Confidence': '',
            'Feature Reasoning': '',
            'Priority Rank': '',
            'Analysis Date': customer.analyzed_at ? new Date(customer.analyzed_at).toLocaleDateString() : ''
          });
        } else {
          // Customer with recommendations
          customer.recommendations.forEach(rec => {
            exportData.push({
              'Company Name': customer.company_name,
              'Internal ID': customer.internal_id,
              'Industry': customer.industry_vertical || '',
              'Overall Confidence Score': customer.overall_confidence_score || 0,
              'Feature Code': rec.feature_code,
              'Feature Name': rec.feature_name,
              'Feature Confidence': rec.confidence,
              'Feature Reasoning': rec.reasoning,
              'Priority Rank': rec.priority_rank,
              'Analysis Date': customer.analyzed_at ? new Date(customer.analyzed_at).toLocaleDateString() : ''
            });
          });
        }
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer Intelligence');

      const currentDate = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `customer-intelligence-${currentDate}.xlsx`);
    } catch (err) {
      console.error('[CustomerIntelligence] Export error:', err);
      alert('Failed to export Excel file');
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format confidence score as percentage
  const formatConfidence = (score: number | null): string => {
    if (score === null || score === undefined) return 'N/A';
    return `${(score * 100).toFixed(1)}%`;
  };

  // Get confidence color
  const getConfidenceColor = (score: number | null): string => {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get confidence badge color
  const getConfidenceBadgeColor = (confidence: string): string => {
    if (confidence === 'high') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (confidence === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Floating particles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => {
          const startX = Math.random() * 100;
          const startY = Math.random() * 100;
          const endX = Math.random() * 100;
          const endY = Math.random() * 100;
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-teal-400/20 rounded-full"
              style={{
                left: `${startX}%`,
                top: `${startY}%`,
              }}
              animate={{
                left: [`${startX}%`, `${endX}%`],
                top: [`${startY}%`, `${endY}%`],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Customer Intelligence Report
          </h1>
          <p className="text-gray-400 text-lg">
            AI-analyzed feature recommendations for current customers
          </p>
          <div className="mt-4 text-xs text-teal-300/80">
            Data sources: <code>ci_customers</code>, <code>ci_feature_recommendations</code>, <code>ci_inecta_features</code>
          </div>
        </motion.div>

        {/* Filters Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Industry Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Industry Vertical
              </label>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value as IndustryVertical)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Industries</option>
                <option value="seafood">Seafood</option>
                <option value="meat">Meat</option>
                <option value="dairy">Dairy</option>
                <option value="produce">Produce</option>
                <option value="bakery">Bakery</option>
                <option value="beverage">Beverage</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Feature Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Feature
              </label>
              <select
                value={featureFilter}
                onChange={(e) => setFeatureFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Features</option>
                {features.map(feature => (
                  <option key={feature.feature_code} value={feature.feature_code}>
                    {feature.feature_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <button
                onClick={handleExportToExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-8"
          >
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-700/30 rounded-lg"></div>
              ))}
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        ) : filteredCustomers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center"
          >
            <Brain className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Customers Found</h3>
            <p className="text-gray-400">
              {customers.length === 0 
                ? 'No analyzed customers found. Check back later.'
                : 'No customers match the current filters.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {filteredCustomers.map((customer) => {
              const isExpanded = expandedCustomers.has(customer.id);
              const confidenceScore = customer.overall_confidence_score || 0;
              const confidenceColor = getConfidenceColor(confidenceScore);

              return (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card overflow-hidden"
                >
                  {/* Collapsed View */}
                  <div
                    onClick={() => toggleCustomer(customer.id)}
                    className="p-6 cursor-pointer hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button className="text-teal-400 hover:text-teal-300 transition-colors">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">
                            {customer.company_name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="px-2 py-1 bg-gray-700/50 rounded text-gray-300">
                              {customer.industry_vertical || 'Unknown'}
                            </span>
                            <span>
                              {customer.recommendations.length} {customer.recommendations.length === 1 ? 'feature' : 'features'}
                            </span>
                            <span className={confidenceColor}>
                              {formatConfidence(confidenceScore)} confidence
                            </span>
                            <span>
                              Analyzed: {formatDate(customer.analyzed_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded View */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-700"
                      >
                        <div className="p-6 space-y-6">
                          {/* Analysis Summary */}
                          {customer.feature_analysis_reasoning && (
                            <div>
                              <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-teal-400" />
                                Feature Analysis Summary
                              </h4>
                              <p className="text-gray-300 leading-relaxed">
                                {customer.feature_analysis_reasoning}
                              </p>
                            </div>
                          )}

                          {/* Recommendations Table */}
                          {customer.recommendations.length > 0 ? (
                            <div>
                              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                Recommended Features ({customer.recommendations.length})
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-700">
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Priority</th>
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Feature</th>
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Confidence</th>
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Reasoning</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {customer.recommendations.map((rec, idx) => (
                                      <tr
                                        key={idx}
                                        className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors"
                                      >
                                        <td className="py-3 px-4 text-gray-300 font-medium">
                                          #{rec.priority_rank}
                                        </td>
                                        <td className="py-3 px-4">
                                          <div>
                                            <div className="text-white font-medium">{rec.feature_name}</div>
                                            <div className="text-xs text-gray-500">{rec.feature_code}</div>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getConfidenceBadgeColor(rec.confidence)}`}>
                                            {rec.confidence}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 text-sm">
                                          {rec.reasoning}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              No feature recommendations available for this customer.
                            </div>
                          )}

                          {/* Sales Talking Points */}
                          {customer.recommended_features_summary?.sales_talking_points &&
                            customer.recommended_features_summary.sales_talking_points.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                Sales Talking Points
                              </h4>
                              <ul className="space-y-2">
                                {customer.recommended_features_summary.sales_talking_points.map((point, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-gray-300">
                                    <span className="text-teal-400 mt-1">•</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

