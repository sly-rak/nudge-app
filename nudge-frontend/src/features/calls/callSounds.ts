// Synthesized Web Audio ringback and calling sound effects

let audioCtx: AudioContext | null = null;
let ringbackInterval: any = null;
let incomingInterval: any = null;
let activeOscillators: OscillatorNode[] = [];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play telephone ringback tone (dual frequency 440Hz + 480Hz)
 * Cadence: 2s tone, 3.5s pause
 */
export function startRingbackTone() {
  stopAllCallSounds();
  try {
    const ctx = getAudioContext();

    const playBeep = () => {
      try {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = 440; // 440Hz
        osc2.frequency.value = 480; // 480Hz
        osc1.type = 'sine';
        osc2.type = 'sine';

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.setValueAtTime(0.08, now + 1.8);
        gain.gain.linearRampToValueAtTime(0.0001, now + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);

        activeOscillators.push(osc1, osc2);
      } catch (err) {
        console.warn('Ringback beep error:', err);
      }
    };

    playBeep();
    ringbackInterval = setInterval(playBeep, 4500);
  } catch (err) {
    console.warn('Could not start ringback tone:', err);
  }
}

/**
 * Play incoming call melody (soft rising chime)
 */
export function startIncomingCallTone() {
  stopAllCallSounds();
  try {
    const ctx = getAudioContext();

    const playMelody = () => {
      try {
        const now = ctx.currentTime;
        const notes = [
          { f: 523.25, t: 0.0 }, // C5
          { f: 659.25, t: 0.15 }, // E5
          { f: 783.99, t: 0.3 }, // G5
          { f: 1046.5, t: 0.45 }, // C6
        ];

        notes.forEach(({ f, t }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.value = f;

          const startAt = now + t;
          gain.gain.setValueAtTime(0.001, startAt);
          gain.gain.linearRampToValueAtTime(0.12, startAt + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startAt);
          osc.stop(startAt + 0.36);
          activeOscillators.push(osc);
        });
      } catch (err) {
        console.warn('Incoming melody error:', err);
      }
    };

    playMelody();
    incomingInterval = setInterval(playMelody, 2800);
  } catch (err) {
    console.warn('Could not start incoming call tone:', err);
  }
}

/**
 * Play short connected confirmation chime
 */
export function playConnectedTone() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  } catch {}
}

/**
 * Play call ended tone (3 beeps)
 */
export function playCallEndedTone() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    [0, 0.18, 0.36].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 420;

      const t = now + offset;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.13);
    });
  } catch {}
}

export function stopAllCallSounds() {
  if (ringbackInterval) {
    clearInterval(ringbackInterval);
    ringbackInterval = null;
  }
  if (incomingInterval) {
    clearInterval(incomingInterval);
    incomingInterval = null;
  }
  activeOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {}
  });
  activeOscillators = [];
}
