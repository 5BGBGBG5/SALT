"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, FileText, Settings, ChevronDown, Search } from 'lucide-react';

// --- SUPABASE SETUP ---
// Supabase client is created at runtime to avoid build-time URL errors.

// --- DATA TYPES ---
// Define a type for our report data for type safety
type PostLike = {
  full_name: string | null;
  occupation: string | null;
  company_name: string | null;
  profile_url: string | null;
  post_content: string | null;
  engaged_at: string | null;
};

// --- UI COMPONENTS ---

// Sidebar Navigation Component
const Sidebar = () => {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Ineca Marketing</h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        <a
          href="#"
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg"
        >
          <BarChart className="w-5 h-5 mr-3" />
          Reports
        </a>
        <a
          href="#"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <FileText className="w-5 h-5 mr-3" />
          Documents
        </a>
        <a
          href="#"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </a>
      </nav>
    </aside>
  );
};

// Header Component
const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
       <div className="relative">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
         <input
            type="text"
            placeholder="Search reports..."
            className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
         />
       </div>
       <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                JD
            </div>
            <span className="text-sm font-medium text-gray-700">John Doe</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
       </div>
    </header>
  );
};

// Main Report Table Component
const ReportTable = ({ data, isLoading, error }: { data: PostLike[], isLoading: boolean, error: string | null }) => {
  if (isLoading) {
    return <div className="text-center p-8">Loading data...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }

  if (data.length === 0) {
    return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800">No Post Likes Data Found</h3>
            <p className="text-sm text-gray-500 mt-1">Check that data has been imported to the `all_post_likes` view.</p>
        </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupation</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Content</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engaged At</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((like, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <a href={like.profile_url || '#'} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                  {like.full_name || 'N/A'}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{like.occupation || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{like.company_name || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs truncate">{like.post_content || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {like.engaged_at ? new Date(like.engaged_at).toLocaleDateString() : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  // State to hold the data, loading status, and any errors
  const [postLikes, setPostLikes] = useState<PostLike[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    const fetchPostLikes = async () => {
      setIsLoading(true);
      setError(null);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setError('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        setIsLoading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Query the 'all_post_likes' view from Supabase
      const { data, error } = await supabase
        .from('all_post_likes') // This is your database VIEW
        .select('*') // Select all columns
        .order('engaged_at', { ascending: false }) // Get the most recent likes first
        .limit(100); // Limit to the latest 100 results for performance

      if (error) {
        console.error('Error fetching data from Supabase:', error);
        setError(error.message);
      } else {
        setPostLikes(data as PostLike[]);
      }
      setIsLoading(false);
    };

    fetchPostLikes();
  }, []); // The empty dependency array means this runs once on mount

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
             <h2 className="text-2xl font-semibold text-gray-900">Post Likes Report</h2>
             <p className="mt-1 text-sm text-gray-600">
               View all post likes with profile information and post content.
             </p>
             <div className="mt-6">
                <ReportTable data={postLikes} isLoading={isLoading} error={error} />
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
