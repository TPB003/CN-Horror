import { useMemo, useSyncExternalStore } from 'react';
import { useReducedMotion } from 'motion/react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import type { ParticlesPluginRegistrar } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';

// Site palette (mirrors styles.css variables): bone/fog ash greys with a rare
// cinnabar fleck (1 in 5 colours, each particle picks one at random).
const ASH_COLOURS = ['#ddd6c6', '#c4bda9', '#a29c8a', '#8b8574', '#a64035'];
const RAIN_COLOUR = '#9fb2b5';

const NARROW_QUERY = '(max-width: 768px)';

function subscribeNarrow(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function useNarrowViewport() {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}

// ParticlesProvider requires a stable init callback for the app lifecycle.
const initEngine: ParticlesPluginRegistrar = async (engine) => {
  await loadSlim(engine);
};

function ashOptions(narrow: boolean): ISourceOptions {
  return {
    fullScreen: { enable: false },
    fpsLimit: 60,
    detectRetina: true,
    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: narrow ? 16 : 38 },
      color: { value: ASH_COLOURS },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.06, max: 0.32 },
        animation: { enable: true, speed: 0.35, sync: false },
      },
      size: { value: { min: 0.5, max: 2.3 } },
      move: {
        enable: true,
        speed: { min: 0.12, max: 0.45 },
        direction: 'none',
        angle: { value: 268, offset: 24 },
        random: true,
        straight: false,
        outModes: { default: 'out' },
      },
      life: {
        duration: { value: { min: 6, max: 13 }, sync: false },
        count: 0, // 0 = respawn forever, so the ash never fully settles
      },
    },
  };
}

function rainOptions(narrow: boolean): ISourceOptions {
  return {
    fullScreen: { enable: false },
    fpsLimit: 60,
    detectRetina: true,
    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: narrow ? 7 : 15 },
      color: { value: RAIN_COLOUR },
      shape: { type: 'line' },
      opacity: { value: { min: 0.04, max: 0.11 } },
      size: { value: { min: 4, max: 9 } },
      move: {
        enable: true,
        speed: { min: 5, max: 8 },
        direction: 'none',
        angle: { value: 97, offset: 3 },
        straight: true,
        outModes: { default: 'out' },
      },
    },
  };
}

/**
 * Full-site atmosphere layer: slow paper-ash motes drifting up and dissolving,
 * with an extremely faint slanted drizzle beneath them. Sits between the scene
 * backdrop and the story copy; purely decorative (aria-hidden, no hit area).
 * Renders nothing at all when the user prefers reduced motion.
 */
export default function AtmosphereParticles() {
  const reducedMotion = useReducedMotion();
  const narrow = useNarrowViewport();
  const ash = useMemo(() => ashOptions(narrow), [narrow]);
  const rain = useMemo(() => rainOptions(narrow), [narrow]);

  if (reducedMotion) return null;

  return (
    <div className="atmosphere-layer" aria-hidden="true">
      <ParticlesProvider init={initEngine}>
        <Particles id="atmosphere-ash" className="atmosphere-canvas" options={ash} />
        <Particles id="atmosphere-rain" className="atmosphere-canvas" options={rain} />
      </ParticlesProvider>
    </div>
  );
}
