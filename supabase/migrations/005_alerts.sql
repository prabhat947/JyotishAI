-- Create transit_alerts table
CREATE TABLE transit_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'planet_transit', 'dasha_change', 'station',
        'eclipse', 'nodal_transit', 'digest'
    )),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    trigger_date DATE NOT NULL,
    planet TEXT,
    natal_planet TEXT,
    orb DECIMAL(4,2),
    dispatched_whatsapp BOOLEAN DEFAULT false,
    dispatched_email BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transit_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see alerts for their profiles
CREATE POLICY "Users see own alerts" ON transit_alerts
    FOR ALL USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Indexes
CREATE INDEX idx_alerts_profile_id ON transit_alerts(profile_id);
CREATE INDEX idx_alerts_trigger_date ON transit_alerts(trigger_date);
CREATE INDEX idx_alerts_is_read ON transit_alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_alerts_type ON transit_alerts(alert_type);
