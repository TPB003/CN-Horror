import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { StoryRuntime } from '../src/storyRuntime';

const storyText = readFileSync(new URL('../public/story/story.json', import.meta.url), 'utf8');
const index = JSON.parse(readFileSync(new URL('../public/story/chapters.json', import.meta.url), 'utf8')) as {
  startKnot: string;
  chapters: Array<{ id: string; knot: string; prose: string[]; sourceIds: string[]; sources: unknown[] }>;
  endings: Array<{ id: string; knot: string }>;
};

describe('Ink story runtime and exported index', () => {
  it('contains twelve sourced stations and two endings', () => {
    expect(index.chapters).toHaveLength(12);
    expect(index.endings).toHaveLength(2);
    for (const chapter of index.chapters) {
      expect(chapter.prose.length, chapter.id).toBeGreaterThan(0);
      expect(chapter.sourceIds.length, chapter.id).toBeGreaterThan(0);
      expect(chapter.sources.length, chapter.id).toBe(chapter.sourceIds.length);
    }
  });

  it('loads the canonical first station and exposes its Ink action', () => {
    const runtime = new StoryRuntime(storyText);
    const text = runtime.readKnot(index.startKnot);
    expect(text.join('\n')).toMatch(/连云老街|沈归/);
    expect(runtime.choices().length).toBeGreaterThan(0);
  });
});
