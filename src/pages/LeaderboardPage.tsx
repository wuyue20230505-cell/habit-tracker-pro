import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  syncToLeaderboard,
  fetchLeaderboard,
  fetchMyRank,
  type LeaderboardEntry,
  type RankBy,
} from '../utils/leaderboardSync';

const TABS: { key: RankBy; label: string; icon: string; desc: string }[] = [
  { key: 'weekly_checkins',  label: '周榜', icon: '🔥', desc: '本周打卡最多' },
  { key: 'month_checkins',   label: '月榜', icon: '📅', desc: '本月打卡最多' },
  { key: 'current_streak',   label: '连续', icon: '⚡', desc: '连续打卡最长' },
  { key: 'total_checkins',   label: '总榜', icon: '👑', desc: '历史总打卡数' },
];

// ── 排名徽章 ───────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-3xl">🥇</span>;
  if (rank === 2) return <span className="text-3xl">🥈</span>;
  if (rank === 3) return <span className="text-3xl">🥉</span>;
  return (
    <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-400">
      {rank}
    </span>
  );
}

// ── 前三名领奖台 ──────────────────────────────
function Podium({ top3 }: { top3: LeaderboardEntry[] }) {
  const [first, second, third] = top3;
  return (
    <div className="flex items-end justify-center gap-3 h-44 mb-6">
      {/* 第二名 */}
      {second && (
        <div className="flex flex-col items-center w-20">
          <span className="text-2xl mb-1">{second.avatar_emoji}</span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate w-full text-center mb-1">
            {second.display_name}
          </span>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-t-xl flex items-center justify-center h-20">
            <span className="text-2xl">🥈</span>
          </div>
        </div>
      )}

      {/* 第一名 */}
      {first && (
        <div className="flex flex-col items-center w-24">
          <span className="text-3xl mb-1">{first.avatar_emoji}</span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate w-full text-center mb-1">
            {first.display_name}
          </span>
          <div className="w-full bg-indigo-500 rounded-t-xl flex items-center justify-center h-28 shadow-lg shadow-indigo-500/30">
            <span className="text-3xl">🥇</span>
          </div>
        </div>
      )}

      {/* 第三名 */}
      {third && (
        <div className="flex flex-col items-center w-20">
          <span className="text-2xl mb-1">{third.avatar_emoji}</span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate w-full text-center mb-1">
            {third.display_name}
          </span>
          <div className="w-full bg-amber-100 dark:bg-amber-900/40 rounded-t-xl flex items-center justify-center h-16">
            <span className="text-2xl">🥉</span>
          </div>
        </div>
      )}
    </div>
  );
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
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        isMe
          ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <div className="w-8 text-center"><RankBadge rank={rank} /></div>
      <span className="text-xl">{entry.avatar_emoji}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate block">
          {entry.display_name}
          {isMe && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-500">
              我
            </span>
          )}
        </span>
        <span className="text-[11px] text-gray-400">
          {rankBy === 'current_streak'
            ? `连续 ${entry.current_streak} 天`
            : `${entry.total_checkins} 次总打卡`}
        </span>
      </div>
      <div className="text-right">
        <span className="text-lg font-bold text-indigo-500">
          {rankBy === 'current_streak'
            ? `${entry.current_streak}天`
            : entry[rankBy]}
        </span>
      </div>
    </div>
  );
}

// ── 页面主体 ──────────────────────────────────
export default function LeaderboardPage() {
  const { user } = useAuth();
  const { state } = useApp();
  const [rankBy, setRankBy] = useState<RankBy>('weekly_checkins');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    const [data, rank] = await Promise.all([
      fetchLeaderboard(rankBy),
      fetchMyRank(rankBy),
    ]);
    setEntries(data);
    setMyRank(rank);
    setLoading(false);
  }, [rankBy]);

  // 初次加载 + 切换 Tab 时刷新
  useEffect(() => {
    load();
  }, [load]);

  // 同步自己的数据
  useEffect(() => {
    if (!user) return;
    const pomodoroTotal = state.checkins.filter((c) =>
      state.habits.some((h) => h.id === c.habitId && h.usePomodoro)
    ).length;
    syncToLeaderboard(state.habits, state.checkins, pomodoroTotal).then(() => {
      setLastSync(new Date().toLocaleTimeString());
    });
  }, [user, state.checkins.length]); // 仅在打卡数变化时同步

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const myEntry = entries.find((e) => e.user_id === user?.id);

  return (
    <div className="min-h-dvh relative" style={{ background: 'linear-gradient(180deg, #d4d9f0 0%, #dde1f5 10%, #e8ecfa 30%, #f5f6fd 55%, #fafafe 100%)' }}>
      {/* 山峰层叠 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-2/3" style={{ background: 'linear-gradient(180deg, transparent, rgba(140,150,200,0.08), rgba(120,135,190,0.12))', clipPath: 'polygon(0% 80%, 15% 45%, 30% 65%, 50% 35%, 65% 55%, 80% 40%, 100% 60%, 100% 100%, 0% 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ background: 'linear-gradient(180deg, transparent, rgba(160,170,210,0.06), rgba(140,155,200,0.1))', clipPath: 'polygon(0% 70%, 20% 50%, 35% 60%, 55% 40%, 70% 55%, 85% 45%, 100% 65%, 100% 100%, 0% 100%)' }} />
      </div>
    <div className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-4 relative z-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">排行榜</h1>
        {lastSync && (
          <span className="text-[10px] text-gray-400">已同步 {lastSync}</span>
        )}
      </div>
      <p className="text-gray-400 dark:text-gray-500 mb-1">和全站用户比比谁更自律</p>

      {/* 未登录提示 */}
      {!user && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-center mb-4">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            📝 登录后才能上榜哦
          </p>
        </div>
      )}

      {/* Tab 切换 */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRankBy(tab.key)}
            className={`flex-1 py-2.5 px-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex flex-col items-center ${
              rankBy === tab.key
                ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-500'
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
          {/* 前三名领奖台 */}
          <Podium top3={top3} />

          {/* 我的排名条 */}
          {user && myRank && myRank > 3 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
              <span className="text-sm text-indigo-500 font-bold">我的排名</span>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">#{myRank}</span>
              <span className="text-xs text-indigo-400 ml-auto">
                {rankBy === 'current_streak'
                  ? `连续 ${myEntry?.current_streak ?? 0} 天`
                  : `${myEntry?.[rankBy] ?? 0} 次`}
              </span>
            </div>
          )}

          {/* 4-50 名列表 */}
          {rest.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400 px-4 mb-2">完整排名</p>
              {rest.map((entry, i) => (
                <LeaderboardRow
                  key={entry.user_id}
                  entry={entry}
                  rank={i + 4}
                  rankBy={rankBy}
                  isMe={entry.user_id === user?.id}
                />
              ))}
            </div>
          )}

          {/* 如果我在前三但不显示在列表 */}
          {myEntry && myRank && myRank <= 3 && rest.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-8">
              🎉 你在领奖台上！继续加油保持排名！
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
}
