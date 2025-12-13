'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Calendar, ChevronDown, ChevronRight, Filter } from 'lucide-react';

interface PersonaRow {
  personaName: string;
  personaId: string;
  models: {
    [modelName: string]: {
      mentioned: boolean;
      mentionCount: number;
      responseId: string;
    }
  };
  totalMentions: number;
  totalResponses: number;
}

interface ResponseDetail {
  id: string;
  queryId: string;
  model: string;
  prompt: string;
  response: string;
  inectaMentioned: boolean;
  mentionCount: number;
  competitorsMentioned: Record<string, number>;
  date: string;
}

interface QueryGroup {
  queryId: string;
  queryText: string;
  responses: {
    model: string;
    content: string;
    inectaMentioned: boolean;
    mentionCount: number;
    competitors: Record<string, number>;
  }[];
}

interface ResponseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: PersonaRow;
  responses: ResponseDetail[];
}

const formatModelName = (model: string) => {
  if (model.toLowerCase().includes('chatgpt')) return 'ChatGPT-4o';
  if (model.toLowerCase().includes('gemini')) return 'Gemini Pro';
  return model;
};

const highlightInecta = (text: string): React.ReactNode => {
  if (!text) return <span className="text-gray-400 italic">N/A</span>;
  
  const regex = /(inecta)/gi;
  const parts: string[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(match[0]);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return (
    <span>
      {parts.map((part, index) => {
        const isInecta = /^inecta$/i.test(part);
        return isInecta ? (
          <mark key={index} className="bg-yellow-400/50 text-yellow-100 px-1 rounded">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

type FilterType = 'all' | 'mentioned' | 'not-mentioned';

function ResponseCard({ 
  response, 
  model 
}: { 
  response?: { 
    content: string; 
    inectaMentioned: boolean; 
    mentionCount: number; 
    competitors: Record<string, number> 
  }; 
  model: string;
}) {
  const [expanded, setExpanded] = useState(false);
  
  if (!response) {
    return (
      <div className="glass-card p-4 border border-gray-700/50">
        <div className="text-gray-500 text-sm italic">No response from {formatModelName(model)}</div>
      </div>
    );
  }
  
  const preview = response.content.slice(0, 150);
  const hasMore = response.content.length > 150;
  const displayText = expanded ? response.content : preview;
  
  return (
    <div className="glass-card p-4 border border-gray-700/50">
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium text-white">{formatModelName(model)}</span>
        {response.inectaMentioned ? (
          <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/50">
            <CheckCircle className="w-3 h-3" />
            Mentioned ({response.mentionCount}x)
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/50">
            <XCircle className="w-3 h-3" />
            Not Mentioned
          </span>
        )}
      </div>
      
      <div className="text-sm text-gray-300 whitespace-pre-wrap mb-3">
        {displayText ? highlightInecta(displayText) : <span className="text-gray-400 italic">No response available</span>}
        {hasMore && !expanded && '...'}
      </div>
      
      {hasMore && (
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
        >
          {expanded ? 'Show less' : 'Show full response'}
        </button>
      )}
      
      {Object.keys(response.competitors).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="text-xs text-gray-400 mb-2">Competitors:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(response.competitors)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => (
                <span 
                  key={name}
                  className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/50"
                >
                  {name} ({count})
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QueryAccordion({ 
  group, 
  isOpen, 
  onToggle 
}: { 
  group: QueryGroup; 
  isOpen: boolean; 
  onToggle: () => void;
}) {
  const chatgptResponse = group.responses.find(r => r.model.toLowerCase().includes('chatgpt'));
  const geminiResponse = group.responses.find(r => r.model.toLowerCase().includes('gemini'));
  
  const chatgptMentioned = chatgptResponse?.inectaMentioned || false;
  const geminiMentioned = geminiResponse?.inectaMentioned || false;
  
  return (
    <div className="border border-gray-700/50 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
          <span className="text-sm text-gray-300 truncate flex-1">
            {group.queryText || <span className="text-gray-500 italic">No query text</span>}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {chatgptResponse ? (
            chatgptMentioned ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )
          ) : (
            <span className="w-4 h-4 text-gray-500">-</span>
          )}
          {geminiResponse ? (
            geminiMentioned ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )
          ) : (
            <span className="w-4 h-4 text-gray-500">-</span>
          )}
        </div>
      </button>
      
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="p-4 border-t border-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponseCard response={chatgptResponse} model={chatgptResponse?.model || 'chatgpt-4o'} />
              <ResponseCard response={geminiResponse} model={geminiResponse?.model || 'gemini-pro-25-flash'} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function ResponseDetailModal({ isOpen, onClose, persona, responses }: ResponseDetailModalProps) {
  const [expandedQueries, setExpandedQueries] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Group responses by query_id
  const groupedByQuery = useMemo(() => {
    const groups = new Map<string, QueryGroup>();
    
    responses.forEach(r => {
      if (!groups.has(r.queryId)) {
        groups.set(r.queryId, {
          queryId: r.queryId,
          queryText: r.prompt,
          responses: []
        });
      }
      groups.get(r.queryId)!.responses.push({
        model: r.model,
        content: r.response,
        inectaMentioned: r.inectaMentioned,
        mentionCount: r.mentionCount,
        competitors: r.competitorsMentioned
      });
    });
    
    return Array.from(groups.values());
  }, [responses]);
  
  // Filter groups based on filter type
  const filteredGroups = useMemo(() => {
    if (filter === 'all') return groupedByQuery;
    
    return groupedByQuery.filter(group => {
      const chatgptResponse = group.responses.find(r => r.model.toLowerCase().includes('chatgpt'));
      const geminiResponse = group.responses.find(r => r.model.toLowerCase().includes('gemini'));
      
      if (filter === 'mentioned') {
        return (chatgptResponse?.inectaMentioned || false) || (geminiResponse?.inectaMentioned || false);
      } else {
        return !(chatgptResponse?.inectaMentioned || false) && !(geminiResponse?.inectaMentioned || false);
      }
    });
  }, [groupedByQuery, filter]);
  
  const toggleQuery = (queryId: string) => {
    setExpandedQueries(prev => {
      const next = new Set(prev);
      if (next.has(queryId)) {
        next.delete(queryId);
      } else {
        next.add(queryId);
      }
      return next;
    });
  };
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-5xl bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-y-auto border-l border-gray-700"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-700">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {persona.personaName} - Response Details
                  </h2>
                  <div className="flex items-center gap-4 flex-wrap text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Total: {persona.totalMentions}/{persona.totalResponses} mentions</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Filters */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Show:</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      filter === 'all'
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50'
                        : 'bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50'
                    }`}
                  >
                    All Queries
                  </button>
                  <button
                    onClick={() => setFilter('mentioned')}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      filter === 'mentioned'
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50'
                        : 'bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50'
                    }`}
                  >
                    Mentioned
                  </button>
                  <button
                    onClick={() => setFilter('not-mentioned')}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      filter === 'not-mentioned'
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50'
                        : 'bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50'
                    }`}
                  >
                    Not Mentioned
                  </button>
                </div>
              </div>

              {/* Query Groups */}
              <div className="space-y-3">
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No queries found matching the selected filter.
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <QueryAccordion
                      key={group.queryId}
                      group={group}
                      isOpen={expandedQueries.has(group.queryId)}
                      onToggle={() => toggleQuery(group.queryId)}
                    />
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
