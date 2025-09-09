"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, FileText, Building2, TrendingUp, BarChart3, X } from 'lucide-react';

interface Command {
  id: string;
  icon: React.ReactNode;
  text: string;
  action: () => void;
  category: 'competitive' | 'crm' | 'research' | 'analytics';
}

export default function SearchInput() {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Battlecard upload state
  const [uploadForm, setUploadForm] = useState({
    competitor: '',
    verticals: '',
    content: '',
    file: null as File | null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Command definitions
  const commands: Command[] = [
    {
      id: 'battlecard-upload',
      icon: <FileText className="w-4 h-4" />,
      text: 'Upload battlecard for competitor',
      action: () => setShowUploadModal(true),
      category: 'competitive'
    },
    {
      id: 'search-deals',
      icon: <TrendingUp className="w-4 h-4" />,
      text: 'Search deals in pipeline',
      action: handleDealSearch,
      category: 'crm'
    },
    {
      id: 'analyze-company',
      icon: <Building2 className="w-4 h-4" />,
      text: 'Analyze company: [company name]',
      action: handleCompanyAnalysis,
      category: 'research'
    },
    {
      id: 'weekly-report',
      icon: <BarChart3 className="w-4 h-4" />,
      text: 'Generate weekly sales report',
      action: handleWeeklyReport,
      category: 'analytics'
    }
  ];

  // Handle command execution
  function handleCommand(input: string) {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.startsWith('/battlecard') || lowerInput.includes('upload battlecard')) {
      setShowUploadModal(true);
    } else if (lowerInput.startsWith('/deals') || lowerInput.includes('search deals')) {
      handleDealSearch();
    } else if (lowerInput.startsWith('/analyze') || lowerInput.includes('analyze company')) {
      const company = input.replace(/^.*analyze company:?\s*/i, '').trim();
      if (company) {
        handleCompanyAnalysisWithCompany(company);
      }
    } else if (lowerInput.startsWith('/report') || lowerInput.includes('weekly report')) {
      handleWeeklyReport();
    }
  }

  // Battlecard upload handler
  async function handleBattlecardUpload() {
    setIsUploading(true);
    setUploadError('');

    try {
      // Validate required fields
      if (!uploadForm.competitor.trim()) {
        setUploadError('Competitor name is required');
        return;
      }

      if (!uploadForm.file && !uploadForm.content.trim()) {
        setUploadError('Please upload a file or enter content');
        return;
      }

      console.log('Starting upload with:', {
        competitor: uploadForm.competitor,
        hasFile: !!uploadForm.file,
        hasContent: !!uploadForm.content,
        fileName: uploadForm.file?.name,
        fileSize: uploadForm.file?.size
      });

      const formData = new FormData();
      formData.append('competitor', uploadForm.competitor.trim());
      formData.append('verticals', uploadForm.verticals.trim());
      formData.append('sourceType', 'battlecard');
      
      if (uploadForm.file) {
        // Check file size before processing - increased limit since we're not base64 encoding
        const maxSize = 8 * 1024 * 1024; // 8MB limit for direct file upload
        if (uploadForm.file.size > maxSize) {
          setUploadError('File size must be less than 8MB for upload.');
          return;
        }

        console.log('Processing file:', uploadForm.file.name, 'Type:', uploadForm.file.type, 'Size:', uploadForm.file.size);

        // Send the file directly without base64 encoding to avoid payload size issues
        formData.append('file', uploadForm.file);
        
        // For text files, also read the content for immediate processing
        if (uploadForm.file.type === 'text/plain' || uploadForm.file.type === 'text/markdown') {
          try {
            const textContent = await uploadForm.file.text();
            formData.append('content', textContent);
            console.log('Also read text file content, length:', textContent.length);
          } catch (error) {
            console.warn('Could not read text file content:', error);
            // Continue with just the file - n8n can process it
          }
        }
        
        console.log('Sending file directly to avoid base64 payload size issues');
      } else {
        // For text content
        formData.append('content', uploadForm.content.trim());
        console.log('Using text content, length:', uploadForm.content.trim().length);
      }

      console.log('Sending request to /api/battlecard/upload');

      const response = await fetch('/api/battlecard/upload', {
        method: 'POST',
        // Important: Don't set Content-Type header - let browser set it for FormData
        body: formData,
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorText = await response.text();
          console.error('Upload failed response:', errorText);
          
          // Try to parse as JSON to get more detailed error
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If not JSON, use the raw text
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.error('Error reading response:', e);
        }
        
        setUploadError(`Upload failed: ${errorMessage}`);
        return;
      }

      let result;
      try {
        result = await response.json();
        console.log('Upload response:', result);
      } catch (e) {
        console.error('Error parsing response JSON:', e);
        setUploadError('Invalid response from server');
        return;
      }

      if (result.success) {
        setShowUploadModal(false);
        setUploadForm({ competitor: '', verticals: '', content: '', file: null });
        alert('Battlecard uploaded successfully!');
        console.log('Upload successful:', result);
      } else {
        const errorMsg = result.error || 'Upload failed - no error message provided';
        console.error('Upload failed with result:', result);
        setUploadError(errorMsg);
      }
    } catch (error) {
      console.error('Upload error (catch block):', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(`Failed to upload battlecard: ${errorMsg}`);
    } finally {
      setIsUploading(false);
    }
  }

  // Placeholder handlers for other commands
  function handleDealSearch() {
    console.log('Searching deals...');
    // TODO: Implement HubSpot deal search
  }

  function handleCompanyAnalysis() {
    setQuery('Analyze company: ');
    inputRef.current?.focus();
    // Position cursor at the end
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
      }
    }, 0);
  }

  function handleCompanyAnalysisWithCompany(company: string) {
    console.log('Analyzing company:', company);
    // TODO: Implement company analysis
  }

  function handleWeeklyReport() {
    console.log('Generating weekly report...');
    // TODO: Implement report generation
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsTyping(true);
    
    // Reset typing indicator after user stops typing
    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleCommandClick = (command: Command) => {
    setQuery(command.text);
    command.action();
    inputRef.current?.focus();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setQuery('');
        setShowUploadModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="w-full max-w-3xl mx-auto">
        <div className="glass-card overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <div className="relative flex items-center">
            <Search className={`absolute left-6 w-5 h-5 transition-colors duration-300 ${
              isTyping ? 'text-teal-400' : 'text-gray-400'
            }`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCommand(query);
                }
              }}
              className="w-full pl-14 pr-6 py-6 text-lg outline-none bg-transparent text-white placeholder-gray-400 font-medium"
              placeholder="Ask a question or search..."
              autoFocus
            />
            {isTyping && (
              <div className="absolute right-6 flex items-center">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          <div className="border-t border-teal-500/20">
            <div className="p-3">
              {commands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => handleCommandClick(command)}
                  onMouseEnter={() => setSelectedCommand(index)}
                  className={`w-full flex items-center gap-4 px-4 py-4 text-left rounded-lg transition-all duration-300 group transform hover:scale-[1.01] ${
                    selectedCommand === index
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'hover:bg-teal-500/10 text-gray-300 hover:text-white'
                  }`}
                >
                  <span className={`transition-colors duration-300 flex-shrink-0 ${
                    selectedCommand === index
                      ? 'text-teal-400'
                      : 'text-teal-400/60 group-hover:text-teal-400'
                  }`}>
                    {command.icon}
                  </span>
                  <span className="font-medium">
                    {command.text}
                  </span>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-6 h-6 rounded-full border border-teal-400/30 flex items-center justify-center">
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-8 mt-8 text-gray-400 text-sm">
          <div className="flex items-center gap-2 group">
            <kbd className="glass-card px-3 py-1.5 text-xs font-mono text-teal-400 group-hover:text-teal-300 transition-colors">⌘K</kbd>
            <span className="group-hover:text-gray-300 transition-colors">Quick search</span>
          </div>
          <div className="flex items-center gap-2 group">
            <kbd className="glass-card px-3 py-1.5 text-xs font-mono text-teal-400 group-hover:text-teal-300 transition-colors">⌘/</kbd>
            <span className="group-hover:text-gray-300 transition-colors">AI assist</span>
          </div>
          <div className="flex items-center gap-2 group">
            <kbd className="glass-card px-3 py-1.5 text-xs font-mono text-teal-400 group-hover:text-teal-300 transition-colors">ESC</kbd>
            <span className="group-hover:text-gray-300 transition-colors">Clear</span>
          </div>
        </div>
      </div>

      {/* Battlecard Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Upload Battlecard</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Competitor Name *</label>
                <input
                  type="text"
                  value={uploadForm.competitor}
                  onChange={(e) => setUploadForm({...uploadForm, competitor: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Microsoft"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Verticals (comma-separated)</label>
                <input
                  type="text"
                  value={uploadForm.verticals}
                  onChange={(e) => setUploadForm({...uploadForm, verticals: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Seafood, Dairy, Bakery"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Upload File</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Check file size (8MB limit for direct upload)
                      const maxSize = 8 * 1024 * 1024; // 8MB in bytes
                      if (file.size > maxSize) {
                        setUploadError('File size must be less than 8MB for upload');
                        return;
                      }
                      
                      // Check file type
                      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
                      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt|md)$/i)) {
                        setUploadError('Only PDF, DOCX, TXT, and MD files are allowed');
                        return;
                      }
                      
                      setUploadForm({...uploadForm, file: file});
                      setUploadError(''); // Clear any previous errors
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-teal-600 file:text-white hover:file:bg-teal-700"
                />
              </div>

              <div className="text-center text-gray-500">OR</div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Paste Content</label>
                <textarea
                  value={uploadForm.content}
                  onChange={(e) => setUploadForm({...uploadForm, content: e.target.value})}
                  disabled={!!uploadForm.file}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-teal-500 h-32 resize-none disabled:opacity-50"
                  placeholder="Paste battlecard content here..."
                />
              </div>

              {uploadError && (
                <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                  {uploadError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleBattlecardUpload}
                  disabled={isUploading || !uploadForm.competitor || (!uploadForm.file && !uploadForm.content)}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



