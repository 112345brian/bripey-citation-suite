export interface PartialCSLEntry {
  id: string;
  title: string;
  groupID?: number;
  /** Which source this entry was loaded from. Internal — not a CSL field. */
  _source?: 'bib' | 'zotero';
  /** ISO dateModified from Zotero, used to resolve cross-group duplicates. */
  _dateModified?: string;
  /** Internal Zotero item key (8-char, e.g. "ABC12345"). Used to write the
   *  zotero-key frontmatter field that ZotLit needs to index a literature note. */
  _zoteroKey?: string;
}

export type CSLList = PartialCSLEntry[];
