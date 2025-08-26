"use client";

import React, { useEffect, useState } from 'react';
import BestRanking from "./components/BestRanking";
import './BestRanking.css';

type DashboardMetric = {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
};

export default function AieoReportPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);

  useEffect(() => {
    const initializeDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // For now, use sample data since the actual tables don't exist
        // In the future, replace this with real Supabase queries
        const sampleMetrics: DashboardMetric[] = [
          {
            label: "Total Posts Analyzed",
            value: "1,247",
            change: "+12%",
            changeType: "positive"
          },
          {
            label: "Average Sentiment Score",
            value: "7.2/10",
            change: "+0.3",
            changeType: "positive"
          },
          {
            label: "Engagement Rate",
            value: "4.8%",
            change: "-0.2%",
            changeType: "negative"
          },
          {
            label: "Top Performing Post",
            value: "Food Service Conference 2025",
            change: "New",
            changeType: "neutral"
          }
        ];

        setMetrics(sampleMetrics);
        
        // Simulate loading time
        setTimeout(() => setIsLoading(false), 1000);
        
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load dashboard data');
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, []);

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
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">AiEO Report</h1>
      <p className="text-lg text-gray-600 mb-8">AI-powered Engagement Optimization Dashboard</p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
              </div>
              {metric.change && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  metric.changeType === 'positive' ? 'bg-green-100 text-green-800' :
                  metric.changeType === 'negative' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {metric.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Best Ranking Card */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Ranking Performance</h3>
          <BestRanking ranking={85} />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">New post published - &ldquo;Food Service Conference 2025&rdquo;</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Sentiment analysis completed for 47 posts</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Weekly ranking updated - Position #3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Setup Instructions</h3>
        <p className="text-blue-800 mb-4">
          To connect real data, create these tables in your Supabase database:
        </p>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• <code className="bg-blue-100 px-1 rounded">aieo_sentiment_metrics</code> - for sentiment analysis data</li>
          <li>• <code className="bg-blue-100 px-1 rounded">aieo_weekly_rankings</code> - for ranking performance data</li>
          <li>• <code className="bg-blue-100 px-1 rounded">aieo_engagement_metrics</code> - for engagement analytics</li>
        </ul>
      </div>
    </div>
  );
}
