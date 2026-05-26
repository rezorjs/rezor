export function markData<T extends Function>(fn: T): T {
  // @ts-expect-error
  if (fn.__data__) {
    return fn
  }

  // Wrap instead of mutating `fn` so the original stays usable as a method
  // elsewhere — mutation would route it through setData everywhere it's bound.
  const marked = (...args: unknown[]) => fn(...args)
  marked.__data__ = true
  return marked as unknown as T
}
