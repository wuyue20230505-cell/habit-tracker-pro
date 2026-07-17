export function generateId(): string {
  return crypto.randomUUID();
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${month}月${day}日 ${weekdays[d.getDay()]}`;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getMonthDays(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function daysInMonth(date: string): number {
  const [y, m] = date.split('-').map(Number);
  return getMonthDays(y, m);
}

export function getWeekdayName(dayIndex: number): string {
  const names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return names[dayIndex === 0 ? 6 : dayIndex - 1];
}

export function getMonthName(month: number): string {
  const names = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return names[month];
}

export function daysBetween(from: string, to: string): string[] {
  const result: string[] = [];
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  while (start <= end) {
    result.push(start.toISOString().slice(0, 10));
    start.setDate(start.getDate() + 1);
  }
  return result;
}
