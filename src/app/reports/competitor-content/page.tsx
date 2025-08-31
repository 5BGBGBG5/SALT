"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Supabase client setup (ensure these are loaded from environment variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Post {
  id: string;
  post_url: string;
  post_urn: string | null;
  author_name: string | null;
  author_url: string | null;
  author_profile_id: string | null;
  author_company_id: string | null;
  post_type: string | null;
  post_content: string | null;
  image_url: string | null;
  video_url: string | null;
  like_count: number;
  comment_count: number;
  repost_count: number;
  action: string | null;
  post_date: string | null;
  post_timestamp: string | null; // ISO date string
  scraped_timestamp: string | null; // ISO date string
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

interface PostIdea {
  id: string;
  title: string;
  hook: string | null;
  confidence_score: number;
  status: 'draft' | 'approved' | 'rejected' | 'published';
  week_of_date: string; // YYYY-MM-DD
  outline: string | null;
  angle: string | null;
  persona: string | null;
  inspired_by_posts: string[] | null; // Array of post URLs
  created_at: string;
  updated_at: string;
}

const PostContentTruncated: React.FC<{ content: string }> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const truncatedContent = content.substring(0, 100);

  return (
    <div>
      {isExpanded ? content : `${truncatedContent}...`}
      {content.length > 100 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-indigo-600 hover:text-indigo-900 ml-1"
        >
          {isExpanded ? 'read less' : 'read more'}
        </button>
      )}
    </div>
  );
};

const CompetitorContentReportPage = () => {
  const [activeTab, setActiveTab] = useState<'posts' | 'ideas'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Post; direction: 'ascending' | 'descending' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10); // Number of posts per page
  const [totalPosts, setTotalPosts] = useState(0);
  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterContent, setFilterContent] = useState('');
  const [filterPostType, setFilterPostType] = useState('');
  const [filterMinLikes, setFilterMinLikes] = useState(0);
  const [filterMinComments, setFilterMinComments] = useState(0);
  const [filterMinReposts, setFilterMinReposts] = useState(0);
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);

  // Debounced filters for Competitor Posts
  const debouncedFilterAuthor = useDebounce(filterAuthor, 500);
  const debouncedFilterContent = useDebounce(filterContent, 500);

  // State for Post Ideas tab
  const [postIdeas, setPostIdeas] = useState<PostIdea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [errorIdeas, setErrorIdeas] = useState<string | null>(null);
  const [filterIdeaStatus, setFilterIdeaStatus] = useState('');
  const [filterIdeaWeekOfDate, setFilterIdeaWeekOfDate] = useState<string | null>(null);
  const [filterIdeaConfidenceScore, setFilterIdeaConfidenceScore] = useState<[number, number]>([0, 1]); // [min, max]
  const [filterIdeaSearch, setFilterIdeaSearch] = useState('');

  // Debounced filter for Post Ideas
  const debouncedFilterIdeaSearch = useDebounce(filterIdeaSearch, 500);

  // State for Inspired Posts Modal
  const [showInspiredPostsModal, setShowInspiredPostsModal] = useState(false);
  const [selectedInspiredPosts, setSelectedInspiredPosts] = useState<Post[]>([]);
  const [loadingInspiredPosts, setLoadingInspiredPosts] = useState(false);
  const [errorInspiredPosts, setErrorInspiredPosts] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetitorPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase.from('posts').select('*', { count: 'exact' });

        // Apply filters
        if (debouncedFilterAuthor) {
          query = query.ilike('author_name', `%
            ${
              debouncedFilterAuthor
            }%
          `);
        }
        if (debouncedFilterContent) {
          query = query.ilike('post_content', `%
            ${
              debouncedFilterContent
            }%
          `);
        }
        if (filterPostType) {
          query = query.eq('post_type', filterPostType);
        }
        if (filterMinLikes > 0) {
          query = query.gte('like_count', filterMinLikes);
        }
        if (filterMinComments > 0) {
          query = query.gte('comment_count', filterMinComments);
        }
        if (filterMinReposts > 0) {
          query = query.gte('repost_count', filterMinReposts);
        }
        if (filterStartDate) {
          query = query.gte('post_timestamp', filterStartDate);
        }
        if (filterEndDate) {
          query = query.lte('post_timestamp', filterEndDate);
        }

        // Default sorting: newest first (post_timestamp desc)
        query = query.order('post_timestamp', { ascending: false });

        const { data, error, count } = await query
          .limit(postsPerPage)
          .range((currentPage - 1) * postsPerPage, currentPage * postsPerPage - 1);

        if (error) throw error;
        setPosts(data || []);
        setTotalPosts(count || 0);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    const fetchPostIdeas = async () => {
      setLoadingIdeas(true);
      setErrorIdeas(null);
      try {
        let query = supabase.from('post_ideas').select('*');

        // Apply filters
        if (filterIdeaStatus) {
          query = query.eq('status', filterIdeaStatus);
        }
        if (filterIdeaWeekOfDate) {
          query = query.eq('week_of_date', filterIdeaWeekOfDate);
        }
        if (filterIdeaConfidenceScore[0] > 0 || filterIdeaConfidenceScore[1] < 1) {
          query = query
            .gte('confidence_score', filterIdeaConfidenceScore[0])
            .lte('confidence_score', filterIdeaConfidenceScore[1]);
        }
        if (debouncedFilterIdeaSearch) {
          query = query.or(
            `title.ilike.%${debouncedFilterIdeaSearch}%,
            hook.ilike.%${debouncedFilterIdeaSearch}%,
            outline.ilike.%${debouncedFilterIdeaSearch}%`
          );
        }

        const { data, error } = await query.order('week_of_date', { ascending: false });

        if (error) throw error;
        setPostIdeas(data || []);
      } catch (err: unknown) {
        setErrorIdeas(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoadingIdeas(false);
      }
    };

    if (activeTab === 'posts') {
      fetchCompetitorPosts();
    } else if (activeTab === 'ideas') {
      fetchPostIdeas();
    }
  }, [activeTab, currentPage, postsPerPage, debouncedFilterAuthor, debouncedFilterContent, filterPostType, filterMinLikes, filterMinComments, filterMinReposts, filterStartDate, filterEndDate, filterIdeaStatus, filterIdeaWeekOfDate, filterIdeaConfidenceScore, debouncedFilterIdeaSearch]);

  const fetchInspiredPosts = async (postUrls: string[]) => {
    setLoadingInspiredPosts(true);
    setErrorInspiredPosts(null);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('post_url', postUrls);

      if (error) throw error;
      setSelectedInspiredPosts(data || []);
    } catch (err: unknown) {
      setErrorInspiredPosts(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoadingInspiredPosts(false);
    }
  };

  const handleViewInspiredPosts = (postUrls: string[]) => {
    fetchInspiredPosts(postUrls);
    setShowInspiredPostsModal(true);
  };

  const sortedPosts = React.useMemo(() => {
    const sortablePosts = [...posts];
    if (sortConfig !== null) {
      sortablePosts.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        // Fallback for mixed types or nulls
        if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortablePosts;
  }, [posts, sortConfig]);

  const requestSort = (key: keyof Post) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Pagination controls
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const postTypes = ['Image', 'Video (LinkedIn Source)', 'Text']; // Example post types, replace with actual types from DB
  const ideaStatuses = ['draft', 'approved', 'rejected', 'published'];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Competitor Content Report</h1>

      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('posts')}
            className={`${
              activeTab === 'posts'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Competitor Posts
          </button>
          <button
            onClick={() => setActiveTab('ideas')}
            className={`${
              activeTab === 'ideas'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Post Ideas
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'posts' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Competitor Posts</h2>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label htmlFor="author-search" className="block text-sm font-medium text-gray-700">Author Name</label>
                <input
                  type="text"
                  id="author-search"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filterAuthor}
                  onChange={(e) => setFilterAuthor(e.target.value)}
                  placeholder="Search by author"
                />
              </div>
              <div>
                <label htmlFor="content-search" className="block text-sm font-medium text-gray-700">Post Content</label>
                <input
                  type="text"
                  id="content-search"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filterContent}
                  onChange={(e) => setFilterContent(e.target.value)}
                  placeholder="Search by content"
                />
              </div>
              <div>
                <label htmlFor="post-type-dropdown" className="block text-sm font-medium text-gray-700">Post Type</label>
                <select
                  id="post-type-dropdown"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filterPostType}
                  onChange={(e) => setFilterPostType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {postTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="min-likes" className="block text-sm font-medium text-gray-700">Min Likes: {filterMinLikes}</label>
                <input
                  type="range"
                  id="min-likes"
                  min="0"
                  max="1000"
                  value={filterMinLikes}
                  onChange={(e) => setFilterMinLikes(Number(e.target.value))}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label htmlFor="min-comments" className="block text-sm font-medium text-gray-700">Min Comments: {filterMinComments}</label>
                <input
                  type="range"
                  id="min-comments"
                  min="0"
                  max="500"
                  value={filterMinComments}
                  onChange={(e) => setFilterMinComments(Number(e.target.value))}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label htmlFor="min-reposts" className="block text-sm font-medium text-gray-700">Min Reposts: {filterMinReposts}</label>
                <input
                  type="range"
                  id="min-reposts"
                  min="0"
                  max="200"
                  value={filterMinReposts}
                  onChange={(e) => setFilterMinReposts(Number(e.target.value))}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  id="start-date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filterStartDate || ''}
                  onChange={(e) => setFilterStartDate(e.target.value || null)}
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  id="end-date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filterEndDate || ''}
                  onChange={(e) => setFilterEndDate(e.target.value || null)}
                />
              </div>
            </div>


            {error && <p className="text-red-500">Error: {error}</p>}
            {loading ? (
              <p>Loading posts...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('author_name')}
                      >
                        Author Name
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('post_content')}
                      >
                        Post Content
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('post_type')}
                      >
                        Post Type
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('like_count')}
                      >
                        Likes
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('comment_count')}
                      >
                        Comments
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('repost_count')}
                      >
                        Reposts
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('post_timestamp')}
                      >
                        Post Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedPosts.map((post) => (
                      <tr key={post.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {post.author_url ? (
                            <a href={post.author_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                              {post.author_name || 'Unknown Author'}
                            </a>
                          ) : (
                            post.author_name || 'Unknown Author'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {post.post_content && post.post_content.length > 100 ? (
                            <PostContentTruncated content={post.post_content} />
                          ) : (
                            post.post_content
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.post_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.like_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.comment_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.repost_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {post.post_timestamp ? new Date(post.post_timestamp).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {post.post_url && (
                            <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                              View Post
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination Controls */}
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage * postsPerPage >= totalPosts}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * postsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * postsPerPage, totalPosts)}</span> of {' '}
                        <span className="font-medium">{totalPosts}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        {pageNumbers.map((number) => (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              number === currentPage
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {number}
                          </button>
                        ))}
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage * postsPerPage >= totalPosts}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'ideas' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Post Ideas</h2>
            
            {/* Filter Controls for Post Ideas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label htmlFor="idea-status-dropdown" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  id="idea-status-dropdown"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filterIdeaStatus}
                  onChange={(e) => setFilterIdeaStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {ideaStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="idea-week-of-date" className="block text-sm font-medium text-gray-700">Week of Date</label>
                <input
                  type="date"
                  id="idea-week-of-date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filterIdeaWeekOfDate || ''}
                  onChange={(e) => setFilterIdeaWeekOfDate(e.target.value || null)}
                />
              </div>
              <div>
                <label htmlFor="idea-confidence-score" className="block text-sm font-medium text-gray-700">Confidence Score: {filterIdeaConfidenceScore[0].toFixed(2)} - {filterIdeaConfidenceScore[1].toFixed(2)}</label>
                <input
                  type="range"
                  id="idea-confidence-score-min"
                  min="0"
                  max="1"
                  step="0.01"
                  value={filterIdeaConfidenceScore[0]}
                  onChange={(e) => setFilterIdeaConfidenceScore([Number(e.target.value), filterIdeaConfidenceScore[1]])}
                  className="mt-1 block w-full"
                />
                <input
                  type="range"
                  id="idea-confidence-score-max"
                  min="0"
                  max="1"
                  step="0.01"
                  value={filterIdeaConfidenceScore[1]}
                  onChange={(e) => setFilterIdeaConfidenceScore([filterIdeaConfidenceScore[0], Number(e.target.value)])}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label htmlFor="idea-search" className="block text-sm font-medium text-gray-700">Search Ideas</label>
                <input
                  type="text"
                  id="idea-search"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filterIdeaSearch}
                  onChange={(e) => setFilterIdeaSearch(e.target.value)}
                  placeholder="Search title, hook, outline"
                />
              </div>
            </div>

            {errorIdeas && <p className="text-red-500">Error: {errorIdeas}</p>}
            {loadingIdeas ? (
              <p>Loading post ideas...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {postIdeas.map((idea) => (
                  <div key={idea.id} className="bg-white shadow rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-2">{idea.title}</h3>
                    {idea.hook && <p className="text-gray-700 mb-2"><strong>Hook:</strong> {idea.hook}</p>}
                    
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        idea.status === 'published' ? 'bg-green-100 text-green-800' :
                        idea.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        idea.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {idea.status}
                      </span>
                    </div>

                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700">Confidence Score:</p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            idea.confidence_score >= 0.8 ? 'bg-green-500' :
                            idea.confidence_score >= 0.6 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${idea.confidence_score * 100}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{(idea.confidence_score * 100).toFixed(0)}%</p>
                    </div>

                    {idea.week_of_date && <p className="text-sm text-gray-600">Week of: {new Date(idea.week_of_date).toLocaleDateString()}</p>}

                    {idea.outline && (
                      <details className="mt-2 p-2 bg-gray-50 rounded-md">
                        <summary className="font-semibold cursor-pointer">Outline</summary>
                        <p className="text-sm text-gray-800 mt-1">{idea.outline}</p>
                      </details>
                    )}
                    {idea.angle && (
                      <details className="mt-2 p-2 bg-gray-50 rounded-md">
                        <summary className="font-semibold cursor-pointer">Angle</summary>
                        <p className="text-sm text-gray-800 mt-1">{idea.angle}</p>
                      </details>
                    )}
                    {idea.persona && (
                      <details className="mt-2 p-2 bg-gray-50 rounded-md">
                        <summary className="font-semibold cursor-pointer">Persona</summary>
                        <p className="text-sm text-gray-800 mt-1">{idea.persona}</p>
                      </details>
                    )}

                    {idea.inspired_by_posts && idea.inspired_by_posts.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        <button
                          onClick={() => handleViewInspiredPosts(idea.inspired_by_posts || [])}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Inspired by {idea.inspired_by_posts.length} competitor posts
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Inspired Posts Modal */}
            {showInspiredPostsModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                <div className="relative p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
                  <h3 className="text-lg font-bold mb-4">Inspired By Competitor Posts</h3>
                  {loadingInspiredPosts ? (
                    <p>Loading inspired posts...</p>
                  ) : errorInspiredPosts ? (
                    <p className="text-red-500">Error: {errorInspiredPosts}</p>
                  ) : selectedInspiredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {selectedInspiredPosts.map((post) => (
                        <div key={post.id} className="border p-3 rounded-md shadow-sm">
                          <p className="text-sm font-medium"><strong>Author:</strong> {post.author_name}</p>
                          <p className="text-sm"><strong>Content:</strong> {post.post_content?.substring(0, 150)}...</p>
                          <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 text-sm">View Post</a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No inspired posts found.</p>
                  )}
                  <button
                    onClick={() => setShowInspiredPostsModal(false)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitorContentReportPage;
