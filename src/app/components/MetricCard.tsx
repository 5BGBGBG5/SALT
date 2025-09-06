"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage';
  className?: string;
}

const AnimatedNumber: React.FC<{ value: number | string; format?: 'number' | 'currency' | 'percentage' }> = ({ 
  value, 
  format = 'number' 
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    let start = 0;
    const end = numericValue;
    const duration = 2000; // 2 seconds
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  return <span>{formatValue(displayValue)}</span>;
};

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  format = 'number',
  className = '' 
}) => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass-card p-6 relative overflow-hidden group cursor-pointer ${className}`}
      whileHover={{ y: -4 }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Icon with float animation */}
      {icon && (
        <div className="absolute top-4 right-4 text-teal-400/30 group-hover:text-teal-400/50 transition-colors duration-300 animate-float">
          {icon}
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        <p className="text-gray-400 text-sm mb-2 font-medium">{title}</p>
        <p className="text-3xl font-bold text-white mb-2">
          {typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(String(value)))) ? (
            <AnimatedNumber value={value} format={format} />
          ) : (
            value
          )}
        </p>
        {change !== undefined && (
          <div className="flex items-center gap-1">
            <span className={`text-sm font-medium ${change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {change > 0 ? '↗' : change < 0 ? '↘' : '→'} {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        )}
      </div>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

export default MetricCard;
