-- Sample data for AiEO dashboard tables
-- Run these in your Supabase SQL editor to populate the tables

-- 1. Insert sample sentiment metrics data
INSERT INTO public.aieo_sentiment_metrics (execution_date, average_sentiment) VALUES
('2025-08-20', 7.2),
('2025-08-21', 7.8),
('2025-08-22', 6.9),
('2025-08-23', 8.1),
('2025-08-24', 7.5),
('2025-08-25', 8.3),
('2025-08-26', 7.9);

-- 2. Insert sample weekly rankings data
INSERT INTO public.aieo_weekly_rankings (ranking_value, created_at) VALUES
(3, '2025-08-20 10:00:00+00'),
(2, '2025-08-21 10:00:00+00'),
(1, '2025-08-22 10:00:00+00'),
(4, '2025-08-23 10:00:00+00'),
(2, '2025-08-24 10:00:00+00'),
(1, '2025-08-25 10:00:00+00'),
(3, '2025-08-26 10:00:00+00');

-- 3. Insert sample sentiment history data (if you want to use this table)
INSERT INTO public.sentiment_history (execution_date, average_sentiment, total_posts, positive_posts, negative_posts, neutral_posts) VALUES
('2025-08-20', 7.2, 45, 28, 8, 9),
('2025-08-21', 7.8, 52, 35, 6, 11),
('2025-08-22', 6.9, 38, 22, 10, 6),
('2025-08-23', 8.1, 61, 42, 7, 12),
('2025-08-24', 7.5, 47, 30, 9, 8),
('2025-08-25', 8.3, 55, 38, 5, 12),
('2025-08-26', 7.9, 49, 33, 7, 9);

-- Verify the data was inserted
SELECT 'aieo_sentiment_metrics' as table_name, COUNT(*) as record_count FROM public.aieo_sentiment_metrics
UNION ALL
SELECT 'aieo_weekly_rankings' as table_name, COUNT(*) as record_count FROM public.aieo_weekly_rankings
UNION ALL
SELECT 'sentiment_history' as table_name, COUNT(*) as record_count FROM public.sentiment_history;
