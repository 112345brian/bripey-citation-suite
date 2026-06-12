import en from './locale/en';

const localeMap: { [k: string]: Partial<typeof en> } = { en };

const lang = window.localStorage.getItem('language');
const locale = localeMap[lang || 'en'] ?? en;

export function t(str: keyof typeof en): string {
  return locale[str] ?? en[str];
}
