/*
  # Clear chat and forum data

  1. Changes
    - Delete all chat messages
    - Delete all forum comments
    - Delete all forum posts
    - Preserve forum categories and user profiles

  2. Notes
    - This migration prepares the database for deployment
    - All user data and categories remain intact
    - Only clears content (messages, posts, comments)
*/

-- Clear chat messages
DELETE FROM chat_messages;

-- Clear forum comments
DELETE FROM forum_comments;

-- Clear forum posts
DELETE FROM forum_posts;