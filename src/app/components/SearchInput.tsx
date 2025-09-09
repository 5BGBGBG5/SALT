"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, FileText, Building2, TrendingUp, BarChart3 } from 'lucide-react';
import BattlecardUploadForm from './BattlecardUploadForm';

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

  // Success message state
  const [successMessage, setSuccessMessage] = useState('');

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
      action: () => {
        setQuery('Analyze company: ');
        inputRef.current?.focus();
      },
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
        handleCompanyAnalysis(company);
      }
    } else if (lowerInput.startsWith('/report') || lowerInput.includes('weekly report')) {
      handleWeeklyReport();
    }
  }

  // Handle success from battlecard form
  const handleBattlecardSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowUploadModal(false);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Placeholder handlers for other commands
  function handleDealSearch() {
    console.log('Searching deals...');
    // TODO: Implement HubSpot deal search
  }

  function handleCompanyAnalysis(company: string) {
    console.log('Analyzing company:', company);
    // TODO: Implement company analysis
  }

  function handleWeeklyReport() {
    console.log('Generating weekly report...');
    // TODO: Implement report generation
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setQuery('');
        setShowUploadModal(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle typing indicator
  useEffect(() => {
    if (query.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [query]);

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        <div className="glass-card bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center mb-8">
            <div className="relative flex-1">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                isTyping ? 'text-teal-400' : 'text-gray-400'
              }`} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCommand(query);
                  }
                }}
                placeholder="Ask a question, search data, or try a command..."
                className="w-full pl-12 pr-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 outline-none focus:border-teal-500/50 focus:bg-gray-800/70 transition-all duration-300 text-lg"
              />
              {isTyping && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Command Suggestions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">Quick Actions</h3>
            {commands.map((command, index) => (
              <button
                key={command.id}
                onClick={command.action}
                onMouseEnter={() => setSelectedCommand(index)}
                className={`group w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left ${
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

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-6 py-3 rounded-lg backdrop-blur-sm">
          {successMessage}
        </div>
      )}

      {/* Battlecard Upload Form */}
      {showUploadModal && (
        <BattlecardUploadForm
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleBattlecardSuccess}
        />
      )}
    </>
  );
}
