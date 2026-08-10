import { useState } from 'react';
import PrivacyPolicyContent from './PrivacyPolicyContent';

interface Props {
  onAgree: () => void;
  onDisagree: () => void;
}

const KEY_POINTS = [
  ['🔐', '我们仅收集为您提供核心服务所必需的信息：邮箱、昵称、头像、打卡记录、番茄钟数据'],
  ['🛡️', '您的数据仅用于核心功能，绝不用于广告、画像或出售给任何第三方'],
  ['🗑️', '您可随时在应用内删除账号，所有云端数据将被永久删除'],
] as const;

/**
 * 首次启动隐私政策同意弹窗（华为审核 7.5 要求：首次启动明示隐私政策）
 * 用户未同意前不初始化任何数据收集（Supabase 会话等由外层 PrivacyGate 拦截）
 */
export default function PrivacyConsentModal({ onAgree, onDisagree }: Props) {
  const [showFull, setShowFull] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#FFF9E8] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-amber-200 flex flex-col max-h-[85dvh] max-h-[85vh]">
        <div className="text-center mb-4 shrink-0">
          <span className="text-4xl block mb-2">🛡️</span>
          <h1 className="text-lg font-bold text-amber-900 drop-shadow-sm">隐私政策提示</h1>
        </div>

        {!showFull ? (
          <>
            <div className="text-center text-xs text-stone-600 mb-4">
              欢迎使用习惯追踪！在使用本应用前，请仔细阅读并同意我们的隐私政策。
            </div>
            <ul className="space-y-2.5 mb-5">
              {KEY_POINTS.map(([icon, text]) => (
                <li key={text} className="flex items-start gap-2 text-xs text-stone-700 leading-relaxed">
                  <span className="shrink-0">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowFull(true)}
              className="text-xs text-indigo-600 underline underline-offset-4 mb-5 text-center w-full hover:text-indigo-500"
            >
              查看完整隐私政策
            </button>
            <div className="space-y-2 shrink-0">
              <button
                onClick={onAgree}
                className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-all active:scale-[0.98]"
              >
                同意并继续
              </button>
              <button
                onClick={onDisagree}
                className="w-full py-2.5 rounded-xl bg-white/60 text-stone-600 text-sm border border-stone-300 hover:bg-white transition-all"
              >
                不同意，退出
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 pr-1 mb-4 -mx-1 px-1">
              <PrivacyPolicyContent />
            </div>
            <div className="space-y-2 shrink-0">
              <button
                onClick={onAgree}
                className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-all active:scale-[0.98]"
              >
                同意并继续
              </button>
              <button
                onClick={onDisagree}
                className="w-full py-2.5 rounded-xl bg-white/60 text-stone-600 text-sm border border-stone-300 hover:bg-white transition-all"
              >
                不同意，退出
              </button>
              <button
                onClick={() => setShowFull(false)}
                className="w-full py-2 text-xs text-stone-500 hover:text-stone-700 transition-all"
              >
                ← 返回摘要
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
