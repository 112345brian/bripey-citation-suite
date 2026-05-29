## 2.0.32

- **Race condition fix:** a run counter now cancels stale `processReferences` calls so switching notes quickly never renders a previous file's references into the current view.
- **Click-to-jump:** clicking a reference entry in the sidebar now scrolls the editor to that citation instead of copying. Right-click gives a context menu with "Copy citekey" and "Copy reference" options.
- **Unresolved citations badge:** the sidebar now shows a red count badge for citekeys that couldn't be resolved.
- **Keyboard navigation in SearchSelect:** arrow keys move through the dropdown, Enter confirms, Escape closes. Full ARIA combobox attributes added.
- **Custom CSL URL preserved in dropdown:** when a non-preset style URL is configured, the dropdown now shows it as a selectable label instead of going blank.
- **Parallel `.bib` loading:** multiple `.bib` files are now parsed in a single pass (concatenated) rather than sequentially, reducing load time on large multi-file setups.
- **Zotero pagination fix:** corrected an off-by-one in the item-fetch loop that could skip the last page when the response was exactly `limit` items.
- **Renderer rerender fallbacks:** added fallbacks for vaults where `previewMode.renderer` is absent, preventing silent no-ops on re-render.
- **Type fixes:** `@retorquere/bibtex-parser` and Electron `clipboard` ambient declarations consolidated into `src/ambient.d.ts`; eliminates TS errors from missing types.
