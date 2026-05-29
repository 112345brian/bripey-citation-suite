export class SimpleLRU<K, V> {
  private max: number;
  private map = new Map<K, V>();
  private onDispose?: (value: V) => void;

  constructor(opts: { max: number; dispose?: (value: V) => void }) {
    this.max = opts.max;
    this.onDispose = opts.dispose;
  }

  has(key: K) {
    return this.map.has(key);
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key)!;
    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  set(key: K, value: V) {
    const isExisting = this.map.has(key);
    this.map.delete(key);
    this.map.set(key, value);
    if (!isExisting && this.map.size > this.max) {
      const oldest = this.map.keys().next().value!;
      const oldVal = this.map.get(oldest)!;
      this.map.delete(oldest);
      this.onDispose?.(oldVal);
    }
  }

  delete(key: K) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}
