"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface TableInfo {
  table_name: string;
}

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [tableInfo, setTableInfo] = useState<TableInfo[] | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Check environment variables
        const aieoSupabaseUrl = process.env.NEXT_PUBLIC_AIEO_SUPABASE_URL;
        const aieoSupabaseKey = process.env.NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY;

        setConnectionStatus('Checking environment variables...');
        
        if (!aieoSupabaseUrl || !aieoSupabaseKey) {
          setConnectionStatus('❌ Environment variables not set');
          setErrorDetails(`Missing: ${!aieoSupabaseUrl ? 'NEXT_PUBLIC_AIEO_SUPABASE_URL ' : ''}${!aieoSupabaseKey ? 'NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY' : ''}`);
          return;
        }

        setConnectionStatus('Creating Supabase client...');
        const supabase = createClient(aieoSupabaseUrl, aieoSupabaseKey);

        setConnectionStatus('Testing basic connection...');
        
        // Test basic connection by listing tables
        const { data: tables, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .limit(5);

        if (tablesError) {
          setConnectionStatus('❌ Connection failed');
          setErrorDetails(`Tables query error: ${tablesError.message}`);
          return;
        }

        setConnectionStatus('✅ Basic connection successful');
        setTableInfo(tables);

        // Test specific table access
        setConnectionStatus('Testing table access...');
        
        // Try to access the v_post_engagement view
        const { data: engagementData, error: engagementError } = await supabase
          .from('v_post_engagement')
          .select('*')
          .limit(1);

        if (engagementError) {
          setConnectionStatus('⚠️ Connection works but view access failed');
          setErrorDetails(`View access error: ${engagementError.message}`);
        } else {
          setConnectionStatus('✅ Full connection and view access successful');
          setErrorDetails(`Found ${engagementData?.length || 0} engagement records`);
        }

      } catch (error) {
        setConnectionStatus('❌ Connection failed with exception');
        setErrorDetails(`Exception: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">AiEO Supabase Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="text-lg font-mono">{connectionStatus}</div>
          
          {errorDetails && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold text-red-800">Error Details:</h3>
              <pre className="text-sm text-red-700 mt-2 whitespace-pre-wrap">{errorDetails}</pre>
            </div>
          )}
        </div>

        {tableInfo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Available Tables</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tableInfo.map((table: TableInfo, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded border">
                  <span className="font-mono text-sm">{table.table_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Check that your <code className="bg-blue-100 px-1 rounded">.env.local</code> file has the correct AiEO credentials</li>
            <li>Verify that you&apos;ve run the database setup script in your AiEO Supabase project</li>
            <li>Check that the <code className="bg-blue-100 px-1 rounded">v_post_engagement</code> view exists</li>
            <li>Ensure your AiEO project has the correct RLS policies</li>
            <li>Check the Supabase dashboard for any service issues</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

