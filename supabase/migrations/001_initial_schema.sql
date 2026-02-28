-- JyotishAI Database Schema
-- Run this in Supabase SQL Editor if tables don't exist yet
-- Tables may already exist if created via Supabase dashboard

-- Enable pgvector extension for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- PROFILES: Family member birth details
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  birth_place TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timezone TEXT NOT NULL,
  relation TEXT DEFAULT 'self',
  avatar_url TEXT,
  chart_data JSONB,
  chart_calculated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REPORTS: Generated horoscope reports
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  content TEXT,
  summary TEXT,
  model_used TEXT,
  generation_status TEXT DEFAULT 'pending',
  year INTEGER,
  is_favorite BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REPORT CHUNKS: RAG embeddings for chat
-- ============================================
CREATE TABLE IF NOT EXISTS report_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAT SESSIONS: Conversation containers
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAT MESSAGES: Individual messages
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER PREFERENCES: Settings per user
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ayanamsha TEXT DEFAULT 'lahiri',
  house_system TEXT DEFAULT 'whole_sign',
  dasha_system TEXT DEFAULT 'vimshottari',
  chart_style TEXT DEFAULT 'north_indian',
  default_language TEXT DEFAULT 'en',
  preferred_model TEXT DEFAULT 'claude-sonnet-4-5',
  alert_enabled BOOLEAN DEFAULT TRUE,
  alert_orb DOUBLE PRECISION DEFAULT 2.0,
  whatsapp_digest_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_number TEXT,
  whatsapp_digest_time TEXT DEFAULT '07:00',
  email_digest_enabled BOOLEAN DEFAULT FALSE,
  email_digest_day TEXT DEFAULT 'monday',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSIT ALERTS: Proactive notifications
-- ============================================
CREATE TABLE IF NOT EXISTS transit_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  planet TEXT,
  natal_planet TEXT,
  orb DOUBLE PRECISION,
  trigger_date DATE NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  dispatched_whatsapp BOOLEAN DEFAULT FALSE,
  dispatched_email BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_profile_id ON reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_report_chunks_profile_id ON report_chunks(profile_id);
CREATE INDEX IF NOT EXISTS idx_report_chunks_report_id ON report_chunks(report_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_profile_id ON chat_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_transit_alerts_profile_id ON transit_alerts(profile_id);
CREATE INDEX IF NOT EXISTS idx_transit_alerts_trigger_date ON transit_alerts(trigger_date);

-- Full-text search index on report chunks
CREATE INDEX IF NOT EXISTS idx_report_chunks_content_fts
  ON report_chunks USING gin(to_tsvector('english', content));

-- Vector similarity index (IVFFlat for performance)
-- Only create if enough rows exist; otherwise Supabase handles this
-- CREATE INDEX IF NOT EXISTS idx_report_chunks_embedding
--   ON report_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see their own
CREATE POLICY IF NOT EXISTS "Users can view own profiles" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own profiles" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own profiles" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Reports: users can access reports for their profiles
CREATE POLICY IF NOT EXISTS "Users can view own reports" ON reports
  FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can update own reports" ON reports
  FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can delete own reports" ON reports
  FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Report chunks: same as reports
CREATE POLICY IF NOT EXISTS "Users can view own report chunks" ON report_chunks
  FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can insert own report chunks" ON report_chunks
  FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Chat sessions: users can access chat for their profiles
CREATE POLICY IF NOT EXISTS "Users can view own chat sessions" ON chat_sessions
  FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can insert own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Chat messages: access via session ownership
CREATE POLICY IF NOT EXISTS "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (session_id IN (
    SELECT cs.id FROM chat_sessions cs
    JOIN profiles p ON cs.profile_id = p.id
    WHERE p.user_id = auth.uid()
  ));
CREATE POLICY IF NOT EXISTS "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (session_id IN (
    SELECT cs.id FROM chat_sessions cs
    JOIN profiles p ON cs.profile_id = p.id
    WHERE p.user_id = auth.uid()
  ));

-- User preferences: users can only access their own
CREATE POLICY IF NOT EXISTS "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Transit alerts: access via profile ownership
CREATE POLICY IF NOT EXISTS "Users can view own alerts" ON transit_alerts
  FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can update own alerts" ON transit_alerts
  FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================
-- HYBRID SEARCH FUNCTION (Vector + Full-Text)
-- Used by RAG chat retriever
-- ============================================
CREATE OR REPLACE FUNCTION search_report_chunks(
  p_profile_id UUID,
  p_query_embedding VECTOR(1536),
  p_query_text TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  report_id UUID,
  similarity DOUBLE PRECISION,
  ts_rank DOUBLE PRECISION,
  combined_score DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.content,
    rc.metadata,
    rc.report_id,
    1 - (rc.embedding <=> p_query_embedding) AS similarity,
    ts_rank_cd(to_tsvector('english', rc.content), plainto_tsquery('english', p_query_text)) AS ts_rank,
    -- Weighted hybrid: 70% vector similarity + 30% full-text rank
    (0.7 * (1 - (rc.embedding <=> p_query_embedding))) +
    (0.3 * ts_rank_cd(to_tsvector('english', rc.content), plainto_tsquery('english', p_query_text))) AS combined_score
  FROM report_chunks rc
  WHERE rc.profile_id = p_profile_id
    AND rc.embedding IS NOT NULL
  ORDER BY combined_score DESC
  LIMIT p_limit;
END;
$$;
