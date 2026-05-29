/* eslint-disable @typescript-eslint/ban-ts-comment */

import path from 'path';
import {
  bibToCSL,
  getCSLLocale,
  getCSLStyle,
  // getZBib,
  getZUserGroups,
  isZoteroRunning,
  zoteroItemToCSL,
} from '../helpers';
import { SimpleLRU } from '../lru';

// @ts-ignore
import testCSL from './test.json';
// @ts-ignore
import testBIBCSL from './test.bib.json';
// @ts-ignore
import testBIB2CSL from './test2.bib.json';
// @ts-ignore
import testYAMLCSL from './test.yaml.json';
// @ts-ignore
// import library from './My Library.json';
import { existsSync, rmSync } from 'fs';

describe('bibToCSL()', () => {
  it('returns json from json', async () => {
    expect(
      await bibToCSL(
        path.join(__dirname, 'test.json'),
        '/opt/homebrew/bin/pandoc'
      )
    ).toEqual(testCSL);
  });

  it('returns json from bib', async () => {
    expect(
      await bibToCSL(
        path.join(__dirname, 'test.bib'),
        '/opt/homebrew/bin/pandoc'
      )
    ).toEqual(testBIBCSL);
  });

  it('returns json from bib2', async () => {
    expect(
      await bibToCSL(
        path.join(__dirname, 'test2.bib'),
        '/opt/homebrew/bin/pandoc'
      )
    ).toEqual(testBIB2CSL);
  });

  it('returns json from yaml', async () => {
    expect(
      await bibToCSL(
        path.join(__dirname, 'test.yaml'),
        '/opt/homebrew/bin/pandoc'
      )
    ).toEqual(testYAMLCSL);
  });
});

// @ts-ignore
global.setImmediate =
  // @ts-ignore
  global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));

describe('getLocale()', () => {
  it('fetches a locale', async () => {
    const cache = new Map<string, string>();
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(true);
    const locale = await getCSLLocale(cache, __dirname, 'bg-BG');
    expect(typeof locale).toBe('string');
    expect(existsSync(path.join(__dirname, 'locales-bg-BG.xml'))).toBe(true);
    await getCSLLocale(cache, __dirname, 'bg-BG');
    rmSync(path.join(__dirname, 'locales-bg-BG.xml'));
  });
});

describe('getStyle()', () => {
  it('fetches a style', async () => {
    const cache = new Map<string, string>();
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(true);
    const style = await getCSLStyle(
      cache,
      __dirname,
      'https://www.zotero.org/styles/australian-guide-to-legal-citation-3rd-edition'
    );
    expect(typeof style).toBe('string');
    expect(
      existsSync(
        path.join(__dirname, 'australian-guide-to-legal-citation-3rd-edition')
      )
    ).toBe(true);
    await getCSLStyle(
      cache,
      __dirname,
      'australian-guide-to-legal-citation-3rd-edition'
    );
    rmSync(
      path.join(__dirname, 'australian-guide-to-legal-citation-3rd-edition')
    );
  });
});

describe('getZUserGroups()', () => {
  it('retrieves user groups', async () => {
    expect(await getZUserGroups('23119')).toEqual([
      { id: 1, name: 'My Library' },
      { id: 2, name: 'test' },
    ]);
  });
});

// describe('getZBib()', () => {
//   it('retrieves bib', async () => {
//     expect(await getZBib(new Map(), '23119', 1, 'My Library')).toEqual(library);
//   });
// });

describe('isZoteroRunning()', () => {
  it('runs', async () => {
    expect(await isZoteroRunning('23119')).toBe(true);
  });
});

// ─── SimpleLRU ────────────────────────────────────────────────────────────────

describe('SimpleLRU', () => {
  it('stores and retrieves values', () => {
    const lru = new SimpleLRU<string, number>({ max: 3 });
    lru.set('a', 1);
    lru.set('b', 2);
    expect(lru.has('a')).toBe(true);
    expect(lru.get('a')).toBe(1);
    expect(lru.has('z')).toBe(false);
    expect(lru.get('z')).toBeUndefined();
  });

  it('evicts the least-recently-used entry when over max', () => {
    const evicted: string[] = [];
    const lru = new SimpleLRU<string, string>({
      max: 2,
      dispose: (v) => evicted.push(v),
    });

    lru.set('a', 'A');
    lru.set('b', 'B');
    // access 'a' to make 'b' the oldest
    lru.get('a');
    lru.set('c', 'C'); // 'b' is oldest — should be evicted
    expect(lru.has('b')).toBe(false);
    expect(lru.has('a')).toBe(true);
    expect(lru.has('c')).toBe(true);
    expect(evicted).toEqual(['B']);
  });

  it('does not call dispose when overwriting an existing key', () => {
    const evicted: string[] = [];
    const lru = new SimpleLRU<string, string>({
      max: 2,
      dispose: (v) => evicted.push(v),
    });

    lru.set('a', 'A');
    lru.set('a', 'A2'); // overwrite
    expect(lru.get('a')).toBe('A2');
    expect(evicted).toEqual([]);
  });

  it('delete removes the entry', () => {
    const lru = new SimpleLRU<string, number>({ max: 5 });
    lru.set('x', 99);
    lru.delete('x');
    expect(lru.has('x')).toBe(false);
  });

  it('clear empties the cache', () => {
    const lru = new SimpleLRU<string, number>({ max: 5 });
    lru.set('a', 1);
    lru.set('b', 2);
    lru.clear();
    expect(lru.has('a')).toBe(false);
    expect(lru.has('b')).toBe(false);
  });
});

// ─── zoteroItemToCSL ─────────────────────────────────────────────────────────

describe('zoteroItemToCSL()', () => {
  const baseItem = (overrides: Record<string, any> = {}) => ({
    data: {
      citationKey: 'smith2020',
      itemType: 'journalArticle',
      title: 'A Test Article',
      creators: [{ creatorType: 'author', firstName: 'Jane', lastName: 'Smith' }],
      date: '2020-06-15',
      publicationTitle: 'Journal of Testing',
      volume: '12',
      issue: '3',
      pages: '100-110',
      DOI: '10.1234/test',
      ...overrides,
    },
  });

  it('returns null when citationKey is missing', () => {
    expect(zoteroItemToCSL({ data: { itemType: 'book' } }, 1)).toBeNull();
  });

  it('maps a journal article correctly', () => {
    const result = zoteroItemToCSL(baseItem(), 1);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('smith2020');
    expect(result!.type).toBe('article-journal');
    expect((result as any).title).toBe('A Test Article');
    expect((result as any)['container-title']).toBe('Journal of Testing');
    expect((result as any).DOI).toBe('10.1234/test');
    expect((result as any).author).toEqual([{ family: 'Smith', given: 'Jane' }]);
  });

  it('sets groupID on every entry', () => {
    const result = zoteroItemToCSL(baseItem(), 42);
    expect((result as any).groupID).toBe(42);
  });

  it('parses full date (YYYY-MM-DD)', () => {
    const result = zoteroItemToCSL(baseItem(), 1);
    expect((result as any).issued).toEqual({ 'date-parts': [[2020, 6, 15]] });
  });

  it('falls back to document type for unknown itemType', () => {
    const result = zoteroItemToCSL(baseItem({ itemType: 'unknownType' }), 1);
    expect(result!.type).toBe('document');
  });

  it('maps editor creator type', () => {
    const item = baseItem({
      creators: [
        { creatorType: 'editor', firstName: 'Bob', lastName: 'Jones' },
      ],
    });
    const result = zoteroItemToCSL(item, 1);
    expect((result as any).editor).toEqual([{ family: 'Jones', given: 'Bob' }]);
    expect((result as any).author).toBeUndefined();
  });

  it('handles institutional authors (literal name)', () => {
    const item = baseItem({
      creators: [{ creatorType: 'author', name: 'ACME Corp' }],
    });
    const result = zoteroItemToCSL(item, 1);
    expect((result as any).author).toEqual([{ literal: 'ACME Corp' }]);
  });
});
