import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

// ── Pro 功能限制常量 ──────────────────────────
export const LIMITS = {
  FREE_HABITS: 3,        // 免费最多3个习惯
  FREE_STATS_DAYS: 7,    // 免费看最近7天统计
  FREE_MUSIC: ['rain'],  // 免费只有雨声
} as const;

// ── 定价方案 ──────────────────────────────────
export const PRICING = {
  yearly:  { price: 12,  period: '年', label: '年付' },
  lifetime:{ price: 48,  period: '',  label: '终身买断' },
} as const;

// ── 面包多 支付配置 ───────────────────────────
// 1. 注册 https://mbd.pub → 创建商品 → 复制支付链接
// 2. 在面包多后台设置回调地址：https://my-project-rust-six-71.vercel.app?pro=1
const PAY_URLS: Record<keyof typeof PRICING, string> = {
  yearly:  '',  // 填入年付商品支付链接
  lifetime:'',  // 填入终身商品支付链接
};

// ── Pro Hook ──────────────────────────────────
export function usePro() {
  const [isPro, setIsPro] = useLocalStorage<boolean>('habit-pro', false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState('');
  const [payingPlan, setPayingPlan] = useState<string | null>(null); // 正在支付的方案

  // 支付成功回调检测
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pro') === '1') {
      if (!isPro) {
        setIsPro(true);
        setShowPaywall(false);
        setPayingPlan(null);
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isPro, setIsPro]);

  // 打开支付页面
  const purchase = useCallback((plan: keyof typeof PRICING) => {
    const url = PAY_URLS[plan];

    // 未配置支付链接 → 开发模式直接解锁
    if (!url) {
      setIsPro(true);
      setShowPaywall(false);
      setPayingPlan(null);
      alert('Pro 已激活（开发模式）！\n\n配置真实支付：\n1. 注册 mbd.pub\n2. 创建商品 ¥12 和 ¥48\n3. 复制支付链接到 src/hooks/usePro.ts');
      return;
    }

    // 显示等待状态
    setPayingPlan(plan);
    window.open(url, '_blank');
  }, [setIsPro]);

  // 手动确认支付完成
  const confirmPayment = useCallback(() => {
    setIsPro(true);
    setShowPaywall(false);
    setPayingPlan(null);
  }, [setIsPro]);

  const requirePro = useCallback((reason: string): boolean => {
    if (!isPro) {
      setPaywallReason(reason);
      setShowPaywall(true);
      setPayingPlan(null);
      return false;
    }
    return true;
  }, [isPro]);

  const checkHabitLimit = useCallback((currentCount: number): boolean => {
    if (isPro) return true;
    if (currentCount >= LIMITS.FREE_HABITS) {
      requirePro(`免费版最多创建 ${LIMITS.FREE_HABITS} 个习惯`);
      return false;
    }
    return true;
  }, [isPro, requirePro]);

  return {
    isPro,
    setIsPro,
    showPaywall,
    setShowPaywall,
    paywallReason,
    requirePro,
    checkHabitLimit,
    purchase,
    payingPlan,
    confirmPayment,
  };
}
