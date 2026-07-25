export function dataFn<T extends (...args: any[]) => any>(fn: T): T {
  // @ts-expect-error
  if (fn.__v_data) {
    return fn
  }

  // Wrap instead of mutating `fn` so the original stays usable as a method
  // elsewhere — mutation would route it through setData everywhere it's bound.
  const wrapped = (...args: any[]) => fn(...args)
  wrapped.__v_data = true
  return wrapped as unknown as T
}
