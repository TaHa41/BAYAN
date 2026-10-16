-- Preserve the first-class reason an archived news item did not become an article.
-- Runtime schema initialization also guards this column for already-deployed databases.
ALTER TABLE news_archive ADD COLUMN article_last_reason TEXT;
