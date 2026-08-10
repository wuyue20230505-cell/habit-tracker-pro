import { useRef, useEffect } from 'react';

interface Props {
  selectedDate: string;
  onChange: (date: string) => void;
}

export default function DateSlider({ selectedDate, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate dates: 30 days back to today
  const dates: { date: string; label: string; dayName: string; isToday: boolean }[] = [];
  const today = new Date();
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const isToday = i === 0;
    dates.push({
      date: dateStr,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      dayName: dayNames[d.getDay()],
      isToday,
    });
  }

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const todayEl = scrollRef.current.querySelector('[data-today="true"]');
      if (todayEl) {
        todayEl.scrollIntoView({ inline: 'center', behavior: 'smooth' });
      }
    }
  }, []);

  const selectedIdx = dates.findIndex((d) => d.date === selectedDate);

  return (
    <div className="mb-4">
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dates.map((d) => (
          <button
            key={d.date}
            data-today={d.isToday ? 'true' : undefined}
            onClick={() => onChange(d.date)}
            className={`flex-shrink-0 w-14 py-2 rounded-xl text-center snap-center transition-all ${
              d.date === selectedDate
                ? 'bg-indigo-500 text-white shadow-md'
                : d.isToday
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500'
                  : 'bg-white/15 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:bg-white/15 dark:hover:bg-white/10'
            }`}
          >
            <div className="text-[10px]">{d.dayName}</div>
            <div className="text-sm font-medium">{d.label}</div>
          </button>
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="flex justify-between items-center mt-1">
        <button
          onClick={() => {
            const newIdx = Math.max(0, selectedIdx - 1);
            onChange(dates[newIdx].date);
            const el = scrollRef.current?.children[newIdx] as HTMLElement;
            el?.scrollIntoView({ inline: 'center', behavior: 'smooth' });
          }}
          className="text-xs text-gray-400 hover:text-gray-600 px-2"
        >
          ← 前一天
        </button>
        <button
          onClick={() => onChange(dates[dates.length - 1].date)}
          className="text-xs text-indigo-500 hover:text-indigo-600 px-2 font-medium"
        >
          回到今天
        </button>
        <button
          onClick={() => {
            const newIdx = Math.min(dates.length - 1, selectedIdx + 1);
            onChange(dates[newIdx].date);
            const el = scrollRef.current?.children[newIdx] as HTMLElement;
            el?.scrollIntoView({ inline: 'center', behavior: 'smooth' });
          }}
          disabled={selectedIdx >= dates.length - 1}
          className={`text-xs px-2 ${
            selectedIdx >= dates.length - 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          后一天 →
        </button>
      </div>
    </div>
  );
}
