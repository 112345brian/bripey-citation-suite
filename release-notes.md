## 2.0.26

- Support file-relative and multiple bibliography files in YAML frontmatter
- Auto-update frontmatter bibliography paths when `.bib` files are renamed
- Native Zotero 7/8 API mode (no Better BibTeX required) — opt-in in settings
- Fix stale Zotero cache: items added to Zotero were permanently missed after the initial cache load because `lastUpdate` was incorrectly advanced when reading from the local cache file instead of fetching fresh from Zotero
