"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, Title, LineChart } from "@tremor/react";

type SentimentData = {
  execution_date: string;
  average_sentiment: number;
};

export default function AieoReportPage() {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentimentData = async () => {
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
        // Assuming a table or view named 'aieo_sentiment_metrics' exists in your Supabase project
        const { data, error } = await supabase
          .from('aieo_sentiment_metrics')
          .select('execution_date, aggregate_metrics->average_sentiment as average_sentiment')
          .order('execution_date', { ascending: true })
          .range(0, 99);

        if (error) {
          console.error('Error fetching sentiment data:', error);
          setError(error.message);
        } else {
          console.log('Raw sentiment data from Supabase:', data);
          setSentimentData((data as SentimentData[]) || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch sentiment data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSentimentData();
  }, []);

  // Prepare the data for the chart
  const sentimentChartData = sentimentData
    .map(record => ({
      date: new Date(record.execution_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Average Sentiment': record.average_sentiment,
    }))
    .reverse(); // Reverse to show time from left to right

  if (isLoading) {
    return <div className="text-center p-8">Loading sentiment data...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-900">AiEO Report</h1>
      <p className="mt-2 text-lg text-gray-600">This page will contain the AiEO specific reports.</p>

      <div className="mt-6">
        <Card>
          <Title>Sentiment Over Time</Title>
          <LineChart
            className="mt-6"
            data={sentimentChartData}
            index="date"
            categories={['Average Sentiment']}
            colors={['blue']}
            yAxisWidth={40}
          />
        </Card>
      </div>
    </div>
  );
}
