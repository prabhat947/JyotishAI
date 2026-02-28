-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create report_chunks table for RAG
CREATE TABLE report_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE report_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see chunks for their profiles
CREATE POLICY "Users see own chunks" ON report_chunks
    FOR ALL USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Indexes for vector search and filtering
CREATE INDEX idx_report_chunks_embedding ON report_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_report_chunks_profile_id ON report_chunks(profile_id);
CREATE INDEX idx_report_chunks_report_id ON report_chunks(report_id);
CREATE INDEX idx_report_chunks_metadata ON report_chunks USING gin (metadata);
