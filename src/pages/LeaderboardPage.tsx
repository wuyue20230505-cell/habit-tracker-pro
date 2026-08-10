import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ImageCarousel from '../components/ImageCarousel';
import {
  fetchLeaderboard,
  type LeaderboardEntry,
  type RankBy,
} from '../utils/leaderboardSync';

const TABS: { key: RankBy; label: string; icon: string }[] = [
  { key: 'daily_pomodoro',   label: '日榜', icon: '☀️' },
  { key: 'weekly_pomodoro',  label: '周榜', icon: '🔥' },
  { key: 'monthly_pomodoro', label: '月榜', icon: '📅' },
  { key: 'total_pomodoro',   label: '总榜', icon: '👑' },
];

// ── 排名徽章 ───────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-3xl">🥇</span>;
  if (rank === 2) return <span className="text-3xl">🥈</span>;
  if (rank === 3) return <span className="text-3xl">🥉</span>;
  return (
    <span className="w-8 h-8 rounded-full bg-white/10 dark:bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400">
      {rank}
    </span>
  );
}

// ── 排行维度 → 对应打卡数字段 ──────────────────
function getCheckinField(rankBy: RankBy): keyof LeaderboardEntry {
  switch (rankBy) {
    case 'daily_pomodoro':   return 'daily_checkins';
    case 'weekly_pomodoro':  return 'weekly_checkins';
    case 'monthly_pomodoro': return 'month_checkins';
    default:                 return 'total_checkins';
  }
}

// ── 排行榜行 ──────────────────────────────────
function LeaderboardRow({
  entry,
  rank,
  rankBy,
  isMe,
}: {
  entry: LeaderboardEntry;
  rank: number;
  rankBy: RankBy;
  isMe: boolean;
}) {
  const periodCheckins = entry[getCheckinField(rankBy)] ?? 0;
  const focusMinutes = entry[rankBy] ?? 0;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
        isMe
          ? 'bg-indigo-500/20 border border-indigo-400/30'
          : 'hover:bg-white/5'
      }`}
    >
      <div className="w-7 text-center"><RankBadge rank={rank} /></div>
      {entry.avatar_emoji?.startsWith('http') || entry.avatar_emoji?.startsWith('data:') ? (
        <img src={entry.avatar_emoji} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <span className="text-xl">{entry.avatar_emoji}</span>
      )}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-white truncate block">
          {entry.display_name}
          {isMe && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300">我</span>}
        </span>
        <span className="text-[11px] text-white/40">
          🍅 专注 {focusMinutes} 分钟 · ✅ 打卡 {periodCheckins} 次
        </span>
      </div>
      <div className="text-right shrink-0">
        <span className="text-base font-bold text-amber-400">{focusMinutes}<span className="text-xs text-white/40"> 分钟</span></span>
      </div>
    </div>
  );
}

// ── 页面主体 ──────────────────────────────────
export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rankBy, setRankBy] = useState<RankBy>('daily_pomodoro');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaderboard(rankBy);
    setEntries(data);
    setLoading(false);
  }, [rankBy]);

  // 初次加载 + 切换 Tab + 30秒自动刷新
  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);


  return (
    <div className="min-h-dvh relative">
      <ImageCarousel images={['/bg-leaderboard.jpg', '/leaderboard-2.jpg']} interval={6000} />
<div className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-4 relative z-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-white drop-shadow-lg">排行榜</h1>
      </div>
      <p className="text-white/80 drop-shadow mb-1">和全站用户比比谁更自律</p>

      {/* 未登录提示 */}
      {!user && (
        <div className="bg-white/20 dark:bg-black/25 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-center mb-4">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            📝 登录后才能上榜哦
          </p>
        </div>
      )}

      {/* Tab 切换 */}
      <div className="flex bg-white/10 dark:bg-white/5 rounded-xl p-1 mb-4 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRankBy(tab.key)}
            className={`flex-1 py-2.5 px-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex flex-col items-center ${
              rankBy === tab.key
                ? 'bg-white/20 dark:bg-black/30 shadow-sm text-indigo-500'
                : 'text-gray-500'
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 内容 */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin text-4xl mb-3">⏳</div>
          <p className="text-gray-400 text-sm">加载排行榜...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">🏆</span>
          <p className="text-gray-500 font-medium">还没有人上榜</p>
          <p className="text-gray-400 text-sm mt-1">成为第一个上榜的人吧！</p>
        </div>
      ) : (
        <>
          {/* 我的排名条 */}

          {/* 全部排行 */}
          <div className="space-y-1">
            {entries.map((entry, i) => (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                rank={i + 1}
                rankBy={rankBy}
                isMe={entry.user_id === user?.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
    </div>
  );
}
