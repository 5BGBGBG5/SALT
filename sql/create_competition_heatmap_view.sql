-- Create the missing view for Competition Heat Map report
-- This view transforms ai_responses data into the format expected by the report

CREATE OR REPLACE VIEW public.v_high_intent_prompt_mentions AS
SELECT 
    ar.id as ai_response_id,
    EXTRACT(WEEK FROM ar.execution_date::date) as execution_week,
    ar.execution_date,
    ar.id::text as prompt_id, -- Using id as prompt_id since we don't have a separate prompt table
    CASE 
        WHEN ar.prompt_text ILIKE '%comparison%' OR ar.prompt_text ILIKE '%vs%' OR ar.prompt_text ILIKE '%versus%' THEN 'comparison'
        WHEN ar.prompt_text ILIKE '%head%' AND ar.prompt_text ILIKE '%head%' THEN 'head_to_head'
        WHEN ar.prompt_text ILIKE '%feature%' OR ar.prompt_text ILIKE '%benefit%' THEN 'feature'
        WHEN ar.prompt_text ILIKE '%vertical%' OR ar.prompt_text ILIKE '%industry%' THEN 'vertical'
        WHEN ar.prompt_text ILIKE '%variant%' OR ar.prompt_text ILIKE '%alternative%' THEN 'variant'
        ELSE 'generic'
    END as prompt_category,
    ar.prompt_text,
    CASE 
        WHEN ar.model_responses ? 'openai' THEN 'openai'
        WHEN ar.model_responses ? 'gemini' THEN 'gemini'
        WHEN ar.model_responses ? 'claude' THEN 'claude'
        WHEN ar.model_responses ? 'grok' THEN 'grok'
        ELSE 'unknown'
    END as model,
    CASE 
        WHEN ar.model_responses ? 'openai' OR ar.model_responses ? 'gemini' OR ar.model_responses ? 'claude' OR ar.model_responses ? 'grok' THEN true
        ELSE false
    END as responded,
    CASE 
        WHEN ar.prompt_text ILIKE '%inecta%' OR 
             (ar.model_responses ? 'openai' AND ar.model_responses->>'openai' ILIKE '%inecta%') OR
             (ar.model_responses ? 'gemini' AND ar.model_responses->>'gemini' ILIKE '%inecta%') OR
             (ar.model_responses ? 'claude' AND ar.model_responses->>'claude' ILIKE '%inecta%') OR
             (ar.model_responses ? 'grok' AND ar.model_responses->>'grok' ILIKE '%inecta%') THEN true
        ELSE false
    END as inecta_mentioned
FROM public.ai_responses ar
WHERE ar.execution_date IS NOT NULL;

-- Grant permissions to the view
GRANT SELECT ON public.v_high_intent_prompt_mentions TO anon, authenticated;

-- Add comment to the view
COMMENT ON VIEW public.v_high_intent_prompt_mentions IS 'View for Competition Heat Map report showing AI model responses and Inecta mentions';
