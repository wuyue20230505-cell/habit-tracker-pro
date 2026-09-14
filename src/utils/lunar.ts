// 农历转换工具 —— 基于 lunar-javascript（1900-2100 精确数据）
// 2026-08-13 自检发现旧手写数据表有闰月/日期错误（18 锚点错 6 个），替换为成熟库

import { Solar, Lunar as LunarLib, LunarYear } from 'lunar-javascript';

/** 农历日期 */
export interface LunarDate {
  year: number
  month: number       // 1-12
  day: number         // 1-30
  isLeap: boolean     // 是否闰月
  yearName: string    // 天干地支年名
  monthName: string   // 农历月名
  dayName: string     // 农历日名
}

// 天干地支
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const LUNAR_MONTH_NAMES = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
const LUNAR_DAY_NAMES = [
  '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
]

export function solarToLunar(solarDate: string): LunarDate {
  const [sy, sm, sd] = solarDate.split('-').map(Number)
  const lunar = Solar.fromYmd(sy, sm, sd).getLunar()
  const m = lunar.getMonth()
  const month = Math.abs(m)
  const isLeap = m < 0
  const year = lunar.getYear()
  const day = lunar.getDay()
  return {
    year, month, day, isLeap,
    yearName: `${GAN[year % 10]}${ZHI[year % 12]}年`,
    monthName: isLeap ? `闰${LUNAR_MONTH_NAMES[month]}` : LUNAR_MONTH_NAMES[month],
    dayName: LUNAR_DAY_NAMES[day] || `${day}`,
  }
}

export function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeap: boolean): string {
  const lunar = LunarLib.fromYmd(lunarYear, isLeap ? -lunarMonth : lunarMonth, lunarDay)
  const s = lunar.getSolar()
  return `${s.getYear()}-${String(s.getMonth()).padStart(2, '0')}-${String(s.getDay()).padStart(2, '0')}`
}

export function formatLunarDate(d: LunarDate): string {
  return d.isLeap ? `闰${LUNAR_MONTH_NAMES[d.month]}${d.dayName}` : `${d.monthName}${d.dayName}`
}

/** 农历月名（含闰月前缀） */
export function getLunarMonthName(month: number, isLeap: boolean): string {
  return isLeap ? `闰${LUNAR_MONTH_NAMES[month]}` : LUNAR_MONTH_NAMES[month];
}

/** 农历日名（初一~三十） */
export function getLunarDayName(day: number): string {
  return LUNAR_DAY_NAMES[day] || `${day}`;
}

/** 指定农历年的闰月（0 = 无闰月） */
export function getLunarLeapMonth(year: number): number {
  const months = LunarYear.fromYear(year).getMonths();
  for (const lm of months) {
    if (lm.getMonth() < 0) return Math.abs(lm.getMonth());
  }
  return 0;
}

/** 指定农历月的天数（29 或 30） */
export function getLunarMonthDays(year: number, month: number, isLeap: boolean): number {
  const months = LunarYear.fromYear(year).getMonths();
  for (const lm of months) {
    if (Math.abs(lm.getMonth()) === month && (lm.getMonth() < 0) === isLeap) {
      return lm.getDayCount();
    }
  }
  return 30;
}
