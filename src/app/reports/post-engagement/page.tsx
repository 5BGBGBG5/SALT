"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

type PostEngagementData = {
  // Post information
  post_id: string | null;
  post_url: string | null;
  post_content: string | null;
  post_type: string | null;
  post_timestamp: string | null;
  post_author: string | null;
  like_count: number | null;
  comment_count: number | null;
  repost_count: number | null;
  
  // Engagement details
  engagement_type: 'like' | 'comment' | 'share';
  engagement_id: string | null;
  reaction_type: string | null; // like type, comment text, or share text
  engagement_timestamp: string | null;
  
  // Profile information
  first_name: string | null;
  last_name: string | null;
  engager_name: string | null;
  engager_headline: string | null;
  engager_location: string | null;
  current_job_title: string | null;
  linkedin_profile_url: string | null;
  
  // Company information
  engager_company_name: string | null;
  engager_company_industry: string | null;
  engager_company_size: string | null;
  engager_company_location: string | null;
  engager_company_employees: number | null;
  engager_company_url: string | null;
  engager_job_title: string | null;
};

type SortConfig = {
  key: keyof PostEngagementData;
  direction: 'asc' | 'desc';
};

type FilterConfig = {
  engager_name: string;
  engager_company_name: string;
  engager_job_title: string;
  post_content: string;
  engager_company_industry: string;
  engager_company_location: string;
  engagement_type: string; // 'all', 'like', 'comment', 'share'
  global_search: string;
  date_from: string;
  date_to: string;
};

const PostEngagementTable = ({ 
  data, 
  isLoading, 
  error, 
  sortConfig, 
  onSort, 
  filters, 
  onFilterChange,
  onExportToExcel 
}: { 
  data: PostEngagementData[]; 
  isLoading: boolean; 
  error: string | null;
  sortConfig: SortConfig;
  onSort: (key: keyof PostEngagementData) => void;
  filters: FilterConfig;
  onFilterChange: (key: keyof FilterConfig, value: string) => void;
  onExportToExcel: () => void;
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [scrollIndicators, setScrollIndicators] = useState({ left: false, right: true });
  const tableRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    type: true,
    engager_name: true,
    engager_company_name: true,
    engager_company_industry: true,
    engager_company_size: true,
    engager_company_employees: true,
    engager_job_title: true,
    profile: true,
    post_content: true,
    details: true,
    post_url: true,
    engagement_timestamp: true
  });

  const filteredAndSortedData = useMemo(() => {
    // Filter the data based on current filter settings
    const filtered = data.filter(row => {
      // Engagement type filter
      if (filters.engagement_type !== 'all' && row.engagement_type !== filters.engagement_type) {
        return false;
      }

      // Date range filter
      if (filters.date_from || filters.date_to) {
        const engagementDate = row.engagement_timestamp ? new Date(row.engagement_timestamp) : null;
        if (engagementDate) {
          if (filters.date_from) {
            const fromDate = new Date(filters.date_from);
            if (engagementDate < fromDate) {
              return false;
            }
          }
          if (filters.date_to) {
            const toDate = new Date(filters.date_to);
            toDate.setHours(23, 59, 59, 999); // Include the entire end date
            if (engagementDate > toDate) {
              return false;
            }
          }
        }
      }

      // Global search across all fields
      if (filters.global_search) {
        const searchTerm = filters.global_search.toLowerCase();
        const searchableFields = [
          row.engager_name,
          row.engager_company_name,
          row.engager_job_title,
          row.post_content,
          row.engager_company_industry,
          row.engager_company_location,
          row.engager_headline,
          row.post_author,
          row.engagement_type,
          row.reaction_type
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableFields.includes(searchTerm)) {
          return false;
        }
      }

      // Individual column filters
      if (filters.engager_name && !row.engager_name?.toLowerCase().includes(filters.engager_name.toLowerCase())) {
        return false;
      }
      if (filters.engager_company_name && !row.engager_company_name?.toLowerCase().includes(filters.engager_company_name.toLowerCase())) {
        return false;
      }
      if (filters.engager_job_title && !row.engager_job_title?.toLowerCase().includes(filters.engager_job_title.toLowerCase())) {
        return false;
      }
      if (filters.post_content && !row.post_content?.toLowerCase().includes(filters.post_content.toLowerCase())) {
        return false;
      }
      if (filters.engager_company_industry && !row.engager_company_industry?.toLowerCase().includes(filters.engager_company_industry.toLowerCase())) {
        return false;
      }
      if (filters.engager_company_location && !row.engager_company_location?.toLowerCase().includes(filters.engager_company_location.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Sorting - create a copy to avoid mutating the original filtered array
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string' && 
                 !isNaN(Date.parse(aValue)) && !isNaN(Date.parse(bValue))) {
        // Handle date strings by converting to Date objects
        comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, filters, sortConfig]);

  // Handle scroll indicators
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      const { scrollLeft, scrollWidth, clientWidth } = target;
      setScrollIndicators({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth - 1
      });
    };

    const tableEl = tableRef.current;
    if (tableEl) {
      tableEl.addEventListener('scroll', handleScroll);
      // Check initial state
      const { scrollLeft, scrollWidth, clientWidth } = tableEl;
      setScrollIndicators({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth - 1
      });
      return () => tableEl.removeEventListener('scroll', handleScroll);
    }
  }, [filteredAndSortedData.length]);

  const SortableHeader = ({ 
    columnKey, 
    children, 
    className = "" 
  }: { 
    columnKey: keyof PostEngagementData; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <th 
      scope="col" 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${className}`}
      onClick={() => onSort(columnKey)}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        <div className="ml-2">
          {sortConfig.key === columnKey ? (
            sortConfig.direction === 'asc' ? (
              <span className="text-blue-600">↑</span>
            ) : (
              <span className="text-blue-600">↓</span>
            )
          ) : (
            <span className="text-gray-400">↕</span>
          )}
        </div>
      </div>
    </th>
  );

  if (isLoading) {
    return <div className="text-center p-8">Loading data...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Global Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search across all fields..."
            value={filters.global_search}
            onChange={(e) => onFilterChange('global_search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Type</label>
              <select
                value={filters.engagement_type}
                onChange={(e) => onFilterChange('engagement_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="all">All Types</option>
                <option value="like">Likes</option>
                <option value="comment">Comments</option>
                <option value="share">Shares</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engager Name</label>
              <input
                type="text"
                placeholder="Filter by name..."
                value={filters.engager_name}
                onChange={(e) => onFilterChange('engager_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                placeholder="Filter by company..."
                value={filters.engager_company_name}
                onChange={(e) => onFilterChange('engager_company_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                placeholder="Filter by job title..."
                value={filters.engager_job_title}
                onChange={(e) => onFilterChange('engager_job_title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Post Content</label>
              <input
                type="text"
                placeholder="Filter by post content..."
                value={filters.post_content}
                onChange={(e) => onFilterChange('post_content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                placeholder="Filter by industry..."
                value={filters.engager_company_industry}
                onChange={(e) => onFilterChange('engager_company_industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="Filter by location..."
                value={filters.engager_company_location}
                onChange={(e) => onFilterChange('engager_company_location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => onFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => onFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>
          
          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={onExportToExcel}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </button>
          </div>
        </div>
      )}

      {/* Column Visibility Toggle */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Visible Columns</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setVisibleColumns(prev => Object.keys(prev).reduce((acc, key) => ({...acc, [key]: true}), {} as typeof prev))}
              className="text-xs px-2 py-1 bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30 transition-colors"
            >
              Show All
            </button>
            <button
              onClick={() => setVisibleColumns(prev => Object.keys(prev).reduce((acc, key) => ({...acc, [key]: ['type', 'engager_name', 'engager_company_name'].includes(key)}), {} as typeof prev))}
              className="text-xs px-2 py-1 bg-gray-700/50 text-gray-300 rounded hover:bg-gray-700/70 transition-colors"
            >
              Essential Only
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(visibleColumns).map(([key, value]) => (
            <label key={key} className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setVisibleColumns(prev => ({...prev, [key]: e.target.checked}))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-1"
              />
              <span className="ml-2 text-sm text-gray-600">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="text-sm text-gray-300">
        Showing {filteredAndSortedData.length} of {data.length} engagements
      </div>

      {/* Data Table - Desktop */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden md:block glass-table flex flex-col"
      >
        <div className="relative">
          {scrollIndicators.left && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--background-secondary)] via-[var(--background-secondary)] to-transparent pointer-events-none z-20" />
          )}
          {scrollIndicators.right && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--background-secondary)] via-[var(--background-secondary)] to-transparent pointer-events-none z-20" />
          )}
          <div 
            ref={tableRef} 
            className="overflow-auto max-h-[70vh] border border-border-primary rounded-lg"
            style={{ scrollbarWidth: 'thin' }}
          >
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {visibleColumns.type && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                )}
                {visibleColumns.engager_name && (
                  <SortableHeader columnKey="engager_name">Engager Name</SortableHeader>
                )}
                {visibleColumns.engager_company_name && (
                  <SortableHeader columnKey="engager_company_name">Company</SortableHeader>
                )}
                {visibleColumns.engager_company_industry && (
                  <SortableHeader columnKey="engager_company_industry">Industry</SortableHeader>
                )}
                {visibleColumns.engager_company_size && (
                  <SortableHeader columnKey="engager_company_size">Company Size</SortableHeader>
                )}
                {visibleColumns.engager_company_employees && (
                  <SortableHeader columnKey="engager_company_employees">Employees</SortableHeader>
                )}
                {visibleColumns.engager_job_title && (
                  <SortableHeader columnKey="engager_job_title">Job Title</SortableHeader>
                )}
                {visibleColumns.profile && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                )}
                {visibleColumns.post_content && (
                  <SortableHeader columnKey="post_content">Post Content</SortableHeader>
                )}
                {visibleColumns.details && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                )}
                {visibleColumns.post_url && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post URL</th>
                )}
                {visibleColumns.engagement_timestamp && (
                  <SortableHeader columnKey="engagement_timestamp">Engaged At</SortableHeader>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-500/20">
              {filteredAndSortedData.map((row, index) => (
                <tr key={index} className="hover:bg-teal-500/5 transition-colors">
                  {visibleColumns.type && (
                    <td className="px-6 py-4 whitespace-normal min-w-[100px]">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        row.engagement_type === 'like' ? 'bg-green-100 text-green-800' :
                        row.engagement_type === 'comment' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {row.engagement_type.charAt(0).toUpperCase() + row.engagement_type.slice(1)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.engager_name && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.engager_name || 'N/A'}
                    </td>
                  )}
                  {visibleColumns.engager_company_name && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.engager_company_name ? (
                        row.engager_company_url ? (
                          <a href={row.engager_company_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                            {row.engager_company_name}
                          </a>
                        ) : (
                          row.engager_company_name
                        )
                      ) : (
                        'N/A'
                      )}
                    </td>
                  )}
                  {visibleColumns.engager_company_industry && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.engager_company_industry || 'N/A'}
                    </td>
                  )}
                  {visibleColumns.engager_company_size && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.engager_company_size || 'N/A'}
                    </td>
                  )}
                  {visibleColumns.engager_company_employees && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {row.engager_company_employees ? row.engager_company_employees.toLocaleString() : 'N/A'}
                    </td>
                  )}
                  {visibleColumns.engager_job_title && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.engager_job_title || 'N/A'}
                    </td>
                  )}
                  {visibleColumns.profile && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {row.linkedin_profile_url ? (
                        <a href={row.linkedin_profile_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                          View Profile
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  )}
                  {visibleColumns.post_content && (
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs whitespace-normal">
                      {row.post_content ? (
                        <div className="max-w-xs">
                          {row.post_content}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  )}
                  {visibleColumns.details && (
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">
                      {row.engagement_type === 'comment'
                        ? `Comment: "${row.reaction_type}"`
                        : row.engagement_type === 'like'
                        ? `Reaction: ${row.reaction_type}`
                        : `Shared`}
                    </td>
                  )}
                  {visibleColumns.post_url && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.post_url ? (
                        <a href={row.post_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                          View Post
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  )}
                  {visibleColumns.engagement_timestamp && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.engagement_timestamp ? new Date(row.engagement_timestamp).toLocaleDateString() : 'N/A'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </motion.div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedData.map((row, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="glass-card p-4"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      row.engagement_type === 'like' ? 'bg-green-100 text-green-800' :
                      row.engagement_type === 'comment' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {row.engagement_type.charAt(0).toUpperCase() + row.engagement_type.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {row.engagement_timestamp ? new Date(row.engagement_timestamp).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900">{row.engager_name || 'N/A'}</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Company:</span>
                  <span className="text-gray-900">
                    {row.engager_company_name ? (
                      row.engager_company_url ? (
                        <a href={row.engager_company_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                          {row.engager_company_name}
                        </a>
                      ) : (
                        row.engager_company_name
                      )
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
                
                {row.engager_company_industry && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Industry:</span>
                    <span className="text-gray-900">{row.engager_company_industry}</span>
                  </div>
                )}
                
                {row.engager_job_title && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Job Title:</span>
                    <span className="text-gray-900">{row.engager_job_title}</span>
                  </div>
                )}
                
                {row.engager_company_size && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Company Size:</span>
                    <span className="text-gray-900">{row.engager_company_size}</span>
                  </div>
                )}
                
                {row.engager_company_employees && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Employees:</span>
                    <span className="text-gray-900">{row.engager_company_employees.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              {row.post_content && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="font-medium text-gray-600 text-sm">Post Content:</span>
                  <p className="text-sm text-gray-900 mt-1">{row.post_content}</p>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {row.engagement_type === 'comment'
                    ? `Comment: "${row.reaction_type}"`
                    : row.engagement_type === 'like'
                    ? `Reaction: ${row.reaction_type}`
                    : `Shared`}
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                {row.linkedin_profile_url && (
                  <a href={row.linkedin_profile_url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-900">
                    View Profile
                  </a>
                )}
                {row.post_url && (
                  <a href={row.post_url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-900">
                    View Post
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function PostEngagementReportPage() {
  const [postEngagementData, setPostEngagementData] = useState<PostEngagementData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'engagement_timestamp',
    direction: 'desc'
  });
  const [filters, setFilters] = useState<FilterConfig>({
    engager_name: '',
    engager_company_name: '',
    engager_job_title: '',
    post_content: '',
    engager_company_industry: '',
    engager_company_location: '',
    engagement_type: 'all',
    global_search: '',
    date_from: '',
    date_to: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100); // Default to 100 entries per page
  const [totalCount, setTotalCount] = useState(0); // Total number of entries without pagination

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const handleSort = (key: keyof PostEngagementData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key: keyof FilterConfig, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      engager_name: '',
      engager_company_name: '',
      engager_job_title: '',
      post_content: '',
      engager_company_industry: '',
      engager_company_location: '',
      engagement_type: 'all',
      global_search: '',
      date_from: '',
      date_to: ''
    });
  };

  const handleExportToExcel = () => {
    try {
      console.log('[PostEngagement] Starting Excel export...');
      console.log('[PostEngagement] Total data rows:', postEngagementData.length);
      
      // Get the filtered data that's currently displayed in the table
      const dataToExport = postEngagementData.filter(row => {
        // Apply the same filtering logic as in the table
        if (filters.engagement_type !== 'all' && row.engagement_type !== filters.engagement_type) {
          return false;
        }

        // Date range filter
        if (filters.date_from || filters.date_to) {
          const engagementDate = row.engagement_timestamp ? new Date(row.engagement_timestamp) : null;
          if (engagementDate) {
            if (filters.date_from) {
              const fromDate = new Date(filters.date_from);
              if (engagementDate < fromDate) {
                return false;
              }
            }
            if (filters.date_to) {
              const toDate = new Date(filters.date_to);
              toDate.setHours(23, 59, 59, 999);
              if (engagementDate > toDate) {
                return false;
              }
            }
          }
        }

        // Global search filter
        if (filters.global_search) {
          const searchTerm = filters.global_search.toLowerCase();
          const searchableFields = [
            row.engager_name,
            row.engager_company_name,
            row.engager_job_title,
            row.post_content,
            row.engager_company_industry,
            row.engager_company_location,
            row.engager_headline,
            row.post_author,
            row.engagement_type,
            row.reaction_type
          ].filter(Boolean).join(' ').toLowerCase();
          
          if (!searchableFields.includes(searchTerm)) {
            return false;
          }
        }

        // Individual column filters
        if (filters.engager_name && !row.engager_name?.toLowerCase().includes(filters.engager_name.toLowerCase())) {
          return false;
        }
        if (filters.engager_company_name && !row.engager_company_name?.toLowerCase().includes(filters.engager_company_name.toLowerCase())) {
          return false;
        }
        if (filters.engager_job_title && !row.engager_job_title?.toLowerCase().includes(filters.engager_job_title.toLowerCase())) {
          return false;
        }
        if (filters.post_content && !row.post_content?.toLowerCase().includes(filters.post_content.toLowerCase())) {
          return false;
        }
        if (filters.engager_company_industry && !row.engager_company_industry?.toLowerCase().includes(filters.engager_company_industry.toLowerCase())) {
          return false;
        }
        if (filters.engager_company_location && !row.engager_company_location?.toLowerCase().includes(filters.engager_company_location.toLowerCase())) {
          return false;
        }

        return true;
      });

      console.log('[PostEngagement] Filtered data rows:', dataToExport.length);

      // Check if there's data to export
      if (dataToExport.length === 0) {
        alert('No data to export. Please adjust your filters or ensure data is loaded.');
        return;
      }

      // Prepare data for Excel export
      const exportData = dataToExport.map(row => ({
        'Engagement Type': row.engagement_type || '',
        'Engager Name': row.engager_name || '',
        'Company Name': row.engager_company_name || '',
        'Company Industry': row.engager_company_industry || '',
        'Company Size': row.engager_company_size || '',
        'Company Location': row.engager_company_location || '',
        'Company Employees': row.engager_company_employees || '',
        'Job Title': row.engager_job_title || '',
        'Engager Headline': row.engager_headline || '',
        'Engager Location': row.engager_location || '',
        'LinkedIn Profile': row.linkedin_profile_url || '',
        'Post Content': row.post_content ? row.post_content.substring(0, 500) + (row.post_content.length > 500 ? '...' : '') : '',
        'Post Author': row.post_author || '',
        'Post Type': row.post_type || '',
        'Like Count': row.like_count || 0,
        'Comment Count': row.comment_count || 0,
        'Repost Count': row.repost_count || 0,
        'Post URL': row.post_url || '',
        'Post Date': row.post_timestamp ? new Date(row.post_timestamp).toLocaleDateString() : '',
        'Engagement Date': row.engagement_timestamp ? new Date(row.engagement_timestamp).toLocaleDateString() : '',
        'Engagement Time': row.engagement_timestamp ? new Date(row.engagement_timestamp).toLocaleTimeString() : '',
        'Reaction Type': row.reaction_type || ''
      }));

      console.log('[PostEngagement] Export data prepared:', exportData.length, 'rows');

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns based on content
      if (exportData.length > 0) {
        const colWidths = Object.keys(exportData[0]).map(key => {
          const maxLength = Math.max(
            key.length, // Header length
            ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
          );
          return { wch: Math.min(Math.max(maxLength, 10), 50) }; // Min 10, max 50 characters
        });
        worksheet['!cols'] = colWidths;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Post Engagement Data');

      // Generate filename with current date and time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `post-engagement-report-${currentDate}-${currentTime}.xlsx`;

      console.log('[PostEngagement] Saving file:', filename);

      // Save the file
      XLSX.writeFile(workbook, filename);
      
      console.log('[PostEngagement] Excel export completed successfully');
      
      // Show success message
      alert(`Excel file exported successfully!\nFilename: ${filename}\nRows exported: ${exportData.length}`);
      
    } catch (error) {
      console.error('[PostEngagement] Excel export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to export Excel file: ${errorMessage}`);
    }
  };

  useEffect(() => {
    const fetchPostEngagementData = async () => {
      setIsLoading(true);
      setError(null);

      // Use AiEO project credentials for this report
      const aieoSupabaseUrl = process.env.NEXT_PUBLIC_AIEO_SUPABASE_URL;
      const aieoSupabaseKey = process.env.NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY;

      if (!aieoSupabaseUrl || !aieoSupabaseKey) {
        setError('AiEO Supabase is not configured. Set NEXT_PUBLIC_AIEO_SUPABASE_URL and NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY.');
        setIsLoading(false);
        return;
      }

      const supabase = createClient(aieoSupabaseUrl, aieoSupabaseKey);

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage - 1;

      try {
        console.log('[PostEngagement] Connecting to AiEO Supabase…');
        console.log('[PostEngagement] URL:', aieoSupabaseUrl);
        console.log('[PostEngagement] Key length:', aieoSupabaseKey ? aieoSupabaseKey.length : 'NOT SET');
        console.log('[PostEngagement] Table: public.v_post_engagement_v2');
        
        const { data, error, count } = await supabase
          .from('v_post_engagement_v2')
          .select('*', { count: 'exact' })
          .order('engagement_timestamp', { ascending: false })
          .range(startIndex, endIndex);

        if (error) {
          console.error('Supabase error (v_post_engagement_v2):', error);
          setError(`Database error (v_post_engagement_v2): ${error.message} (Code: ${error.code})`);
        } else {
          console.log('Raw data from AiEO Supabase (v_post_engagement_v2):', data);
          setPostEngagementData((data as PostEngagementData[]) || []);
          setTotalCount(count || 0);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Network error: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostEngagementData();
  }, [currentPage, itemsPerPage]); // Add currentPage and itemsPerPage to dependencies

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-teal-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/30 rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-teal-200 to-emerald-200 bg-clip-text text-transparent">
            Post Engagement Report
          </h2>
          <p className="mt-2 text-gray-300">
            View all post engagements (likes, comments, shares) with post content, profile information, and company details from the AiEO LinkedIn Data project.
          </p>
          <div className="mt-1 text-xs text-teal-300/80">
            Data source: <code>public.v_post_engagement_v2</code>
          </div>
        </motion.div>
        
        <div className="mt-6">
          <PostEngagementTable 
            data={postEngagementData} 
            isLoading={isLoading} 
            error={error}
            sortConfig={sortConfig}
            onSort={handleSort}
            filters={filters}
            onFilterChange={handleFilterChange}
            onExportToExcel={handleExportToExcel}
          />
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="items-per-page" className="text-sm font-medium text-gray-700">Show</label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm font-medium text-gray-700">entries</span>
          </div>

          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              Page {currentPage} of {Math.ceil(totalCount / itemsPerPage) || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * itemsPerPage >= totalCount}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-4">
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
}