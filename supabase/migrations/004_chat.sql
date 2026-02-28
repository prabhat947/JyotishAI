-- Create chat_sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB,
    model_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their chat sessions
CREATE POLICY "Users see own sessions" ON chat_sessions
    FOR ALL USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- RLS Policy: Users can only see messages in their sessions
CREATE POLICY "Users see own messages" ON chat_messages
    FOR ALL USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE profile_id IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Indexes
CREATE INDEX idx_chat_sessions_profile_id ON chat_sessions(profile_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
