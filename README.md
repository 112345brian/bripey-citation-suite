## Obsidian Pandoc Reference List

Displays a formatted reference in the sidebar for each pandoc citekey present in the current document.

### Set up instructions

#### Requirements
- Ensure [Pandoc](https://pandoc.org/) is installed. **This plugin requires at least version 2.11**.

#### Configuration Options

**Option 1: Global Bibliography (Traditional)**
- Supply a path to a compatible bibliography file in plugin settings
- (Optional) Supply a path or URL to a compatible [CSL style](https://citationstyles.org/)

**Option 2: YAML Frontmatter (New in 2.0.26)**
- No global configuration required
- Specify bibliography file in your Markdown files' YAML frontmatter:
```yaml
---
bibliography: path/to/references.bib
---
```

**Option 3: Hybrid Configuration**
- Use global bibliography as default
- Override with YAML frontmatter in specific files

#### First Time Setup (Recommended)

**For better performance and offline support**, pre-configure the CSL cache:

1. Create a `.pandoc` folder in your vault root
2. Download default CSL styles and locale files:
   - [APA style](https://raw.githubusercontent.com/citation-style-language/styles/master/apa.csl) → save as `.pandoc/apa.csl`
   - [IEEE style](https://raw.githubusercontent.com/citation-style-language/styles/master/ieee.csl) → save as `.pandoc/ieee.csl`
   - [English locale](https://raw.githubusercontent.com/citation-style-language/locales/master/locales-en-US.xml) → save as `.pandoc/locales-en-US.xml`

> **Note**: The plugin will automatically download these files on first launch, but pre-configuring ensures faster startup and offline availability.

#### Usage
- Run "Pandoc Reference List: Show reference list" from Obsidian command palette to display References tab in the sidebar
- Use pandoc citation syntax in your notes: `[@author2023]` or `[@author2023; @another2022]`

<img src="https://raw.githubusercontent.com/mgmeyers/obsidian-pandoc-reference-list/main/Screen%20Shot.png" alt="A screenshot of the plugin's works cited list">
