'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, FileText, Loader2, ChevronDown } from 'lucide-react';

// TypeScript interfaces
interface Competitor {
  value: string;
  label: string;
}

interface CompetitorApiResponse {
  value?: string;
  name?: string;
  id?: string;
  label?: string;
}

interface FormData {
  competitorSelect: string;
  newCompetitorName: string;
  verticals: string;
  content: string;
  file: File | null; // Add file support
  url: string;
}

interface BattlecardPayload {
  competitorSelect: string;
  newCompetitorName: string;
  competitor: string;
  verticals: string[];
  sourceType: 'battlecard';
  content: string;
  url?: string; // Add url to payload
}

const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function BattlecardUpload() {
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoadingCompetitors, setIsLoadingCompetitors] = useState(true);
  const [isCompetitorDropdownOpen, setIsCompetitorDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    competitorSelect: '',
    newCompetitorName: '',
    verticals: '',
    content: '',
    file: null, // Add file to initial state
    url: '',
  });

  const [alerts, setAlerts] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Add file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const competitorDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch competitors on component mount
  useEffect(() => {
    fetchCompetitors();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (competitorDropdownRef.current && !competitorDropdownRef.current.contains(event.target as Node)) {
        setIsCompetitorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCompetitors = async () => {
    try {
      setIsLoadingCompetitors(true);
      const response = await fetch('/api/webhook/get-competitors');
      if (!response.ok) throw new Error('Failed to fetch competitors');
      
      const data = await response.json();
      const competitorOptions = data.competitors.map((comp: CompetitorApiResponse) => ({
        value: comp.value || comp.name || comp.id,
        label: comp.label || comp.name || comp.value || comp.id
      }));
      
      setCompetitors([
        ...competitorOptions,
        { value: '__new__', label: '+ Add New Competitor' }
      ]);
    } catch (error) {
      console.error('Error fetching competitors:', error);
      setCompetitors([{ value: '__new__', label: '+ Add New Competitor' }]);
    } finally {
      setIsLoadingCompetitors(false);
    }
  };

  const getSelectedCompetitorName = (): string => {
    if (!formData.competitorSelect) return 'Select a competitor...';
    if (formData.competitorSelect === '__new__') return formData.newCompetitorName || '+ Add New Competitor';
    
    const selected = competitors.find(comp => comp.value === formData.competitorSelect);
    return selected?.label || formData.competitorSelect;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      const validTypes = ['.pdf', '.docx', '.txt', '.md'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        setAlerts({ type: 'error', message: 'Invalid file type. Please select PDF, DOCX, TXT, or MD files.' });
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setAlerts({ type: 'error', message: 'File size too large. Please select a file smaller than 10MB.' });
        return;
      }

      setAlerts({ type: null, message: '' });
    }
    
    setFormData(prev => ({ ...prev, file }));
  };

  const validateForm = (): boolean => {
    console.log('Validating form...');
    // Competitor selection is required
    if (!formData.competitorSelect) {
      setAlerts({ type: 'error', message: 'Please select a competitor.' });
      console.log('Validation failed: Competitor not selected.');
      return false;
    }

    // If "Add New" selected, new competitor name is required
    if (formData.competitorSelect === '__new__' && !formData.newCompetitorName.trim()) {
      setAlerts({ type: 'error', message: 'Please enter a new competitor name.' });
      console.log('Validation failed: New competitor name is empty.');
      return false;
    }

    // Either content, file, or URL is required
    if (!formData.content.trim() && !formData.file && !formData.url.trim()) {
      setAlerts({ type: 'error', message: 'Please provide content via text, file upload, or URL.' });
      console.log('Validation failed: Neither content, file, nor URL provided.');
      return false;
    }

    // URL format validation
    if (formData.url.trim() && !isValidUrl(formData.url)) {
      setAlerts({ type: 'error', message: 'Please enter a valid URL starting with http:// or https://' });
      console.log('Validation failed: Invalid URL format.');
      return false;
    }
    
    console.log('Form validation successful.');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    console.log('Form Data before submission:', formData);
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

      console.log('Submitting battlecard:', {
        competitor: finalCompetitorName,
        hasFile: !!formData.file,
        hasContent: !!formData.content,
        hasUrl: !!formData.url,
        fileName: formData.file?.name,
        url: formData.url
      });

      let response: Response;
      const webhookUrl = 'https://inecta.app.n8n.cloud/webhook/upload-battlecard';

      // Determine submission type and prepare payload
      if (formData.file) {
        console.log('Submission method: File Upload');
        // If there's a file, use FormData
        const submitFormData = new FormData();
        
        // Add all text fields
        submitFormData.append('competitorSelect', formData.competitorSelect);
        submitFormData.append('newCompetitorName', formData.newCompetitorName);
        submitFormData.append('competitor', finalCompetitorName);
        submitFormData.append('verticals', JSON.stringify(verticalsArray));
        submitFormData.append('sourceType', 'battlecard');
        submitFormData.append('content', formData.content || ''); // Send empty string if no content
        submitFormData.append('url', formData.url || ''); // Add URL to FormData
        
        // Add the file
        submitFormData.append('file', formData.file, formData.file.name);
        
        // Log FormData contents for debugging
        console.log('FormData entries before fetch:');
        for (const [key, value] of submitFormData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }

        console.log(`Sending FormData request to: ${webhookUrl}, Method: POST`);
        // Send with NO Content-Type header (let browser set it with boundary for multipart/form-data)
        response = await fetch(webhookUrl, {
          method: 'POST',
          body: submitFormData,
        });
        
      } else if (formData.url.trim()) {
        console.log('Submission method: URL Scraping');
        const payload: BattlecardPayload = {
          competitorSelect: formData.competitorSelect,
          newCompetitorName: formData.newCompetitorName,
          competitor: finalCompetitorName,
          verticals: verticalsArray,
          sourceType: 'battlecard',
          content: formData.content,
          url: formData.url, // Add URL to JSON payload
        };

        console.log('=== SUBMISSION DEBUG (JSON) ===');
        console.log('Final payload object:', payload);
        const stringifiedPayload = JSON.stringify(payload);
        console.log('Stringified payload:', stringifiedPayload);
        console.log('Payload byte length:', new TextEncoder().encode(stringifiedPayload).length);

        console.log(`Sending JSON request to: ${webhookUrl}, Method: POST, Headers: { 'Content-Type': 'application/json' }, Body:`, payload);
        response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: stringifiedPayload
        });
      } else {
        console.log('Submission method: Text Content Only');
        // No file, send as JSON
        const payload: BattlecardPayload = {
          competitorSelect: formData.competitorSelect,
          newCompetitorName: formData.newCompetitorName,
          competitor: finalCompetitorName,
          verticals: verticalsArray,
          sourceType: 'battlecard',
          content: formData.content
        };

        console.log('=== SUBMISSION DEBUG (JSON) ===');
        console.log('Final payload object:', payload);
        const stringifiedPayload = JSON.stringify(payload);
        console.log('Stringified payload:', stringifiedPayload);
        console.log('Payload byte length:', new TextEncoder().encode(stringifiedPayload).length);

        // Temporary debug: Send hardcoded payload if competitor is '__DEBUG_TEST__'
        if (formData.competitorSelect === '__DEBUG_TEST__') {
          const debugPayload = { test: 'data', from: 'debug_test' };
          const debugStringified = JSON.stringify(debugPayload);
          console.log('Sending DEBUG JSON payload:', debugPayload);
          console.log('Debug Stringified payload:', debugStringified);
          console.log('Debug Payload byte length:', new TextEncoder().encode(debugStringified).length);
          response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: debugStringified
          });
        } else {
          console.log(`Sending JSON request to: ${webhookUrl}, Method: POST, Headers: { 'Content-Type': 'application/json' }, Body:`, payload);
          response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: stringifiedPayload
          });
        }
      }

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}. Details: ${errorText}`);
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
        content: '',
        file: null,
        url: '',
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // New competitor was added successfully

    } catch (error) {
      console.error('Error submitting battlecard:', error);
      let errorMessage = 'Failed to upload battlecard. Please check the console and try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setAlerts({
        type: 'error',
        message: errorMessage
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Competitor *
            </label>
            <div className="relative" ref={competitorDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCompetitorDropdownOpen(!isCompetitorDropdownOpen)}
                disabled={isLoadingCompetitors}
                className={`w-full px-4 py-3 text-left bg-gray-700 border border-gray-600 rounded-lg transition-colors flex items-center justify-between hover:border-gray-500 focus:border-teal-500 ${
                  isLoadingCompetitors ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span className={formData.competitorSelect ? 'text-white' : 'text-gray-400'}>
                  {isLoadingCompetitors ? 'Loading competitors...' : getSelectedCompetitorName()}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                  isCompetitorDropdownOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {isCompetitorDropdownOpen && !isLoadingCompetitors && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {competitors.map((competitor) => (
                    <button
                      key={competitor.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('competitorSelect', competitor.value);
                        setIsCompetitorDropdownOpen(false);
                        if (competitor.value !== '__new__') {
                          handleInputChange('newCompetitorName', '');
                        }
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors ${
                        formData.competitorSelect === competitor.value ? 'bg-teal-600 text-white' : 'text-gray-300'
                      } ${competitor.value === '__new__' ? 'border-t border-gray-600 text-teal-400' : ''}`}
                    >
                      {competitor.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* New Competitor Name Input */}
          {formData.competitorSelect === '__new__' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                New Competitor Name *
              </label>
              <input
                type="text"
                value={formData.newCompetitorName}
                onChange={(e) => handleInputChange('newCompetitorName', e.target.value)}
                placeholder="Enter competitor name"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          )}

          {/* Verticals Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Verticals (Optional)
            </label>
            <input
              type="text"
              value={formData.verticals}
              onChange={(e) => handleInputChange('verticals', e.target.value)}
              placeholder="e.g., Healthcare, Finance, Technology (comma-separated)"
              disabled={isSubmitting}
              className={`w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <p className="text-xs text-gray-500">
              Enter relevant industry verticals separated by commas
            </p>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload File (Optional)
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-full px-4 py-3 bg-gray-700 
                         border-2 border-dashed border-gray-600 rounded-lg text-gray-400 
                         hover:border-teal-500 hover:text-gray-300 cursor-pointer 
                         transition-all duration-200"
              >
                {formData.file ? (
                  <span className="text-teal-400 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {formData.file.name}
                  </span>
                ) : (
                  <span>Click to upload or drag and drop</span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF, DOCX, TXT, MD (Max 10MB)
            </p>
          </div>

          {/* OR Section */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          {/* URL Input Section */}
          <div>
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-300 mb-2">
              Enter URL (Optional)
            </label>
            <input
              type="url"
              id="url-input"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://competitor-website.com/product-page"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Scrape content directly from a webpage.
            </p>
          </div>

          {/* OR Section */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          {/* Content Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Battlecard Content {!formData.file && !formData.url && '*'}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter competitive intelligence content... (optional if file or URL is provided)"
              rows={8}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.file || formData.url ? 'Optional when file or URL is provided' : 'Required if no file or URL is provided'}
            </p>
          </div>

          {/* Submit Button - unchanged */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Battlecard
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}