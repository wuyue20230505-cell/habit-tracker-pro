interface Props {
  open: boolean;
  onClose: () => void;
}

const PGYER_URL = 'https://www.pgyer.com/xgzz';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PGYER_URL)}`;

export default function DownloadModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-2 drop-shadow">📱 安装到手机</h2>
        <p className="text-sm text-white/60 mb-4">扫码或点击链接即可安装</p>

        {/* 蒲公英 — 微信扫码安装 */}
        <div className="bg-emerald-50/20 border-2 border-emerald-300/30 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-lg">📱</span>
            <h3 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">微信扫码安装</h3>
          </div>
          <div className="bg-white rounded-xl p-2 mb-3 inline-block">
            <img src={QR_URL} alt="下载二维码" className="w-40 h-40" />
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">微信扫码 → 右上角浏览器打开 → 一键安装</p>
        </div>

        {/* 直接下载链接 */}
        <a
          href={PGYER_URL}
          target="_blank"
          rel="noopener"
          className="block w-full py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm text-center hover:bg-indigo-600 transition-colors mb-2"
        >
          📥 直接下载安装
        </a>
        <p className="text-[10px] text-white/30 mb-4">如提示"未知来源"，请前往设置 → 安全 → 允许安装未知应用</p>

        {/* 网页版 */}
        <div className="bg-white/10 rounded-2xl p-3 mb-4">
          <p className="text-xs text-white/50">
            💡 也可以用浏览器打开 <span className="text-white/70 font-mono text-[10px]">my-project-rust-six-71.vercel.app</span> 直接使用网页版
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/10 text-white/60 font-medium hover:bg-white/15 transition-colors text-sm"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
