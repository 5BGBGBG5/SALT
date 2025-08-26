"use client";

import React, { useEffect, useState } from 'react';
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

const PostLikesTable = ({ data, isLoading, error }: { data: PostLikeData[]; isLoading: boolean; error: string | null }) => {
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
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liker Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liker Company</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liker Job Title</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liker Profile</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Content</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post URL</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liked At</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No data found</td>
            </tr>
          ) : (
            data.map((row, index) => (
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
  );
};

export default function ReportClient() {
  const [postLikesData, setPostLikesData] = useState<PostLikeData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        <PostLikesTable data={postLikesData} isLoading={isLoading} error={error} />
      </div>
    </>
  );
}


