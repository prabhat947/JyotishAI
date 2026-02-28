-- Add preferred_provider column and update default model
ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS preferred_provider TEXT DEFAULT 'google';

-- Update default model from Claude to Gemini
ALTER TABLE user_preferences
    ALTER COLUMN preferred_model SET DEFAULT 'gemini-2.0-flash';
