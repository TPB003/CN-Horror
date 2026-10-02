import { useMemo, type ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';

// Slow ink-like ease: no bounce, no playfulness. transform/opacity only.
const INK_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: {},
  show: (stagger: number) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.15 },
  }),
};

const glyphVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.15, ease: INK_EASE },
  },
};

/** Per-character staggered ink reveal. Screen readers hear the text once via aria-label. */
export function InkChars({ text, charDelay = 0.085, className }: {
  text: string;
  charDelay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const chars = useMemo(() => Array.from(text), [text]);
  if (reduce) return <span className={className}>{text}</span>;
  return (
    <motion.span
      className={className}
      variants={containerVariants}
      custom={charDelay}
      initial="hidden"
      animate="show"
      aria-hidden="true"
    >
      {chars.map((ch, index) => (
        <motion.span key={index} className="ink-char" variants={glyphVariants}>
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </motion.span>
  );
}

/** Slow opacity-only entrance for vertical text, subtitles and captions. */
export function InkFade({ children, delay = 0.35, duration = 1.4, className }: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{children}</span>;
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay, ease: INK_EASE }}
    >
      {children}
    </motion.span>
  );
}

/** Chapter/section title with staggered ink reveal. */
export function InkTitle({ id, text, className }: {
  id?: string;
  text: string;
  className?: string;
}) {
  return (
    <h1 id={id} className={className} aria-label={text}>
      <InkChars text={text} />
    </h1>
  );
}

/** Full-screen transition variants: fade with a faint lift, like walking with a lamp. */
export const screenVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: INK_EASE },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.55, ease: INK_EASE },
  },
};
