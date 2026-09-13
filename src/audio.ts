type Layer = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
};

type Cue = 'knock' | 'paper' | 'sting' | 'footstep' | 'whisper' | 'bell';

/** Original browser-synthesized ambience: no game or film recording is embedded. */
export class Soundscape {
  private context?: AudioContext;
  private master?: GainNode;
  private layers: Layer[] = [];
  private enabled = false;
  private sceneIndex = -1;
  private sceneTimers: number[] = [];

  get isEnabled() {
    return this.enabled;
  }

  async start() {
    if (this.enabled) return;
    const Context = window.AudioContext;
    if (!Context) return;
    this.context ??= new Context();
    await this.context.resume();
    this.master ??= this.context.createGain();
    this.master.gain.value = 0.165;
    this.master.connect(this.context.destination);
    this.layers = [
      this.makeNoise(180, 0.13, 'lowpass'), // sea wind below the roofs
      this.makeNoise(1200, 0.027, 'bandpass'), // fine rain and salt spray
      this.makeNoise(3100, 0.008, 'highpass'), // distant roof and wire hiss
    ];
    this.enabled = true;
    this.sceneIndex = -1;
  }

  stop() {
    if (!this.context) return;
    this.clearSceneTimers();
    this.layers.forEach(({ source }) => {
      try { source.stop(); } catch { /* The layer has already stopped. */ }
    });
    this.layers = [];
    this.enabled = false;
    this.sceneIndex = -1;
  }

  setVolume(value: number) {
    if (this.master && this.context) this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.08);
  }

  setScene(index: number) {
    if (!this.context || !this.enabled || this.sceneIndex === index) return;
    this.sceneIndex = index;
    this.clearSceneTimers();
    const now = this.context.currentTime;
    const progression = Math.min(1, Math.max(0, index / 11));
    this.layers.forEach(({ gain, filter }, layerIndex) => {
      const base = [0.12, 0.026, 0.008][layerIndex] ?? 0.01;
      const rise = [0.045, 0.016, 0.005][layerIndex] ?? 0;
      const target = index === 11 ? base * 0.04 : base + progression * rise;
      gain.gain.setTargetAtTime(target, now, index === 11 ? 2.4 : 1.3);
      const cutoff = layerIndex === 0 ? 150 + progression * 90 : layerIndex === 1 ? 850 + progression * 460 : 1800 + progression * 900;
      filter.frequency.setTargetAtTime(cutoff, now, 1.8);
    });

    // Specific sounds are sparse, low in the mix, and remain optional in mute mode.
    const timing = new Map<number, [number, Cue[]]>([
      [1, [7200, ['whisper']]],
      [2, [5100, ['paper', 'knock']]],
      [4, [6400, ['bell']]],
      [6, [1700, ['footstep', 'footstep', 'footstep']]],
      [7, [7400, ['whisper']]],
      [8, [4600, ['paper', 'knock']]],
      [9, [2700, ['footstep', 'footstep']]],
      [10, [8200, ['knock', 'knock']]],
    ]);
    const sceneCue = timing.get(index);
    if (sceneCue) {
      const [delay, cues] = sceneCue;
      this.sceneTimers.push(window.setTimeout(() => {
        if (!this.enabled) return;
        cues.forEach((cue, cueIndex) => this.sceneTimers.push(window.setTimeout(() => this.cue(cue), cueIndex * 1050)));
      }, delay));
    }
  }

  cue(kind: Cue) {
    if (!this.enabled || !this.context || !this.master) return;
    const ctx = this.context;
    const now = ctx.currentTime;
    const settings: Record<Exclude<Cue, 'whisper'>, [number, BiquadFilterType, number, number]> = {
      knock: [74, 'lowpass', 520, 0.22],
      paper: [390, 'bandpass', 1550, 0.095],
      sting: [49, 'lowpass', 180, 0.32],
      footstep: [92, 'lowpass', 250, 0.16],
      bell: [294, 'bandpass', 780, 1.3],
    };

    if (kind === 'whisper') {
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const envelope = ctx.createGain();
      const pan = ctx.createStereoPanner();
      const duration = 1.8;
      source.buffer = this.noiseBuffer(duration, 0.6);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1300, now);
      filter.frequency.exponentialRampToValueAtTime(470, now + duration * 0.84);
      filter.Q.value = 1.8;
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.linearRampToValueAtTime(0.085, now + 0.4);
      envelope.gain.linearRampToValueAtTime(0.0001, now + duration);
      pan.pan.setValueAtTime(Math.random() > 0.5 ? -0.62 : 0.62, now);
      source.connect(filter).connect(envelope).connect(pan).connect(this.master);
      source.start(now);
      source.stop(now + duration + 0.04);
      return;
    }

    const [frequency, filterType, cutoff, duration] = settings[kind];
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = kind === 'paper' ? 'triangle' : kind === 'bell' ? 'sine' : 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    if (kind === 'sting') osc.frequency.exponentialRampToValueAtTime(30, now + duration);
    if (kind === 'bell') osc.frequency.exponentialRampToValueAtTime(frequency * 0.63, now + duration);
    filter.type = filterType;
    filter.frequency.value = cutoff;
    filter.Q.value = kind === 'bell' ? 4 : 0.7;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'sting' ? 0.12 : kind === 'bell' ? 0.055 : 0.065, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(filter).connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.04);
  }

  private makeNoise(cutoff: number, volume: number, type: BiquadFilterType): Layer {
    const ctx = this.context!;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = this.noiseBuffer(6, 0.24);
    source.loop = true;
    filter.type = type;
    filter.frequency.value = cutoff;
    if (type === 'bandpass') filter.Q.value = 0.5;
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(this.master!);
    source.start();
    return { source, gain, filter };
  }

  private noiseBuffer(seconds: number, amount: number) {
    const ctx = this.context!;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * amount;
    return buffer;
  }

  private clearSceneTimers() {
    this.sceneTimers.forEach((timer) => window.clearTimeout(timer));
    this.sceneTimers = [];
  }
}
