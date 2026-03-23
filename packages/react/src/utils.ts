export const extend: typeof Object.assign = Object.assign

export function exclude<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const ret: Record<string, unknown> = {}
  Object.keys(obj).forEach((key) => {
    if (!keys.includes(key as K)) {
      ret[key] = obj[key]
    }
  })
  return ret as Omit<T, K>
}

export function isFunction(x: unknown): x is Function {
  return typeof x === 'function'
}

export function areHookDepsEqual(
  prevDeps?: readonly unknown[],
  nextDeps?: readonly unknown[],
): boolean {
  if (prevDeps === undefined || nextDeps === undefined) {
    return false
  }

  if (nextDeps.length !== prevDeps.length) {
    return false
  }

  for (let i = 0; i < nextDeps.length; i++) {
    if (!Object.is(nextDeps[i], prevDeps[i])) {
      return false
    }
  }

  return true
}
