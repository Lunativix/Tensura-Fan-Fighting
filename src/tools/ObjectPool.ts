export class ObjectPool<T> {
  private readonly available: T[] = []
  private readonly inUse = new Set<T>()

  private readonly factory: () => T
  private readonly reset: (item: T) => void

  constructor(factory: () => T, reset: (item: T) => void, initial = 0) {
    this.factory = factory
    this.reset = reset
    for (let i = 0; i < initial; i += 1) {
      this.available.push(this.factory())
    }
  }

  acquire(): T {
    const item = this.available.pop() ?? this.factory()
    this.inUse.add(item)
    return item
  }

  release(item: T): void {
    if (!this.inUse.delete(item)) {
      return
    }
    this.reset(item)
    this.available.push(item)
  }

  releaseAll(): void {
    for (const item of this.inUse) {
      this.reset(item)
      this.available.push(item)
    }
    this.inUse.clear()
  }

  get activeCount(): number {
    return this.inUse.size
  }
}
