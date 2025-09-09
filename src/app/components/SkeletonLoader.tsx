"use client";

import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'card' | 'table' | 'text' | 'metric';
  rows?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  className = '', 
  variant = 'card',
  rows = 1 
}) => {
  const baseShimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-teal-500/10 before:to-transparent";

  if (variant === 'card') {
    return (
      <div className={`glass-card p-6 animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className={`h-4 bg-gray-700/50 rounded w-1/3 ${baseShimmer}`} />
          <div className={`h-8 bg-gray-700/50 rounded w-1/2 ${baseShimmer}`} />
          <div className={`h-3 bg-gray-700/50 rounded w-1/4 ${baseShimmer}`} />
        </div>
      </div>
    );
  }

  if (variant === 'metric') {
    return (
      <div className={`glass-card p-6 animate-pulse ${className}`}>
        <div className="space-y-3">
          <div className={`h-3 bg-gray-700/50 rounded w-2/3 ${baseShimmer}`} />
          <div className={`h-10 bg-gray-700/50 rounded w-1/2 ${baseShimmer}`} />
          <div className={`h-3 bg-gray-700/50 rounded w-1/3 ${baseShimmer}`} />
        </div>
        <div className="absolute top-4 right-4">
          <div className={`w-8 h-8 bg-gray-700/50 rounded ${baseShimmer}`} />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`glass-card overflow-hidden ${className}`}>
        {/* Table header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex justify-between items-center">
            <div className={`h-6 bg-gray-700/50 rounded w-1/4 ${baseShimmer}`} />
            <div className={`h-4 bg-gray-700/50 rounded w-1/6 ${baseShimmer}`} />
          </div>
        </div>
        
        {/* Table rows */}
        <div className="divide-y divide-gray-700/50">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-6 flex justify-between items-center">
              <div className="flex items-center space-x-4 flex-1">
                <div className={`h-4 bg-gray-700/50 rounded w-1/4 ${baseShimmer}`} />
                <div className={`h-4 bg-gray-700/50 rounded w-1/3 ${baseShimmer}`} />
                <div className={`h-4 bg-gray-700/50 rounded w-1/6 ${baseShimmer}`} />
              </div>
              <div className={`h-8 bg-gray-700/50 rounded w-20 ${baseShimmer}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div 
            key={i} 
            className={`h-4 bg-gray-700/50 rounded ${baseShimmer}`}
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${baseShimmer} h-4 bg-gray-700/50 rounded ${className}`} />
  );
};

export default SkeletonLoader;

