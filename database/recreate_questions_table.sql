-- Recreate questions table with correct ENUM values
-- Run this script if the fix_question_types.sql doesn't work

USE survey_app;

-- Drop the existing questions table (this will also drop question_options due to foreign key)
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;

-- Recreate questions table with correct ENUM values
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    question_text TEXT NOT NULL,
    type ENUM('text', 'textarea', 'radio', 'checkbox', 'dropdown', 'rating') NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    display_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

-- Recreate question_options table
CREATE TABLE question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    display_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_questions_survey_id ON questions(survey_id);
CREATE INDEX idx_questions_display_order ON questions(display_order);
CREATE INDEX idx_question_options_question_id ON question_options(question_id);

-- Verify the table structure
SHOW COLUMNS FROM questions;
SHOW COLUMNS FROM question_options;
