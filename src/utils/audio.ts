// ── 音频引擎 v4：火燃声 + 海浪 + 上传真实音频（卡农/婚礼/music.1-3）──

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let nodes: AudioNode[] = [];
let intervals: number[] = [];
let htmlAudios: HTMLAudioElement[] = [];
let isPlaying = false;
let currentType: SoundscapeType = 'none';
let currentFileName = '';

// ── IndexedDB ──
const DB_NAME = 'habit-music-v2';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('tracks')) {
        req.result.createObjectStore('tracks', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// slot: 0|1|2 或 'canon'|'mariage'
export async function saveTrack(id: string, name: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tracks', 'readwrite');
    tx.objectStore('tracks').put({ id, name, type: file.type, data: file, savedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadTrack(id: string): Promise<{ name: string; blob: Blob } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tracks', 'readonly');
    const req = tx.objectStore('tracks').get(id);
    req.onsuccess = () => {
      if (!req.result) { resolve(null); return; }
      resolve({ name: req.result.name, blob: new Blob([req.result.data], { type: req.result.type }) });
    };
    req.onerror = () => reject(req.error);
  });
}

export async function hasTrack(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('tracks', 'readonly');
    const req = tx.objectStore('tracks').get(id);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => resolve(false);
  });
}

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

// ── 播放上传的音频 ──
function playBlob(_name: string, blob: Blob) {
  stopSoundscape();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url); audio.loop = true; audio.volume = 0.8;
  const c = getCtx(); if (c.state === 'suspended') c.resume();
  masterGain = c.createGain(); masterGain.gain.value = 0.85; masterGain.connect(c.destination);
  c.createMediaElementSource(audio).connect(masterGain);
  audio.play().catch(() => {});
  htmlAudios = [audio];
}

// ── 内置音乐（public/ 目录的 MP3 文件）──
function playBuiltinFile(src: string) {
  const audio = new Audio(src); audio.loop = true; audio.volume = 0.8;
  // 简单直接：不经过 Web Audio 路由，避免 createMediaElementSource 的各种坑
  audio.play().catch(() => {});
  htmlAudios.push(audio);
}

// ── Public API ──
export type SoundscapeType = 'fire' | 'ocean' | 'canon' | 'mariage' | 'fivehundred' | 'fate' | 'rain2' | 'slot0' | 'slot1' | 'slot2' | 'none';

export function getPlayingState(): boolean { return isPlaying; }
export function getSoundscapeType(): SoundscapeType { return currentType; }
export function getCurrentFileName(): string { return currentFileName; }

export function playLocalFile(file: File): void {
  playBlob(file.name, file);
  isPlaying = true; currentType = 'none'; currentFileName = file.name;
}

export function loadLocalFileFromBlob(name: string, blob: Blob): void {
  playBlob(name, blob);
  isPlaying = true; currentType = 'none'; currentFileName = name;
}

export function playTrack(id: string, name: string, blob: Blob): void {
  playBlob(name, blob);
  isPlaying = true;
  // Map slot id to type
  const map: Record<string, SoundscapeType> = { '0': 'slot0', '1': 'slot1', '2': 'slot2' };
  currentType = map[id] || 'none';
  currentFileName = name;
}

export function startSoundscape(type: SoundscapeType): void {
  if (type === 'none') { stopSoundscape(); return; }
  if (isPlaying && currentType === type) return;
  stopSoundscape();

  const c = getCtx(); if (c.state === 'suspended') c.resume();
  masterGain = c.createGain(); masterGain.gain.value = 0.85; masterGain.connect(c.destination);

  currentType = type; isPlaying = true; currentFileName = '';

  if (type === 'fire') {
    playBuiltinFile('/rain.mp3');
  } else if (type === 'ocean') {
    playBuiltinFile('/ocean.mp3');
  } else if (type === 'canon') {
    playBuiltinFile('/canon.mp3');
  } else if (type === 'mariage') {
    playBuiltinFile('/mariage.mp3');
  } else if (type === 'fivehundred') {
    playBuiltinFile('/fivehundred.mp3');
  } else if (type === 'fate') {
    playBuiltinFile('/fate.mp3');
  } else if (type === 'rain2') {
    playBuiltinFile('/rain2.mp3');
  }
}

export function stopSoundscape(): void {
  intervals.forEach(id => { try { clearTimeout(id); } catch {} }); intervals = [];
  nodes.forEach(n => { try { if (n instanceof AudioBufferSourceNode || n instanceof OscillatorNode) n.stop(); n.disconnect(); } catch {} }); nodes = [];
  if (masterGain) { masterGain.disconnect(); masterGain = null; }
  htmlAudios.forEach(a => { a.pause(); a.src = ''; }); htmlAudios = [];
  isPlaying = false; currentType = 'none'; currentFileName = '';
}

export function setVolume(v: number): void {
  const vol = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = vol;
  htmlAudios.forEach(a => { a.volume = vol; });
}

export function playWorkCompleteSound(): void {
  const c = getCtx(); if (c.state === 'suspended') c.resume();
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.3, c.currentTime + i * 0.15);
    g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + i * 0.15 + 0.4);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + i * 0.15); o.stop(c.currentTime + i * 0.15 + 0.5);
  });
}

export function playBreakEndSound(): void {
  const c = getCtx(); if (c.state === 'suspended') c.resume();
  [440, 554.37].forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.25, c.currentTime + i * 0.2);
    g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + i * 0.2 + 0.5);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + i * 0.2); o.stop(c.currentTime + i * 0.2 + 0.6);
  });
}
