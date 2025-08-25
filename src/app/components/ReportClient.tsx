"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type PostLike = {
  full_name: string | null;
  occupation: string | null;
  company_name: string | null;
  profile_url: string | null;
  post_content: string | null;
  engaged_at: string | null;
};

const ReportTable = ({ data, isLoading, error }: { data: PostLike[]; isLoading: boolean; error: string | null }) => {
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
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Content</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((like, index) => {
            const name = (like.full_name || '').trim();
            const [first, ...rest] = name.split(/\s+/);
            const firstName = first || 'N/A';
            const lastName = rest.join(' ') || 'N/A';

            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{firstName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lastName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{like.company_name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs truncate">{like.post_content || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {like.profile_url ? (
                    <a href={like.profile_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">Profile</a>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default function ReportClient() {
  const [postLikes, setPostLikes] = useState<PostLike[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

      const { data, error } = await supabase
        .from('all_post_likes')
        .select('*')
        .order('engaged_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching data from Supabase:', error);
        setError(error.message);
      } else {
        setPostLikes(data as PostLike[]);
      }
      setIsLoading(false);
    };

    fetchPostLikes();
  }, []);

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-900">Post Likes Report</h2>
      <p className="mt-1 text-sm text-gray-600">View all post likes with profile information and post content.</p>
      <div className="mt-6">
        <ReportTable data={postLikes} isLoading={isLoading} error={error} />
      </div>
    </>
  );
}


