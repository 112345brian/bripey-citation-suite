import { FileSystemAdapter, Platform, htmlToMarkdown } from 'obsidian';

// esbuild 0.13.x leaves dynamic import() of Node/Electron builtins verbatim
// in CJS output, which Electron's renderer can't resolve as an ES module.
// Synchronous require() works correctly in Electron's Node integration.
declare const require: (id: string) => any;

export function getVaultRoot() {
  return (app.vault.adapter as FileSystemAdapter).getBasePath();
}

export async function copyElToClipboard(el: HTMLElement) {
  const html = el.outerHTML;
  const text = htmlToMarkdown(html);

  if (Platform.isDesktop) {
    const { clipboard } = require('electron');
    clipboard.write({ html, text });
    return;
  }

  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
    return;
  }

  await navigator.clipboard?.writeText(text);
}

export async function copyTextToClipboard(text: string) {
  if (Platform.isDesktop) {
    const { clipboard } = require('electron');
    clipboard.writeText(text);
    return;
  }

  await navigator.clipboard?.writeText(text);
}

export class PromiseCapability<T> {
  settled = false;
  promise: Promise<T>;
  resolve: (data: T) => void;
  reject: (reason?: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (data) => {
        resolve(data);
        this.settled = true;
      };

      this.reject = (reason) => {
        reject(reason);
        this.settled = true;
      };
    });
  }
}

export function areSetsEqual<T>(as: Set<T>, bs: Set<T>) {
  if (as.size !== bs.size) return false;
  for (const a of as) if (!bs.has(a)) return false;
  return true;
}
