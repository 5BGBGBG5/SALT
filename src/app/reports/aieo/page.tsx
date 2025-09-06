"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
// Removed @tremor/react import - package was removed due to React 19 compatibility issues
import BestRanking from "./components/BestRanking";
import './BestRanking.css';
import PromptAccordion from "./components/PromptAccordion";

type SentimentData = {
  execution_date: string;
  average_sentiment: number;
};

type PromptData = {
  id: string | number;
  prompt_text: string;
  model_responses: { [key: string]: string };
  execution_date?: string;
};

type SentimentRawData = {
  execution_date: string;
  aggregate_metrics: {
    average_sentiment: number;
    total_posts?: number;
    positive_posts?: number;
    negative_posts?: number;
    neutral_posts?: number;
  } | null;
};

type RankingRawData = {
  ranking_value: number;
  report_week: string;
};

export default function AieoReportPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bestRanking, setBestRanking] = useState<number | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [prompts, setPrompts] = useState<PromptData[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      setError(null);

      // Use AiEO project credentials for this report
      const aieoSupabaseUrl = process.env.NEXT_PUBLIC_AIEO_SUPABASE_URL;
      const aieoSupabaseKey = process.env.NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY;

      console.log('Environment Variables Check:');
      console.log('AIEO_SUPABASE_URL:', aieoSupabaseUrl ? 'SET' : 'NOT SET');
      console.log('AIEO_SUPABASE_KEY:', aieoSupabaseKey ? 'SET (length: ' + aieoSupabaseKey.length + ')' : 'NOT SET');

      if (!aieoSupabaseUrl || !aieoSupabaseKey) {
        setError(`AiEO Supabase is not configured. Missing: ${!aieoSupabaseUrl ? 'NEXT_PUBLIC_AIEO_SUPABASE_URL ' : ''}${!aieoSupabaseKey ? 'NEXT_PUBLIC_AIEO_SUPABASE_ANON_KEY' : ''}`);
        setIsLoading(false);
        return;
      }

      const supabase = createClient(aieoSupabaseUrl, aieoSupabaseKey);
      
      // Debug: Test basic connection and verify database
      console.log('Testing AiEO Supabase connection...');
      console.log('Connection URL:', aieoSupabaseUrl);
      console.log('Connection Key length:', aieoSupabaseKey ? aieoSupabaseKey.length : 'NOT SET');
      
      try {
        // Test connection with a table that should exist in the AiEO project
        const { data: testData, error: testError } = await supabase
          .from('ai_responses')
          .select('id')
          .limit(1);
        console.log('Connection test result:', { data: testData, error: testError });
        
        if (testData && testData.length > 0) {
          console.log('Successfully connected to AiEO database, ai_responses table has data');
        } else if (testError) {
          console.log('Connection works but table access issue:', testError.message);
        }
      } catch (err) {
        console.error('Connection test failed:', err);
      }

      try {
        console.log('Starting Supabase queries...');

        // Fetch Sentiment Data
        console.log('Fetching sentiment data...');
        let sentimentData: SentimentData[] = [];

        const { data: sentiment, error: sentimentError } = await supabase
          .from('aieo_sentiment_metrics')
          .select('execution_date, aggregate_metrics')
          .order('execution_date', { ascending: true })
          .range(0, 99);

        console.log('AIEO Sentiment query result:', { data: sentiment, error: sentimentError });

        if (sentimentError) {
          console.error('Error fetching AIEO sentiment data:', sentimentError);
          // Don't set error, just use empty data and continue
          console.log('Using empty sentiment data due to error');
          sentimentData = [];
        } else {
          const transformedSentiment = (sentiment as SentimentRawData[] || []).map(item => ({
            execution_date: item.execution_date,
            average_sentiment: item.aggregate_metrics?.average_sentiment || 0
          }));
          console.log('Using AIEO sentiment data:', transformedSentiment);
          sentimentData = transformedSentiment;
        }

        setSentimentData(sentimentData);

        // Fetch Best Ranking Data
        console.log('Fetching ranking data...');
        let rankingData: number | null = null;

        const { data: ranking, error: rankingError } = await supabase
          .from('aieo_weekly_rankings')
          .select('ranking_value, report_week')
          .order('report_week', { ascending: false })
          .limit(1);

        console.log('AIEO Ranking query result:', { data: ranking, error: rankingError });

        if (rankingError) {
          console.error('Error fetching AIEO ranking data:', rankingError);
          // Don't set error, just use null and continue
          console.log('Using null ranking data due to error');
          rankingData = null;
        } else if (ranking && ranking.length > 0) {
          rankingData = (ranking[0] as RankingRawData).ranking_value;
          console.log('Using AIEO ranking data:', rankingData);
        } else {
          console.log('No AIEO ranking data found, setting to null.');
          rankingData = null;
        }

        setBestRanking(rankingData);

        // Fetch Prompts with Responses Data
        console.log('Fetching prompts data...');
        
        // First, let's test if we can see the table at all
        console.log('Testing table access...');
        
        // Try different approaches to access the table
        console.log('Attempt 1: Direct table access');
        const { data: tableTest, error: tableTestError } = await supabase
          .from('ai_responses')
          .select('id')
          .limit(1);
        
        console.log('Direct table access result:', { data: tableTest, error: tableTestError });
        
        if (tableTestError) {
          console.error('Direct table access failed:', tableTestError);
          
          // Try with quotes around table name
          console.log('Attempt 2: Quoted table name');
          const { data: quotedTest, error: quotedError } = await supabase
            .from('"ai_responses"')
            .select('id')
            .limit(1);
          
          console.log('Quoted table name result:', { data: quotedTest, error: quotedError });
          
          // Try to get more info about what tables are available
          console.log('Attempt 3: Check available tables');
          const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .like('table_name', '%ai%');
          
          console.log('Available AI tables:', { data: tables, error: tablesError });
          
          // Try to list all tables in public schema
          console.log('Attempt 4: List all public tables');
          const { data: allTables, error: allTablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .order('table_name');
          
          console.log('All public tables:', { data: allTables, error: allTablesError });
        }
        
        // Try to bypass schema cache by using a different approach
        console.log('Attempt 5: Try with explicit schema and different column selection');
        
        // First try with just the basic columns that we know exist
        const { data: promptsData, error: promptsError } = await supabase
          .from('ai_responses')
          .select('id, prompt_text, model_responses, execution_date')
          .order('execution_date', { ascending: false })
          .limit(10);
        
        console.log('AI Responses query result:', { data: promptsData, error: promptsError });

        if (promptsError) {
          console.error('Error fetching AI responses data:', promptsError);
          
          // Try one more time with minimal columns
          console.log('Attempt 6: Try with minimal columns');
          const { data: minimalData, error: minimalError } = await supabase
            .from('ai_responses')
            .select('id')
            .limit(1);
          
          console.log('Minimal query result:', { data: minimalData, error: minimalError });
          
          if (minimalError) {
            setError(`AI responses data error: ${promptsError.message}`);
          } else {
            // If minimal query works, the table exists but there's a column issue
            setError(`Table exists but column access failed: ${promptsError.message}`);
          }
        } else {
          setPrompts((promptsData as PromptData[]) || []);
          console.log('Using AI responses data:', promptsData);
        }

      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch report data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, []);

  // Prepare the data for the chart
  const sentimentChartData = sentimentData
    .map(record => ({
      date: new Date(record.execution_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Average Sentiment': record.average_sentiment,
    }))
    .reverse(); // Reverse to show time from left to right

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AiEO report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center p-8 text-red-600">
          <h2 className="text-xl font-semibold mb-2">Error Loading Report</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-teal-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/30 rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-teal-200 to-emerald-200 bg-clip-text text-transparent mb-2">
            AI Engagement Optimization
          </h1>
          <p className="text-lg text-gray-300 mb-8">AI-powered insights for optimizing content engagement and performance</p>
        </motion.div>

        {/* Best Ranking Performance - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6 cursor-help mb-8 hover:scale-[1.01] transition-transform"
          title="Shows your current best ranking position in AI-powered performance metrics. Lower numbers indicate better performance. Rankings are color-coded: green for top performers, yellow for good performers, and red for areas needing improvement."
        >
          <h3 className="text-lg font-semibold text-white mb-4">Best Ranking Performance</h3>
          <BestRanking ranking={bestRanking} />
        </motion.div>

        {/* Sentiment Chart - Simple Implementation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Sentiment Over Time</h3>
        {sentimentChartData.length > 0 ? (
          <div className="space-y-2">
            {sentimentChartData.slice(-5).map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
                <span className="text-sm text-gray-300">{item.date}</span>
                <span className="text-sm font-medium text-teal-400">{item['Average Sentiment'].toFixed(1)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No sentiment data available</p>
        )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Prompt Analysis & Responses</h3>
        {prompts.length > 0 ? (
          prompts.map(prompt => (
            <PromptAccordion key={prompt.id} prompt={prompt} />
          ))
        ) : (
          <p className="text-gray-400">No AI prompt analysis data available.</p>
        )}
        </motion.div>
      </div>
    </div>
  );
}
