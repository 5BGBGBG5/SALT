-- Create monthly aggregation view for LinkedIn Ads data
-- This view aggregates daily LinkedIn Ads data into monthly metrics
-- Run this in your Supabase SQL editor

CREATE OR REPLACE VIEW v_linkedin_ads_monthly AS
SELECT 
  date_trunc('month', date)::date AS month,
  SUM(impressions) AS impressions,
  SUM(clicks) AS clicks,
  SUM(cost) AS total_spend,
  SUM(conversions) AS conversions,
  CASE WHEN SUM(impressions) > 0 
    THEN ROUND((SUM(clicks)::numeric / SUM(impressions)) * 100, 2) 
    ELSE 0 END AS ctr_percent,
  CASE WHEN SUM(clicks) > 0 
    THEN ROUND(SUM(cost) / SUM(clicks), 2) 
    ELSE 0 END AS avg_cpc,
  CASE WHEN SUM(clicks) > 0 
    THEN ROUND((SUM(conversions)::numeric / SUM(clicks)) * 100, 2) 
    ELSE 0 END AS conversion_rate_percent,
  CASE WHEN SUM(conversions) > 0 
    THEN ROUND(SUM(cost) / SUM(conversions), 2) 
    ELSE 0 END AS cost_per_conversion
FROM linkedin_ads_daily
GROUP BY date_trunc('month', date)
ORDER BY month;


