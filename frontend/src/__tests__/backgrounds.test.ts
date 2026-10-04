import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BACKGROUND_NAMES, BACKGROUNDS, findBackground } from '../backgrounds';

const dir = path.join(import.meta.dirname, '..', '..', 'public', 'backgrounds');

describe('background catalog', () => {
  it('has an AVIF and a WebP for every background, and no stray images', () => {
    const files = fs.readdirSync(dir).filter((file) => /\.(avif|webp)$/.test(file));
    const expected = BACKGROUND_NAMES.flatMap((name) => [`${name}.avif`, `${name}.webp`]);
    expect(files.sort()).toEqual(expected.sort());
  });

  it('credits every still with a film, director and year', () => {
    for (const name of BACKGROUND_NAMES) {
      const { film, director, year } = BACKGROUNDS[name];
      expect(film).not.toBe('');
      expect(director).not.toBe('');
      expect(year).toBeGreaterThan(1890);
    }
  });

  it('only accepts known names', () => {
    expect(findBackground('stalker')).toBe('stalker');
    expect(findBackground('spirit-of-the-beehive')).toBeUndefined();
    expect(findBackground(undefined)).toBeUndefined();
  });
});
