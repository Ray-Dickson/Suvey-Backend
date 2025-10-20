-- Migration script for new features
-- Run this after the main schema is created

-- Add conditional logic support
CREATE TABLE IF NOT EXISTS conditional_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    condition_type ENUM('equals', 'not_equals', 'contains', 'greater_than', 'less_than') NOT NULL,
    condition_value TEXT NOT NULL,
    target_question_id INT NOT NULL,
    action ENUM('show', 'hide') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (target_question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Add survey scheduling support
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS scheduled_start DATETIME NULL,
ADD COLUMN IF NOT EXISTS scheduled_end DATETIME NULL,
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;

-- Add email preferences for users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notification_frequency ENUM('immediate', 'daily', 'weekly') DEFAULT 'immediate';

-- Add response metadata
ALTER TABLE responses 
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL,
ADD COLUMN IF NOT EXISTS user_agent TEXT NULL,
ADD COLUMN IF NOT EXISTS completion_time INT NULL; -- in seconds

-- Add survey analytics cache table
CREATE TABLE IF NOT EXISTS survey_analytics_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    cache_key VARCHAR(255) NOT NULL,
    cache_data JSON NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_survey_cache (survey_id, cache_key),
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_submitted_at ON responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_answers_response_id ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);

-- Add email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    email_type ENUM('survey_completion', 'survey_created', 'new_response', 'admin_alert') NOT NULL,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    error_message TEXT NULL,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add survey templates table
CREATE TABLE IF NOT EXISTS survey_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_data JSON NOT NULL,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add survey sharing table
CREATE TABLE IF NOT EXISTS survey_shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    shared_with_email VARCHAR(255) NOT NULL,
    permission_level ENUM('view', 'edit', 'admin') DEFAULT 'view',
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
