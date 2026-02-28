-- Create reports table for generated horoscope reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN (
        'in_depth', 'career', 'wealth', 'yearly',
        'transit_jupiter', 'transit_saturn', 'transit_rahu_ketu',
        'numerology', 'gem_recommendation'
    )),
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi')),
    content TEXT,
    summary TEXT,
    model_used TEXT,
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,
    is_favorite BOOLEAN DEFAULT false,
    year INTEGER,
    generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN (
        'pending', 'generating', 'complete', 'failed'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see reports for their profiles
CREATE POLICY "Users see own reports" ON reports
    FOR ALL USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Indexes
CREATE INDEX idx_reports_profile_id ON reports(profile_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_type ON reports(report_type);
