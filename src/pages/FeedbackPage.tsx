import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 600 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      setScreenshots(prev => [...prev, canvas.toDataURL('image/jpeg', 0.5)]);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('screenshots', screenshots.length.toString());
      // FormSubmit 免费邮件转发
      const res = await fetch('https://formsubmit.co/ajax/515327096@qq.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '习惯追踪用户',
          message: `${text}\n\n截图数量：${screenshots.length}`,
          _subject: '习惯追踪App反馈',
        }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        alert('发送失败，请重试');
      }
    } catch {
      alert('网络错误，请重试');
    }
    setSending(false);
  };

  return (
    <div className="min-h-dvh relative" style={{ background: 'url(/feedback-bg.jpg) center/cover no-repeat', minHeight: '100dvh' }}>
      <div className="absolute inset-0 bg-black/40 z-[1]" />
      <div className="max-w-lg mx-auto px-4 pt-8 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white drop-shadow-lg">💬 意见反馈</h1>
          <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white text-sm">← 返回</button>
        </div>

        {sent ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-4">📬</span>
            <h2 className="text-lg font-bold text-white mb-2">感谢反馈！</h2>
            <p className="text-white/50 text-sm mb-4">已发送到邮箱，我会尽快查看</p>
            <button onClick={() => { setSent(false); setText(''); setScreenshots([]); }}
              className="text-indigo-400 text-sm">继续反馈</button>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="请详细描述你的意见或遇到的问题..."
              rows={6}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            {/* Screenshots */}
            {screenshots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {screenshots.map((s, i) => (
                  <div key={i} className="relative">
                    <img src={s} className="w-20 h-20 object-cover rounded-lg" />
                    <button onClick={() => setScreenshots(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => fileRef.current?.click()}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 text-sm hover:bg-white/15 transition-colors">
                📷 添加截图
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={addScreenshot} className="hidden" />
              <button onClick={handleSend}
                disabled={!text.trim() || sending}
                className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 disabled:opacity-30 transition-all">
                {sending ? '发送中...' : '📤 发送反馈'}
              </button>
            </div>
            <p className="text-[10px] text-white/20 text-center">发送后我会在 515327096@qq.com 收到你的反馈</p>
          </div>
        )}
      </div>
    </div>
  );
}
