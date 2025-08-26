"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, Title, LineChart } from "@tremor/react";
import BestRanking from "./components/BestRanking";
import './BestRanking.css';

type SentimentData = {
  execution_date: string;
  average_sentiment: number;
};

type RankingData = {
  ranking_value: number | null;
};

export default function AieoReportPage() {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [bestRanking, setBestRanking] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
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
        // Fetch Sentiment Data
        const { data: sentiment, error: sentimentError } = await supabase
          .from('aieo_sentiment_metrics')
          .select('execution_date, aggregate_metrics->average_sentiment as average_sentiment')
          .order('execution_date', { ascending: true })
          .range(0, 99);

        if (sentimentError) {
          console.error('Error fetching sentiment data:', sentimentError);
          setError(sentimentError.message);
        } else {
          setSentimentData((sentiment as SentimentData[]) || []);
        }

        // Fetch Best Ranking Data
        const { data: ranking, error: rankingError } = await supabase
          .from('aieo_weekly_rankings') // Assuming a table/view for weekly rankings
          .select('ranking_value')
          .order('created_at', { ascending: false })
          .limit(1);

        if (rankingError) {
          console.error('Error fetching ranking data:', rankingError);
          // Don't set a global error for this, as sentiment might still be fine
        } else if (ranking && ranking.length > 0) {
          setBestRanking((ranking[0] as RankingData).ranking_value);
        } else {
          setBestRanking(null); // No ranking data found
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
    return <div className="text-center p-8">Loading AiEO report data...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-900">AiEO Report</h1>
      <p className="mt-2 text-lg text-gray-600">This page will contain the AiEO specific reports.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BestRanking ranking={bestRanking} />
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
