'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Calendar } from 'lucide-react';

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

export default function ResponseDetailModal({ isOpen, onClose, persona, responses }: ResponseDetailModalProps) {
  if (!isOpen) return null;

  // Group responses by model
  const responsesByModel = responses.reduce((acc, response) => {
    const model = response.model;
    if (!acc[model]) {
      acc[model] = [];
    }
    acc[model].push(response);
    return acc;
  }, {} as Record<string, ResponseDetail[]>);

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
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-y-auto border-l border-gray-700"
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

              <div className="space-y-6">
                {Object.entries(responsesByModel).map(([model, modelResponses]) => (
                  <div key={model} className="glass-card p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      {formatModelName(model)}
                    </h3>
                    
                    {modelResponses.map((response, index) => (
                      <div key={response.id} className={index > 0 ? 'mt-6 pt-6 border-t border-gray-700' : ''}>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Query:</h4>
                          <div className="bg-gray-950/50 p-4 rounded-lg border border-gray-700">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">
                              {response.prompt || <span className="text-gray-400 italic">No prompt available</span>}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Response:</h4>
                          <div className="bg-gray-950/50 p-4 rounded-lg border border-gray-700">
                            <div className="text-sm text-gray-300 whitespace-pre-wrap">
                              {response.response ? highlightInecta(response.response) : <span className="text-gray-400 italic">No response available</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            {response.inectaMentioned ? (
                              <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/50">
                                <CheckCircle className="w-3 h-3" />
                                Inecta Mentioned ({response.mentionCount}x)
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/50">
                                <XCircle className="w-3 h-3" />
                                Inecta NOT Mentioned
                              </span>
                            )}
                          </div>
                          
                          {Object.keys(response.competitorsMentioned).length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-gray-400">Competitors:</span>
                              {Object.entries(response.competitorsMentioned)
                                .sort((a, b) => b[1] - a[1])
                                .map(([vendor, count]) => (
                                  <span 
                                    key={vendor}
                                    className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/50"
                                  >
                                    {vendor} ({count})
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

