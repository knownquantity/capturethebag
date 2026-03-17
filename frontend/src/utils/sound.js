let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playModalOpenSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // CRT power-on — short rising sweep
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
}

export function playModalCloseSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // CRT power-off — short falling sweep
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.12);
}

export function playCopySound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // Quick two-tone confirmation blip
  const freqs = [600, 900];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.1, now + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.06);
    osc.stop(now + i * 0.06 + 0.06);
  });
}

export function playWinSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // Victory fanfare — ascending major arpeggio, longer and triumphant
  const freqs = [523, 659, 784, 1047, 1319, 1568];
  const noteLen = 0.12;

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.15, now + i * noteLen);
    gain.gain.setValueAtTime(0.15, now + i * noteLen + noteLen * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * noteLen + noteLen * 0.95);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * noteLen);
    osc.stop(now + i * noteLen + noteLen);
  });
}

export function playLoseSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // Descending minor — sad trombone, Atari style
  const freqs = [440, 370, 311, 220];
  const noteLen = 0.18;

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.12, now + i * noteLen);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * noteLen + noteLen * 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * noteLen);
    osc.stop(now + i * noteLen + noteLen);
  });
}

export function playClaimSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // Cash register — quick burst then high confirmation tone
  const freqs = [800, 1000, 800, 1000, 1600];
  const timings = [0, 0.04, 0.08, 0.12, 0.2];
  const lengths = [0.03, 0.03, 0.03, 0.03, 0.15];

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.14, now + timings[i]);
    gain.gain.exponentialRampToValueAtTime(0.001, now + timings[i] + lengths[i]);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + timings[i]);
    osc.stop(now + timings[i] + lengths[i]);
  });
}

export function playCaptureSound() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // Rising arpeggio — 3 quick square-wave tones
  const freqs = [440, 660, 880];
  const noteLen = 0.08;

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.15, now + i * noteLen);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * noteLen + noteLen * 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * noteLen);
    osc.stop(now + i * noteLen + noteLen);
  });
}
