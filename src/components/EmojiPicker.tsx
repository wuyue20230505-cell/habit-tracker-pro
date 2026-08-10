const EMOJIS = [
  // 运动健康
  '💪', '🏃', '🚴', '🏊', '🧘', '🏋️', '🤸', '⛹️', '🏄', '🎯',
  // 学习成长
  '📚', '✍️', '📝', '🎓', '💻', '🧠', '🎨', '🎸', '🎹', '🎬',
  // 饮食生活
  '💧', '🍎', '🥗', '🍳', '☕', '🍵', '🥤', '🍚', '🫖', '🥑',
  // 作息
  '🌅', '🌙', '💤', '⏰', '☀️', '🌿', '🧹', '🛏️', '🚿', '🧴',
  // 心情
  '😊', '❤️', '🌟', '✨', '🔥', '🎉', '🌈', '💖', '🙏', '🍀',
  // 社交
  '📞', '💬', '👨‍👩‍👧‍👦', '🐕', '🐱', '🌱', '📸', '🎵', '🧩', '♟️',
  // 财务
  '💰', '💳', '📊', '💼', '🏦',
  // 其他
  '🗂️', '✈️', '🎒', '🔧', '🧭',
];

interface Props {
  value: string;
  onChange: (emoji: string) => void;
}

export default function EmojiPicker({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">图标</label>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            className={`text-xl p-2 rounded-lg transition-all ${
              value === e
                ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500 scale-110'
                : 'hover:bg-white/15 dark:hover:bg-white/10'
            }`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
