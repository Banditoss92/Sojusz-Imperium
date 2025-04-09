/*
  # Translate forum categories to Polish

  1. Changes
    - Update forum category names to Polish
    - Keep existing slugs for URL compatibility
*/

UPDATE forum_categories
SET name = 'Wojna'
WHERE slug = 'war';

UPDATE forum_categories
SET name = 'Handel'
WHERE slug = 'trade';

UPDATE forum_categories
SET name = 'Dyplomacja'
WHERE slug = 'diplomacy';

UPDATE forum_categories
SET name = 'Dyskusja Ogólna'
WHERE slug = 'general';