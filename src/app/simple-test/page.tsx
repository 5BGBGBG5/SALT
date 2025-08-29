"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface TableResult {
  data: Record<string, unknown>[] | null;
  error: { message: string } | null;
}

interface TestResults {
  [key: string]: TableResult;
}

export default function SimpleTestPage() {
  const [status, setStatus] = useState<string>('Testing...');
  const [results, setResults] = useState<TestResults>({});

  useEffect(() => {
    const testBasicAccess = async () => {
      try {
        const aieoSupabaseUrl = process.env.NEXT_PUBLIC_AIEO_SUPABASE_URL;
        const aieoSupabaseKey = process.env.NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY;

        if (!aieoSupabaseUrl || !aieoSupabaseKey) {
          setStatus('❌ Environment variables not set');
          return;
        }

        const supabase = createClient(aieoSupabaseUrl, aieoSupabaseKey);
        setStatus('Testing basic table access...');

        // Test each table individually
        const tests: TestResults = {
          companies: await supabase.from('companies').select('*').limit(1),
          profiles: await supabase.from('profiles').select('*').limit(1),
          posts: await supabase.from('posts').select('*').limit(1),
          post_likes: await supabase.from('post_likes').select('*').limit(1),
          post_comments: await supabase.from('post_comments').select('*').limit(1),
          post_shares: await supabase.from('post_shares').select('*').limit(1)
        };

        setResults(tests);
        setStatus('✅ Basic table access test complete');

      } catch (error) {
        setStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    testBasicAccess();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Simple Table Access Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Status</h2>
          <div className="text-lg font-mono">{status}</div>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Table Access Results</h2>
            <div className="space-y-4">
              {Object.entries(results).map(([tableName, result]) => (
                <div key={tableName} className="border rounded p-4">
                  <h3 className="font-semibold text-lg">{tableName}</h3>
                  <div className="text-sm">
                    <div>Error: {result.error ? result.error.message : 'None'}</div>
                    <div>Data Count: {result.data ? result.data.length : 'N/A'}</div>
                    <div>Status: {result.error ? '❌ Failed' : '✅ Success'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

