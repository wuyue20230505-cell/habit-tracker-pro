// 全局按钮点击反馈：轻微震动（Android WebView 支持 navigator.vibrate，其他平台静默忽略）
// 视觉按压反馈在 index.css 中（button:active 亮度变化）

let initialized = false;

export function initTapFeedback(): void {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    // 只对可点击元素反馈，避免滑动/误触时频繁震动
    const el = target.closest('button, a, [role="button"], input[type="checkbox"], input[type="date"], input[type="file"]');
    if (!el) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {
      /* 不支持的环境静默忽略 */
    }
  });
}
