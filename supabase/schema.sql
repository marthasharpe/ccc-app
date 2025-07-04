-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the ccc_paragraphs table for storing Catechism paragraphs with embeddings
CREATE TABLE IF NOT EXISTS ccc_paragraphs (
  id SERIAL PRIMARY KEY,
  paragraph_number INTEGER NOT NULL UNIQUE,
  content TEXT NOT NULL,
  footnotes JSONB, -- Store footnotes as JSON
  embedding vector(1536), -- OpenAI text-embedding-ada-002 produces 1536-dimensional vectors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on paragraph_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_ccc_paragraphs_number ON ccc_paragraphs(paragraph_number);

-- Create an index for similarity search using cosine distance
CREATE INDEX IF NOT EXISTS idx_ccc_paragraphs_embedding ON ccc_paragraphs 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create a full-text search index for keyword searches
CREATE INDEX IF NOT EXISTS idx_ccc_paragraphs_content_fts ON ccc_paragraphs 
USING gin (to_tsvector('english', content));

-- Create a function to search for similar paragraphs
CREATE OR REPLACE FUNCTION search_ccc_paragraphs(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id integer,
  paragraph_number integer,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ccc_paragraphs.id,
    ccc_paragraphs.paragraph_number,
    ccc_paragraphs.content,
    1 - (ccc_paragraphs.embedding <=> query_embedding) AS similarity
  FROM ccc_paragraphs
  WHERE ccc_paragraphs.embedding IS NOT NULL
    AND 1 - (ccc_paragraphs.embedding <=> query_embedding) > match_threshold
  ORDER BY ccc_paragraphs.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create a function to search for keyword matches in CCC paragraphs
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

-- Create the daily_usage table for tracking user usage
CREATE TABLE IF NOT EXISTS daily_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cost_used DECIMAL(10, 6) DEFAULT 0.00, -- Track cost in dollars (6 decimal places for precision)
  tokens_used INTEGER DEFAULT 0, -- Keep for backward compatibility
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create an index on user_id and date for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(user_id, date);

-- Create an index on date for cleanup operations
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(date);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_daily_usage_updated_at
  BEFORE UPDATE ON daily_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();