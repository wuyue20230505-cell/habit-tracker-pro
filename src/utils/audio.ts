// Web Audio API — natural ambient sounds + piano melodies

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let nodes: AudioNode[] = [];
let intervals: number[] = [];
let htmlAudio: HTMLAudioElement | null = null;
let isPlaying = false;
let currentType: SoundscapeType = 'none';
let currentFileName = '';

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

// High-quality pink noise (natural rain)
function createPinkNoise(c: AudioContext, d = 2): AudioBuffer {
  const sr = c.sampleRate, len = sr * d, buf = c.createBuffer(1, len, sr), data = buf.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for (let i=0;i<len;i++) {
    const w = Math.random()*2-1;
    b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
    b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
    b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
    data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.09; b6=w*0.115926;
  }
  return buf;
}

// Brown noise (ocean/wind)
function createBrownNoise(c: AudioContext, d = 2): AudioBuffer {
  const sr = c.sampleRate, len = sr * d, buf = c.createBuffer(1, len, sr), data = buf.getChannelData(0);
  let last = 0;
  for (let i=0;i<len;i++) { last=(last+0.02*(Math.random()*2-1))/1.02; data[i]=last*2.8; }
  return buf;
}

// Soft tone with vibrato
function createTone(c: AudioContext, freq: number, g: GainNode, vol = 0.06) {
  const osc = c.createOscillator(), lfo = c.createOscillator(), lfoG = c.createGain();
  osc.type = 'sine'; osc.frequency.value = freq;
  lfo.type = 'sine'; lfo.frequency.value = 0.08; lfoG.gain.value = 2;
  lfo.connect(lfoG); lfoG.connect(osc.frequency);
  const og = c.createGain(); og.gain.value = vol;
  osc.connect(og); og.connect(g); osc.start(); lfo.start();
  nodes.push(osc, lfo);
}

// === Piano melodies — oscillator-based like lofi (proven working) ===

function scheduleNote(c: AudioContext, g: GainNode, freq: number, startTime: number, dur: number, vol: number, type: OscillatorType) {
  if (freq <= 0) return;
  const osc = c.createOscillator();
  const eg = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  eg.gain.setValueAtTime(vol, startTime);
  eg.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
  osc.connect(eg);
  eg.connect(g);
  osc.start(startTime);
  osc.stop(startTime + dur + 0.05);
  nodes.push(osc, eg);
}

// Canon in D chord progression
const CANON_CHORDS = [
  [146.83, 220, 293.66, 369.99],  // D major
  [196, 246.94, 293.66, 369.99],  // G major
  [174.61, 220, 293.66, 349.23],  // F# minor
  [164.81, 220, 261.63, 329.63],  // E minor
];

// Mariage d'Amour progression
const MARIAGE_CHORDS = [
  [130.81, 196, 261.63, 329.63],  // C major
  [164.81, 246.94, 293.66, 369.99], // E minor
  [196, 261.63, 329.63, 392],     // G major
  [174.61, 246.94, 293.66, 369.99], // F# dim
];

function playPianoChords(c: AudioContext, g: GainNode, chords: number[][], bpm: number) {
  const secPerChord = 60 / bpm * 4;
  let chordIdx = 0;

  function playNext() {
    if (!isPlaying || (currentType !== 'canon' && currentType !== 'mariage')) return;
    const now = c.currentTime;
    const chord = chords[chordIdx % chords.length];
    chord.forEach((freq, j) => {
      scheduleNote(c, g, freq, now + j * 0.05, secPerChord * 0.9, 0.06, j === 0 ? 'triangle' : 'sine');
    });
    chordIdx++;
    intervals.push(setTimeout(playNext, secPerChord * 1000));
  }

  playNext();
}

function playCanon(c: AudioContext, g: GainNode) {
  playPianoChords(c, g, CANON_CHORDS, 60);
}

function playMariage(c: AudioContext, g: GainNode) {
  playPianoChords(c, g, MARIAGE_CHORDS, 72);
}

// === Public API ===
export type SoundscapeType = 'rain' | 'ocean' | 'lofi' | 'canon' | 'mariage' | 'file' | 'none';

export function getPlayingState(): boolean { return isPlaying; }
export function getSoundscapeType(): SoundscapeType { return currentType; }
export function getCurrentFileName(): string { return currentFileName; }

export function loadLocalFile(file: File): void {
  stopSoundscape();
  const url = URL.createObjectURL(file);
  htmlAudio = new Audio(url); htmlAudio.loop = true; htmlAudio.volume = 0.4;
  const c = getCtx(); if (c.state === 'suspended') c.resume();
  masterGain = c.createGain(); masterGain.gain.value = 0.4; masterGain.connect(c.destination);
  c.createMediaElementSource(htmlAudio).connect(masterGain);
  htmlAudio.play().catch(() => {});
  isPlaying = true; currentType = 'file'; currentFileName = file.name;
}

export function startSoundscape(type: SoundscapeType): void {
  if (type === 'none') { stopSoundscape(); return; }
  if (type === 'file') return;
  if (isPlaying && currentType === type) return;
  stopSoundscape();

  const c = getCtx(); if (c.state === 'suspended') c.resume();
  masterGain = c.createGain(); masterGain.gain.value = 0.35; masterGain.connect(c.destination);

  switch (type) {
    case 'rain': {
      const buf = createPinkNoise(c);
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
      src.connect(f); f.connect(masterGain); src.start(); nodes = [src, f];
      break;
    }
    case 'ocean': {
      const buf = createBrownNoise(c);
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 350;
      src.connect(f); f.connect(masterGain);
      createTone(c, 136.1, masterGain, 0.05);
      src.start(); nodes = [src, f];
      break;
    }
    case 'lofi': {
      const buf = createPinkNoise(c);
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
      src.connect(f); f.connect(masterGain);
      createTone(c, 220, masterGain, 0.05);
      createTone(c, 330, masterGain, 0.04);
      src.start(); nodes = [src, f];
      break;
    }
    case 'canon': {
      playCanon(c, masterGain); break;
    }
    case 'mariage': {
      playMariage(c, masterGain); break;
    }
  }
  isPlaying = true; currentType = type; currentFileName = '';
}

export function stopSoundscape(): void {
  intervals.forEach(id => clearInterval(id));
  intervals = [];
  nodes.forEach(n => { try { if (n instanceof AudioBufferSourceNode || n instanceof OscillatorNode) n.stop(); n.disconnect(); } catch {} });
  nodes = [];
  if (masterGain) { masterGain.disconnect(); masterGain = null; }
  if (htmlAudio) { htmlAudio.pause(); htmlAudio.src = ''; htmlAudio = null; }
  isPlaying = false; currentType = 'none'; currentFileName = '';
}

export function setVolume(v: number): void {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
  if (htmlAudio) htmlAudio.volume = Math.max(0, Math.min(1, v));
}

export function playWorkCompleteSound(): void {
  const c = getCtx(); if (c.state === 'suspended') c.resume();
  const t = c.currentTime;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.3, t+i*0.15);
    g.gain.exponentialRampToValueAtTime(0.01, t+i*0.15+0.4);
    o.connect(g); g.connect(c.destination);
    o.start(t+i*0.15); o.stop(t+i*0.15+0.5);
  });
}

export function playBreakEndSound(): void {
  const c = getCtx(); if (c.state === 'suspended') c.resume();
  const t = c.currentTime;
  [440, 554.37].forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.25, t+i*0.2);
    g.gain.exponentialRampToValueAtTime(0.01, t+i*0.2+0.5);
    o.connect(g); g.connect(c.destination);
    o.start(t+i*0.2); o.stop(t+i*0.2+0.6);
  });
}
