-- Database Schema for QUIZ RACING 50

-- 1. Create Tables

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'WAITING', -- WAITING, PLAYING, FINISHED
  current_question_index INT DEFAULT 0,
  settings JSONB DEFAULT '{"maxPlayers": 50, "timeLimit": 10, "baseScore": 100}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer VARCHAR(10) NOT NULL,
  time_limit INT DEFAULT 10,
  sort_order INT DEFAULT 0
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  avatar VARCHAR(20) NOT NULL,
  score INT DEFAULT 0,
  combo INT DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  session_id VARCHAR(100)
);

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  selected_option VARCHAR(10),
  is_correct BOOLEAN,
  response_time FLOAT,
  score_awarded INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Realtime Setup
-- Enable realtime for tables so clients can listen to changes
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;

-- 3. Row Level Security policies (Important for free tier security)
-- For a simple game, we can enable RLS and allow anonymous access for ease of use, 
-- but in production we'd tighten this. 
-- Here we'll configure it to allow anon access to keep deployment simple and free without auth walls.

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Allow reading/writing from anon role for simplicity (MVP)
CREATE POLICY "Enable read access for all users" ON rooms FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON rooms FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON questions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON questions FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON players FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON players FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON answers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON answers FOR UPDATE USING (true);

-- Adding some index to boost performance
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_answers_room_id ON answers(room_id);
CREATE INDEX idx_questions_room_id ON questions(room_id);
