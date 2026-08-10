import { useEffect, useState, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import PrivacyConsentModal from './PrivacyConsentModal';
import { PRIVACY_VERSION } from './PrivacyPolicyContent';

// 首次启动隐私同意门禁（华为审核 7.5）
// 未同意前不渲染任何业务内容 → 不初始化 Supabase、不收集任何数据
// 隐私政策版本变更时（PRIVACY_VERSION）要求用户重新同意

const CONSENT_KEY = 'habit-privacy-consent';

type Status = 'checking' | 'need-consent' | 'agreed' | 'refused';

export default function PrivacyGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (raw) {
        const consent = JSON.parse(raw);
        if (consent && consent.version === PRIVACY_VERSION) {
          setStatus('agreed');
          return;
        }
      }
    } catch { /* 数据损坏则重新要求同意 */ }
    setStatus('need-consent');
  }, []);

  const handleAgree = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: PRIVACY_VERSION, agreedAt: Date.now() }));
    } catch { /* 存储失败不阻塞使用 */ }
    setStatus('agreed');
  };

  const handleDisagree = () => {
    // 原生 App（Android）直接退出；Web 端显示拒绝提示页
    if (Capacitor.isNativePlatform()) {
      App.exitApp();
    } else {
      setStatus('refused');
    }
  };

  if (status === 'checking') {
    // 空白帧，避免同意弹窗闪烁
    return <div className="min-h-dvh bg-gray-900" />;
  }

  if (status === 'need-consent') {
    return <PrivacyConsentModal onAgree={handleAgree} onDisagree={handleDisagree} />;
  }

  if (status === 'refused') {
    return (
      <div className="min-h-dvh bg-[#FFF9E8] text-stone-800 flex flex-col items-center justify-center px-8 text-center">
        <span className="text-5xl mb-4">🛡️</span>
        <h1 className="text-lg font-bold text-stone-900 mb-2">您已拒绝《隐私政策》</h1>
        <p className="text-sm text-stone-600 mb-8 leading-relaxed">
          未同意隐私政策前，我们无法为您提供服务，也不会收集您的任何信息。
          您可返回重新阅读，或同意后继续使用。
        </p>
        <div className="w-full max-w-xs space-y-2.5">
          <button
            onClick={handleAgree}
            className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-all active:scale-[0.98]"
          >
            同意并继续
          </button>
          <button
            onClick={() => setStatus('need-consent')}
            className="w-full py-2.5 rounded-xl bg-white/60 text-stone-600 text-sm border border-stone-300 hover:bg-white transition-all"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
