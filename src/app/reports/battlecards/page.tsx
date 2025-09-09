"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus, Check, AlertCircle, ChevronDown, Tag, FileText, Building2 } from 'lucide-react';

interface Competitor {
  value: string;
  label: string;
}

export default function BattlecardsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState('');
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [showNewCompetitor, setShowNewCompetitor] = useState(false);
  const [verticals, setVerticals] = useState('');
  const [sourceType, setSourceType] = useState('battlecard');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCompetitors, setLoadingCompetitors] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    try {
      setLoadingCompetitors(true);
      const response = await fetch('https://inecta.app.n8n.cloud/webhook/get-competitors');
      
      if (!response.ok) throw new Error('Failed to fetch competitors');
      
      const data = await response.json();
      
      if (data.success && data.competitors) {
        setCompetitors(data.competitors);
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
      setCompetitors([{ value: '__new__', label: '➕ Add New Competitor...' }]);
      setErrorMessage('Could not load competitors. You can still add new ones.');
    } finally {
      setLoadingCompetitors(false);
    }
  };

  const handleCompetitorChange = (value: string) => {
    setSelectedCompetitor(value);
    setShowNewCompetitor(value === '__new__');
    if (value !== '__new__') {
      setNewCompetitorName('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const finalCompetitor = selectedCompetitor === '__new__' ? newCompetitorName : selectedCompetitor;
    
    const formData = {
      competitorSelect: selectedCompetitor,
      newCompetitorName: showNewCompetitor ? newCompetitorName : '',
      competitor: finalCompetitor,
      verticals: verticals.split(',').map(v => v.trim()).filter(v => v),
      sourceType: sourceType,
      content: content
    };

    try {
      const response = await fetch('https://inecta.app.n8n.cloud/webhook/upload-battlecard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccessMessage(`Battlecard for ${finalCompetitor} uploaded successfully!`);
        
        // Reset form
        setSelectedCompetitor('');
        setNewCompetitorName('');
        setVerticals('');
        setContent('');
        setFile(null);
        setShowNewCompetitor(false);
        
        // Refresh competitors if new one was added
        if (selectedCompetitor === '__new__') {
          fetchCompetitors();
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage('Failed to upload battlecard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Background effects */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-teal-600/20"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            Battlecard Upload
          </h1>
          <p className="text-gray-400">
            Add competitive intelligence to your knowledge base
          </p>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Competitor Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <Building2 className="w-4 h-4 text-teal-400" />
                Select Competitor
              </label>
              <div className="relative">
                <select
                  value={selectedCompetitor}
                  onChange={(e) => handleCompetitorChange(e.target.value)}
                  required
                  disabled={loadingCompetitors}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white 
                           focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <option value="">
                    {loadingCompetitors ? '⏳ Loading competitors...' : '-- Select a competitor --'}
                  </option>
                  {competitors.map((comp) => (
                    <option key={comp.value} value={comp.value}>
                      {comp.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* New Competitor Name */}
            <AnimatePresence>
              {showNewCompetitor && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    New Competitor Name
                  </label>
                  <input
                    type="text"
                    value={newCompetitorName}
                    onChange={(e) => setNewCompetitorName(e.target.value)}
                    required={showNewCompetitor}
                    placeholder="Enter new competitor name"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white 
                             placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent
                             transition-all duration-200"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verticals */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <Tag className="w-4 h-4 text-teal-400" />
                Verticals
              </label>
              <input
                type="text"
                value={verticals}
                onChange={(e) => setVerticals(e.target.value)}
                placeholder="e.g., SaaS, Enterprise, Healthcare (comma-separated)"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white 
                         placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent
                         transition-all duration-200"
              />
            </div>

            {/* Source Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <FileText className="w-4 h-4 text-teal-400" />
                Source Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white 
                         focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none
                         transition-all duration-200"
              >
                <option value="battlecard">Battlecard</option>
                <option value="website">Website</option>
                <option value="document">Document</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <FileText className="w-4 h-4 text-teal-400" />
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                placeholder="Enter competitive intelligence information..."
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white 
                         placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent 
                         resize-none transition-all duration-200"
              />
            </div>

            {/* File Upload (Optional) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <Upload className="w-4 h-4 text-teal-400" />
                Upload File (Optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full px-4 py-3 bg-gray-900/50 
                           border-2 border-dashed border-gray-600 rounded-xl text-gray-400 
                           hover:border-teal-500 hover:text-gray-300 cursor-pointer 
                           transition-all duration-200"
                >
                  {file ? (
                    <span className="text-teal-400">{file.name}</span>
                  ) : (
                    <span>Click to upload or drag and drop</span>
                  )}
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white 
                       font-semibold rounded-xl shadow-lg hover:from-teal-600 hover:to-emerald-600 
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Battlecard
                </>
              )}
            </motion.button>
          </form>

          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center gap-3"
              >
                <Check className="w-5 h-5 text-emerald-400" />
                <p className="text-emerald-300">{successMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-300">{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}