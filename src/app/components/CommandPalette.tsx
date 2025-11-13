"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Upload, 
  FileText, 
  Building2, 
  Users, 
  TrendingUp, 
  X, 
  ChevronRight, 
  File, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Bot,
  Send,
  User as UserIcon
} from 'lucide-react';

// TypeScript Interfaces
interface Command {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'competitive' | 'crm' | 'analysis' | 'upload';
  action: () => void;
  keywords?: string[];
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

interface BattlecardForm {
  competitor: string;
  verticals: string[];
  content: string;
  file: File | null;
  sourceType: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
}

type ViewState = 'main' | 'battlecard-upload' | 'company-analysis';

export default function CommandPalette() {
  // State Management
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('main');
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false
  });
  
  // Form state for battlecard upload
  const [battlecardForm, setBattlecardForm] = useState<BattlecardForm>({
    competitor: '',
    verticals: [],
    content: '',
    file: null,
    sourceType: 'battlecard'
  });

  // Chat state for company deep dive
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    sessionId: `session-${Date.now()}`
  });
  const [chatInput, setChatInput] = useState('');

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Commands Configuration
  const commands: Command[] = [
    {
      id: 'upload-battlecard',
      name: 'Upload Battlecard',
      description: 'Add competitive intelligence documents',
      icon: <Upload className="w-4 h-4" />,
      category: 'upload',
      action: () => setCurrentView('battlecard-upload'),
      keywords: ['upload', 'battlecard', 'competitive', 'intelligence', 'document']
    },
    {
      id: 'company-deep-dive',
      name: 'Company Deep Dive',
      description: 'AI-powered analysis of Inecta and competitors',
      icon: <Building2 className="w-4 h-4" />,
      category: 'analysis',
      action: () => {
        setCurrentView('company-analysis');
        // Add welcome message if no messages exist
        setChatState(prev => {
          if (prev.messages.length === 0) {
            return {
              ...prev,
              messages: [{
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: "Hi! I can help you with information about Inecta Food ERP and compare it with competitors like Business Central, NetSuite, and others. What would you like to know?",
                timestamp: new Date()
              }]
            };
          }
          return prev;
        });
      },
      keywords: ['company', 'analysis', 'deep', 'dive', 'research']
    },
    {
      id: 'search-hubspot-deals',
      name: 'Search HubSpot Deals',
      description: 'Query CRM deals and opportunities',
      icon: <TrendingUp className="w-4 h-4" />,
      category: 'crm',
      action: () => console.log('HubSpot Deals Search - Coming Soon'),
      keywords: ['hubspot', 'deals', 'crm', 'opportunities', 'sales']
    },
    {
      id: 'search-hubspot-contacts',
      name: 'Search HubSpot Contacts',
      description: 'Query CRM contacts and leads',
      icon: <Users className="w-4 h-4" />,
      category: 'crm',
      action: () => console.log('HubSpot Contacts Search - Coming Soon'),
      keywords: ['hubspot', 'contacts', 'crm', 'leads', 'people']
    },
    {
      id: 'competitor-comparison',
      name: 'Competitor Comparison',
      description: 'Compare competitors side by side',
      icon: <FileText className="w-4 h-4" />,
      category: 'competitive',
      action: () => console.log('Competitor Comparison - Coming Soon'),
      keywords: ['competitor', 'comparison', 'competitive', 'analysis', 'compare']
    }
  ];

  // Filtered commands based on search query
  const filteredCommands = commands.filter(command => {
    if (!query.trim()) return true;
    const searchTerm = query.toLowerCase();
    return (
      command.name.toLowerCase().includes(searchTerm) ||
      command.description.toLowerCase().includes(searchTerm) ||
      command.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
  });

  // Keyboard Navigation Effects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
        if (!isOpen) {
          setCurrentView('main');
          setQuery('');
          setSelectedIndex(0);
        }
        return;
      }

      if (!isOpen) return;

      // Escape to close or go back
      if (e.key === 'Escape') {
        e.preventDefault();
        if (currentView !== 'main') {
          setCurrentView('main');
        } else {
          setIsOpen(false);
        }
        return;
      }

      // Only handle arrow keys and enter in main view
      if (currentView === 'main') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
        } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
          e.preventDefault();
          filteredCommands[selectedIndex].action();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentView, filteredCommands, selectedIndex]);

  // Auto-focus search input when palette opens
  useEffect(() => {
    if (isOpen && currentView === 'main' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, currentView]);

  // Auto-focus chat input when company-analysis view is active
  useEffect(() => {
    if (currentView === 'company-analysis' && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [currentView]);

  // Auto-scroll chat messages to bottom
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatState.messages]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // File Upload Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['.pdf', '.docx', '.txt', '.md'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        setUploadState(prev => ({
          ...prev,
          error: 'Invalid file type. Please select PDF, DOCX, TXT, or MD files.'
        }));
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setUploadState(prev => ({
          ...prev,
          error: 'File size too large. Please select a file smaller than 10MB.'
        }));
        return;
      }

      setBattlecardForm(prev => ({ 
        ...prev, 
        file,
        content: '' // Clear content when file is selected
      }));
      setUploadState(prev => ({ ...prev, error: null }));
    }
  };

  // Chat Submit Handler
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const message = chatInput.trim();
    if (!message || chatState.isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null
    }));
    setChatInput('');

    try {
      const response = await fetch('/api/company-deep-dive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          sessionId: chatState.sessionId,
          context: { timestamp: new Date().toISOString() }
        })
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response || data.message || 'I apologize, but I couldn\'t generate a response. Please try again.',
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get response. Please try again.'
      }));
    }
  };

  // Form Submission Handler
  const handleBattlecardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!battlecardForm.competitor.trim()) {
      setUploadState(prev => ({ ...prev, error: 'Competitor name is required' }));
      return;
    }

    if (!battlecardForm.content.trim() && !battlecardForm.file) {
      setUploadState(prev => ({ ...prev, error: 'Either content or file is required' }));
      return;
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false
    });

    try {
      const formData = new FormData();
      formData.append('competitor', battlecardForm.competitor.trim());
      formData.append('verticals', battlecardForm.verticals.join(','));
      formData.append('sourceType', battlecardForm.sourceType);
      
      if (battlecardForm.file) {
        formData.append('file', battlecardForm.file);
      } else {
        formData.append('content', battlecardForm.content.trim());
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const response = await fetch('/api/battlecard/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        success: true
      });

      // Reset form
      setBattlecardForm({
        competitor: '',
        verticals: [],
        content: '',
        file: null,
        sourceType: 'battlecard'
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Auto-close after success
      setTimeout(() => {
        setCurrentView('main');
        setUploadState(prev => ({ ...prev, success: false, progress: 0 }));
      }, 2000);

    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false
      });
    }
  };

  // Render Main View
  const renderMainView = () => (
    <>
      <div className="relative flex items-center border-b border-emerald-500/20">
        <Search className="absolute left-4 w-5 h-5 text-emerald-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 text-lg outline-none bg-transparent text-white placeholder-gray-400 font-medium"
          placeholder="Search commands..."
          autoFocus
        />
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {filteredCommands.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No commands found for &quot;{query}&quot;
          </div>
        ) : (
          filteredCommands.map((command, index) => (
            <button
              key={command.id}
              onClick={command.action}
              className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-all duration-200 ${
                index === selectedIndex
                  ? 'bg-emerald-500/20 border-r-2 border-emerald-400'
                  : 'hover:bg-emerald-500/10'
              }`}
            >
              <span className={`transition-colors duration-200 flex-shrink-0 ${
                index === selectedIndex ? 'text-emerald-400' : 'text-emerald-400/60'
              }`}>
                {command.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`font-medium transition-colors duration-200 ${
                  index === selectedIndex ? 'text-white' : 'text-gray-300'
                }`}>
                  {command.name}
                </div>
                <div className="text-sm text-gray-400 truncate">
                  {command.description}
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 transition-all duration-200 ${
                index === selectedIndex ? 'text-emerald-400 opacity-100' : 'text-gray-400 opacity-0'
              }`} />
            </button>
          ))
        )}
      </div>
    </>
  );

  // Render Chat View
  const renderChatView = () => (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-emerald-500/20">
        <button
          onClick={() => setCurrentView('main')}
          className="p-1 rounded-lg hover:bg-emerald-500/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
        </button>
        <Bot className="w-5 h-5 text-emerald-400" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">Company Deep Dive</h2>
          <p className="text-xs text-gray-400">AI-powered competitive intelligence</p>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatMessagesRef}
        className="flex-1 overflow-y-auto max-h-96 p-4 space-y-4"
      >
        {chatState.messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800/50 border border-gray-700 text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-emerald-100' : 'text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-emerald-400" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {chatState.isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {chatState.error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{chatState.error}</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleChatSubmit} className="p-4 border-t border-emerald-500/20">
        <div className="flex gap-2">
          <input
            ref={chatInputRef}
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about Inecta or competitors..."
            disabled={chatState.isLoading}
            className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={chatState.isLoading || !chatInput.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 px-1">
          Try: &quot;How does Inecta handle traceability?&quot; or &quot;Compare Inecta to Business Central&quot;
        </p>
      </form>
    </>
  );

  // Render Battlecard Upload View
  const renderBattlecardUploadView = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-emerald-500/20">
        <button
          onClick={() => setCurrentView('main')}
          className="p-1 rounded-lg hover:bg-emerald-500/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
        </button>
        <Upload className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-white">Upload Battlecard</h2>
      </div>

      <form onSubmit={handleBattlecardSubmit} className="p-4 space-y-4">
        {/* Competitor Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Competitor Name *
          </label>
          <input
            type="text"
            value={battlecardForm.competitor}
            onChange={(e) => setBattlecardForm(prev => ({ ...prev, competitor: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
            placeholder="e.g., NetSuite, Salesforce, HubSpot"
            required
            disabled={uploadState.isUploading}
          />
        </div>

        {/* Verticals */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Verticals (comma-separated)
          </label>
          <input
            type="text"
            value={battlecardForm.verticals.join(', ')}
            onChange={(e) => setBattlecardForm(prev => ({ 
              ...prev, 
              verticals: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
            }))}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
            placeholder="e.g., Manufacturing, Healthcare, Retail"
            disabled={uploadState.isUploading}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Upload Document
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploadState.isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadState.isUploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-emerald-500 hover:text-emerald-400 transition-all disabled:opacity-50"
          >
            <File className="w-4 h-4" />
            {battlecardForm.file ? battlecardForm.file.name : 'Select PDF, DOCX, TXT, or MD file'}
          </button>
        </div>

        {/* Content Text Area */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Or paste content directly
          </label>
          <textarea
            value={battlecardForm.content}
            onChange={(e) => setBattlecardForm(prev => ({ ...prev, content: e.target.value }))}
            disabled={!!battlecardForm.file || uploadState.isUploading}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all resize-none disabled:opacity-50"
            rows={6}
            placeholder="Paste your battlecard content here..."
          />
        </div>

        {/* Progress Bar */}
        {uploadState.isUploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading... {uploadState.progress}%
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadState.error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{uploadState.error}</span>
          </div>
        )}

        {/* Success Message */}
        {uploadState.success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Battlecard uploaded successfully!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrentView('main')}
            disabled={uploadState.isUploading}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploadState.isUploading || (!battlecardForm.content.trim() && !battlecardForm.file)}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploadState.isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Battlecard'
            )}
          </button>
        </div>
      </form>
    </>
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div
            ref={modalRef}
            className="w-full max-w-2xl mx-4 bg-gray-900/95 backdrop-blur-xl border border-emerald-500/20 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300 flex flex-col max-h-[80vh]"
          >
            {currentView === 'main' && renderMainView()}
            {currentView === 'battlecard-upload' && renderBattlecardUploadView()}
            {currentView === 'company-analysis' && renderChatView()}
            
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {!isOpen && (
        <div className="fixed bottom-6 left-6 flex items-center gap-2 text-gray-400 text-sm z-40">
          <kbd className="px-2 py-1 bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded text-xs font-mono text-emerald-400">
            ⌘K
          </kbd>
          <span>Open command palette</span>
        </div>
      )}
    </>
  );
}