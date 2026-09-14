// 中国法定节假日工具
// 数据来源：国务院办公厅放假安排通知，与小程序版同一份数据
// 2026-08-19 已按国办发明电〔2025〕7号逐条核对：2025/2026 假期区间与补班日全部正确
// 2027 为推算（官方约 2026-11 公布后校正）；覆盖范围外年份只按周末判断休息日

/** 节假日区间 */
export interface HolidayRange {
  name: string
  start: string   // YYYY-MM-DD
  end: string     // YYYY-MM-DD（含）
}

/** 调休工作日（周末但上班） */
type YearData = { holidays: HolidayRange[]; makeupDays: string[] }

// ============================================================
// 2025 年放假安排（官方）
// ============================================================
const Y2025: YearData = {
  holidays: [
    { name: '元旦', start: '2025-01-01', end: '2025-01-01' },
    { name: '春节', start: '2025-01-28', end: '2025-02-04' },
    { name: '清明节', start: '2025-04-04', end: '2025-04-06' },
    { name: '劳动节', start: '2025-05-01', end: '2025-05-05' },
    { name: '端午节', start: '2025-05-31', end: '2025-06-02' },
    { name: '国庆节/中秋节', start: '2025-10-01', end: '2025-10-08' },
  ],
  makeupDays: ['2025-01-26', '2025-02-08', '2025-04-27', '2025-09-28', '2025-10-11'],
}

// ============================================================
// 2026 年放假安排（官方：国办发明电〔2025〕7号，2025-11-04 公布）
// 补班日：1/4、2/14、2/28、5/9、9/20、10/10
// ============================================================
const Y2026: YearData = {
  holidays: [
    { name: '元旦', start: '2026-01-01', end: '2026-01-03' },
    { name: '春节', start: '2026-02-15', end: '2026-02-23' },
    { name: '清明节', start: '2026-04-04', end: '2026-04-06' },
    { name: '劳动节', start: '2026-05-01', end: '2026-05-05' },
    { name: '端午节', start: '2026-06-19', end: '2026-06-21' },
    { name: '中秋节', start: '2026-09-25', end: '2026-09-27' },
    { name: '国庆节', start: '2026-10-01', end: '2026-10-07' },
  ],
  makeupDays: ['2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10'],
}

// ============================================================
// 2027 年放假安排（推算，待官方公布后校正；官方约 2026-11 公布）
// ============================================================
const Y2027: YearData = {
  holidays: [
    { name: '元旦', start: '2027-01-01', end: '2027-01-03' },
    { name: '春节', start: '2027-02-05', end: '2027-02-12' },
    { name: '清明节', start: '2027-04-04', end: '2027-04-06' },
    { name: '劳动节', start: '2027-05-01', end: '2027-05-05' },
    { name: '端午节', start: '2027-06-09', end: '2027-06-09' },
    { name: '中秋节', start: '2027-09-15', end: '2027-09-15' },
    { name: '国庆节', start: '2027-10-01', end: '2027-10-07' },
  ],
  makeupDays: [
    '2027-02-13', '2027-02-14',  // 春节
    '2027-04-25', '2027-05-08',  // 劳动节
    '2027-09-26', '2027-10-09',  // 国庆节
  ],
}

const ALL_DATA: Record<number, YearData> = {
  2025: Y2025,
  2026: Y2026,
  2027: Y2027,
}

// 预热：把所有节假日日期展开为 Set 加速查询
function buildHolidaySet(data: YearData): Set<string> {
  const set = new Set<string>()
  for (const h of data.holidays) {
    const start = new Date(h.start + 'T00:00:00')
    const end = new Date(h.end + 'T00:00:00')
    const cur = new Date(start)
    while (cur <= end) {
      const ds = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
      set.add(ds)
      cur.setDate(cur.getDate() + 1)
    }
  }
  return set
}

interface CachedYear {
  holidays: Set<string>   // 所有法定节假日日期
  makeupDays: Set<string> // 调休工作日（周末但上班）
}

const cache = new Map<number, CachedYear>()

function getYearCache(year: number): CachedYear | undefined {
  if (cache.has(year)) return cache.get(year)
  const data = ALL_DATA[year]
  if (!data) return undefined
  const entry: CachedYear = {
    holidays: buildHolidaySet(data),
    makeupDays: new Set(data.makeupDays),
  }
  cache.set(year, entry)
  return entry
}

/** 是否法定节假日（不含普通周末） */
export function isStatutoryHoliday(dateStr: string): boolean {
  const [y] = dateStr.split('-').map(Number)
  return !!getYearCache(y)?.holidays.has(dateStr)
}

/** 是否调休上班日（周末但上班） */
export function isMakeupDay(dateStr: string): boolean {
  const [y] = dateStr.split('-').map(Number)
  return !!getYearCache(y)?.makeupDays.has(dateStr)
}

/** 是否周六/周日 */
export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return false
  const dow = d.getDay()
  return dow === 0 || dow === 6
}

/** 是否周末休息日（周六日且非调休上班日） */
export function isWeekendRest(dateStr: string): boolean {
  return isWeekend(dateStr) && !isMakeupDay(dateStr)
}

/** 是否休息日（法定节假日 + 周末休息，排除调休上班日） */
export function isRestDay(dateStr: string): boolean {
  if (isMakeupDay(dateStr)) return false
  if (isStatutoryHoliday(dateStr)) return true
  return isWeekend(dateStr)
}

/** 是否工作日 */
export function isWorkday(dateStr: string): boolean {
  return !isRestDay(dateStr)
}

/** 两日期之间（含两端）的工作日数量 */
export function countWorkdaysBetween(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0

  const lo = s <= e ? new Date(s) : new Date(e)
  const hi = s <= e ? new Date(e) : new Date(s)

  let count = 0
  const cur = new Date(lo)
  while (cur <= hi) {
    const ds = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    if (isWorkday(ds)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/** 导出假期列表（用于 UI 展示，调试用） */
export function getHolidaysForYear(year: number): HolidayRange[] {
  const data = ALL_DATA[year]
  return data ? [...data.holidays] : []
}
