# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## 项目

习惯追踪打卡APP（Habit Tracker）。React + TypeScript + Vite 前端SPA，支持localStorage本地存储和Supabase云同步。

## 命令

```bash
npm run dev           # 开发服务器（--host 局域网可访问）
npm run build         # 生产构建
npm run build:android # 构建web + 同步Android
npm run open:android  # Android Studio打开 → Build APK
npx vercel --prod --yes # 一键部署到公网
```

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | WelcomePage | 推广首页 |
| `/checkin` | TodayPage | 打卡主页+日期滑动+音乐选择 |
| `/pomodoro-timer` | PomodoroTimerPage | 全屏番茄钟（独立路由，无底部导航） |
| `/pomodoro` | PomodoroPage | 独立番茄钟设置 |
| `/habits` | HabitsPage | 习惯CRUD+归档 |
| `/history` | HistoryPage | 周/月/年完成率图+热力图 |
| `/stats` | StatsPage | 统计卡片+趋势图+各习惯明细 |
| `/leaderboard` | LeaderboardPage | 排行榜（周/月/连续/总榜）+领奖台+数据同步 |
| `/auth` | AuthPage | 登录/注册（Supabase） |

## 架构

- **Context**: `AuthContext`(用户) → `AppContext`(habits/checkins/pomodoro) → `ProContext`(付费状态)
- **存储**: `useLocalStorage` hook → key `habit-tracker`; Pro状态 → key `habit-pro`
- **API**: addHabit, addCheckin, removeCheckin, getCheckinCount, isCheckedIn, startPomodoro, stopPomodoro, startBreak, incrementCycle
- **音频**: `src/utils/audio.ts` — Web Audio API 环境音+钢琴曲+提示音
- **排行榜同步**: `src/utils/leaderboardSync.ts` — 打卡时上报Supabase，拉取排名
- **Pro系统**: `src/hooks/usePro.ts` — 免费限制(3习惯/7天统计) + 定价方案 ¥12月/¥168年/¥298终身; `src/components/PaywallModal.tsx` — 付费墙弹窗

## 数据模型

- Habit: id, name, emoji, color, frequency({daily}|{weekly,count}|{monthly,count}), createdAt, archived, usePomodoro?, pomodoroMinutes?, dailyGoal?, excludeHolidays?
- Checkin: id, habitId, date, note?
- ActivePomodoro: habitId, workMinutes, breakMinutes, totalCycles, isBreak, phaseStartedAt

## 部署

- 公网: https://my-project-rust-six-71.vercel.app
- APK: /habit-tracker.apk (构建后放 public/)
- Vercel配置: vercel.json (SPA rewrites)
- Supabase: 需设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
