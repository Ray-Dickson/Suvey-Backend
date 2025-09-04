-- Fix question types ENUM values
-- Run this script to update the existing questions table

USE survey_app;

-- First, let's check what the current ENUM values are
-- SHOW COLUMNS FROM questions LIKE 'type';

-- Update the ENUM to include all the correct values
ALTER TABLE questions 
MODIFY COLUMN type ENUM('text', 'textarea', 'radio', 'checkbox', 'dropdown', 'rating') NOT NULL;

-- If you have existing data with different values, you might need to update them:
-- UPDATE questions SET type = 'text' WHERE type = 'short_answer';
-- UPDATE questions SET type = 'textarea' WHERE type = 'long_answer';
-- UPDATE questions SET type = 'radio' WHERE type = 'multiple_choice';
-- UPDATE questions SET type = 'rating' WHERE type = 'rating_scale';

-- Verify the change
SHOW COLUMNS FROM questions LIKE 'type';
