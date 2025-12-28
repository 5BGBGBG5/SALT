-- Create views for Aimdoc Chatbot Analytics dashboard
-- Run these in your Supabase SQL editor before using the dashboard

-- Timeline stats view (daily aggregation)
CREATE OR REPLACE VIEW aimdoc_daily_stats AS
SELECT 
    DATE(c.started_at) as date,
    COUNT(DISTINCT c.conversation_id) as conversations,
    COUNT(DISTINCT CASE WHEN c.lead_captured THEN c.conversation_id END) as leads,
    ROUND(AVG(a.engagement_score), 1) as avg_engagement,
    ROUND(AVG(a.resolution_score), 1) as avg_resolution,
    ROUND(AVG(a.sentiment_score), 1) as avg_sentiment,
    ROUND(AVG(a.lead_quality_score), 1) as avg_lead_quality
FROM aimdoc_conversations c
LEFT JOIN aimdoc_conversation_analysis a ON c.conversation_id = a.conversation_id
GROUP BY DATE(c.started_at)
ORDER BY date DESC;

-- Intent summary view
CREATE OR REPLACE VIEW aimdoc_intent_summary AS
SELECT 
    visitor_intent,
    COUNT(*) as count,
    ROUND(AVG(engagement_score), 1) as avg_engagement,
    ROUND(AVG(lead_quality_score), 1) as avg_lead_quality,
    COUNT(CASE WHEN lead_captured THEN 1 END) as leads_captured
FROM aimdoc_full_analysis
WHERE visitor_intent IS NOT NULL
GROUP BY visitor_intent
ORDER BY count DESC;

-- Industry summary view
CREATE OR REPLACE VIEW aimdoc_industry_summary AS
SELECT 
    industry_segment,
    COUNT(*) as count,
    ROUND(AVG(engagement_score), 1) as avg_engagement,
    ROUND(AVG(lead_quality_score), 1) as avg_lead_quality
FROM aimdoc_full_analysis
WHERE industry_segment IS NOT NULL
GROUP BY industry_segment
ORDER BY count DESC;

