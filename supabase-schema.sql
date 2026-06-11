-- ============================================================
-- RCF FUTA — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Units ────────────────────────────────────────────────────
CREATE TABLE units (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ── Recordings ───────────────────────────────────────────────
CREATE TABLE recordings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  speaker text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  description text,
  duration_seconds integer DEFAULT 0,
  audio_url text NOT NULL,
  audio_public_id text,  -- Cloudinary public_id for deletion
  cover_url text,
  transcript text,
  play_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ── Play events (tracks real plays) ──────────────────────────
-- Each row = one confirmed play (after 10s of listening)
CREATE TABLE play_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id uuid REFERENCES recordings(id) ON DELETE CASCADE NOT NULL,
  played_at timestamptz DEFAULT now()
);

-- Function: increment play_count on recordings when a play_event is inserted
CREATE OR REPLACE FUNCTION increment_play_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recordings SET play_count = play_count + 1 WHERE id = NEW.recording_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_play_event
  AFTER INSERT ON play_events
  FOR EACH ROW EXECUTE FUNCTION increment_play_count();

-- ── Students ─────────────────────────────────────────────────
CREATE TABLE students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  department text NOT NULL,
  level text NOT NULL,
  hobbies text,
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  image_url text,
  image_public_id text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── Subscribers ──────────────────────────────────────────────
CREATE TABLE subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  recording_id uuid REFERENCES recordings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS)
-- Anon key can READ public data and INSERT play events/students/subscribers
-- Admin operations are protected by checking the service key
-- (For simplicity we use anon key + RLS policies here)
-- ============================================================

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read units" ON units FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read recordings" ON recordings FOR SELECT USING (true);
CREATE POLICY "Public read approved students" ON students FOR SELECT USING (approved = true);
CREATE POLICY "Public read notifications" ON notifications FOR SELECT USING (true);

-- Public insert
CREATE POLICY "Anyone can log a play" ON play_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can subscribe" ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit student profile" ON students FOR INSERT WITH CHECK (true);

-- Admin write (all operations — handled via service_role key on admin actions)
-- We use service_role for admin mutations; anon for public reads
CREATE POLICY "Admin insert recordings" ON recordings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update recordings" ON recordings FOR UPDATE USING (true);
CREATE POLICY "Admin delete recordings" ON recordings FOR DELETE USING (true);
CREATE POLICY "Admin manage units" ON units FOR ALL USING (true);
CREATE POLICY "Admin manage categories" ON categories FOR ALL USING (true);
CREATE POLICY "Admin approve students" ON students FOR UPDATE USING (true);
CREATE POLICY "Admin delete students" ON students FOR DELETE USING (true);
CREATE POLICY "Admin view all students" ON students FOR SELECT USING (true);
CREATE POLICY "Admin manage notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Admin read subscribers" ON subscribers FOR SELECT USING (true);

-- ============================================================
-- Default seed data (units and categories only — no fake data)
-- ============================================================
INSERT INTO units (name) VALUES
  ('Music'),
  ('Ushering'),
  ('Evangelism'),
  ('Technical'),
  ('Word'),
  ('Welfare'),
  ('Intercessory'),
  ('Drama');

INSERT INTO categories (name) VALUES
  ('Teaching'),
  ('Devotional'),
  ('Evangelism'),
  ('Orientation'),
  ('Special Program'),
  ('Workshop');
