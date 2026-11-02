// WebAudio 5-Preset Sound Synthesizer ported directly from nudge-standalone.html lines 3686-3707

let actx: AudioContext | null = null;

export type SoundPreset = 'chime' | 'bell' | 'pop' | 'marimba' | 'drop';

export function playTone(id: SoundPreset | string) {
  if (!id || id === 'silent') return;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!actx) actx = new AC();
    if (actx.state === 'suspended') actx.resume();

    const sequences: Record<string, [number, number][]> = {
      chime: [
        [880, 0],
        [1175, 0.13],
      ],
      incoming: [
        [880, 0],
        [1175, 0.13],
      ],
      bell: [
        [1319, 0],
        [988, 0.16],
        [1319, 0.32],
      ],
      bop: [
        [1319, 0],
        [988, 0.16],
        [1319, 0.32],
      ],
      pop: [
        [620, 0],
        [420, 0.07],
      ],
      marimba: [
        [523, 0],
        [659, 0.1],
        [784, 0.2],
      ],
      drop: [
        [900, 0],
        [540, 0.1],
        [380, 0.2],
      ],
    };

    const seq = sequences[id] || [[880, 0]];
    const type: OscillatorType = id === 'marimba' ? 'triangle' : 'sine';
    const t0 = actx.currentTime + 0.01;

    seq.forEach((n) => {
      if (!actx) return;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type;
      o.frequency.value = n[0];
      g.gain.setValueAtTime(0.0001, t0 + n[1]);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + n[1] + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n[1] + 0.34);
      o.connect(g);
      g.connect(actx.destination);
      o.start(t0 + n[1]);
      o.stop(t0 + n[1] + 0.36);
    });
  } catch (e) {
    // AudioContext blocked or not supported
  }
}
