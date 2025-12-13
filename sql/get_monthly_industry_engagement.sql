-- Function to get monthly industry engagement breakdown
-- This pre-aggregates industry engagement data for better performance
-- Usage: SELECT * FROM get_monthly_industry_engagement('2025-06-01', '2025-12-31');

CREATE OR REPLACE FUNCTION get_monthly_industry_engagement(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  month TEXT,
  industry TEXT,
  engagement_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('month', pl.like_timestamp), 'YYYY-MM') || '-01' AS month,
    COALESCE(c.company_industry, 'Other/Blank') AS industry,
    COUNT(*) AS engagement_count
  FROM post_likes pl
  LEFT JOIN profiles p ON pl.profile_id = p.id
  LEFT JOIN companies c ON p.current_company_id = c.id
  INNER JOIN posts po ON pl.post_id = po.id
  WHERE po.author_name = 'inecta - Food ERP'
    AND po.is_competitor = false
    AND pl.like_timestamp >= start_date
    AND pl.like_timestamp <= end_date
  GROUP BY 
    DATE_TRUNC('month', pl.like_timestamp),
    c.company_industry
  ORDER BY month, industry;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_monthly_industry_engagement(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_industry_engagement(DATE, DATE) TO anon;


