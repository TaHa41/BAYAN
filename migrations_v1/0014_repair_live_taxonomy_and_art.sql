-- BAYAN live-data repair after final taxonomy migration.
-- Correct legacy rows that were assigned to unrelated sections by older migrations.
UPDATE articles SET section='egypt' WHERE slug IN ('egypt-at-a-glance-ar','egypt-at-a-glance-en');
UPDATE articles SET section='history' WHERE slug IN ('world-war-two-overview-ar','world-war-two-overview-en');
UPDATE articles SET section='sports' WHERE slug IN ('how-sports-statistics-work-ar','how-sports-statistics-work-en');
UPDATE articles SET section='news' WHERE slug IN ('what-is-a-news-story-ar','what-is-a-news-story-en','how-stories-are-built-ar','how-stories-are-built-en');

-- Add the missing Arts & Entertainment knowledge section in both locales.
INSERT OR IGNORE INTO articles(slug,section,language,title,summary,body,sources_json,status,created_at,updated_at) VALUES
('art-how-to-read-a-film-ar','art','ar','كيف نقرأ الفيلم بعيدًا عن الانطباع الأول؟','إطار مبسط لفهم القصة والصورة والموسيقى والأداء دون الخلط بين الرأي والحقيقة.','يمكن قراءة الفيلم عبر عناصر قابلة للملاحظة مثل بناء القصة، الصورة، المونتاج، الموسيقى والأداء. أما الحكم الجمالي فهو جزء من التفسير والرأي، لذلك من الأفضل فصل ما يظهر في العمل عن التقييم الشخصي له.','[{"title":"Film Art","publisher":"Encyclopaedia Britannica","url":"https://www.britannica.com/art/film"}]','PUBLISHED','2026-10-07T00:00:00Z','2026-10-07T00:00:00Z'),
('art-how-to-read-a-film-en','art','en','How to read a film beyond first impressions','A simple framework for understanding story, image, music and performance without confusing opinion with fact.','A film can be examined through observable elements such as narrative structure, cinematography, editing, music and performance. Judgments about artistic quality are interpretations, so it helps to separate what is present in the work from personal evaluation.','[{"title":"Film Art","publisher":"Encyclopaedia Britannica","url":"https://www.britannica.com/art/film"}]','PUBLISHED','2026-10-07T00:00:00Z','2026-10-07T00:00:00Z'),
('art-how-music-works-ar','art','ar','كيف تعمل الموسيقى؟','مدخل إلى الإيقاع واللحن والتناغم وكيف تتعاون هذه العناصر لصناعة تجربة موسيقية.','تستخدم الموسيقى عناصر مثل الإيقاع واللحن والتناغم واللون الصوتي لبناء تجربة سمعية. يمكن وصف هذه العناصر بصورة موضوعية نسبيًا، بينما يختلف أثرها الجمالي والعاطفي من مستمع إلى آخر.','[{"title":"Music","publisher":"Encyclopaedia Britannica","url":"https://www.britannica.com/art/music"}]','PUBLISHED','2026-10-07T00:00:00Z','2026-10-07T00:00:00Z'),
('art-how-music-works-en','art','en','How music works: rhythm, melody and harmony','An introduction to rhythm, melody and harmony and how these elements shape musical experience.','Music uses elements such as rhythm, melody, harmony and timbre to build an auditory experience. These elements can be described in relatively objective terms, while their emotional and aesthetic effect varies between listeners.','[{"title":"Music","publisher":"Encyclopaedia Britannica","url":"https://www.britannica.com/art/music"}]','PUBLISHED','2026-10-07T00:00:00Z','2026-10-07T00:00:00Z');

CREATE INDEX IF NOT EXISTS idx_articles_final_taxonomy_v2
ON articles(section,language,status,updated_at DESC);
