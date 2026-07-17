interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DownloadModal({ open, onClose }: Props) {
  if (!open) return null;

  const productionUrl = 'https://my-project-rust-six-71.vercel.app';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(productionUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">📱 安装到手机</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">三种方式，任选其一</p>

        {/* Method 1: PWA - best option */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-300 dark:border-indigo-700 rounded-2xl p-4 mb-4 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⭐</span>
            <h3 className="font-bold text-indigo-700 dark:text-indigo-400">推荐：一键安装（无需下载）</h3>
          </div>
          <ol className="text-sm text-indigo-600 dark:text-indigo-400 space-y-1.5 leading-relaxed">
            <li>1. 手机浏览器打开 <span className="font-mono text-xs bg-indigo-100 dark:bg-indigo-900/40 px-1 rounded">my-project-rust-six-71.vercel.app</span></li>
            <li>2. 点击浏览器菜单 <strong>⋮</strong> → <strong>添加到主屏幕</strong></li>
            <li>3. 桌面出现「习惯追踪」图标，像原生APP一样使用！</li>
          </ol>
        </div>

        {/* Method 2: QR Code */}
        <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 mb-4 border dark:border-gray-600">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📷 扫码打开</h3>
          <div className="bg-white rounded-xl p-2 mb-2 inline-block">
            <img src={qrApiUrl} alt="QR Code" className="w-36 h-36" />
          </div>
          <p className="text-xs text-gray-400">微信/浏览器扫码即可打开</p>
        </div>

        {/* Method 3: APK direct download */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-left">
          <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2">📦 安卓 APK 一键下载</h3>
          <a
            href="/habit-tracker.apk"
            download
            className="block w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm text-center hover:bg-emerald-600 transition-colors mb-2"
          >
            📥 下载 APK (4.3 MB)
          </a>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
            下载后直接安装即可。如提示「未知来源」，请前往设置 → 安全 → 允许安装未知应用。
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
