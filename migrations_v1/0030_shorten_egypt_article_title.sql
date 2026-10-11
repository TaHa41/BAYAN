-- Keep the English Egypt article title within the recommended search-result length.
UPDATE articles
SET title='How the Nile Valley shapes settlement in Egypt',
    updated_at=CURRENT_TIMESTAMP
WHERE slug='egypt-nile-valley-delta-en' AND language='en';
