CREATE TABLE IF NOT EXISTS showcase_inquiries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  project_type TEXT NOT NULL,
  location_area TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_key TEXT,
  photo_content_type TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_showcase_inquiries_created ON showcase_inquiries(created_at);
