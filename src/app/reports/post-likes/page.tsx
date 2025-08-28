"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

type PostLikeData = {
  like_id: string | null;
  reaction_type: string | null;
  like_timestamp: string | null;
  post_url: string | null;
  post_content: string | null;
  post_type: string | null;
  post_author: string | null;
  first_name: string | null;
  last_name: string | null;
  liker_name: string | null;
  liker_headline: string | null;
  liker_location: string | null;
  current_job_title: string | null;
  linkedin_profile_url: string | null;
  liker_company_name: string | null;
  liker_company_industry: string | null;
  liker_company_size: string | null;
  liker_company_location: string | null;
  liker_company_employees: number | null;
  liker_company_url: string | null;
  liker_job_title: string | null;
};

type SortConfig = {
  key: keyof PostLikeData;
  direction: 'asc' | 'desc';
};

type FilterConfig = {
  liker_name: string;
  liker_company_name: string;
  liker_job_title: string;
  post_content: string;
  liker_company_industry: string;
  liker_company_location: string;
  global_search: string;
};

const PostLikesTable = ({ 
  data, 
  isLoading, 
  error, 
  sortConfig, 
  onSort, 
  filters, 
  onFilterChange 
}: { 
  data: PostLikeData[]; 
  isLoading: boolean; 
  error: string | null;
  sortConfig: SortConfig;
  onSort: (key: keyof PostLikeData) => void;
  filters: FilterConfig;
  onFilterChange: (key: keyof FilterConfig, value: string) => void;
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(row => {
      // Global search across all fields
      if (filters.global_search) {
        const searchTerm = filters.global_search.toLowerCase();
        const searchableFields = [
          row.liker_name,
          row.liker_company_name,
          row.liker_job_title,
          row.post_content,
          row.liker_company_industry,
          row.liker_company_location,
          row.liker_headline,
          row.post_author
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableFields.includes(searchTerm)) {
          return false;
        }
      }

      // Individual column filters
      if (filters.liker_name && !row.liker_name?.toLowerCase().includes(filters.liker_name.toLowerCase())) {
        return false;
      }
      if (filters.liker_company_name && !row.liker_company_name?.toLowerCase().includes(filters.liker_company_name.toLowerCase())) {
        return false;
      }
      if (filters.liker_job_title && !row.liker_job_title?.toLowerCase().includes(filters.liker_job_title.toLowerCase())) {
        return false;
      }
      if (filters.post_content && !row.post_content?.toLowerCase().includes(filters.post_content.toLowerCase())) {
        return false;
      }
      if (filters.liker_company_industry && !row.liker_company_industry?.toLowerCase().includes(filters.liker_company_industry.toLowerCase())) {
        return false;
      }
      if (filters.liker_company_location && !row.liker_company_location?.toLowerCase().includes(filters.liker_company_location.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
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
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [data, filters, sortConfig]);

  const SortableHeader = ({ 
    columnKey, 
    children, 
    className = "" 
  }: { 
    columnKey: keyof PostLikeData; 
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Liker Name</label>
              <input
                type="text"
                placeholder="Filter by name..."
                value={filters.liker_name}
                onChange={(e) => onFilterChange('liker_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                placeholder="Filter by company..."
                value={filters.liker_company_name}
                onChange={(e) => onFilterChange('liker_company_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                placeholder="Filter by job title..."
                value={filters.liker_job_title}
                onChange={(e) => onFilterChange('liker_job_title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Post Content</label>
              <input
                type="text"
                placeholder="Filter by post content..."
                value={filters.post_content}
                onChange={(e) => onFilterChange('post_content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Industry</label>
              <input
                type="text"
                placeholder="Filter by industry..."
                value={filters.liker_company_industry}
                onChange={(e) => onFilterChange('liker_company_industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Location</label>
              <input
                type="text"
                placeholder="Filter by location..."
                value={filters.liker_company_location}
                onChange={(e) => onFilterChange('liker_company_location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedData.length} of {data.length} results
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader columnKey="liker_name">Liker Name</SortableHeader>
              <SortableHeader columnKey="liker_company_name">Liker Company</SortableHeader>
              <SortableHeader columnKey="liker_job_title">Liker Job Title</SortableHeader>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liker Profile</th>
              <SortableHeader columnKey="post_content">Post Content</SortableHeader>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post URL</th>
              <SortableHeader columnKey="like_timestamp">Liked At</SortableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  {filters.global_search || Object.values(filters).some(f => f) 
                    ? 'No results match your filters. Try adjusting your search criteria.' 
                    : 'No data found'}
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.liker_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.liker_company_name ? (
                      row.liker_company_url ? (
                        <a href={row.liker_company_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                          {row.liker_company_name}
                        </a>
                      ) : (
                        row.liker_company_name
                      )
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.liker_job_title || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {row.linkedin_profile_url ? (
                      <a href={row.linkedin_profile_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">View Profile</a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 max-w-xs">
                    {row.post_content || 'No content available'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {row.post_url ? (
                      <a href={row.post_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">View Post</a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.like_timestamp ? new Date(row.like_timestamp).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function PostLikesReportPage() {
  const [postLikesData, setPostLikesData] = useState<PostLikeData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'like_timestamp',
    direction: 'desc'
  });
  const [filters, setFilters] = useState<FilterConfig>({
    liker_name: '',
    liker_company_name: '',
    liker_job_title: '',
    post_content: '',
    liker_company_industry: '',
    liker_company_location: '',
    global_search: ''
  });

  const handleSort = (key: keyof PostLikeData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key: keyof FilterConfig, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      liker_name: '',
      liker_company_name: '',
      liker_job_title: '',
      post_content: '',
      liker_company_industry: '',
      liker_company_location: '',
      global_search: ''
    });
  };

  useEffect(() => {
    const fetchPostLikesData = async () => {
      setIsLoading(true);
      setError(null);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setError('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        setIsLoading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      try {
        const { data, error } = await supabase
          .from('v_likes_detailed')
          .select('*')
          .order('like_timestamp', { ascending: false })
          .range(0, 99);

        if (error) {
          console.error('Error fetching data from Supabase:', error);
          setError(error.message);
        } else {
          console.log('Raw data from Supabase (v_likes_detailed):', data);
          setPostLikesData((data as PostLikeData[]) || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch data');
      }
      
      setIsLoading(false);
    };

    fetchPostLikesData();
  }, []);

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-900">Post Likes Report</h2>
      <p className="mt-1 text-sm text-gray-600">View all post likes with post content, profile information, and company details.</p>
      
      <div className="mt-6">
        <PostLikesTable 
          data={postLikesData} 
          isLoading={isLoading} 
          error={error}
          sortConfig={sortConfig}
          onSort={handleSort}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
        
        {/* Clear Filters Button */}
        {(filters.global_search || Object.values(filters).some(f => f)) && (
          <div className="mt-4">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}


