-- Create user_preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
    ayanamsha TEXT DEFAULT 'lahiri',
    house_system TEXT DEFAULT 'whole_sign',
    dasha_system TEXT DEFAULT 'vimshottari',
    default_language TEXT DEFAULT 'en',
    chart_style TEXT DEFAULT 'north_indian',
    preferred_model TEXT DEFAULT 'anthropic/claude-sonnet-4-5',
    whatsapp_number TEXT,
    whatsapp_digest_enabled BOOLEAN DEFAULT true,
    whatsapp_digest_time TIME DEFAULT '07:00:00',
    email_digest_enabled BOOLEAN DEFAULT true,
    email_digest_day TEXT DEFAULT 'sunday',
    alert_orb DECIMAL(3,1) DEFAULT 2.0,
    alert_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see/modify their own preferences
CREATE POLICY "Users see own prefs" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_preferences_user_id ON user_preferences(user_id);
