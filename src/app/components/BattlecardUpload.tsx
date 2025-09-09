'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// TypeScript interfaces
interface Competitor {
  value: string;
  label: string;
}

interface FormData {
  competitorSelect: string;
  newCompetitorName: string;
  verticals: string;
  content: string;
}

interface BattlecardPayload {
  competitorSelect: string;
  newCompetitorName: string;
  competitor: string;
  verticals: string[];
  sourceType: 'battlecard';
  content: string;
}

export default function BattlecardUpload() {
  // State management
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoadingCompetitors, setIsLoadingCompetitors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewCompetitorInput, setShowNewCompetitorInput] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    competitorSelect: '',
    newCompetitorName: '',
    verticals: '',
    content: ''
  });

  const [alerts, setAlerts] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Fetch competitors on component mount
  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    setIsLoadingCompetitors(true);
    try {
      const response = await fetch('https://inecta.app.n8n.cloud/webhook/Get-Competitor');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the response data to match our interface
      const competitorList: Competitor[] = Array.isArray(data) 
        ? data.map(item => ({
            value: typeof item === 'string' ? item : item.value || item.name || item.label,
            label: typeof item === 'string' ? item : item.label || item.name || item.value
          }))
        : [];
      
      setCompetitors(competitorList);
    } catch (error) {
      console.error('Error fetching competitors:', error);
      // Fallback: just show "Add New" option
      setCompetitors([]);
      setAlerts({
        type: 'error',
        message: 'Failed to load competitors. You can still add a new competitor.'
      });
    } finally {
      setIsLoadingCompetitors(false);
    }
  };

  const handleCompetitorSelect = (value: string) => {
    setFormData(prev => ({ ...prev, competitorSelect: value }));
    setShowNewCompetitorInput(value === '__new__');
    setIsDropdownOpen(false);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    // Competitor selection is required
    if (!formData.competitorSelect) {
      setAlerts({ type: 'error', message: 'Please select a competitor.' });
      return false;
    }

    // If "Add New" selected, new competitor name is required
    if (formData.competitorSelect === '__new__' && !formData.newCompetitorName.trim()) {
      setAlerts({ type: 'error', message: 'Please enter a new competitor name.' });
      return false;
    }

    // Content is required
    if (!formData.content.trim()) {
      setAlerts({ type: 'error', message: 'Please enter battlecard content.' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setAlerts({ type: null, message: '' });

    try {
      // Determine final competitor name
      const finalCompetitorName = formData.competitorSelect === '__new__' 
        ? formData.newCompetitorName.trim()
        : formData.competitorSelect;

      // Parse verticals from comma-separated string
      const verticalsArray = formData.verticals
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);

      // Prepare payload
      const payload: BattlecardPayload = {
        competitorSelect: formData.competitorSelect,
        newCompetitorName: formData.newCompetitorName,
        competitor: finalCompetitorName,
        verticals: verticalsArray,
        sourceType: 'battlecard',
        content: formData.content
      };

      console.log('Submitting battlecard:', payload);

      const response = await fetch('https://inecta.app.n8n.cloud/webhook/c3e419ad-120b-4813-9ca3-9e9684175b94', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Success flow
      setAlerts({
        type: 'success',
        message: 'Battlecard uploaded successfully!'
      });

      // Reset form
      setFormData({
        competitorSelect: '',
        newCompetitorName: '',
        verticals: '',
        content: ''
      });
      setShowNewCompetitorInput(false);

      // If new competitor was added, refresh the competitors list
      if (formData.competitorSelect === '__new__') {
        fetchCompetitors();
      }

    } catch (error) {
      console.error('Error submitting battlecard:', error);
      setAlerts({
        type: 'error',
        message: 'Failed to upload battlecard. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAlert = () => {
    setAlerts({ type: null, message: '' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Upload className="w-6 h-6 text-teal-400" />
            Upload Battlecard
          </h2>
          <p className="text-gray-400">
            Add competitive intelligence for sales enablement
          </p>
        </div>

        {/* Alert Messages */}
        <AnimatePresence>
          {alerts.type && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                alerts.type === 'success' 
                  ? 'bg-green-900/20 border border-green-500/30 text-green-400'
                  : 'bg-red-900/20 border border-red-500/30 text-red-400'
              }`}
            >
              {alerts.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="flex-1">{alerts.message}</span>
              <button
                onClick={clearAlert}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Competitor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Competitor *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isLoadingCompetitors}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 flex items-center justify-between disabled:opacity-50"
              >
                <span className="text-left">
                  {isLoadingCompetitors ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading competitors...
                    </span>
                  ) : formData.competitorSelect ? (
                    formData.competitorSelect === '__new__' 
                      ? 'Add New Competitor...'
                      : competitors.find(c => c.value === formData.competitorSelect)?.label || formData.competitorSelect
                  ) : (
                    'Select a competitor...'
                  )}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && !isLoadingCompetitors && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {competitors.map((competitor) => (
                      <button
                        key={competitor.value}
                        type="button"
                        onClick={() => handleCompetitorSelect(competitor.value)}
                        className="w-full px-4 py-3 text-left text-white hover:bg-gray-600 transition-colors"
                      >
                        {competitor.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleCompetitorSelect('__new__')}
                      className="w-full px-4 py-3 text-left text-teal-400 hover:bg-gray-600 transition-colors border-t border-gray-600"
                    >
                      ➕ Add New Competitor...
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* New Competitor Input */}
          <AnimatePresence>
            {showNewCompetitorInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Competitor Name *
                </label>
                <input
                  type="text"
                  value={formData.newCompetitorName}
                  onChange={(e) => handleInputChange('newCompetitorName', e.target.value)}
                  placeholder="Enter competitor name..."
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verticals */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Verticals
            </label>
            <input
              type="text"
              value={formData.verticals}
              onChange={(e) => handleInputChange('verticals', e.target.value)}
              placeholder="e.g., Seafood, Dairy, Bakery (comma-separated)"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Separate multiple verticals with commas
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Battlecard Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter competitive intelligence content..."
              rows={8}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Battlecard
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
