"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Building2, Bot, FileBarChart } from 'lucide-react';

interface Suggestion {
  icon: React.ReactNode;
  text: string;
  action: () => void;
}

export default function CommandPalette() {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions: Suggestion[] = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: "Show me this week's engagement metrics",
      action: () => console.log('Show engagement metrics')
    },
    {
      icon: <Building2 className="w-4 h-4" />,
      text: "Which companies engaged with our content?",
      action: () => console.log('Show company engagement')
    },
    {
      icon: <Bot className="w-4 h-4" />,
      text: "How is Inecta performing in AI responses?",
      action: () => console.log('Show AI performance')
    },
    {
      icon: <FileBarChart className="w-4 h-4" />,
      text: "Generate weekly performance report",
      action: () => console.log('Generate report')
    }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Escape to clear and blur
      if (e.key === 'Escape') {
        setQuery('');
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          What can I help you find?
        </h1>
        <p className="text-white/90 text-lg">
          Search for reports, analyze data, or ask questions
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-transform hover:scale-[1.01]">
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            className="w-full pl-12 pr-4 py-5 text-lg outline-none text-gray-900 placeholder-gray-400"
            placeholder="Ask a question or search..."
            autoFocus
          />
        </div>

        <div className="border-t border-gray-100">
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                  {suggestion.icon}
                </span>
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                  {suggestion.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-8 text-white/80 text-sm">
        <div className="flex items-center gap-2">
          <kbd className="bg-white/20 backdrop-blur px-2 py-1 rounded text-xs font-mono">⌘K</kbd>
          <span>Quick search</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="bg-white/20 backdrop-blur px-2 py-1 rounded text-xs font-mono">⌘/</kbd>
          <span>AI assist</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="bg-white/20 backdrop-blur px-2 py-1 rounded text-xs font-mono">ESC</kbd>
          <span>Clear</span>
        </div>
      </div>
    </div>
  );
}
