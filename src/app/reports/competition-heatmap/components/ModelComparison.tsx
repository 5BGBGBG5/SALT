'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

interface ModelStats {
  model: string;
  total: number;
  mentions: number;
  mentionRate: number;
}

interface ModelComparisonProps {
  modelStats: ModelStats[];
}

const MODEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'chatgpt-4o': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  'gemini-pro-25-flash': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
  'chatgpt': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  'gemini': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
};

const getModelColor = (model: string) => {
  const lowerModel = model.toLowerCase();
  for (const [key, colors] of Object.entries(MODEL_COLORS)) {
    if (lowerModel.includes(key)) {
      return colors;
    }
  }
  return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' };
};

const formatModelName = (model: string) => {
  if (model.toLowerCase().includes('chatgpt')) return 'ChatGPT-4o';
  if (model.toLowerCase().includes('gemini')) return 'Gemini Pro';
  return model;
};

export default function ModelComparison({ modelStats }: ModelComparisonProps) {
  if (modelStats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No model data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {modelStats.map((model, index) => {
        const colors = getModelColor(model.model);
        const progress = model.mentionRate;
        
        return (
          <motion.div
            key={model.model}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card p-6 border ${colors.border}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${colors.text}`}>
                {formatModelName(model.model)}
              </h3>
              {model.mentions > 0 ? (
                <span className={`flex items-center gap-1 text-sm ${colors.text}`}>
                  <CheckCircle className="w-4 h-4" />
                  {model.mentions}/{model.total} ({model.mentionRate.toFixed(1)}%)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-red-400">
                  <X className="w-4 h-4" />
                  {model.mentions}/{model.total} (0%)
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Mention Rate</span>
                <span className={colors.text}>{model.mentionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-full ${colors.bg.replace('/20', '')} ${colors.text.replace('-400', '-300')} rounded-full`}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}


