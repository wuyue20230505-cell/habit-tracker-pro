import { PRICING } from '../hooks/usePro';
import { useProCtx } from '../context/ProContext';

interface Props {
  open: boolean;
  reason: string;
  onClose: () => void;
}

export default function PaywallModal({ open, reason, onClose }: Props) {
  const { purchase, payingPlan, confirmPayment } = useProCtx();

  if (!open) return null;

  // 支付进行中 → 显示确认按钮
  if (payingPlan) {
    const plan = PRICING[payingPlan as keyof typeof PRICING];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div
          className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-5xl block mb-4">🧾</span>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            等待支付确认
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            已在浏览器新标签页打开 {plan?.label}（¥{plan?.price}）的支付页面
          </p>
          <p className="text-xs text-amber-500 font-medium mb-5">
            支付完成后，点击下方按钮激活 Pro
          </p>

          <button
            onClick={confirmPayment}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/25 mb-2.5"
          >
            ✅ 已完成支付，激活 Pro
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            稍后再确认
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-5xl block mb-4">⭐</span>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">升级 Pro</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{reason}</p>
        <p className="text-xs text-amber-500 font-medium mb-5">解锁全部功能，让自律更高效</p>

        {/* 定价卡片 */}
        <div className="space-y-2.5 mb-4">
          {Object.entries(PRICING).map(([key, plan]) => (
            <button
              key={key}
              onClick={() => purchase(key as 'yearly' | 'lifetime')}
              className={`w-full py-3.5 px-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                key === 'lifetime'
                  ? 'border-amber-400 bg-white/20 dark:bg-black/25 shadow-md'
                  : 'border-gray-200 dark:border-gray-600 hover:border-amber-300'
              }`}
            >
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  {plan.label}
                  {key === 'lifetime' ? (
                    <span className="text-[10px] bg-red-400 text-white px-1.5 py-0.5 rounded-full">限时</span>
                  ) : (
                    <span className="text-[10px] bg-amber-400 text-white px-1.5 py-0.5 rounded-full">优惠</span>
                  )}
                </div>
                <div className="text-[11px] text-white/50">
                  {plan.period === '年' ? '月均不到 ¥1' : '一次付费永久使用'}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-white/30 line-through mr-1">¥{(plan as any).originalPrice}</span>
                <span className="text-lg font-bold text-amber-400">¥{plan.price}</span>
              </div>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-gray-400 mb-4">
          支持微信支付 · 支付宝 · 安全可靠
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          以后再说
        </button>
      </div>
    </div>
  );
}
