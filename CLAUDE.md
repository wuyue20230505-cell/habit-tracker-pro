# 习惯追踪打卡APP (Habit Tracker Pro)

React 19 + TS + Vite 8 + Tailwind 4 + Capacitor + Supabase

## 命令
```bash
npm run dev        # localhost:5173
npm run build      # 生产构建
npx vercel --prod  # 部署公网
```

## 路由
`/` 首页 `/checkin` 打卡 `/habits` 习惯CRUD `/history` 历史 `/stats` 统计 `/leaderboard` 排行榜 `/pomodoro-timer` 番茄钟 `/auth` 登录

## 架构
`AuthContext → AppContext → ProContext` 三层 Context，持久化用 `useLocalStorage("habit-{uid}")`，云端 Supabase push/pull

## 数据模型
Habit: id, name, emoji, color, frequency({daily}|{weekly,count}|{monthly,count}), dailyGoal, archived, usePomodoro, pomodoroMinutes
Checkin: id, habitId, date

## 关键逻辑（已修复的坑）
- `isCheckedIn`: daily 检查当日次数≥dailyGoal；weekly/monthly 先查当日上限，再查唯一天数(Set)≥count
- `handleCheckin`: 每日上限 `count>=goal` 前置拦截（番茄钟也受此限制）
- `persistDispatch`: 同步推进 `latestState` ref + useReducer + localStorage + debounce(2s)→push
- `CLOUD_SYNC` 后必须 `latestState.current = newState`，否则后续操作基于过时状态
- push 合并时本地数据在前（`[...local, ...cloud]`），本地删除/编辑优先
- 登录时先 push 本地再 pull 云端，防删除的习惯复活

## 文件索引
- `src/context/AppContext.tsx` - 核心状态+打卡逻辑+同步
- `src/utils/cloudSync.ts` - Supabase push/pull
- `src/components/HabitCard.tsx` - 打卡卡片（进度徽章、番茄钟入口）
- `src/hooks/useLocalStorage.ts` - localStorage 持久化
- `src/pages/TodayPage.tsx` - 打卡主页
- `src/pages/HabitsPage.tsx` - 习惯管理（增删改归）
- `src/components/HabitForm.tsx` - 习惯表单（频率/次数/番茄钟设置）

## 换电脑部署
```bash
git clone <repo-url> && cd habit-tracker-pro && npm install
cp .env.example .env   # 然后填入 Supabase URL 和 ANON_KEY
npm run dev
```
Supabase: `VITE_SUPABASE_URL=https://glkimrioysdowwygpliq.supabase.co`
