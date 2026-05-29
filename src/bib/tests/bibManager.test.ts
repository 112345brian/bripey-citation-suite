/* eslint-disable @typescript-eslint/ban-ts-comment */

// bibToCSL, getCSLLocale, getCSLStyle, getZUserGroups, and isZoteroRunning all
// require a live Obsidian runtime (vault.adapter / requestUrl) or a live Zotero
// instance. They are not exercised in the Jest suite. Run them manually in a
// dev vault or write integration tests against a live environment.

import { zoteroItemToCSL } from '../zotero-csl';
import { SimpleLRU } from '../lru';

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
    lru.get('a'); // access 'a' to make 'b' the oldest
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
    lru.set('a', 'A2');
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
      creators: [{ creatorType: 'editor', firstName: 'Bob', lastName: 'Jones' }],
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
