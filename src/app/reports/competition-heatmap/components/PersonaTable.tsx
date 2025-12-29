'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, ChevronRight } from 'lucide-react';

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

interface PersonaTableProps {
  personaRows: PersonaRow[];
  onPersonaClick: (persona: PersonaRow) => void;
}

const MODEL_NAMES = ['chatgpt-4o', 'gemini-pro-25-flash', 'chatgpt', 'gemini'];

const formatModelName = (model: string) => {
  if (model.toLowerCase().includes('chatgpt')) return 'ChatGPT';
  if (model.toLowerCase().includes('gemini')) return 'Gemini';
  return model;
};

export default function PersonaTable({ personaRows, onPersonaClick }: PersonaTableProps) {
  if (personaRows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No persona data available
      </div>
    );
  }

  // Get all unique model names from all personas
  const allModels = new Set<string>();
  personaRows.forEach(persona => {
    Object.keys(persona.models).forEach(model => allModels.add(model));
  });
  const sortedModels = Array.from(allModels).sort((a, b) => {
    const aIsChatGPT = a.toLowerCase().includes('chatgpt');
    const bIsChatGPT = b.toLowerCase().includes('chatgpt');
    if (aIsChatGPT && !bIsChatGPT) return -1;
    if (!aIsChatGPT && bIsChatGPT) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Persona</th>
            {sortedModels.map(model => (
              <th key={model} className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                {formatModelName(model)}
              </th>
            ))}
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Total</th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300"></th>
          </tr>
        </thead>
        <tbody>
          {personaRows.map((persona, index) => (
            <motion.tr
              key={persona.personaId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
              onClick={() => onPersonaClick(persona)}
            >
              <td className="py-3 px-4 text-sm text-white">{persona.personaName}</td>
              {sortedModels.map(model => {
                const modelData = persona.models[model];
                if (!modelData) {
                  return (
                    <td key={model} className="py-3 px-4 text-center">
                      <span className="text-gray-500">-</span>
                    </td>
                  );
                }
                return (
                  <td key={model} className="py-3 px-4 text-center">
                    {modelData.mentioned ? (
                      <span className="flex items-center justify-center gap-1 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-red-400">
                        <X className="w-4 h-4" />
                      </span>
                    )}
                  </td>
                );
              })}
              <td className="py-3 px-4 text-center text-sm text-gray-300">
                {persona.totalMentions}/{persona.totalResponses}
              </td>
              <td className="py-3 px-4 text-center">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


