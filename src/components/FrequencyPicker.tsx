import type { Frequency } from '../types';

interface Props {
  value: Frequency;
  onChange: (freq: Frequency) => void;
  excludeHolidays?: boolean;
  onExcludeHolidaysChange?: (v: boolean) => void;
}

export default function FrequencyPicker({ value, onChange, excludeHolidays, onExcludeHolidaysChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">频率</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {([
          { type: 'daily' as const, label: '每天' },
          { type: 'weekly' as const, label: '每周' },
          { type: 'monthly' as const, label: '每月' },
        ]).map(({ type, label }) => (
          <button type="button" key={type}
            onClick={() => {
              if (type === 'daily') onChange({ type: 'daily' });
              else if (type === 'weekly') onChange({ type: 'weekly', count: 3 });
              else onChange({ type: 'monthly', count: 10 });
            }}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              value.type === type ? 'bg-indigo-500 text-white' : 'bg-white/10 dark:bg-white/5 hover:bg-gray-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {(value.type === 'weekly' || value.type === 'monthly') && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {value.type === 'weekly' ? '每周' : '每月'}
          </span>
          <button type="button" onClick={() => onChange({ ...value, count: Math.max(1, value.count - 1) })}
            className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 text-sm">−</button>
          <input type="number" value={value.count}
            onChange={e => onChange({ ...value, count: Math.max(1, Math.min(value.type === 'weekly' ? 7 : 30, Number(e.target.value))) })}
            className="w-14 text-center py-1 rounded-lg border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none"
            min={1} max={value.type === 'weekly' ? 7 : 30} />
          <button type="button" onClick={() => onChange({ ...value, count: Math.min(value.type === 'weekly' ? 7 : 30, value.count + 1) })}
            className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 text-sm">+</button>
          <span className="text-xs text-gray-400">天</span>
        </div>
      )}

      {onExcludeHolidaysChange && (
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input type="checkbox" checked={excludeHolidays ?? false}
            onChange={e => onExcludeHolidaysChange(e.target.checked)}
            className="w-4 h-4 accent-indigo-500" />
          <span className="text-sm text-gray-500">法定节假日不打卡</span>
        </label>
      )}
    </div>
  );
}
