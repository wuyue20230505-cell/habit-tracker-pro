declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
  }
  export class Lunar {
    /** month 为负数表示闰月 */
    static fromYmd(year: number, month: number, day: number): Lunar;
    getYear(): number;
    /** 负数表示闰月 */
    getMonth(): number;
    getDay(): number;
    getSolar(): Solar;
  }
  export class LunarMonth {
    /** 负数表示闰月 */
    getMonth(): number;
    getDayCount(): number;
  }
  export class LunarYear {
    static fromYear(year: number): LunarYear;
    getMonths(): LunarMonth[];
  }
}
