## 2.0.26

### Features
- **YAML Frontmatter Bibliography Support**: Use bibliography files specified in YAML frontmatter without requiring global path configuration
- **Flexible Configuration**: Mix global and per-file bibliography settings seamlessly
- **Better Error Messages**: Updated to inform users about both global and YAML configuration options

### Bug Fixes
- Fixed issue where YAML frontmatter bibliography would not work without global pathToBibliography configuration
- Fixed "empty CSL style" error when using only YAML frontmatter bibliography
- Ensure CSL styles and locales are loaded even when no global bibliography is configured

### Technical Details
- Modified `processReferences()` to defer validation until after YAML frontmatter is checked
- Enhanced `loadGlobalBibFile()` to preload CSL styles for YAML frontmatter usage
- Improved `loadScopedEngine()` to explicitly load global styles when needed

### Usage Example
```yaml
---
bibliography: references.bib
---

# My Paper

This is a citation [@author2023].
```

---

## 2.0.25
86918b5 Fix BBT API change
