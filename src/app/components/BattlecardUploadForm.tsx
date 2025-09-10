'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, ChevronDown, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

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
      
      // Use the correct n8n webhook URL for getting competitors
      const response = await fetch('https://inecta.app.n8n.cloud/webhook/get-competitors');
      
      if (!response.ok) throw new Error('Failed to fetch competitors');
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.competitors)) {
        // Format competitors and add "Add New" option
        const competitorOptions: Competitor[] = [
          ...data.competitors.map((comp: CompetitorApiResponse) => ({
            value: comp.value || comp.name || comp.id,
            label: comp.label || comp.name || comp.id
          })),
          { value: '__new__', label: '➕ Add New Competitor...' }
        ];
        setCompetitors(competitorOptions);
      } else {
        setCompetitors([{ value: '__new__', label: '➕ Add New Competitor...' }]);
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
      setCompetitors([{ value: '__new__', label: '➕ Add New Competitor...' }]);
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

// Replace your handleSubmit function with this version

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);
  setSubmitMessage(null);

  try {
    // Determine final competitor name
    const finalCompetitorName = formData.competitorSelect === '__new__' 
      ? formData.newCompetitorName.trim()
      : formData.competitorSelect;

    console.log('Submitting battlecard to n8n:', {
      competitor: finalCompetitorName,
      verticals: formData.verticals,
      hasFile: !!formData.file,
      contentLength: formData.content.length
    });

    // Prepare the submission data
    const submitData: { [key: string]: any } = {
      competitorSelect: formData.competitorSelect,
      newCompetitorName: formData.newCompetitorName,
      competitor: finalCompetitorName,
      verticals: formData.verticals, // Send as array, not JSON string
      sourceType: formData.sourceType,
      content: formData.content
    };

    let response: Response;

    if (formData.file) {
      // If there's a file, use FormData
      const submitFormData = new FormData();
      
      // Add all form fields
      Object.entries(submitData).forEach(([key, value]) => {
        if (key === 'verticals') {
          submitFormData.append(key, JSON.stringify(value));
        } else {
          submitFormData.append(key, String(value));
        }
      });
      
      // Add file
      submitFormData.append('file', formData.file);

      response = await fetch('https://inecta.app.n8n.cloud/webhook/upload-battlecard', {
        method: 'POST',
        body: submitFormData,
      });
    } else {
      // No file, send as JSON (simpler for n8n to handle)
      response = await fetch('https://inecta.app.n8n.cloud/webhook/upload-battlecard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
    }

    console.log('n8n response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n error response:', errorText);
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json().catch(() => ({ success: true }));
    console.log('n8n response:', result);
    
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

    // If new competitor was added, refresh the competitors list
    if (formData.competitorSelect === '__new__') {
      fetchCompetitors();
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
    
    if (file) {
      // Validate file type
      const validTypes = ['.pdf', '.docx', '.txt', '.md'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        setErrors(prev => ({ ...prev, file: 'Invalid file type. Please select PDF, DOCX, TXT, or MD files.' }));
        return;
      }

      // Validate file size (3MB max for Vercel)
      const maxSize = 3 * 1024 * 1024; // 3MB
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, file: 'File size too large. Please select a file smaller than 3MB.' }));
        return;
      }

      setErrors(prev => ({ ...prev, file: '', content: '' }));
    }
    
    setFormData(prev => ({ ...prev, file }));
  };

  const getSelectedCompetitorName = () => {
    if (formData.competitorSelect === '__new__') {
      return formData.newCompetitorName || 'Add New Competitor...';
    }
    const selected = competitors.find(c => c.value === formData.competitorSelect);
    return selected?.label || 'Select Competitor...';
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
                      key={competitor.value}
                      type="button"
                      onClick={() => handleCompetitorSelect(competitor.value)}
                      className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors first:rounded-t-lg"
                    >
                      {competitor.label}
                    </button>
                  ))}
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
                required={formData.competitorSelect === '__new__'}
                placeholder="Enter competitor name"
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 transition-colors ${
                  errors.newCompetitor ? 'border-red-500' : 'border-gray-600 focus:border-teal-500'
                }`}
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
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-full px-4 py-3 bg-gray-800 
                         border-2 border-dashed border-gray-600 rounded-lg text-gray-400 
                         hover:border-teal-500 hover:text-gray-300 cursor-pointer 
                         transition-all duration-200"
              >
                {formData.file ? (
                  <span className="text-teal-400">{formData.file.name}</span>
                ) : (
                  <span>Click to upload or drag and drop</span>
                )}
              </label>
            </div>
            <p className="text-xs text-gray-500">Supported formats: PDF, DOCX, TXT, MD</p>
            {errors.file && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.file}
              </p>
            )}
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