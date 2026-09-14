/**
 * Audio Synthesis & Notification Sound Engine
 * Provides custom built-in sound presets (Cash Register, Harmony Chime, Crystal Bell, etc.)
 * as well as custom audio URL & uploaded audio support.
 * Uses Web Audio API for zero-latency, offline-capable playback with volume control.
 */

import { SoundPreset } from '../types';

let cachedAudioCtx: AudioContext | null = null;

export const SOUND_PRESETS_META: Array<{
  id: SoundPreset;
  name: string;
  desc: string;
  icon: string;
}> = [
  {
    id: 'cash_register',
    name: 'Mesin Kasir / Kaching',
    desc: 'Suara gemerincing koin logam & lonceng kasir toko (Sangat cocok untuk jualan!)',
    icon: '💵'
  },
  {
    id: 'harmony_chime',
    name: 'Chime Harmoni Dua Nada',
    desc: 'Nada modern yang jernih, tenang & profesional',
    icon: '🔔'
  },
  {
    id: 'crystal_bell',
    name: 'Crystal Bell Mewah',
    desc: 'Lonceng kristal berkilau dengan sustain frekuensi tinggi',
    icon: '💎'
  },
  {
    id: 'radar_pulse',
    name: 'Radar Futuristik',
    desc: 'Pulse sci-fi frekuensi ganda berteknologi tinggi',
    icon: '📡'
  },
  {
    id: 'gentle_marimba',
    name: 'Marimba Akustik',
    desc: 'Nada perkusi kayu yang hangat & ramah di telinga',
    icon: '🪵'
  },
  {
    id: 'retro_coin',
    name: 'Koin Retro Arcade',
    desc: 'Efek koin game 8-bit klasik yang riang',
    icon: '🪙'
  },
  {
    id: 'alarm_trill',
    name: 'Panggilan Order Cepat',
    desc: 'Tiga ketukan beruntun untuk perhatian pesanan mendesak',
    icon: '🚨'
  },
  {
    id: 'custom',
    name: 'Suara Kustom / File Sendiri',
    desc: 'Gunakan URL audio kustom atau upload file MP3 / WAV Anda sendiri',
    icon: '🎵'
  }
];

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!cachedAudioCtx || cachedAudioCtx.state === 'closed') {
      cachedAudioCtx = new AudioContextClass();
    }
    if (cachedAudioCtx.state === 'suspended') {
      cachedAudioCtx.resume();
    }
    return cachedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Unlock AudioContext on initial user gesture so background sounds can trigger
 */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Play selected notification sound preset
 */
export function playNotificationSound(
  preset: SoundPreset = 'cash_register',
  volumePercent: number = 80,
  customAudioUrl?: string
) {
  const volume = Math.max(0, Math.min(1, (volumePercent ?? 80) / 100));

  // If custom audio is chosen or provided
  if (preset === 'custom' && customAudioUrl && (customAudioUrl.startsWith('http') || customAudioUrl.startsWith('data:audio'))) {
    try {
      const audio = new Audio(customAudioUrl);
      audio.volume = volume;
      audio.play().catch(() => {
        // Fallback to cash register if custom audio URL fails
        synthesizePreset('cash_register', volume);
      });
      return;
    } catch {
      synthesizePreset('cash_register', volume);
      return;
    }
  }

  synthesizePreset(preset, volume);
}

/**
 * Synthesize sound directly using Web Audio API oscillators and gain envelopes
 */
function synthesizePreset(preset: SoundPreset, volume: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  switch (preset) {
    case 'cash_register':
      playCashRegister(ctx, now, volume);
      break;
    case 'harmony_chime':
      playHarmonyChime(ctx, now, volume);
      break;
    case 'crystal_bell':
      playCrystalBell(ctx, now, volume);
      break;
    case 'radar_pulse':
      playRadarPulse(ctx, now, volume);
      break;
    case 'gentle_marimba':
      playGentleMarimba(ctx, now, volume);
      break;
    case 'retro_coin':
      playRetroCoin(ctx, now, volume);
      break;
    case 'alarm_trill':
      playAlarmTrill(ctx, now, volume);
      break;
    default:
      playCashRegister(ctx, now, volume);
      break;
  }
}

// 1. Cash Register (Metallic coins clink + high bell ding)
function playCashRegister(ctx: AudioContext, now: number, masterVol: number) {
  // Mechanical metallic drawer click 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(240, now);
  osc1.frequency.exponentialRampToValueAtTime(60, now + 0.08);
  gain1.gain.setValueAtTime(0.3 * masterVol, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.09);

  // Coin clink (FM high metallic pitch)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(1800, now + 0.05);
  osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.15);
  gain2.gain.setValueAtTime(0.2 * masterVol, now + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.05);
  osc2.stop(now + 0.19);

  // Cash Register Bell Ding (High E6 ~ 1318.5 Hz with long decay)
  const bell = ctx.createOscillator();
  const bellGain = ctx.createGain();
  bell.type = 'sine';
  bell.frequency.setValueAtTime(1318.51, now + 0.1);
  bellGain.gain.setValueAtTime(0.4 * masterVol, now + 0.1);
  bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  bell.connect(bellGain);
  bellGain.connect(ctx.destination);
  bell.start(now + 0.1);
  bell.stop(now + 0.92);

  // Bell Overtone (A6 ~ 1760 Hz)
  const overtone = ctx.createOscillator();
  const overtoneGain = ctx.createGain();
  overtone.type = 'sine';
  overtone.frequency.setValueAtTime(2637.02, now + 0.1);
  overtoneGain.gain.setValueAtTime(0.15 * masterVol, now + 0.1);
  overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  overtone.connect(overtoneGain);
  overtoneGain.connect(ctx.destination);
  overtone.start(now + 0.1);
  overtone.stop(now + 0.62);
}

// 2. Harmony Chime (G5 -> C6)
function playHarmonyChime(ctx: AudioContext, now: number, masterVol: number) {
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(783.99, now); // G5
  gain1.gain.setValueAtTime(0.35 * masterVol, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.4);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1046.50, now + 0.14); // C6
  gain2.gain.setValueAtTime(0.4 * masterVol, now + 0.14);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.14);
  osc2.stop(now + 0.85);
}

// 3. Crystal Bell
function playCrystalBell(ctx: AudioContext, now: number, masterVol: number) {
  const freqs = [1318.5, 1567.98, 1975.53];
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + idx * 0.08;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.25 * masterVol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.85);
  });
}

// 4. Radar Pulse (Sci-fi chirp)
function playRadarPulse(ctx: AudioContext, now: number, masterVol: number) {
  [0, 0.16].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + delay;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, start);
    osc.frequency.exponentialRampToValueAtTime(1600, start + 0.12);
    gain.gain.setValueAtTime(0.3 * masterVol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.19);
  });
}

// 5. Gentle Marimba (Wooden triad)
function playGentleMarimba(ctx: AudioContext, now: number, masterVol: number) {
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.1;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.4 * masterVol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.46);
  });
}

// 6. Retro Coin (8-bit arcade)
function playRetroCoin(ctx: AudioContext, now: number, masterVol: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(987.77, now); // B5
  osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
  gain.gain.setValueAtTime(0.25 * masterVol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.46);
}

// 7. Alarm Trill (Urgent 3-note)
function playAlarmTrill(ctx: AudioContext, now: number, masterVol: number) {
  const notes = [880, 1108.73, 1318.51];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.09;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.18 * masterVol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.26);
  });
}

// Backward compatibility alias
export function playOrderNotificationChime() {
  playNotificationSound('cash_register', 80);
}
export function setCustomAudioUrl(url: string | null) {
  // Stored in settings
}
