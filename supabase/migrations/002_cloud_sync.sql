-- 云端同步表：用户习惯和打卡数据

-- 用户习惯表
CREATE TABLE IF NOT EXISTS user_habits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_data  JSONB NOT NULL,  -- 完整的 Habit 对象
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_user_habits ON user_habits (user_id);

-- 用户打卡表
CREATE TABLE IF NOT EXISTS user_checkins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checkin_data JSONB NOT NULL,  -- 完整的 Checkin 对象
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_user_checkins ON user_checkins (user_id);

-- 番茄钟记录表
CREATE TABLE IF NOT EXISTS user_pomodoro (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  record_data JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_pomodoro ON user_pomodoro (user_id);

-- RLS
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pomodoro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能读写自己的习惯" ON user_habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能读写自己的打卡" ON user_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能读写自己的番茄" ON user_pomodoro FOR ALL USING (auth.uid() = user_id);
