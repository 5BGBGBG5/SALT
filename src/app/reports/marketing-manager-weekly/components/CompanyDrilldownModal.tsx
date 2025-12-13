'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { X, Loader2, ExternalLink, AlertCircle } from 'lucide-react';

interface Company {
  hubspot_id: string;
  name: string;
  domain: string;
  industry: string | null;
  employee_count: number | null;
  became_mql_date: string | null;
  became_sql_date: string | null;
  lifecycle_stage: string | null;
}

interface CompanyDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string; // Format: "2024-01"
}

export default function CompanyDrilldownModal({ isOpen, onClose, month }: CompanyDrilldownModalProps) {
  const [activeTab, setActiveTab] = useState<'mql' | 'sql'>('mql');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format month for display
  const monthDisplay = React.useMemo(() => {
    const [year, monthNum] = month.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = parseInt(monthNum, 10) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  }, [month]);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchCompanies() {
      setLoading(true);
      setError(null);

      try {
        // Use Inecta Intelligence Supabase connection (same as main page)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Inecta Intelligence Supabase environment variables are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const column = activeTab === 'mql' ? 'mql_month' : 'sql_month';
        const dateColumn = activeTab === 'mql' ? 'became_mql_date' : 'became_sql_date';

        const { data, error: fetchError } = await supabase
          .from('hubspot_companies')
          .select('hubspot_id, name, domain, industry, employee_count, became_mql_date, became_sql_date, lifecycle_stage')
          .eq(column, month)
          .order(dateColumn, { ascending: false });

        if (fetchError) {
          throw new Error(`Failed to fetch companies: ${fetchError.message}`);
        }

        setCompanies((data as Company[]) || []);
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError(err instanceof Error ? err.message : 'Failed to load companies');
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, [isOpen, month, activeTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card w-full max-w-6xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-white">Companies - {monthDisplay}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-6 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('mql')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'mql'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              MQLs
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'sql'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              SQLs
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              </div>
            )}

            {error && !loading && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    // Will trigger useEffect to refetch
                  }}
                  className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg transition-colors border border-teal-500/50"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && companies.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No companies found for this month
              </div>
            )}

            {!loading && !error && companies.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Company Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Domain</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Industry</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Employees</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Lifecycle Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => {
                      const date = activeTab === 'mql' ? company.became_mql_date : company.became_sql_date;
                      return (
                        <tr
                          key={company.hubspot_id}
                          className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm text-white">
                            <a
                              href={`https://app.hubspot.com/contacts/1972232/company/${company.hubspot_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-400 hover:text-teal-300 flex items-center gap-1"
                            >
                              {company.name || 'N/A'}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {company.domain ? (
                              <a
                                href={`https://${company.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-400 hover:text-teal-300"
                              >
                                {company.domain}
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">{company.industry || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm text-gray-300 text-right">
                            {company.employee_count ? company.employee_count.toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {date ? new Date(date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">{company.lifecycle_stage || 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 text-sm text-gray-400">
            Showing {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

