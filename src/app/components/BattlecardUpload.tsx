'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Upload, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';

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
  file: File | null; // Add file support
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
    content: '',
    file: null // Add file to initial state
  });

  const [alerts, setAlerts] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Add file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Either content or file is required
    if (!formData.content.trim() && !formData.file) {
      setAlerts({ type: 'error', message: 'Please provide either content text or upload a file.' });
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

      console.log('Submitting battlecard:', {
        competitor: finalCompetitorName,
        hasFile: !!formData.file,
        hasContent: !!formData.content,
        fileName: formData.file?.name
      });

      let response: Response;

      if (formData.file) {
        // If there's a file, use FormData
        const submitFormData = new FormData();
        
        // Add all text fields
        submitFormData.append('competitorSelect', formData.competitorSelect);
        submitFormData.append('newCompetitorName', formData.newCompetitorName);
        submitFormData.append('competitor', finalCompetitorName);
        submitFormData.append('verticals', JSON.stringify(verticalsArray));
        submitFormData.append('sourceType', 'battlecard');
        submitFormData.append('content', formData.content || ''); // Send empty string if no content
        
        // Add the file
        submitFormData.append('file', formData.file, formData.file.name);
        
        // Log FormData contents for debugging
        console.log('FormData contents:');
        for (let [key, value] of submitFormData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }

        // Send with NO Content-Type header (let browser set it with boundary for multipart/form-data)
        response = await fetch('https://inecta.app.n8n.cloud/webhook/c3e419ad-120b-4813-9ca3-9e9684175b94', {
          method: 'POST',
          body: submitFormData,
          // DO NOT set Content-Type header for FormData!
        });
        
      } else {
        // No file, send as JSON
        const payload: BattlecardPayload = {
          competitorSelect: formData.competitorSelect,
          newCompetitorName: formData.newCompetitorName,
          competitor: finalCompetitorName,
          verticals: verticalsArray,
          sourceType: 'battlecard',
          content: formData.content
        };

        response = await fetch('https://inecta.app.n8n.cloud/webhook/c3e419ad-120b-4813-9ca3-9e9684175b94', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      }

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
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
        content: '',
        file: null
      });
      setShowNewCompetitorInput(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

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
          {/* Competitor Selection - unchanged */}
          {/* ... keep existing competitor selection code ... */}

          {/* File Upload - NEW */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              File Upload (Optional)
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

          {/* Content - UPDATED */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Battlecard Content {!formData.file && '*'}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter competitive intelligence content... (optional if file is uploaded)"
              rows={8}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.file ? 'Optional when file is uploaded' : 'Required if no file is uploaded'}
            </p>
          </div>

          {/* Submit Button - unchanged */}
          {/* ... keep existing submit button code ... */}
        </form>
      </div>
    </motion.div>
  );
}