import { AbstractInputSuggest, TFolder } from 'obsidian';

/**
 * Attaches a folder-autocomplete dropdown to any HTMLInputElement.
 *
 * Usage:
 *   new FolderSuggest(app, text.inputEl);
 *
 * Selecting a suggestion writes the vault-relative folder path into the
 * input and fires an `input` event so any `.onChange()` handler picks it up.
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  getSuggestions(query: string): TFolder[] {
    const q = query.toLowerCase().trim();
    const folders: TFolder[] = [];
    app.vault.getAllLoadedFiles().forEach((f) => {
      if (f instanceof TFolder && (q === '' || f.path.toLowerCase().includes(q))) {
        folders.push(f);
      }
    });
    return folders
      .sort((a, b) => a.path.localeCompare(b.path))
      .slice(0, 50); // cap to keep the list snappy
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    // Show root as a visible label rather than empty string.
    el.setText(folder.path === '/' ? '(vault root)' : folder.path);
  }

  selectSuggestion(folder: TFolder): void {
    // Skip the root — leaving the field blank means "create at vault root".
    const value = folder.path === '/' ? '' : folder.path;
    this.setValue(value);
    // Fire `input` so Obsidian's Setting.addText().onChange() handler fires.
    this.inputEl.dispatchEvent(new Event('input'));
    this.close();
  }
}
