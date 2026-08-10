import { useLocation, useNavigate } from 'react-router-dom';
import PrivacyPolicyContent, { PRIVACY_UPDATED, PRIVACY_VERSION } from '../components/PrivacyPolicyContent';

export default function PrivacyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { fromAuth?: boolean; tab?: string } | null;
  const fromAuth = state?.fromAuth === true;

  const handleAgree = () => {
    try {
      localStorage.setItem('habit-privacy-consent', JSON.stringify({ version: PRIVACY_VERSION, agreedAt: Date.now() }));
    } catch { /* 存储失败不阻塞使用 */ }
    // 从登录/注册页进入时，同意后返回该页（原 tab）并自动勾选；否则进入打卡页
    if (fromAuth) navigate('/auth', { state: { autoAgree: true, tab: state?.tab } });
    else navigate('/checkin');
  };

  return (
    <div className="min-h-dvh bg-[#FFF9E8] text-stone-800">
      <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col min-h-dvh">
        <h1 className="text-2xl font-bold mb-2 text-stone-900">隐私政策</h1>
        <p className="text-sm text-stone-500 mb-8">更新日期：{PRIVACY_UPDATED}</p>
        <div className="flex-1">
          <PrivacyPolicyContent />
        </div>
        {/* 同意 / 返回（华为审核 7.5：政策页须有明确同意入口） */}
        <div className="space-y-2.5 mt-8 max-w-xs mx-auto w-full">
          <button
            onClick={handleAgree}
            className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-all active:scale-[0.98]"
          >
            同意并继续
          </button>
          <button
            onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }}
            className="w-full py-2.5 rounded-xl bg-white/60 text-stone-600 text-sm border border-stone-300 hover:bg-white transition-all"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
