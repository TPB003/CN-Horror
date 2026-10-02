type Layer = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
};

type Cue = 'knock' | 'paper' | 'sting' | 'footstep' | 'whisper' | 'bell';

/** [gain, filter cutoff] targets for the three permanent noise layers. */
type SceneAmbience = {
  wind: [number, number];
  rain: [number, number];
  hiss: [number, number];
};

/**
 * Per-station base ambience. The same three noise loops run all night; each
 * station only retargets their gain/cutoff, so switching chapters crossfades
 * instead of stacking a second loop.
 */
const SCENE_AMBIENCE: SceneAmbience[] = [
  { wind: [0.115, 190], rain: [0.030, 1150], hiss: [0.008, 2600] }, // 01 街口: street wind, steady rain
  { wind: [0.085, 165], rain: [0.020, 1000], hiss: [0.006, 2300] }, // 02 书摊: rain dulled by the awning
  { wind: [0.070, 150], rain: [0.014, 900], hiss: [0.009, 3000] }, // 03 课桌: near silence, room hiss
  { wind: [0.060, 140], rain: [0.010, 780], hiss: [0.005, 2100] }, // 04 账房: muffled indoor rain
  { wind: [0.140, 230], rain: [0.038, 1300], hiss: [0.009, 2600] }, // 05 送行: open street, strongest rain
  { wind: [0.055, 135], rain: [0.009, 760], hiss: [0.006, 2400] }, // 06 纸扎铺: still indoor air
  { wind: [0.150, 300], rain: [0.026, 1200], hiss: [0.010, 2700] }, // 07 石巷: wind whistling in the alley
  { wind: [0.065, 150], rain: [0.012, 850], hiss: [0.008, 2900] }, // 08 戏台: hollow hall tone
  { wind: [0.050, 130], rain: [0.008, 720], hiss: [0.011, 3200] }, // 09 影像: television static edge
  { wind: [0.120, 200], rain: [0.016, 950], hiss: [0.007, 2400] }, // 10 回环: fog wind on wet stone
  { wind: [0.055, 140], rain: [0.010, 800], hiss: [0.005, 2200] }, // 11 旅社: quiet corridor
  { wind: [0.006, 160], rain: [0.002, 900], hiss: [0.001, 2000] }, // 12 点灯: almost nothing, room to breathe
];

type Motif = {
  /** Seconds before the first possible motif event after entering a station. */
  first: [number, number];
  /** Seconds between motif events. */
  every: [number, number];
  /** Probability that a scheduled tick actually sounds; keeps the night sparse. */
  chance?: number;
  /** Stop scheduling after this many played events (melodic motifs only). */
  maxPlays?: number;
  play: (pass: number) => void;
};

/**
 * Original browser-synthesized ambience: no game or film recording is embedded.
 * Every station motif is synthesized live — reed, voice, abacus, clapper and
 * music box are oscillator/filter constructions, never sampled performances.
 */
export class Soundscape {
  private context?: AudioContext;
  private master?: GainNode;
  private layers: Layer[] = [];
  private windLfo?: OscillatorNode;
  private burstBuffer?: AudioBuffer;
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
    // Slow breathing on the wind layer so the base never feels looped.
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 0.022;
    lfo.connect(lfoGain).connect(this.layers[0].gain.gain);
    lfo.start();
    this.windLfo = lfo;
    this.enabled = true;
    this.sceneIndex = -1;
  }

  stop() {
    if (!this.context) return;
    this.clearSceneTimers();
    try { this.windLfo?.stop(); } catch { /* The LFO has already stopped. */ }
    this.windLfo = undefined;
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
    const ambience = SCENE_AMBIENCE[index] ?? SCENE_AMBIENCE[0];
    const targets = [ambience.wind, ambience.rain, ambience.hiss];
    const tau = index === 11 ? 2.8 : 2.0;
    this.layers.forEach(({ gain, filter }, layerIndex) => {
      const [targetGain, cutoff] = targets[layerIndex] ?? [0.01, 1000];
      gain.gain.setTargetAtTime(targetGain, now, tau);
      filter.frequency.setTargetAtTime(cutoff, now, tau + 0.3);
    });
    this.startMotifs(index);
  }

  cue(kind: Cue) {
    if (!this.enabled || !this.context || !this.master) return;
    const now = this.context.currentTime;
    switch (kind) {
      case 'knock':
        this.woodKnock(now, { freq: 620, peak: 0.075, decay: 0.2 });
        break;
      case 'paper':
        this.paperSwish(now, 0.14, true);
        break;
      case 'footstep':
        this.footstep(now);
        break;
      case 'whisper':
        this.whisper(now);
        break;
      case 'sting':
        this.sting(now);
        break;
      case 'bell':
        this.bell(now);
        break;
    }
  }

  // ------------------------------------------------------------------ motifs

  private startMotifs(index: number) {
    const motifs: Motif[] = [];
    const add = (motif: Motif) => motifs.push(motif);
    switch (index) {
      case 1: // 02 书摊 — pages turning themselves, sparse
        add({ first: [9, 15], every: [13, 24], play: () => this.paperSwish(this.now(), 0.026) });
        break;
      case 3: // 04 账房 — abacus beads, paper, old beams settling
        add({ first: [11, 18], every: [17, 30], chance: 0.85, play: () => this.abacusCluster(this.now()) });
        add({ first: [14, 22], every: [15, 26], play: () => this.paperSwish(this.now(), 0.024) });
        add({ first: [24, 40], every: [28, 48], chance: 0.7, play: () => this.woodCreak(this.now()) });
        break;
      case 4: // 05 送行 — a distant suona fragment, joyful timbre held down by distance
        add({ first: [13, 19], every: [34, 58], chance: 0.75, maxPlays: 3, play: () => this.suonaPhrase(this.now()) });
        break;
      case 5: // 06 纸扎铺 — only the house settling, very rarely
        add({ first: [20, 34], every: [26, 46], chance: 0.7, play: () => this.woodCreak(this.now()) });
        break;
      case 6: // 07 追逐 — the night watchman's clapper, slow enough to count by
        add({ first: [8, 14], every: [16, 28], play: () => this.clapperPattern(this.now()) });
        break;
      case 7: // 08 戏台 — an unfinished lahunqiang contour, voice-shaped, wordless
        add({ first: [12, 18], every: [36, 60], chance: 0.8, play: () => this.lahunGlide(this.now()) });
        break;
      case 8: // 09 影像 — a music-box lullaby that drifts further off pitch each pass
        add({ first: [10, 16], every: [26, 42], maxPlays: 5, play: (pass) => this.musicBoxPass(this.now(), pass) });
        break;
      case 9: // 10 回环 — water dripping somewhere in the fog
        add({ first: [6, 11], every: [6, 14], play: () => this.drip(this.now()) });
        break;
      case 10: // 11 旅社 — the register being counted again, bead by bead
        add({ first: [12, 20], every: [18, 32], chance: 0.85, play: () => this.abacusCluster(this.now()) });
        break;
      default:
        break;
    }
    motifs.forEach((motif) => {
      let plays = 0;
      const tick = () => {
        if (!this.enabled || this.sceneIndex !== index) return;
        if (motif.maxPlays !== undefined && plays >= motif.maxPlays) return;
        if (Math.random() <= (motif.chance ?? 1)) {
          motif.play(plays);
          plays += 1;
          if (motif.maxPlays !== undefined && plays >= motif.maxPlays) return;
        }
        this.sceneTimers.push(window.setTimeout(tick, this.rand(motif.every[0], motif.every[1]) * 1000));
      };
      this.sceneTimers.push(window.setTimeout(tick, this.rand(motif.first[0], motif.first[1]) * 1000));
    });
  }

  /** A short reed phrase heard from far down the street; bright, but grieving. */
  private suonaPhrase(at: number) {
    const ctx = this.context!;
    const out = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1750;
    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.value = 1150;
    formant.Q.value = 0.7;
    const pan = ctx.createStereoPanner();
    pan.pan.value = -0.15;
    out.gain.value = 0.021;
    out.connect(lowpass).connect(formant).connect(pan).connect(this.master!);

    // A five-note fragment that sinks at the end instead of resolving upward.
    const notes: Array<[number, number]> = [
      [880.0, 0.22], [783.99, 0.22], [659.25, 0.3], [587.33, 1.05], [659.25, 0.55],
    ];
    let cursor = at + 0.05;
    notes.forEach(([freq, dur], noteIndex) => {
      const isLast = noteIndex === notes.length - 1;
      [-6, 5].forEach((cents) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, cursor);
        if (isLast) osc.frequency.exponentialRampToValueAtTime(freq * 0.972, cursor + dur);
        osc.detune.value = cents;
        const vibrato = ctx.createOscillator();
        vibrato.frequency.value = 5.4;
        const vibratoGain = ctx.createGain();
        vibratoGain.gain.setValueAtTime(0, cursor);
        vibratoGain.gain.linearRampToValueAtTime(freq * 0.004, cursor + Math.min(0.3, dur));
        vibrato.connect(vibratoGain).connect(osc.frequency);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, cursor);
        env.gain.exponentialRampToValueAtTime(0.5, cursor + 0.055);
        env.gain.setValueAtTime(0.5, cursor + Math.max(0.055, dur - 0.09));
        env.gain.exponentialRampToValueAtTime(0.0001, cursor + dur);
        osc.connect(env).connect(out);
        osc.start(cursor);
        vibrato.start(cursor);
        osc.stop(cursor + dur + 0.03);
        vibrato.stop(cursor + dur + 0.03);
      });
      cursor += dur + 0.035;
    });
  }

  /** Wordless vocal contour: a slow falling glide through two vowel formants. */
  private lahunGlide(at: number) {
    const ctx = this.context!;
    const dur = 3.8;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, at);
    out.gain.exponentialRampToValueAtTime(0.02, at + 1.0);
    out.gain.setValueAtTime(0.02, at + dur - 1.3);
    out.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    const pan = ctx.createStereoPanner();
    pan.pan.value = 0.1;
    out.connect(pan).connect(this.master!);

    const fundamental = ctx.createOscillator();
    fundamental.type = 'sawtooth';
    fundamental.frequency.setValueAtTime(659.25, at);
    fundamental.frequency.exponentialRampToValueAtTime(554.37, at + dur * 0.62);
    fundamental.frequency.setValueAtTime(554.37, at + dur);
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 4.2;
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.setValueAtTime(0, at);
    vibratoGain.gain.linearRampToValueAtTime(5.5, at + dur * 0.55);
    vibrato.connect(vibratoGain).connect(fundamental.frequency);

    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(659.25, at);
    body.frequency.exponentialRampToValueAtTime(554.37, at + dur * 0.62);
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.5;

    const formantA = ctx.createBiquadFilter();
    formantA.type = 'bandpass';
    formantA.Q.value = 2.4;
    formantA.frequency.setValueAtTime(920, at);
    formantA.frequency.exponentialRampToValueAtTime(680, at + dur * 0.8);
    const formantB = ctx.createBiquadFilter();
    formantB.type = 'bandpass';
    formantB.Q.value = 3.2;
    formantB.frequency.setValueAtTime(2150, at);
    formantB.frequency.exponentialRampToValueAtTime(1550, at + dur * 0.8);
    const formantGainB = ctx.createGain();
    formantGainB.gain.value = 0.4;

    fundamental.connect(formantA).connect(out);
    fundamental.connect(formantB).connect(formantGainB).connect(out);
    body.connect(bodyGain).connect(out);
    fundamental.start(at);
    body.start(at);
    vibrato.start(at);
    fundamental.stop(at + dur + 0.05);
    body.stop(at + dur + 0.05);
    vibrato.stop(at + dur + 0.05);
  }

  /** A cluster of wooden abacus beads, sometimes ending in a quick slide. */
  private abacusCluster(at: number) {
    const count = 3 + Math.floor(Math.random() * 4);
    let cursor = at;
    for (let i = 0; i < count; i += 1) {
      this.beadClick(cursor);
      cursor += this.rand(0.055, 0.1);
    }
    if (Math.random() < 0.25) {
      cursor += 0.09;
      for (let i = 0; i < 6; i += 1) {
        this.beadClick(cursor, 2900 - i * 160);
        cursor += 0.028;
      }
    }
  }

  private beadClick(at: number, bandFreq = 2900) {
    const ctx = this.context!;
    const noise = ctx.createBufferSource();
    noise.buffer = this.burst();
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = bandFreq;
    band.Q.value = 5;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.03, at);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
    noise.connect(band).connect(env).connect(this.master!);
    noise.start(at);
    noise.stop(at + 0.05);
    this.woodKnock(at, { freq: 1150, peak: 0.011, decay: 0.05 });
  }

  /** Watchman's clapper: steady groups, sometimes closing in like a countdown. */
  private clapperPattern(at: number) {
    const closing = Math.random() < 0.4;
    const gaps = closing ? [0, 0.92, 0.78, 0.62] : [0, 0.58, 0.42];
    let cursor = at;
    gaps.forEach((gap, i) => {
      cursor += gap;
      this.woodKnock(cursor, {
        freq: i === gaps.length - 1 ? 610 : 690,
        peak: 0.048,
        decay: 0.19,
      });
    });
  }

  /** Filtered-noise page turn. Motif versions whisper under the mix; user-triggered
   *  cues sit slightly forward and may add a softer settling flip. */
  private paperSwish(at: number, peak = 0.05, settle = false) {
    const ctx = this.context!;
    const dur = 0.55;
    const noise = ctx.createBufferSource();
    noise.buffer = this.burst();
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 1.1;
    band.frequency.setValueAtTime(680, at);
    band.frequency.exponentialRampToValueAtTime(1750, at + dur * 0.6);
    band.frequency.exponentialRampToValueAtTime(950, at + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(peak, at + 0.1);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    noise.connect(band).connect(env).connect(this.master!);
    noise.start(at);
    noise.stop(at + dur + 0.05);
    if (settle && Math.random() < 0.5) {
      // A second, softer flip follows the first, like a page settling.
      const second = ctx.createBufferSource();
      second.buffer = this.burst();
      second.loop = true;
      const band2 = ctx.createBiquadFilter();
      band2.type = 'bandpass';
      band2.Q.value = 1.1;
      band2.frequency.setValueAtTime(900, at + dur * 0.8);
      band2.frequency.exponentialRampToValueAtTime(620, at + dur * 1.3);
      const env2 = ctx.createGain();
      env2.gain.setValueAtTime(0.0001, at + dur * 0.8);
      env2.gain.exponentialRampToValueAtTime(peak * 0.6, at + dur * 0.9);
      env2.gain.exponentialRampToValueAtTime(0.0001, at + dur * 1.3);
      second.connect(band2).connect(env2).connect(this.master!);
      second.start(at + dur * 0.8);
      second.stop(at + dur * 1.35);
    }
  }

  /** Music-box lullaby; each pass is dragged and tuned a little further wrong. */
  private musicBoxPass(at: number, pass: number) {
    // An original eight-note contour; nothing here quotes an existing tune.
    const melody = [440.0, 523.25, 659.25, 523.25, 587.33, 523.25, 440.0, 329.63];
    const detuneSteps = [0, 12, -20, 30, -38];
    const detune = detuneSteps[Math.min(pass, detuneSteps.length - 1)];
    const interval = 0.46 * (1 + Math.min(pass, 4) * 0.045);
    melody.forEach((freq, i) => {
      const noteAt = at + i * interval;
      const dur = i === melody.length - 1 ? 1.9 : 1.3;
      this.musicBoxNote(noteAt, freq, detune + this.rand(-4, 4), dur);
    });
  }

  private musicBoxNote(at: number, freq: number, detuneCents: number, dur: number) {
    const ctx = this.context!;
    const out = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3800;
    out.connect(lowpass).connect(this.master!);
    const partials: Array<[number, number]> = [[1, 0.032], [2, 0.008], [3.98, 0.016]];
    partials.forEach(([ratio, peak]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * ratio;
      osc.detune.value = detuneCents;
      const env = ctx.createGain();
      env.gain.setValueAtTime(peak, at);
      env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(env).connect(out);
      osc.start(at);
      osc.stop(at + dur + 0.03);
    });
  }

  private drip(at: number) {
    const ctx = this.context!;
    const drop = (when: number, panValue: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1350, when);
      osc.frequency.exponentialRampToValueAtTime(880, when + 0.06);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.016, when);
      env.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
      const pan = ctx.createStereoPanner();
      pan.pan.value = panValue;
      osc.connect(env).connect(pan).connect(this.master!);
      osc.start(when);
      osc.stop(when + 0.26);
    };
    drop(at, this.rand(-0.5, 0.5));
    if (Math.random() < 0.3) drop(at + this.rand(0.5, 0.9), this.rand(-0.5, 0.5));
  }

  /** Old timber complaining softly; slow pitch sag through a low filter. */
  private woodCreak(at: number) {
    const ctx = this.context!;
    const dur = 0.85;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(138, at);
    osc.frequency.exponentialRampToValueAtTime(94, at + dur * 0.55);
    osc.frequency.exponentialRampToValueAtTime(118, at + dur);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(0.02, at + dur * 0.4);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(filter).connect(env).connect(this.master!);
    osc.start(at);
    osc.stop(at + dur + 0.04);
  }

  // --------------------------------------------------------------------- cues

  /** Hollow wooden knock shared by the clapper, abacus body and door cues. */
  private woodKnock(at: number, opts: { freq: number; peak: number; decay: number }) {
    const ctx = this.context!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(opts.freq * 1.7, at);
    osc.frequency.exponentialRampToValueAtTime(opts.freq, at + 0.014);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = opts.freq * 1.35;
    band.Q.value = 1.1;
    const env = ctx.createGain();
    env.gain.setValueAtTime(opts.peak, at);
    env.gain.exponentialRampToValueAtTime(0.0001, at + opts.decay);
    osc.connect(band).connect(env).connect(this.master!);
    osc.start(at);
    osc.stop(at + opts.decay + 0.04);
    const click = ctx.createBufferSource();
    click.buffer = this.burst();
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 2400;
    const clickEnv = ctx.createGain();
    clickEnv.gain.setValueAtTime(opts.peak * 0.35, at);
    clickEnv.gain.exponentialRampToValueAtTime(0.0001, at + 0.018);
    click.connect(highpass).connect(clickEnv).connect(this.master!);
    click.start(at);
    click.stop(at + 0.03);
  }

  private footstep(at: number) {
    const ctx = this.context!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(68, at);
    osc.frequency.exponentialRampToValueAtTime(42, at + 0.13);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.06, at);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.15);
    osc.connect(env).connect(this.master!);
    osc.start(at);
    osc.stop(at + 0.19);
    const noise = ctx.createBufferSource();
    noise.buffer = this.burst();
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 210;
    const noiseEnv = ctx.createGain();
    noiseEnv.gain.setValueAtTime(0.02, at);
    noiseEnv.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
    noise.connect(lowpass).connect(noiseEnv).connect(this.master!);
    noise.start(at);
    noise.stop(at + 0.09);
  }

  private whisper(at: number) {
    const ctx = this.context!;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const envelope = ctx.createGain();
    const pan = ctx.createStereoPanner();
    const duration = 1.8;
    source.buffer = this.noiseBuffer(duration, 0.6);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1300, at);
    filter.frequency.exponentialRampToValueAtTime(470, at + duration * 0.84);
    filter.Q.value = 1.8;
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.linearRampToValueAtTime(0.085, at + 0.4);
    envelope.gain.linearRampToValueAtTime(0.0001, at + duration);
    pan.pan.setValueAtTime(Math.random() > 0.5 ? -0.62 : 0.62, at);
    source.connect(filter).connect(envelope).connect(pan).connect(this.master!);
    source.start(at);
    source.stop(at + duration + 0.04);
  }

  private sting(at: number) {
    const ctx = this.context!;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(49, at);
    osc.frequency.exponentialRampToValueAtTime(30, at + 0.32);
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.12, at + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.32);
    osc.connect(filter).connect(gain).connect(this.master!);
    osc.start(at);
    osc.stop(at + 0.36);
  }

  private bell(at: number) {
    const ctx = this.context!;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(294, at);
    osc.frequency.exponentialRampToValueAtTime(294 * 0.63, at + 1.3);
    filter.type = 'bandpass';
    filter.frequency.value = 780;
    filter.Q.value = 4;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.055, at + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.3);
    osc.connect(filter).connect(gain).connect(this.master!);
    osc.start(at);
    osc.stop(at + 1.34);
  }

  // ------------------------------------------------------------------ helpers

  private now() {
    return this.context ? this.context.currentTime : 0;
  }

  private rand(min: number, max: number) {
    return min + Math.random() * (max - min);
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

  /** Shared short noise buffer for clicks, swishes and bead strikes. */
  private burst() {
    if (!this.burstBuffer) this.burstBuffer = this.noiseBuffer(1.5, 0.5);
    return this.burstBuffer;
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

