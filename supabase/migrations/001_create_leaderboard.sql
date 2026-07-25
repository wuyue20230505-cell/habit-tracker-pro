-- 排行榜表：存储每个用户的打卡统计数据
CREATE TABLE IF NOT EXISTS leaderboard (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name  TEXT NOT NULL DEFAULT '匿名用户',
  avatar_emoji  TEXT NOT NULL DEFAULT '🏃',

  -- 核心排行指标
  total_checkins   INTEGER NOT NULL DEFAULT 0,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  weekly_checkins  INTEGER NOT NULL DEFAULT 0,
  month_checkins   INTEGER NOT NULL DEFAULT 0,
  habit_count      INTEGER NOT NULL DEFAULT 0,
  total_pomodoro   INTEGER NOT NULL DEFAULT 0,

  last_checkin_date DATE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引加速排行查询
CREATE INDEX IF NOT EXISTS idx_lb_total     ON leaderboard (total_checkins DESC);
CREATE INDEX IF NOT EXISTS idx_lb_weekly    ON leaderboard (weekly_checkins DESC);
CREATE INDEX IF NOT EXISTS idx_lb_month     ON leaderboard (month_checkins DESC);
CREATE INDEX IF NOT EXISTS idx_lb_streak    ON leaderboard (current_streak DESC);

-- 每周一凌晨自动重置周榜
-- 每月1号凌晨自动重置月榜
-- （由客户端调用时判断并重置，见 leaderboardSync.ts）

-- RLS: 允许所有人读取排行榜
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "任何人都能查看排行榜"
  ON leaderboard FOR SELECT
  USING (true);

CREATE POLICY "用户只能更新自己的数据"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能修改自己的数据"
  ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
