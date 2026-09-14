// 倒数日新建/编辑页
// 重复类型决定日期输入：每年=月+日, 每月=日, 每周=星期, 不重复=完整日期

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { showToast } from '../utils/toast';
import { CARD_COLORS, BORDER_COLORS } from '../utils/countdown';
import { lunarToSolar, solarToLunar, formatLunarDate, getLunarMonthName, getLunarDayName } from '../utils/lunar';
import LunarCalendarPicker from '../components/LunarCalendarPicker';
import MonthDayPicker from '../components/MonthDayPicker';
import type { CountdownRepeat, CalendarType } from '../types';

const REPEATS: { key: CountdownRepeat; label: string }[] = [
  { key: 'none', label: '不重复' },
  { key: 'yearly', label: '每年' },
  { key: 'monthly', label: '每月' },
  { key: 'weekly', label: '每周' },
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 将 Date 转为 YYYY-MM-DD（本地时区安全） */
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 本地时区今天 */
function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 从公历日期找到下一个匹配的农历月日（每年模式） */
function findNextLunarYearly(lunarMonth: number, lunarDay: number): string {
  const start = new Date(todayLocal() + 'T00:00:00');
  for (let i = 0; i < 400; i++) {
    const check = new Date(start);
    check.setDate(check.getDate() + i);
    const s = toDateStr(check);
    try {
      const lunar = solarToLunar(s);
      if (lunar.month === lunarMonth && lunar.day === lunarDay && !lunar.isLeap) return s;
    } catch { /* continue */ }
  }
  return '';
}

/** 从公历日期找到下一个匹配的农历日（每月模式） */
function findNextLunarMonthly(lunarDay: number): string {
  const start = new Date(todayLocal() + 'T00:00:00');
  for (let i = 0; i < 60; i++) {
    const check = new Date(start);
    check.setDate(check.getDate() + i);
    const s = toDateStr(check);
    try {
      const lunar = solarToLunar(s);
      if (lunar.day === lunarDay && !lunar.isLeap) return s;
    } catch { /* continue */ }
  }
  return '';
}

export default function CountdownFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { state, addCountdown, updateCountdown } = useApp();
  const existing = id ? state.countdowns.find((c) => c.id === id) : undefined;

  const [name, setName] = useState('');
  const [color, setColor] = useState(CARD_COLORS[0]);
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [repeat, setRepeat] = useState<CountdownRepeat>('none');
  const [note, setNote] = useState('');
  const [image, setImage] = useState('');
  const [borderColor, setBorderColor] = useState('');
  const [pinned, setPinned] = useState(false);
  const [remind, setRemind] = useState(false);
  const [computedSolar, setComputedSolar] = useState('');

  // 不重复：完整日期
  const [solarYear, setSolarYear] = useState('');
  const [solarMonth, setSolarMonth] = useState('');
  const [solarDay, setSolarDay] = useState('');
  const [lunarYear, setLunarYear] = useState('');
  const [lunarMonth, setLunarMonth] = useState('');
  const [lunarDay, setLunarDay] = useState('');
  const [lunarIsLeap, setLunarIsLeap] = useState(false);
  const [lunarPickerOpen, setLunarPickerOpen] = useState(false);
  // 每年/每月弹框：'ys'每年公历 'yl'每年农历 'ms'每月公历 'ml'每月农历
  const [picker, setPicker] = useState<null | 'ys' | 'yl' | 'ms' | 'ml'>(null);

  // 休息日跳过（倒数只统计工作日）
  const [skipRest, setSkipRest] = useState(false);

  // 每年：月+日
  const [yearlyMonth, setYearlyMonth] = useState(1);
  const [yearlyDay, setYearlyDay] = useState(1);
  const [yearlyLMonth, setYearlyLMonth] = useState(1);
  const [yearlyLDay, setYearlyLDay] = useState(1);

  // 每月：日
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [monthlyLDay, setMonthlyLDay] = useState(1);

  // 每周：星期几
  const [weeklyDay, setWeeklyDay] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // 计算 targetDate
  const computeTargetFromInputs = useCallback(() => {
    if (repeat === 'none') {
      if (calendarType === 'lunar') {
        const yn = parseInt(lunarYear, 10);
        const mn = parseInt(lunarMonth, 10);
        const dn = parseInt(lunarDay, 10);
        if (yn && mn && dn) {
          const s = lunarToSolar(yn, mn, dn, lunarIsLeap);
          if (s) setComputedSolar(s);
          else setComputedSolar('');
        }
      } else {
        const y = parseInt(solarYear, 10);
        const m = parseInt(solarMonth, 10);
        const d = parseInt(solarDay, 10);
        if (y && m && d && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          setComputedSolar(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        } else {
          setComputedSolar('');
        }
      }
      return;
    }

    if (repeat === 'yearly') {
      if (calendarType === 'lunar') {
        const s = findNextLunarYearly(yearlyLMonth, yearlyLDay);
        setComputedSolar(s);
      } else {
        const now = new Date(todayLocal() + 'T00:00:00');
        let next = new Date(now.getFullYear(), yearlyMonth - 1, yearlyDay);
        if (next.getTime() < now.getTime()) {
          next = new Date(now.getFullYear() + 1, yearlyMonth - 1, yearlyDay);
        }
        if (next.getMonth() + 1 !== yearlyMonth || next.getDate() !== yearlyDay) {
          next = new Date(now.getFullYear() + 1, yearlyMonth - 1, yearlyDay);
        }
        setComputedSolar(toDateStr(next));
      }
      return;
    }

    if (repeat === 'monthly') {
      if (calendarType === 'lunar') {
        const s = findNextLunarMonthly(monthlyLDay);
        setComputedSolar(s);
      } else {
        const now = new Date(todayLocal() + 'T00:00:00');
        let next = new Date(now.getFullYear(), now.getMonth(), monthlyDay);
        if (next.getTime() < now.getTime()) {
          next = new Date(now.getFullYear(), now.getMonth() + 1, monthlyDay);
        }
        setComputedSolar(toDateStr(next));
      }
      return;
    }

    if (repeat === 'weekly') {
      const now = new Date(todayLocal() + 'T00:00:00');
      const nowDay = now.getDay();
      let daysUntil = weeklyDay - nowDay;
      if (daysUntil < 0) daysUntil += 7;
      const next = new Date(now);
      next.setDate(next.getDate() + (daysUntil === 0 ? 7 : daysUntil));
      setComputedSolar(toDateStr(next));
    }
  }, [repeat, calendarType, solarYear, solarMonth, solarDay, lunarYear, lunarMonth, lunarDay, lunarIsLeap,
      yearlyMonth, yearlyDay, yearlyLMonth, yearlyLDay, monthlyDay, monthlyLDay, weeklyDay]);

  useEffect(() => {
    computeTargetFromInputs();
  }, [computeTargetFromInputs]);

  // 编辑模式填充
  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setColor(existing.color);
      setCalendarType(existing.calendarType || 'solar');
      setRepeat(existing.repeat);
      setNote(existing.note || '');
      setImage(existing.image || '');
      setBorderColor(existing.borderColor || '');
      setPinned(existing.pinned || false);
      setRemind(existing.remindEnabled || false);
      setComputedSolar(existing.targetDate);
      setSkipRest(!!(existing.skipHolidays || existing.skipWeekends));

      if (existing.repeat === 'yearly') {
        const d = new Date(existing.targetDate + 'T00:00:00');
        setYearlyMonth(d.getMonth() + 1);
        setYearlyDay(d.getDate());
        if (existing.calendarType === 'lunar') {
          try {
            const lunar = solarToLunar(existing.targetDate);
            setYearlyLMonth(lunar.month);
            setYearlyLDay(lunar.day);
          } catch { /* fallback */ }
        }
      } else if (existing.repeat === 'monthly') {
        const d = new Date(existing.targetDate + 'T00:00:00');
        setMonthlyDay(d.getDate());
        if (existing.calendarType === 'lunar') {
          try {
            const lunar = solarToLunar(existing.targetDate);
            setMonthlyLDay(lunar.day);
          } catch { /* fallback */ }
        }
      } else if (existing.repeat === 'weekly') {
        const d = new Date(existing.targetDate + 'T00:00:00');
        setWeeklyDay(d.getDay());
      } else {
        if (existing.calendarType === 'lunar') {
          try {
            const lunar = solarToLunar(existing.targetDate);
            setLunarYear(String(lunar.year));
            setLunarMonth(String(lunar.month));
            setLunarDay(String(lunar.day));
            setLunarIsLeap(lunar.isLeap);
          } catch { /* fallback */ }
        } else {
          const d = new Date(existing.targetDate + 'T00:00:00');
          setSolarYear(String(d.getFullYear()));
          setSolarMonth(String(d.getMonth() + 1));
          setSolarDay(String(d.getDate()));
        }
      }
    }
  }, [id]);

  // 清理 object URL
  useEffect(() => {
    return () => { if (image && image.startsWith('blob:')) URL.revokeObjectURL(image); };
  }, [image]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (image && image.startsWith('blob:')) URL.revokeObjectURL(image);
    setImage(URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast('请输入事件名称');
      return;
    }
    if (!computedSolar || !/^\d{4}-\d{2}-\d{2}$/.test(computedSolar)) {
      showToast('请输入有效日期');
      return;
    }

    const data = {
      name: name.trim(),
      color,
      targetDate: computedSolar,
      calendarType,
      repeat,
      note: note.trim() || undefined,
      image: image || undefined,
      borderColor: borderColor || undefined,
      pinned,
      remindEnabled: remind,
      skipHolidays: skipRest,
      skipWeekends: skipRest,
    };

    if (existing) {
      updateCountdown(existing.id, data as any);
      showToast('已保存');
    } else {
      addCountdown(data as any);
      showToast('已创建');
    }

    setTimeout(() => navigate(-1), 600);
  };

  const coverStyle: React.CSSProperties = image
    ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: color };

  // 农历已选日期的展示文本（如：2026年七月廿三）
  const lunarDisplay = computedSolar
    ? (() => {
        try {
          const l = solarToLunar(computedSolar);
          return `${l.year}年${formatLunarDate(l)}`;
        } catch {
          return computedSolar;
        }
      })()
    : '';

  return (
    <div className="min-h-dvh relative">
      {/* 背景 */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-leaderboard.jpg')", filter: 'saturate(1.08) brightness(1.04) contrast(1.05)' }}
      />
      <div className="fixed inset-0 bg-black/5 dark:bg-black/20" />

      <div className="relative max-w-lg mx-auto px-4 pt-4 pb-24">
        {/* 导航栏 */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white text-sm">← 返回</button>
          <h1 className="text-lg font-bold text-white">{existing ? '编辑倒数日' : '新建倒数日'}</h1>
          <div className="w-12" />
        </div>

        {/* 封面预览 */}
        <div
          className="rounded-2xl h-40 flex items-center justify-center mb-4 shadow-lg"
          style={coverStyle}
        >
          {!image && <span className="text-white/60 text-lg">{name || '预览'}</span>}
        </div>

        {/* 背景图片 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/70 mb-2">背景图片</label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {image ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 text-sm text-white"
              >
                <img src={image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                点击更换
              </button>
              <button
                type="button"
                onClick={() => setImage('')}
                className="text-sm text-red-400 hover:text-red-300"
              >
                移除
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 text-sm text-white/80 w-full justify-center"
            >
              <span>📷</span>
              <span>点击上传背景图</span>
            </button>
          )}
        </div>

        {/* 事件名称 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/70 mb-2">事件名称</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：恋爱纪念日"
            maxLength={16}
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 backdrop-blur text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 重复类型 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/70 mb-2">重复</label>
          <div className="flex gap-2">
            {REPEATS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRepeat(r.key)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  repeat === r.key
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/10 backdrop-blur text-white/70 hover:bg-white/20'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* 日历类型（每周不显示农历） */}
        {repeat !== 'weekly' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/70 mb-2">日历类型</label>
            <div className="flex gap-2">
              {(['solar', 'lunar'] as CalendarType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCalendarType(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    calendarType === t
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/10 backdrop-blur text-white/70 hover:bg-white/20'
                  }`}
                >
                  {t === 'solar' ? '公历' : '农历'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ======== 日期输入区 ======== */}

        {/* 不重复 + 公历：弹出公历日历框选择（与目标截止日期一致） */}
        {repeat === 'none' && calendarType === 'solar' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/70 mb-2">公历日期</label>
            <input
              type="date"
              value={computedSolar}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  setSolarYear(''); setSolarMonth(''); setSolarDay('');
                  return;
                }
                const [y, m, d] = v.split('-');
                setSolarYear(y); setSolarMonth(m); setSolarDay(d);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 backdrop-blur text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
            />
          </div>
        )}

        {/* 不重复 + 农历：弹出农历日历框选择 */}
        {repeat === 'none' && calendarType === 'lunar' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/70 mb-2">农历日期</label>
            <button
              type="button"
              onClick={() => setLunarPickerOpen(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 backdrop-blur text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
            >
              <span>📅</span>
              <span className={lunarDisplay ? '' : 'text-white/30'}>
                {lunarDisplay || '点击选择农历日期'}
              </span>
            </button>
            {computedSolar && <p className="text-white/50 text-xs mt-1">对应公历：{computedSolar}</p>}
          </div>
        )}

        {/* 每年 + 公历：弹框选择月日 */}
        {repeat === 'yearly' && calendarType === 'solar' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/70 mb-2">每年几月几日</label>
            <button
              type="button"
              onClick={() => setPicker('ys')}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 backdrop-blur text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
            >
              <span>📅</span>
              <span>{yearlyMonth}月{yearlyDay}日</span>
            </button>
            {computedSolar && <p className="text-white/50 text-xs mt-1">下次日期：{computedSolar}</p>}
          </div>
        )}

        {/* 每年 + 农历：弹框选择农历月日 */}
        {repeat === 'yearly' && calendarType === 'lunar' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/70 mb-2">每年农历几月几日</label>
            <button
              type="button"
              onClick={() => setPicker('yl')}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 backdrop-blur text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
            >
              <span>📅</span>
              <span>{getLunarMonthName(yearlyLMonth, false)}{getLunarDayName(yearlyLDay)}</span>
            </button>
            {computedSolar && <p className="text-white/50 text-xs mt-1">下次公历日期：{computedSolar}</p>}
          </div>
        )}

        {/* 每月 + 公历：弹框选择几号 */}
        {repeat === 'monthly' && calendarType === 'solar' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/70 mb-2">每月几号</label>
            <button
              type="button"
              onClick={() => setPicker('ms')}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 backdrop-blur text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
            >
              <span>📅</span>
              <span>{monthlyDay}日</span>
            </button>
            {computedSolar && <p className="text-white/50 text-xs mt-1">下次日期：{computedSolar}</p>}
          </div>
        )}

        {/* 每月 + 农历：弹框选择农历几日 */}
        {repeat === 'monthly' && calendarType === 'lunar' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/70 mb-2">每月农历几日</label>
            <button
              type="button"
              onClick={() => setPicker('ml')}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 backdrop-blur text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
            >
              <span>📅</span>
              <span>{getLunarDayName(monthlyLDay)}</span>
            </button>
            {computedSolar && <p className="text-white/50 text-xs mt-1">下次公历日期：{computedSolar}</p>}
          </div>
        )}

        {/* 每周：星期几 */}
        {repeat === 'weekly' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/70 mb-2">每周几</label>
            <div className="flex gap-1">
              {WEEKDAYS.map((name, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setWeeklyDay(i)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    weeklyDay === i
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/10 backdrop-blur text-white/70 hover:bg-white/20'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            {computedSolar && <p className="text-white/50 text-xs mt-1">下次日期：{computedSolar}</p>}
          </div>
        )}

        {/* 休息日跳过（倒数只统计工作日） */}
        <div className="mb-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1">
              <span className="text-sm font-medium text-white">🏖️ 跳过法定节假日和周末</span>
              <p className="text-xs text-white/40 mt-0.5">倒数天数只统计工作日（调休上班的周末照常计算）</p>
            </div>
            <button
              type="button"
              onClick={() => setSkipRest(!skipRest)}
              className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                skipRest ? 'bg-indigo-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white/10 shadow transition-all ${
                  skipRest ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 背景颜色 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/70 mb-2">背景颜色</label>
          <div className="flex gap-2">
            {CARD_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black/20 scale-110' : ''
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {/* 边框颜色 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/70 mb-2">边框颜色</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBorderColor('')}
              className={`w-9 h-9 rounded-full transition-all border-2 border-dashed border-white/30 bg-white/10 ${
                borderColor === '' ? 'ring-2 ring-white ring-offset-2 ring-offset-black/20 scale-110' : ''
              }`}
            />
            {BORDER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBorderColor(c)}
                className={`w-9 h-9 rounded-full transition-all ${
                  borderColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black/20 scale-110' : ''
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {/* 备注 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/70 mb-2">备注</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="添加备注..."
            maxLength={100}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 backdrop-blur text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* 置顶 & 提醒 */}
        <div className="space-y-3 mb-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1">
              <span className="text-sm font-medium text-white">📌 置顶</span>
            </div>
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                pinned ? 'bg-indigo-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white/10 shadow transition-all ${
                  pinned ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1">
              <span className="text-sm font-medium text-white">⏰ 截止前一天提醒</span>
              <p className="text-xs text-white/40 mt-0.5">12:00 和 18:00</p>
            </div>
            <button
              type="button"
              onClick={() => setRemind(!remind)}
              className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                remind ? 'bg-indigo-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white/10 shadow transition-all ${
                  remind ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 农历日历选择框 */}
        <LunarCalendarPicker
          open={lunarPickerOpen}
          initialYear={lunarYear ? parseInt(lunarYear, 10) : undefined}
          initialMonth={lunarMonth ? parseInt(lunarMonth, 10) : undefined}
          initialIsLeap={lunarIsLeap}
          onClose={() => setLunarPickerOpen(false)}
          onSelect={(y, m, d, isLeap, solar) => {
            setLunarYear(String(y));
            setLunarMonth(String(m));
            setLunarDay(String(d));
            setLunarIsLeap(isLeap);
            setComputedSolar(solar);
            setLunarPickerOpen(false);
          }}
        />

        {/* 每年/每月 月日选择弹框 */}
        <MonthDayPicker
          open={picker !== null}
          kind={picker === 'ms' || picker === 'ml' ? 'monthly' : 'yearly'}
          calendar={picker === 'yl' || picker === 'ml' ? 'lunar' : 'solar'}
          month={picker === 'yl' ? yearlyLMonth : yearlyMonth}
          day={picker === 'ys' ? yearlyDay : picker === 'yl' ? yearlyLDay : picker === 'ms' ? monthlyDay : monthlyLDay}
          preview={computedSolar}
          onClose={() => setPicker(null)}
          onSelect={(m, d) => {
            if (picker === 'ys') { setYearlyMonth(m); setYearlyDay(d); }
            else if (picker === 'yl') { setYearlyLMonth(m); setYearlyLDay(d); }
            else if (picker === 'ms') { setMonthlyDay(d); }
            else if (picker === 'ml') { setMonthlyLDay(d); }
            setPicker(null);
          }}
        />

        {/* 保存按钮 */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
        >
          {existing ? '保存' : '创建'}
        </button>
      </div>
    </div>
  );
}
