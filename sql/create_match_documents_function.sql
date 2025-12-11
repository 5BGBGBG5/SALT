-- Create RPC function for vector similarity search
-- This function matches documents based on embedding similarity

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  content text,
  title text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    documents.id,
    documents.content,
    documents.metadata->>'title' as title,
    1 - (documents.embedding <=> query_embedding) as similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_documents(vector, float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents(vector, float, int) TO anon;

