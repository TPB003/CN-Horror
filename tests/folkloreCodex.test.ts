import { describe, expect, it } from 'vitest';
import { FOLKLORE_CODEX } from '../src/data/folkloreCodex';

describe('folklore codex data integrity', () => {
  it('contains the 36 main ledger entries (rejected entries stay out)', () => {
    expect(FOLKLORE_CODEX).toHaveLength(36);
    expect(FOLKLORE_CODEX.some((e) => e.id.startsWith('X'))).toBe(false);
  });

  it('every entry has category, status, source and a boundary line', () => {
    for (const e of FOLKLORE_CODEX) {
      expect(['doc', 'oral', 'fiction'], e.id).toContain(e.category);
      expect(['verified', 'pending'], e.id).toContain(e.status);
      expect(e.name.trim().length, e.id).toBeGreaterThan(0);
      expect(e.source.trim().length, e.id).toBeGreaterThan(0);
      expect(e.boundary.trim().length, e.id).toBeGreaterThan(0);
      expect(typeof e.citable, e.id).toBe('boolean');
    }
  });

  it('only verified non-fiction entries are marked citable', () => {
    for (const e of FOLKLORE_CODEX) {
      if (e.citable) {
        expect(e.status, e.id).toBe('verified');
        expect(e.category, e.id).not.toBe('fiction');
      }
    }
  });

  it('category mix matches the research ledger (20 doc / 11 oral / 5 fiction)', () => {
    const cats = FOLKLORE_CODEX.map((e) => e.category);
    expect(cats.filter((c) => c === 'doc')).toHaveLength(20);
    expect(cats.filter((c) => c === 'oral')).toHaveLength(11);
    expect(cats.filter((c) => c === 'fiction')).toHaveLength(5);
  });
});
