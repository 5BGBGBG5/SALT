"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

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
};

const PostEngagementTable = ({ 
  data, 
  isLoading, 
  error, 
  sortConfig, 
  onSort, 
  filters, 
  onFilterChange 
}: { 
  data: PostEngagementData[]; 
  isLoading: boolean; 
  error: string | null;
  sortConfig: SortConfig;
  onSort: (key: keyof PostEngagementData) => void;
  filters: FilterConfig;
  onFilterChange: (key: keyof FilterConfig, value: string) => void;
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedData = useMemo(() => {
    // Filter the data based on current filter settings
    const filtered = data.filter(row => {
      // Engagement type filter
      if (filters.engagement_type !== 'all' && row.engagement_type !== filters.engagement_type) {
        return false;
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
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedData.length} of {data.length} engagements
      </div>

      {/* Data Table */}
      <div className="bg-white shadow sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <SortableHeader columnKey="engager_name">Engager Name</SortableHeader>
                <SortableHeader columnKey="engager_company_name">Company</SortableHeader>
                <SortableHeader columnKey="engager_job_title">Job Title</SortableHeader>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                <SortableHeader columnKey="post_content">Post Content</SortableHeader>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post URL</th>
                <SortableHeader columnKey="engagement_timestamp">Engaged At</SortableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-normal min-w-[100px]">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      row.engagement_type === 'like' ? 'bg-green-100 text-green-800' :
                      row.engagement_type === 'comment' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {row.engagement_type.charAt(0).toUpperCase() + row.engagement_type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.engager_name || 'N/A'}
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.engager_job_title || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {row.linkedin_profile_url ? (
                      <a href={row.linkedin_profile_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                        View Profile
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs whitespace-normal">
                    {row.post_content ? (
                      <div className="max-w-xs">
                        {row.post_content}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">
                    {row.engagement_type === 'comment'
                      ? `Comment: "${row.reaction_type}"`
                      : row.engagement_type === 'like'
                      ? `Reaction: ${row.reaction_type}`
                      : `Shared`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.post_url ? (
                      <a href={row.post_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                        View Post
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.engagement_timestamp ? new Date(row.engagement_timestamp).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    global_search: ''
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
      global_search: ''
    });
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
        console.log('Attempting to connect to AiEO Supabase...');
        console.log('URL:', aieoSupabaseUrl);
        console.log('Key length:', aieoSupabaseKey ? aieoSupabaseKey.length : 'NOT SET');
        
        const { data, error, count } = await supabase
          .from('v_post_engagement')
          .select('*', { count: 'exact' })
          .order('engagement_timestamp', { ascending: false })
          .range(startIndex, endIndex);

        if (error) {
          console.error('Supabase error:', error);
          setError(`Database error: ${error.message} (Code: ${error.code})`);
        } else {
          console.log('Raw data from AiEO Supabase (v_post_engagement):', data);
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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900">Post Engagement Report (AiEO Project)</h2>
        <p className="mt-1 text-sm text-gray-600">View all post engagements (likes, comments, shares) with post content, profile information, and company details from the AiEO LinkedIn Data project.</p>
        
        <div className="mt-6">
          <PostEngagementTable 
            data={postEngagementData} 
            isLoading={isLoading} 
            error={error}
            sortConfig={sortConfig}
            onSort={handleSort}
            filters={filters}
            onFilterChange={handleFilterChange}
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