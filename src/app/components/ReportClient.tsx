"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type JoinedData = {
  profile_id: string | null;
  profile_url: string | null;
  full_name: string | null;
  company_name: string | null;
  occupation: string | null;
  post_id: string | null;
  post_url: string | null;
  author_name: string | null;
  post_content: string | null;
  post_timestamp: string | null;
  liked_at: string | null;
};

const JoinedTable = ({ data, isLoading, error }: { data: JoinedData[]; isLoading: boolean; error: string | null }) => {
  if (isLoading) {
    return <div className="text-center p-8">Loading data...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post URL</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Content</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile URL</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No data found</td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {row.post_url ? (
                    <a href={row.post_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">View Post</a>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs truncate">{row.post_content || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.post_timestamp ? new Date(row.post_timestamp).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {row.profile_url ? (
                    <a href={row.profile_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">View Profile</a>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.full_name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.company_name || 'N/A'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default function ReportClient() {
  const [joinedData, setJoinedData] = useState<JoinedData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJoinedData = async () => {
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
          .from('v_post_likes')
          .select('*')
          .order('liked_at', { ascending: false })
          .range(0, 99);

        if (error) {
          console.error('Error fetching v_post_likes:', error);
          setError(error.message);
        } else {
          setJoinedData((data as JoinedData[]) || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch data');
      }
      
      setIsLoading(false);
    };

    fetchJoinedData();
  }, []);

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-900">Posts & Profiles Report</h2>
      <p className="mt-1 text-sm text-gray-600">View posts and their associated profile information.</p>
      
      <div className="mt-6">
        <JoinedTable data={joinedData} isLoading={isLoading} error={error} />
      </div>
    </>
  );
}


