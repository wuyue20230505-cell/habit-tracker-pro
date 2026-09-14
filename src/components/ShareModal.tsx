interface Props {
  open: boolean;
  onClose: () => void;
}

const SHARE_LINK = 'https://www.pgyer.com/xgzzpro';
const SHARE_TEXT = `🎯 打卡番茄钟 — 自律打卡神器！

✅ 每日打卡 + 番茄钟专注
🍅 环境白噪音 + 钢琴曲
🏆 全站排行榜 PK
📊 周/月/年数据统计

📥 免费下载：${SHARE_LINK}

我已经坚持打卡了，一起来卷！💪`;

export default function ShareModal({ open, onClose }: Props) {
  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_TEXT);
      alert('✅ 已复制！去微信粘贴发送给好友即可');
    } catch {
      // WeChat blocks clipboard API — user long-presses to copy
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white/15 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-3">📤 分享给好友</h2>

        <p className="text-sm text-white/60 mb-3 text-center">长按下方文字复制，去微信粘贴发送</p>

        {/* 一键复制按钮 */}
        <button
          onClick={handleCopy}
          className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold mb-3 hover:bg-emerald-600 transition-colors text-sm"
        >
          📋 一键复制文案
        </button>

        {/* 推广文案框 */}
        <div className="border-2 border-white/20 rounded-xl p-4 mb-3 bg-white/5 select-all" onClick={handleCopy}>
          <pre className="text-sm text-white/85 whitespace-pre-wrap font-sans leading-relaxed select-text pointer-events-auto">{SHARE_TEXT}</pre>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-colors text-sm"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
