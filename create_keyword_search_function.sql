-- Create a function to search for keyword matches in CCC paragraphs
-- This function provides full-text search capability using PostgreSQL's built-in text search

CREATE OR REPLACE FUNCTION search_ccc_paragraphs_keywords(
  search_query text,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id integer,
  paragraph_number integer,
  content text,
  relevance float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ccc_paragraphs.id,
    ccc_paragraphs.paragraph_number,
    ccc_paragraphs.content,
    ts_rank_cd(to_tsvector('english', ccc_paragraphs.content), plainto_tsquery('english', search_query)) AS relevance
  FROM ccc_paragraphs
  WHERE to_tsvector('english', ccc_paragraphs.content) @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC, ccc_paragraphs.paragraph_number ASC
  LIMIT match_count;
$$;

-- Create the full-text search index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ccc_paragraphs_content_fts ON ccc_paragraphs 
USING gin (to_tsvector('english', content));