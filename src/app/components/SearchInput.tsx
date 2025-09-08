"use client";

import React, { useState, useRef } from 'react';
import { Search, TrendingUp, Building2, FileText, BarChart3 } from 'lucide-react';

interface Suggestion {
  icon: React.ReactNode;
  text: string;
  action: () => void;
}

export default function SearchInput() {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handler functions for each suggestion
  const handleBattlecardUpload = () => {
    // TODO: Open upload modal or navigate to battlecard upload view
    console.log('Opening battlecard upload interface...');
    // Example: router.push('/battlecard/upload') or setShowUploadModal(true)
  };

  const handleDealSearch = () => {
    // TODO: Execute HubSpot API call and display results
    console.log('Searching HubSpot deals in pipeline...');
    // Example: fetchHubSpotDeals() or router.push('/deals')
  };

  const handleCompanyAnalysis = () => {
    // Focus input with pre-filled text for company analysis
    setQuery('Analyze company: ');
    inputRef.current?.focus();
    // Position cursor at the end
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
      }
    }, 0);
  };

  const handleWeeklyReport = () => {
    // TODO: Trigger report generation workflow
    console.log('Generating weekly sales report...');
    // Example: generateWeeklyReport() or router.push('/reports/weekly')
  };

  const suggestions: Suggestion[] = [
    {
      icon: <FileText className="w-4 h-4" />,
      text: 'Upload battlecard for competitor',
      action: handleBattlecardUpload
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: 'Search deals in pipeline',
      action: handleDealSearch
    },
    {
      icon: <Building2 className="w-4 h-4" />,
      text: 'Analyze company: [company name]',
      action: handleCompanyAnalysis
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      text: 'Generate weekly sales report',
      action: handleWeeklyReport
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsTyping(true);
    
    // Reset typing indicator after user stops typing
    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    suggestion.action();
    inputRef.current?.focus();
  };

  return (
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
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-4 px-4 py-4 text-left rounded-lg hover:bg-teal-500/10 transition-all duration-300 group transform hover:scale-[1.01]"
              >
                <span className="text-teal-400/60 group-hover:text-teal-400 transition-colors duration-300 flex-shrink-0">
                  {suggestion.icon}
                </span>
                <span className="text-gray-300 group-hover:text-white transition-colors duration-300 font-medium">
                  {suggestion.text}
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
  );
}


