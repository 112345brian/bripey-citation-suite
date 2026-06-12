jest.mock('obsidian', () => ({
  parseYaml: (str: string) => JSON.parse(str),
}), { virtual: true });

jest.mock('@retorquere/bibtex-parser', () => ({
  parse: jest.fn(),
}));

import * as BibTeXParser from '@retorquere/bibtex-parser';
import { parseBibTeX, parseCSLJSON, parseCSLYAML, parseBibFile } from '../bibtex';

// Helpers
function mockBib(entries: any[]) {
  (BibTeXParser.parse as jest.Mock).mockReturnValue({ entries, errors: [] });
}

function entry(
  key: string,
  type: string,
  fields: Record<string, unknown>,
  creators?: Record<string, unknown>
) {
  return { key, type, fields, creators };
}

function author(firstName: string, lastName: string) {
  return { firstName, lastName };
}

function institution(name: string) {
  return { literal: name };
}

// ─── parseBibTeX field mapping ─────────────────────────────────────────────────

describe('parseBibTeX()', () => {
  beforeEach(() => {
    (BibTeXParser.parse as jest.Mock).mockReset();
  });

  it('returns empty array for empty input', () => {
    expect(parseBibTeX('')).toEqual([]);
    expect(parseBibTeX('   ')).toEqual([]);
  });

  it('maps classic BibTeX article fields (journal, year)', () => {
    mockBib([entry('smith2020', 'article', {
      title: ['A Great Article'],
      journal: ['Journal of Testing'],
      year: ['2020'],
      volume: ['5'],
      number: ['2'],
      pages: ['10--20'],
      doi: ['10.1234/test'],
      issn: ['1234-5678'],
      author: [author('Jane', 'Smith')],
    })]);

    const result = parseBibTeX('anything');
    expect(result).toHaveLength(1);
    const e = result[0] as any;
    expect(e.id).toBe('smith2020');
    expect(e.type).toBe('article-journal');
    expect(e.title).toBe('A Great Article');
    expect(e['container-title']).toBe('Journal of Testing');
    expect(e.volume).toBe('5');
    expect(e.issue).toBe('2');
    expect(e.page).toBe('10–20');
    expect(e.DOI).toBe('10.1234/test');
    expect(e.ISSN).toBe('1234-5678');
    expect(e.issued).toEqual({ 'date-parts': [[2020]] });
    expect(e.author).toEqual([{ family: 'Smith', given: 'Jane' }]);
  });

  it('maps BibLaTeX article fields (journaltitle, date ISO format)', () => {
    mockBib([entry('jones2021a', 'article', {
      title: ['BibLaTeX Article'],
      journaltitle: ['Modern Studies'],
      date: ['2021-03-15'],
      url: ['https://example.com/article'],
      author: [author('Bob', 'Jones')],
    })]);

    const e = parseBibTeX('x')[0] as any;
    expect(e['container-title']).toBe('Modern Studies');
    expect(e.issued).toEqual({ 'date-parts': [[2021, 3, 15]] });
    expect(e.URL).toBe('https://example.com/article');
  });

  it('normalizes -- page ranges to an en-dash', () => {
    mockBib([entry('p_test', 'article', {
      title: ['Pages'],
      year: ['2020'],
      pages: ['100--200'],
    })]);
    expect((parseBibTeX('x')[0] as any).page).toBe('100–200');
  });

  it('strips https://doi.org/ prefix from DOI field', () => {
    mockBib([entry('doi_test', 'article', {
      title: ['T'],
      year: ['2020'],
      doi: ['https://doi.org/10.1234/stripped'],
    })]);
    expect((parseBibTeX('x')[0] as any).DOI).toBe('10.1234/stripped');
  });

  it('strips https://dx.doi.org/ prefix from DOI field', () => {
    mockBib([entry('doi_dx_test', 'article', {
      title: ['T'],
      year: ['2020'],
      doi: ['https://dx.doi.org/10.1234/dx'],
    })]);
    expect((parseBibTeX('x')[0] as any).DOI).toBe('10.1234/dx');
  });

  it('falls back to year from citekey when no date fields present', () => {
    mockBib([entry('smith_2018_on_happiness', 'misc', { note: ['no date'] })]);
    expect((parseBibTeX('x')[0] as any).issued).toEqual({ 'date-parts': [[2018]] });
  });

  it('falls back to humanised citekey as title when title field is absent', () => {
    mockBib([entry('jones_2019_great_idea', 'misc', {})]);
    expect((parseBibTeX('x')[0] as any).title).toBe('jones 2019 great idea');
  });

  it('maps all 24 entry types to their CSL equivalents', () => {
    const cases: [string, string][] = [
      ['article', 'article-journal'],
      ['book', 'book'],
      ['booklet', 'pamphlet'],
      ['collection', 'book'],
      ['conference', 'paper-conference'],
      ['dataset', 'dataset'],
      ['inbook', 'chapter'],
      ['incollection', 'chapter'],
      ['inproceedings', 'paper-conference'],
      ['manual', 'book'],
      ['mastersthesis', 'thesis'],
      ['misc', 'document'],
      ['online', 'webpage'],
      ['patent', 'patent'],
      ['periodical', 'periodical'],
      ['phdthesis', 'thesis'],
      ['proceedings', 'book'],
      ['report', 'report'],
      ['software', 'software'],
      ['techreport', 'report'],
      ['thesis', 'thesis'],
      ['unpublished', 'manuscript'],
      ['video', 'motion_picture'],
      ['www', 'webpage'],
    ];

    for (const [bibType, cslType] of cases) {
      mockBib([entry('key2020', bibType, { title: ['T'], year: ['2020'] })]);
      expect((parseBibTeX('x')[0] as any).type).toBe(cslType);
    }
  });

  it('falls back to "document" for unknown entry types', () => {
    mockBib([entry('key2020', 'weirdtype', { title: ['T'], year: ['2020'] })]);
    expect((parseBibTeX('x')[0] as any).type).toBe('document');
  });

  it('maps multiple authors', () => {
    mockBib([entry('multi2020', 'article', {
      title: ['Multi'],
      year: ['2020'],
      author: [author('Jane', 'Smith'), author('John', 'Doe'), author('Alice', 'Roe')],
    })]);

    const authors = (parseBibTeX('x')[0] as any).author;
    expect(authors).toHaveLength(3);
    expect(authors[0]).toEqual({ family: 'Smith', given: 'Jane' });
    expect(authors[1]).toEqual({ family: 'Doe', given: 'John' });
    expect(authors[2]).toEqual({ family: 'Roe', given: 'Alice' });
  });

  it('maps editor creator role', () => {
    mockBib([entry('edited2020', 'book', {
      title: ['Handbook'],
      year: ['2020'],
      editor: [author('Bob', 'Jones')],
    })]);

    const e = parseBibTeX('x')[0] as any;
    expect(e.editor).toEqual([{ family: 'Jones', given: 'Bob' }]);
    expect(e.author).toBeUndefined();
  });

  it('maps institutional author as CSL literal', () => {
    mockBib([entry('corp2020', 'report', {
      title: ['Annual Report'],
      year: ['2020'],
      author: [institution('ACME Corporation')],
    })]);

    const authors = (parseBibTeX('x')[0] as any).author;
    expect(authors).toHaveLength(1);
    expect(authors[0]).toEqual({ literal: 'ACME Corporation' });
  });

  it('prefers journaltitle over journal over booktitle for container-title', () => {
    mockBib([entry('a', 'article', { title: ['T'], year: ['2020'], journaltitle: ['JT'], journal: ['J'] })]);
    expect((parseBibTeX('x')[0] as any)['container-title']).toBe('JT');

    mockBib([entry('b', 'article', { title: ['T'], year: ['2020'], journal: ['J'], booktitle: ['BT'] })]);
    expect((parseBibTeX('x')[0] as any)['container-title']).toBe('J');

    mockBib([entry('c', 'incollection', { title: ['T'], year: ['2020'], booktitle: ['BT'] })]);
    expect((parseBibTeX('x')[0] as any)['container-title']).toBe('BT');
  });

  it('maps shortjournal to container-title-short', () => {
    mockBib([entry('h', 'article', {
      title: ['T'], year: ['2020'],
      journaltitle: ['Full Title'], shortjournal: ['FT'],
    })]);
    expect((parseBibTeX('x')[0] as any)['container-title-short']).toBe('FT');
  });

  it('maps publisher, institution, and school with publisher taking priority', () => {
    mockBib([entry('d', 'book', { title: ['T'], year: ['2020'], publisher: ['Pub Press'], institution: ['Inst'] })]);
    expect((parseBibTeX('x')[0] as any).publisher).toBe('Pub Press');

    mockBib([entry('e', 'techreport', { title: ['T'], year: ['2020'], institution: ['Inst'] })]);
    expect((parseBibTeX('x')[0] as any).publisher).toBe('Inst');
  });

  it('maps location to publisher-place, address as fallback', () => {
    mockBib([entry('f', 'book', { title: ['T'], year: ['2020'], publisher: ['P'], location: ['New York'] })]);
    expect((parseBibTeX('x')[0] as any)['publisher-place']).toBe('New York');
  });

  it('maps series to collection-title', () => {
    mockBib([entry('g', 'book', { title: ['T'], year: ['2020'], series: ['Lecture Notes'] })]);
    expect((parseBibTeX('x')[0] as any)['collection-title']).toBe('Lecture Notes');
  });

  it('skips entries without a key', () => {
    mockBib([
      { key: '', type: 'article', fields: { title: ['Bad'] }, creators: {} },
      entry('good2020', 'article', { title: ['Good'], year: ['2020'] }),
    ]);
    const result = parseBibTeX('x');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('good2020');
  });

  it('returns empty array when parser returns no entries', () => {
    (BibTeXParser.parse as jest.Mock).mockReturnValue({ entries: [], errors: [] });
    expect(parseBibTeX('anything')).toEqual([]);
  });
});

// ─── parseCSLJSON ─────────────────────────────────────────────────────────────

describe('parseCSLJSON()', () => {
  it('parses a CSL-JSON array', () => {
    const json = JSON.stringify([
      { id: 'smith2020', type: 'article-journal', title: 'A Test' },
    ]);
    const result = parseCSLJSON(json);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('smith2020');
  });
});

// ─── parseCSLYAML ─────────────────────────────────────────────────────────────

describe('parseCSLYAML()', () => {
  it('parses a { references: [...] } wrapper', () => {
    const data = { references: [{ id: 'smith2020', type: 'article-journal' }] };
    const result = parseCSLYAML(JSON.stringify(data));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('smith2020');
  });

  it('parses a bare array', () => {
    const data = [{ id: 'doe2021', type: 'book' }];
    const result = parseCSLYAML(JSON.stringify(data));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('doe2021');
  });
});

// ─── parseBibFile dispatch ─────────────────────────────────────────────────────

describe('parseBibFile()', () => {
  beforeEach(() => (BibTeXParser.parse as jest.Mock).mockReset());

  it('dispatches to parseCSLJSON for .json extension', () => {
    const json = JSON.stringify([{ id: 'x', type: 'book' }]);
    expect(parseBibFile(json, 'refs.json')[0].id).toBe('x');
  });

  it('dispatches to parseCSLYAML for .yaml extension', () => {
    const data = [{ id: 'y', type: 'article-journal' }];
    expect(parseBibFile(JSON.stringify(data), 'refs.yaml')[0].id).toBe('y');
  });

  it('dispatches to parseCSLYAML for .yml extension', () => {
    const data = [{ id: 'z', type: 'report' }];
    expect(parseBibFile(JSON.stringify(data), 'refs.yml')[0].id).toBe('z');
  });

  it('dispatches to parseBibTeX for .bib extension', () => {
    mockBib([entry('jones2020', 'book', { title: ['A Book'], year: ['2020'] })]);
    expect(parseBibFile('anything', 'refs.bib')[0].id).toBe('jones2020');
  });

  it('dispatches to parseBibTeX for unknown extension', () => {
    mockBib([entry('jones2020', 'book', { title: ['A Book'], year: ['2020'] })]);
    expect(parseBibFile('anything', 'refs.txt')[0].id).toBe('jones2020');
  });
});
