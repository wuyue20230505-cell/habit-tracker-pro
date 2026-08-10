import { useState, useEffect, useRef } from 'react';
import {
  startSoundscape, stopSoundscape,
  saveTrack, loadTrack, hasTrack, playTrack,
  getPlayingState, getSoundscapeType,
  type SoundscapeType,
} from '../utils/audio';

// 内置声音
const BUILTIN: { type: SoundscapeType; icon: string; label: string }[] = [
  { type: 'fire',       icon: '🌧️', label: '雨声' },
  { type: 'rain2',      icon: '💧', label: '雨声2' },
  { type: 'ocean',      icon: '🌊', label: '海浪' },
  { type: 'canon',      icon: '🎻', label: 'Canon' },
  { type: 'fate',       icon: '🎺', label: '命运' },
  { type: 'fivehundred',icon: '🚂', label: '500 Miles' },
  { type: 'hometown',   icon: '🏠', label: '故乡' },
  { type: 'pipa',       icon: '🪕', label: '琵琶语' },
];

const UPLOAD_SLOTS: { id: string; type: SoundscapeType; icon: string; label: string }[] = [
  { id: '0', type: 'slot0', icon: '🎸', label: 'music.1' },
  { id: '1', type: 'slot1', icon: '🥁', label: 'music.2' },
  { id: '2', type: 'slot2', icon: '🎷', label: 'music.3' },
  { id: '3', type: 'slot3', icon: '🎺', label: 'music.4' },
  { id: '4', type: 'slot4', icon: '🎻', label: 'music.5' },
  { id: '5', type: 'slot5', icon: '🪕', label: 'music.6' },
  { id: '6', type: 'slot6', icon: '🎵', label: 'music.7' },
  { id: '7', type: 'slot7', icon: '🎶', label: 'music.8' },
];

export default function MusicPicker() {
  const [active, setActive] = useState<SoundscapeType>(getSoundscapeType());
  const [playing, setPlaying] = useState(getPlayingState());
  const [uploaded, setUploaded] = useState<Set<string>>(new Set());
  const [playingSlotId, setPlayingSlotId] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingId = useRef<string>('');

  // 检查哪些槽已上传
  useEffect(() => {
    (async () => {
      const s = new Set<string>();
      for (const slot of UPLOAD_SLOTS) {
        if (await hasTrack(slot.id)) s.add(slot.id);
      }
      setUploaded(s);
    })();
  }, []);

  // 自动恢复上次播放的上传音乐
  useEffect(() => {
    const saved = localStorage.getItem('habit-music-active');
    if (saved) {
      loadTrack(saved).then(record => {
        if (record) playTrack(saved, record.name, record.blob);
        setActive(getSoundscapeType());
        setPlaying(getPlayingState());
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleBuiltin = (type: SoundscapeType) => {
    if (active === type && playing) {
      stopSoundscape(); setPlaying(false); setActive('none'); setPlayingSlotId('');
    } else {
      startSoundscape(type); setPlaying(true); setActive(type); setPlayingSlotId('');
      localStorage.removeItem('habit-music-active');
    }
  };

  const handleUploadSlot = async (slot: typeof UPLOAD_SLOTS[number]) => {
    const record = await loadTrack(slot.id);
    if (record) {
      // 已上传：点一下播放/停止，长按更换
      if (active === slot.type && playing) {
        stopSoundscape(); setPlaying(false); setActive('none'); setPlayingSlotId('');
        localStorage.removeItem('habit-music-active');
        return;
      }
      playTrack(slot.id, record.name, record.blob);
      setActive(slot.type); setPlaying(true); setPlayingSlotId(slot.id);
      localStorage.setItem('habit-music-active', slot.id);
      return;
    }
    // 未上传 → 弹出文件选择
    pendingId.current = slot.id;
    fileRef.current?.click();
  };

  // 长按/右键更换音乐
  const handleReplace = (slotId: string) => {
    pendingId.current = slotId;
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = pendingId.current;
    const slot = UPLOAD_SLOTS.find(s => s.id === id);
    const label = slot?.label || id;

    await saveTrack(id, label, file);
    playTrack(id, label, file);
    setActive(slot?.type || 'none'); setPlaying(true);
    setUploaded(prev => new Set([...prev, id]));
    localStorage.setItem('habit-music-active', id);
    e.target.value = '';
  };

  useEffect(() => {
    const i = setInterval(() => {
      setPlaying(getPlayingState());
      setActive(getSoundscapeType());
    }, 500);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-white/20 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2.5">
      <div className="flex items-center gap-1 justify-center flex-wrap">
        {/* 内置声音 */}
        {BUILTIN.map(o => (
          <button key={o.type} onClick={() => toggleBuiltin(o.type)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all text-xs ${
              active === o.type && playing
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 scale-105 shadow-sm'
                : 'text-gray-400 hover:bg-white/15 dark:hover:bg-white/10'
            }`}
            title={o.label}
          >
            <span className="text-lg">{o.icon}</span>
            <span className="text-[10px]">{o.label}</span>
          </button>
        ))}

        <span className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-0.5" />

        {/* 上传槽 */}
        {UPLOAD_SLOTS.map(s => (
          <button key={s.id}
            onClick={() => handleUploadSlot(s)}
            onContextMenu={(e) => { e.preventDefault(); if (uploaded.has(s.id)) handleReplace(s.id); }}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all text-xs ${
              active === s.type && playing
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 scale-105 shadow-sm'
                : uploaded.has(s.id)
                  ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                  : 'text-gray-300 dark:text-gray-600 hover:bg-white/15 dark:hover:bg-white/10'
            }`}
            title={uploaded.has(s.id) ? `${s.label}（已就绪，右键/长按更换）` : `上传 ${s.label}`}
          >
            <span className="text-lg">{uploaded.has(s.id) ? s.icon : '➕'}</span>
            <span className="text-[10px]">{s.label}</span>
            {uploaded.has(s.id) && active !== s.type && (
              <span className="absolute top-0 right-0 text-[8px]">🔄</span>
            )}
          </button>
        ))}

        <input ref={fileRef} type="file" accept="audio/*" onChange={handleFile} className="hidden" />

        {playing && (
          <>
            <button
              onClick={() => { stopSoundscape(); setPlaying(false); setActive('none'); setPlayingSlotId(''); localStorage.removeItem('habit-music-active'); }}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs transition-all"
            >
              <span className="text-lg">⏹</span>
              <span className="text-[10px]">停止</span>
            </button>
            {playingSlotId && (
              <button
                onClick={() => { pendingId.current = playingSlotId; fileRef.current?.click(); }}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-xs transition-all"
                title="更换当前音乐"
              >
                <span className="text-lg">🔄</span>
                <span className="text-[10px]">更换</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
