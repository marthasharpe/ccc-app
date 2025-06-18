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