-- HackTillDawn Database Schema
-- This schema supports projects, reactions, and replies

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    url VARCHAR(500) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    team_members TEXT NOT NULL,
    sender VARCHAR(255) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_message_id (message_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_team_name (team_name)
);

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    timestamp DATETIME NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_message_id (message_id),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (message_id) REFERENCES projects(message_id) ON DELETE CASCADE
);

-- Replies table
CREATE TABLE IF NOT EXISTS replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    quoted_message_id VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    sender VARCHAR(255) NOT NULL,
    timestamp DATETIME NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_message_id (message_id),
    INDEX idx_quoted_message_id (quoted_message_id),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (quoted_message_id) REFERENCES projects(message_id) ON DELETE CASCADE
);

-- Related message IDs table (for merged projects)
CREATE TABLE IF NOT EXISTS related_message_ids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_message (project_id, message_id)
);
