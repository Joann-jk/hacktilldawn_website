-- Supabase Database Schema for HackTillDawn
-- Run this in your Supabase SQL Editor

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    url VARCHAR(500) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    team_members TEXT NOT NULL,
    sender VARCHAR(255) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id BIGSERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Replies table
CREATE TABLE IF NOT EXISTS replies (
    id BIGSERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    quoted_message_id VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    sender VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Related message IDs table (for merged projects)
CREATE TABLE IF NOT EXISTS related_message_ids (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, message_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_message_id ON projects(message_id);
CREATE INDEX IF NOT EXISTS idx_projects_timestamp ON projects(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_projects_team_name ON projects(team_name);

CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_timestamp ON reactions(timestamp);

CREATE INDEX IF NOT EXISTS idx_replies_message_id ON replies(message_id);
CREATE INDEX IF NOT EXISTS idx_replies_quoted_message_id ON replies(quoted_message_id);
CREATE INDEX IF NOT EXISTS idx_replies_timestamp ON replies(timestamp);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE related_message_ids ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public project gallery)
CREATE POLICY "Allow public read access to projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to reactions" ON reactions
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to replies" ON replies
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to related_message_ids" ON related_message_ids
    FOR SELECT USING (true);

-- Allow inserts for webhook (you might want to restrict this with API key)
CREATE POLICY "Allow insert to projects" ON projects
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert to reactions" ON reactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert to replies" ON replies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert to related_message_ids" ON related_message_ids
    FOR INSERT WITH CHECK (true);

-- Allow updates for project merging
CREATE POLICY "Allow update to projects" ON projects
    FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
INSERT INTO projects (name, description, url, team_name, team_members, sender, group_name, message_id, timestamp) VALUES
('Sample Project', 'This is a sample project for testing', 'https://example.com', 'Sample Team', 'John Doe, Jane Smith', 'Test User', 'HackTillDawn Final Participants', 'sample_001', NOW())
ON CONFLICT (message_id) DO NOTHING;
