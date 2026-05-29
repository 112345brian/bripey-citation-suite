## 2.0.30

- Mobile-compatible runtime path: `.bib` parsing now defaults to the built-in pure-JS parser, normal file/network I/O uses Obsidian APIs, and optional Pandoc support is kept desktop-only.
- Zotero integration: supports merged `.bib` + Zotero sources, native Zotero API mode, ZotLit note creation/indexing, richer autocomplete, and `zotero-key` frontmatter stamping.
- Citation rendering fixes: render citations inside footnotes, preserve semicolons in suffix text when no following citekey exists, and avoid ZotLit bracketed-suggest conflicts.
- Sidebar and commands: add reference filtering and an "Insert bibliography at cursor" command.
- Dependency cleanup: remove `lru-cache`, `execa`, `download`, and `react-select` from the runtime bundle.
