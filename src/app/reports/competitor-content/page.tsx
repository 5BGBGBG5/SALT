"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, Search, CalendarDays } from 'lucide-react';

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
  week_of_date: string; // YYYY-MM-DD
  outline: string | null;
  angle: string | null;
  persona: string | null;
  inspired_by_posts: string[] | null; // Array of post URLs
  created_at: string;
  updated_at: string;
  idea_text: string | null;  // ADD THIS
  idea_number: string | null; // ADD THIS
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
          className="text-blue-600 hover:text-blue-800 ml-1 font-medium transition-colors"
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
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [errorIdeas, setErrorIdeas] = useState<string | null>(null);
  const [filterIdeaWeekOfDate, setFilterIdeaWeekOfDate] = useState<string | null>(null);
  const [filterIdeaSearch, setFilterIdeaSearch] = useState('');

  // Debounced filter for Post Ideas
  const debouncedFilterIdeaSearch = useDebounce(filterIdeaSearch, 500);

  // State for Inspired Posts Modal
  const [showInspiredPostsModal, setShowInspiredPostsModal] = useState(false);
  const [selectedInspiredPosts, setSelectedInspiredPosts] = useState<Post[]>([]);
  const [loadingInspiredPosts, setLoadingInspiredPosts] = useState(false);
  const [errorInspiredPosts, setErrorInspiredPosts] = useState<string | null>(null);

  // State for Post Ideas Table
  const [sortConfigIdeas, setSortConfigIdeas] = useState<{ key: keyof PostIdea; direction: 'ascending' | 'descending' } | null>(null);
  const [currentPageIdeas, setCurrentPageIdeas] = useState(1);
  const [ideasPerPage] = useState(25);
  const [totalIdeas, setTotalIdeas] = useState(0);
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);

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
      console.log('fetchPostIdeas called');
      setLoadingIdeas(true);
      setErrorIdeas(null);
      try {
      let query = supabase.from('post_ideas').select('*', { count: 'exact' });
        
        // Apply filters
        if (filterIdeaWeekOfDate) {
          query = query.eq('week_of_date', filterIdeaWeekOfDate);
        }
        if (debouncedFilterIdeaSearch) {
        query = query.or(`title.ilike.%${debouncedFilterIdeaSearch}%,hook.ilike.%${debouncedFilterIdeaSearch}%,outline.ilike.%${debouncedFilterIdeaSearch}%,angle.ilike.%${debouncedFilterIdeaSearch}%,persona.ilike.%${debouncedFilterIdeaSearch}%,idea_text.ilike.%${debouncedFilterIdeaSearch}%`);
        }
        
      // Default sorting: newest first (created_at desc)
      query = query.order('created_at', { ascending: false });
        
      const { data, error, count } = await query
        .limit(ideasPerPage)
        .range((currentPageIdeas - 1) * ideasPerPage, currentPageIdeas * ideasPerPage - 1);
        
        if (error) throw error;
        setPostIdeas(data || []);
      setTotalIdeas(count || 0);
      } catch (err: unknown) {
        console.error('Error fetching post ideas:', err);
        setErrorIdeas(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoadingIdeas(false);
      }
    };

    console.log('useEffect triggered with activeTab:', activeTab);
    
    if (activeTab === 'posts') {
      fetchCompetitorPosts();
    } else if (activeTab === 'ideas') {
      fetchPostIdeas();
    }
  }, [activeTab, currentPage, postsPerPage, debouncedFilterAuthor, debouncedFilterContent, filterPostType, filterMinLikes, filterMinComments, filterMinReposts, filterStartDate, filterEndDate, filterIdeaWeekOfDate, debouncedFilterIdeaSearch, currentPageIdeas, ideasPerPage]);

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
  const paginateIdeas = (pageNumber: number) => setCurrentPageIdeas(pageNumber);

  // Sorting for Post Ideas
  const sortedPostIdeas = React.useMemo(() => {
    const sortableIdeas = [...postIdeas];
    if (sortConfigIdeas !== null) {
      sortableIdeas.sort((a, b) => {
        const aValue = a[sortConfigIdeas.key];
        const bValue = b[sortConfigIdeas.key];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfigIdeas.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfigIdeas.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        // Fallback for mixed types or nulls
        if (aValue == null) return sortConfigIdeas.direction === 'ascending' ? -1 : 1;
        if (bValue == null) return sortConfigIdeas.direction === 'ascending' ? 1 : -1;

        if (aValue < bValue) {
          return sortConfigIdeas.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfigIdeas.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableIdeas;
  }, [postIdeas, sortConfigIdeas]);

  const requestSortIdeas = (key: keyof PostIdea) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (
      sortConfigIdeas &&
      sortConfigIdeas.key === key &&
      sortConfigIdeas.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfigIdeas({ key, direction });
  };

  // Export functionality
  const exportToExcel = () => {
    const csvContent = [
      ['Idea #', 'Title', 'Week Of', 'Hook', 'Idea Text', 'Outline', 'Angle', 'Persona', 'Inspired By Posts', 'Created At'],
      ...postIdeas.map(idea => [
        idea.idea_number || '',
        idea.title,
        idea.week_of_date,
        idea.hook || '',
        idea.idea_text || '',
        idea.outline || '',
        idea.angle || '',
        idea.persona || '',
        idea.inspired_by_posts?.join('; ') || '',
        new Date(idea.created_at).toLocaleDateString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `post-ideas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const postTypes = ['Image', 'Video (LinkedIn Source)', 'Text']; // Example post types, replace with actual types from DB

  return (
    <div className="min-h-screen py-6 relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-teal-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-text-primary via-accent-primary to-accent-success bg-clip-text text-transparent mb-2">
          LinkedIn Competitor Posts
        </h1>
        <p className="text-lg text-text-secondary mb-8">
          Track and analyze competitor activity on LinkedIn to inform your content strategy
        </p>

        <div className="border-b border-border-primary mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('posts')}
              className={`whitespace-nowrap py-3 px-6 border-b-3 font-medium text-sm transition-all duration-200 ease-in-out ${
                activeTab === 'posts'
                  ? 'border-accent-primary text-accent-primary bg-accent-primary/10 rounded-t-lg'
                  : 'border-transparent text-text-secondary hover:text-accent-primary hover:bg-background-hover hover:border-border-primary'
              }`}
            >
              Competitor Posts
            </button>
            <button
              onClick={() => setActiveTab('ideas')}
              className={`whitespace-nowrap py-3 px-6 border-b-3 font-medium text-sm transition-all duration-200 ease-in-out ${
                activeTab === 'ideas'
                  ? 'border-blue-600 text-blue-600 bg-blue-50 rounded-t-lg dark:border-blue-400 dark:text-blue-400 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800'
              }`}
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
              <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800/95 dark:to-blue-900/20 p-6 rounded-xl shadow-lg mb-6 border border-blue-100 dark:border-blue-900">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
                  Filter LinkedIn Posts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="relative">
                    <label htmlFor="author-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Author Name</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="text"
                        id="author-search"
                        className="block w-full rounded-lg border-gray-300 pl-10 pr-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-gray-700/90 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                        value={filterAuthor}
                        onChange={(e) => setFilterAuthor(e.target.value)}
                        placeholder="Search by author"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label htmlFor="content-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Post Content</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="text"
                        id="content-search"
                        className="block w-full rounded-lg border-gray-300 pl-10 pr-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-gray-700/90 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                        value={filterContent}
                        onChange={(e) => setFilterContent(e.target.value)}
                        placeholder="Search by content"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="post-type-dropdown" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Post Type</label>
                    <select
                      id="post-type-dropdown"
                      className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-all dark:bg-gray-700/90 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
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
                    <label htmlFor="min-likes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Likes: <span className="font-semibold">{filterMinLikes}</span></label>
                    <input
                      type="range"
                      id="min-likes"
                      min="0"
                      max="1000"
                      value={filterMinLikes}
                      onChange={(e) => setFilterMinLikes(Number(e.target.value))}
                      className="mt-1 block w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-200 to-blue-200 dark:from-gray-700 dark:to-blue-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:bg-blue-700 [&::-webkit-slider-thumb]:hover:scale-110"
                    />
                  </div>
                  <div>
                    <label htmlFor="min-comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Comments: <span className="font-semibold">{filterMinComments}</span></label>
                    <input
                      type="range"
                      id="min-comments"
                      min="0"
                      max="500"
                      value={filterMinComments}
                      onChange={(e) => setFilterMinComments(Number(e.target.value))}
                      className="mt-1 block w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-200 to-blue-200 dark:from-gray-700 dark:to-blue-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:bg-blue-700 [&::-webkit-slider-thumb]:hover:scale-110"
                    />
                  </div>
                  <div>
                    <label htmlFor="min-reposts" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Reposts: <span className="font-semibold">{filterMinReposts}</span></label>
                    <input
                      type="range"
                      id="min-reposts"
                      min="0"
                      max="200"
                      value={filterMinReposts}
                      onChange={(e) => setFilterMinReposts(Number(e.target.value))}
                      className="mt-1 block w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-200 to-blue-200 dark:from-gray-700 dark:to-blue-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:bg-blue-700 [&::-webkit-slider-thumb]:hover:scale-110"
                    />
                  </div>
                  <div className="relative">
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <CalendarDays className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="date"
                        id="start-date"
                        className="block w-full rounded-lg border-gray-300 pl-10 pr-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-gray-700/90 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                        value={filterStartDate || ''}
                        onChange={(e) => setFilterStartDate(e.target.value || null)}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <CalendarDays className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="date"
                        id="end-date"
                        className="block w-full rounded-lg border-gray-300 pl-10 pr-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-gray-700/90 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                        value={filterEndDate || ''}
                        onChange={(e) => setFilterEndDate(e.target.value || null)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LinkedIn-style Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Posts</p>
                      <p className="text-2xl font-bold">{totalPosts}</p>
                    </div>
                    <svg className="w-8 h-8 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                    </svg>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Avg Engagement</p>
                      <p className="text-2xl font-bold">
                        {Math.round(sortedPosts.reduce((acc, post) => acc + post.like_count, 0) / sortedPosts.length || 0)}
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                    </svg>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Top Performer</p>
                      <p className="text-2xl font-bold">
                        {Math.max(...sortedPosts.map(post => post.like_count), 0)}
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">This Week</p>
                      <p className="text-2xl font-bold">
                        {sortedPosts.filter(post => {
                          const postDate = new Date(post.post_timestamp || '');
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return postDate >= weekAgo;
                        }).length}
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-orange-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
              </div>

              {error && <p className="text-red-500">Error: {error}</p>}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">Loading LinkedIn posts...</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800/95 p-6 rounded-xl shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden">
                  <div className="mb-4 pb-4 border-b border-blue-100 dark:border-blue-800">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      LinkedIn Posts Analysis
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {sortedPosts.length} competitor posts
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
                        <tr>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider cursor-pointer hover:bg-blue-200/50 transition-colors"
                            onClick={() => requestSort('author_name')}
                          >
                            Author Name
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider cursor-pointer hover:bg-blue-200/50 transition-colors"
                            onClick={() => requestSort('post_content')}
                          >
                            Post Content
                          </th>
                          <th
                            className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('post_type')}
                          >
                            Post Type
                          </th>
                          <th
                            className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('like_count')}
                          >
                            Likes
                          </th>
                          <th
                            className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('comment_count')}
                          >
                            Comments
                          </th>
                          <th
                            className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('repost_count')}
                          >
                            Reposts
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider cursor-pointer hover:bg-blue-200/50 transition-colors"
                            onClick={() => requestSort('post_timestamp')}
                          >
                            Post Date
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800/95 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedPosts.map((post, index) => (
                          <tr key={post.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800/95' : 'bg-gray-50 dark:bg-gray-700/90'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {post.author_url ? (
                                <a href={post.author_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                  {post.author_name || 'Unknown Author'}
                                </a>
                              ) : (
                                post.author_name || 'Unknown Author'
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 text-left">
                              {post.post_content && post.post_content.length > 100 ? (
                                <PostContentTruncated content={post.post_content} />
                              ) : (
                                post.post_content
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-center">{post.post_type || '—'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">{post.like_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">{post.comment_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">{post.repost_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-left">
                              {post.post_timestamp ? new Date(post.post_timestamp).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                              {post.post_url && (
                                <a
                                  href={post.post_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                  View Post
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                  </svg>
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Pagination Controls */}
                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700/90 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600/90"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage * postsPerPage >= totalPosts}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700/90 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600/90"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Showing <span className="font-medium">{(currentPage - 1) * postsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * postsPerPage, totalPosts)}</span> of {' '}
                            <span className="font-medium">{totalPosts}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => paginate(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-md hover:shadow-lg mr-2"
                            >
                              Previous
                            </button>
                            {pageNumbers.map((number) => (
                              <button
                                key={number}
                                onClick={() => paginate(number)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg mx-1 ${
                                  number === currentPage
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 dark:bg-gray-700/90 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-blue-900/20'
                                }`}
                              >
                                {number}
                              </button>
                            ))}
                            <button
                              onClick={() => paginate(currentPage + 1)}
                              disabled={currentPage * postsPerPage >= totalPosts}
                              className="relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-md hover:shadow-lg ml-2"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
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
              <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800/95 dark:to-blue-900/20 p-6 rounded-xl shadow-lg mb-6 border border-blue-100 dark:border-blue-900">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4 lg:mb-0">
                    Filter Post Ideas
                  </h3>
                  <button
                    onClick={exportToExcel}
                    disabled={loadingIdeas || postIdeas.length === 0}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Excel
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label htmlFor="idea-week-of-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Week of Date</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <CalendarDays className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                    <input
                      type="date"
                      id="idea-week-of-date"
                        className="block w-full rounded-lg border-gray-300 pl-10 pr-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-gray-700/90 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                      value={filterIdeaWeekOfDate || ''}
                      onChange={(e) => setFilterIdeaWeekOfDate(e.target.value || null)}
                    />
                    </div>
                  </div>
                  <div className="relative">
                    <label htmlFor="idea-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Ideas</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="text"
                        id="idea-search"
                        className="block w-full rounded-lg border-gray-300 pl-10 pr-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-gray-700/90 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                        value={filterIdeaSearch}
                        onChange={(e) => setFilterIdeaSearch(e.target.value)}
                        placeholder="Search title, hook, idea text, outline, angle, persona"
                      />
                    </div>
                  </div>
                </div>
              </div>


              {errorIdeas && <p className="text-red-500">Error: {errorIdeas}</p>}
              {loadingIdeas ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">Loading post ideas...</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800/95 p-6 rounded-xl shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden">
                  <div className="mb-4 pb-4 border-b border-blue-100 dark:border-blue-800">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      Post Ideas Analysis
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {sortedPostIdeas.length} of {totalIdeas} post ideas
                    </p>
                    </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
                        <tr>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider cursor-pointer hover:bg-blue-200/50 transition-colors"
                            onClick={() => requestSortIdeas('idea_number')}
                          >
                            #
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider cursor-pointer hover:bg-blue-200/50 transition-colors"
                            onClick={() => requestSortIdeas('title')}
                          >
                            Title
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider cursor-pointer hover:bg-blue-200/50 transition-colors"
                            onClick={() => requestSortIdeas('week_of_date')}
                          >
                            Week
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            Hook
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            Target Persona
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            Angle
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            Inspired By
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800/95 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedPostIdeas.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
                                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                </div>
                                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No post ideas found</h3>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">
                                  Try adjusting your filters or ensure the post_ideas table has data.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          sortedPostIdeas.map((idea, index) => (
                            <React.Fragment key={idea.id}>
                              <tr className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800/95' : 'bg-gray-50 dark:bg-gray-700/90'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                  {idea.idea_number ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
                                      #{idea.idea_number}
                          </span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white max-w-xs">
                                  <div className="truncate">{idea.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  {idea.week_of_date ? `Week of ${new Date(idea.week_of_date).toLocaleDateString()}` : '—'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs">
                                  {idea.hook ? (
                                    <div className="truncate" title={idea.hook}>
                                      {idea.hook.length > 100 ? `${idea.hook.substring(0, 100)}...` : idea.hook}
                        </div>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  {idea.persona || '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  {idea.angle || '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-center">
                                  {idea.inspired_by_posts && idea.inspired_by_posts.length > 0 ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewInspiredPosts(idea.inspired_by_posts || []);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                    >
                                      {idea.inspired_by_posts.length} posts
                                    </button>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedIdeaId(expandedIdeaId === idea.id ? null : idea.id);
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                  >
                                    {expandedIdeaId === idea.id ? 'Hide' : 'View'} Details
                                  </button>
                                </td>
                              </tr>
                              {expandedIdeaId === idea.id && (
                                <tr className="bg-blue-50 dark:bg-blue-900/10">
                                  <td colSpan={8} className="px-6 py-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {idea.hook && (
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Hook:</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{idea.hook}</p>
                        </div>
                      )}
                                      {idea.idea_text && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                                          <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">Idea Text:</h4>
                                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">{idea.idea_text}</p>
                                        </div>
                                      )}
                      {idea.outline && (
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Outline:</h4>
                          <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">{idea.outline}</div>
                        </div>
                      )}
                                      {idea.inspired_by_posts && idea.inspired_by_posts.length > 0 && (
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                                          <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Inspired By Posts:</h4>
                                          <div className="space-y-2">
                                            {idea.inspired_by_posts.map((url, idx) => (
                                              <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline break-all"
                                              >
                                                Post {idx + 1}: {url}
                                              </a>
                                            ))}
                                          </div>
                        </div>
                      )}
                        </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                    {/* Pagination Controls for Ideas */}
                    {totalIdeas > ideasPerPage && (
                      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => paginateIdeas(currentPageIdeas - 1)}
                            disabled={currentPageIdeas === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700/90 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600/90"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => paginateIdeas(currentPageIdeas + 1)}
                            disabled={currentPageIdeas * ideasPerPage >= totalIdeas}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700/90 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600/90"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              Showing <span className="font-medium">{(currentPageIdeas - 1) * ideasPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPageIdeas * ideasPerPage, totalIdeas)}</span> of {' '}
                              <span className="font-medium">{totalIdeas}</span> results
                            </p>
                    </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <button
                                onClick={() => paginateIdeas(currentPageIdeas - 1)}
                                disabled={currentPageIdeas === 1}
                                className="relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-md hover:shadow-lg mr-2"
                              >
                                Previous
                              </button>
                              {Array.from({ length: Math.ceil(totalIdeas / ideasPerPage) }, (_, i) => i + 1).map((number) => (
                                <button
                                  key={number}
                                  onClick={() => paginateIdeas(number)}
                                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg mx-1 ${
                                    number === currentPageIdeas
                                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 dark:bg-gray-700/90 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-blue-900/20'
                                  }`}
                                >
                                  {number}
                                </button>
                              ))}
                              <button
                                onClick={() => paginateIdeas(currentPageIdeas + 1)}
                                disabled={currentPageIdeas * ideasPerPage >= totalIdeas}
                                className="relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-md hover:shadow-lg ml-2"
                              >
                                Next
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Inspired Posts Modal */}
              {showInspiredPostsModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
                  <div className="relative p-6 border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800/95 dark:border-gray-700">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Inspired By Competitor Posts</h3>
                    {loadingInspiredPosts ? (
                      <p className="text-gray-700 dark:text-gray-300">Loading inspired posts...</p>
                    ) : errorInspiredPosts ? (
                      <p className="text-red-500">Error: {errorInspiredPosts}</p>
                    ) : selectedInspiredPosts.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {selectedInspiredPosts.map((post) => (
                          <div key={post.id} className="border border-gray-200 dark:border-gray-700 p-3 rounded-md shadow-sm dark:bg-gray-700/90">
                            <p className="text-sm font-medium text-gray-900 dark:text-white"><strong>Author:</strong> {post.author_name}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Content:</strong> {post.post_content?.substring(0, 150)}...</p>
                            <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200">View Post</a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300">No inspired posts found.</p>
                    )}
                    <button
                      onClick={() => setShowInspiredPostsModal(false)}
                      className="mt-6 px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600"
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
    </div>
  );
};

export default CompetitorContentReportPage;
