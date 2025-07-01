-- Optimized Keyword Search Implementation
-- This script implements a stored tsvector column for much faster full-text search

-- Step 1: Add a tsvector column if it doesn't exist
ALTER TABLE ccc_paragraphs
ADD COLUMN IF NOT EXISTS content_tsv tsvector;

-- Step 2: Populate the tsvector column with existing data
UPDATE ccc_paragraphs
SET content_tsv = to_tsvector('english', content);

-- Step 3: Create optimized index on the stored tsvector
CREATE INDEX IF NOT EXISTS idx_ccc_content_tsv
ON ccc_paragraphs USING GIN (content_tsv);

-- Step 4: Create trigger function to keep tsvector up-to-date
CREATE OR REPLACE FUNCTION update_content_tsv() RETURNS trigger AS $$
BEGIN
  NEW.content_tsv := to_tsvector('english', NEW.content);
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Step 5: Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trg_update_content_tsv ON ccc_paragraphs;

CREATE TRIGGER trg_update_content_tsv
BEFORE INSERT OR UPDATE ON ccc_paragraphs
FOR EACH ROW EXECUTE FUNCTION update_content_tsv();

-- Step 6: Create optimized search function using stored tsvector
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
    ts_rank_cd(ccc_paragraphs.content_tsv, plainto_tsquery('english', search_query)) AS relevance
  FROM ccc_paragraphs
  WHERE ccc_paragraphs.content_tsv @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC, ccc_paragraphs.paragraph_number ASC
  LIMIT match_count;
$$;

-- Step 7: Drop the old index that computed tsvector on-the-fly (if it exists)
DROP INDEX IF EXISTS idx_ccc_paragraphs_content_fts;

-- Performance verification query (optional - run after implementation)
/*
EXPLAIN ANALYZE 
SELECT id, paragraph_number, content, 
       ts_rank_cd(content_tsv, plainto_tsquery('english', 'prayer')) as relevance
FROM ccc_paragraphs 
WHERE content_tsv @@ plainto_tsquery('english', 'prayer')
ORDER BY relevance DESC 
LIMIT 10;
*/