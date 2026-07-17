import { useState, useEffect } from 'react';
import { startSoundscape, stopSoundscape, getPlayingState, getSoundscapeType, type SoundscapeType } from '../utils/audio';

const OPTIONS: { type: SoundscapeType; icon: string; label: string }[] = [
  { type: 'rain', icon: '🌧️', label: '雨声' },
  { type: 'ocean', icon: '🌊', label: '海浪' },
  { type: 'lofi', icon: '🌿', label: '舒缓' },
  { type: 'canon', icon: '🎻', label: '卡农' },
  { type: 'mariage', icon: '💒', label: '梦中的婚礼' },
];

export default function MusicPicker() {
  const [active, setActive] = useState<SoundscapeType>(getSoundscapeType());
  const [playing, setPlaying] = useState(getPlayingState());

  const toggle = (type: SoundscapeType) => {
    if (active === type && playing) {
      stopSoundscape(); setPlaying(false); setActive('none');
    } else {
      startSoundscape(type); setPlaying(true); setActive(type);
    }
  };

  useEffect(() => {
    const i = setInterval(() => {
      setPlaying(getPlayingState());
      setActive(getSoundscapeType());
    }, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm">
      <div className="flex items-center gap-1.5 justify-center">
        {OPTIONS.map(o => (
          <button key={o.type} onClick={() => toggle(o.type)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all text-xs ${
              active === o.type && playing
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 scale-105'
                : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title={o.label}
          >
            <span className="text-lg">{o.icon}</span>
            <span className="text-[10px]">{o.label}</span>
          </button>
        ))}
        {active !== 'none' && playing && (
          <button onClick={() => stopSoundscape()} className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs">
            <span className="text-lg">⏹</span>
            <span className="text-[10px]">停止</span>
          </button>
        )}
      </div>
    </div>
  );
}
