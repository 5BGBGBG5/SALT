'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, ChevronDown, Plus, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
}

interface FormData {
  competitorSelect: string;
  newCompetitorName: string;
  verticals: string[];
  sourceType: string;
  content: string;
  file: File | null;
}

interface BattlecardUploadFormProps {
  onClose?: () => void;
  onSuccess?: (message: string) => void;
}

const SOURCE_TYPES = [
  { value: 'battlecard', label: 'Battlecard' },
  { value: 'website', label: 'Website' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' }
];

export default function BattlecardUploadForm({ onClose, onSuccess }: BattlecardUploadFormProps) {
  // State management
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [formData, setFormData] = useState<FormData>({
    competitorSelect: '',
    newCompetitorName: '',
    verticals: [],
    sourceType: 'battlecard',
    content: '',
    file: null
  });

  // UI state
  const [isLoadingCompetitors, setIsLoadingCompetitors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Dropdown state
  const [isCompetitorDropdownOpen, setIsCompetitorDropdownOpen] = useState(false);
  const [verticalInput, setVerticalInput] = useState('');
  
  // Refs
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
      const response = await fetch('/webhook/get-competitors');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch competitors: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sort competitors alphabetically
      const sortedCompetitors = (data.competitors || []).sort((a: Competitor, b: Competitor) => 
        a.name.localeCompare(b.name)
      );
      
      setCompetitors(sortedCompetitors);
    } catch (error) {
      console.error('Error fetching competitors:', error);
      setErrors(prev => ({ ...prev, competitors: 'Failed to load competitors' }));
    } finally {
      setIsLoadingCompetitors(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Competitor validation
    if (!formData.competitorSelect) {
      newErrors.competitor = 'Please select a competitor';
    } else if (formData.competitorSelect === '__new__' && !formData.newCompetitorName.trim()) {
      newErrors.newCompetitor = 'Please enter the new competitor name';
    }

    // Content or file validation
    if (!formData.content.trim() && !formData.file) {
      newErrors.content = 'Please provide either content text or upload a file';
    }

    // Source type validation
    if (!formData.sourceType) {
      newErrors.sourceType = 'Please select a source type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const submitFormData = new FormData();
      
      // Add form fields
      submitFormData.append('competitorSelect', formData.competitorSelect);
      if (formData.competitorSelect === '__new__') {
        submitFormData.append('newCompetitorName', formData.newCompetitorName.trim());
      }
      submitFormData.append('verticals', JSON.stringify(formData.verticals));
      submitFormData.append('sourceType', formData.sourceType);
      submitFormData.append('content', formData.content);
      
      // Add file if present
      if (formData.file) {
        submitFormData.append('file', formData.file);
      }

      const response = await fetch('/webhook/upload-battlecard', {
        method: 'POST',
        body: submitFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      await response.json(); // Process response but don't store unused result
      
      setSubmitMessage({ type: 'success', text: 'Battlecard uploaded successfully!' });
      
      // Reset form
      setFormData({
        competitorSelect: '',
        newCompetitorName: '',
        verticals: [],
        sourceType: 'battlecard',
        content: '',
        file: null
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Call success callback
      if (onSuccess) {
        onSuccess('Battlecard uploaded successfully!');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setSubmitMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to upload battlecard' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompetitorSelect = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      competitorSelect: value,
      newCompetitorName: value === '__new__' ? prev.newCompetitorName : ''
    }));
    setIsCompetitorDropdownOpen(false);
    setErrors(prev => ({ ...prev, competitor: '', newCompetitor: '' }));
  };

  const handleVerticalAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const vertical = verticalInput.trim();
      if (vertical && !formData.verticals.includes(vertical)) {
        setFormData(prev => ({
          ...prev,
          verticals: [...prev.verticals, vertical]
        }));
      }
      setVerticalInput('');
    }
  };

  const removeVertical = (index: number) => {
    setFormData(prev => ({
      ...prev,
      verticals: prev.verticals.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
    setErrors(prev => ({ ...prev, content: '' }));
  };

  const getSelectedCompetitorName = () => {
    if (formData.competitorSelect === '__new__') {
      return formData.newCompetitorName || 'Add New Competitor...';
    }
    const selected = competitors.find(c => c.id === formData.competitorSelect);
    return selected?.name || 'Select Competitor...';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-400" />
            Upload Battlecard
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                className={`w-full px-4 py-3 text-left bg-gray-800 border rounded-lg transition-colors flex items-center justify-between ${
                  errors.competitor ? 'border-red-500' : 'border-gray-600 hover:border-gray-500 focus:border-teal-500'
                } ${isLoadingCompetitors ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={formData.competitorSelect ? 'text-white' : 'text-gray-400'}>
                  {isLoadingCompetitors ? 'Loading competitors...' : getSelectedCompetitorName()}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                  isCompetitorDropdownOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {isCompetitorDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                  {competitors.map((competitor) => (
                    <button
                      key={competitor.id}
                      type="button"
                      onClick={() => handleCompetitorSelect(competitor.id)}
                      className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors first:rounded-t-lg"
                    >
                      {competitor.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleCompetitorSelect('__new__')}
                    className="w-full px-4 py-3 text-left text-teal-400 hover:bg-gray-700 transition-colors border-t border-gray-600 rounded-b-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Competitor...
                  </button>
                </div>
              )}
            </div>
            {errors.competitor && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.competitor}
              </p>
            )}
          </div>

          {/* New Competitor Name */}
          {formData.competitorSelect === '__new__' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                New Competitor Name *
              </label>
              <input
                type="text"
                value={formData.newCompetitorName}
                onChange={(e) => setFormData(prev => ({ ...prev, newCompetitorName: e.target.value }))}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 transition-colors ${
                  errors.newCompetitor ? 'border-red-500' : 'border-gray-600 focus:border-teal-500'
                }`}
                placeholder="Enter competitor name"
              />
              {errors.newCompetitor && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.newCompetitor}
                </p>
              )}
            </div>
          )}

          {/* Verticals */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Verticals
            </label>
            <div className="space-y-2">
              {formData.verticals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.verticals.map((vertical, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-teal-600/20 text-teal-300 rounded-full text-sm"
                    >
                      {vertical}
                      <button
                        type="button"
                        onClick={() => removeVertical(index)}
                        className="text-teal-400 hover:text-teal-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={verticalInput}
                onChange={(e) => setVerticalInput(e.target.value)}
                onKeyDown={handleVerticalAdd}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-teal-500 transition-colors"
                placeholder="Type vertical and press Enter (e.g., Seafood, Dairy, Bakery)"
              />
              <p className="text-xs text-gray-500">Press Enter or comma to add each vertical</p>
            </div>
          </div>

          {/* Source Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Source Type *
            </label>
            <select
              value={formData.sourceType}
              onChange={(e) => setFormData(prev => ({ ...prev, sourceType: e.target.value }))}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white transition-colors ${
                errors.sourceType ? 'border-red-500' : 'border-gray-600 focus:border-teal-500'
              }`}
            >
              {SOURCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.sourceType && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.sourceType}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              File Upload (Optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.doc"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </button>
              {formData.file && (
                <span className="text-sm text-gray-400">
                  {formData.file.name} ({Math.round(formData.file.size / 1024)} KB)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Supported formats: PDF, DOCX, TXT</p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Content {!formData.file && '*'}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 resize-none transition-colors ${
                errors.content ? 'border-red-500' : 'border-gray-600 focus:border-teal-500'
              }`}
              placeholder="Paste or type the competitive intelligence content here..."
            />
            {errors.content && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.content}
              </p>
            )}
          </div>

          {/* Submit Message */}
          {submitMessage && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              submitMessage.type === 'success' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {submitMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {submitMessage.text}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-700">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Battlecard
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
