import type { AppInstance } from './instance'
import { currentApp, getHooksStore, isHookKind } from './instance'
import { areHookDepsEqual } from './utils'

function memoImpl<T>(
  currentInstance: AppInstance,
  factory: () => T,
  deps: unknown[],
): T {
  const store = getHooksStore(currentInstance)
  const index = store.cursor
  let memoSlot = store.slots[index]
  if (!isHookKind(memoSlot, 'memo')) {
    memoSlot = { kind: 'memo', value: factory(), deps }
    store.slots[index] = memoSlot
  } else if (!areHookDepsEqual(memoSlot.deps, deps)) {
    memoSlot.value = factory()
    memoSlot.deps = deps
  }

  store.cursor += 1
  return memoSlot.value
}

export function useMemo<T>(factory: () => T, deps: unknown[]): T {
  const currentInstance = currentApp
  if (currentInstance) {
    return memoImpl(currentInstance, factory, deps)
  }

  if (__DEV__) {
    console.warn(
      'useMemo() hook can only be called during execution of render().',
    )
  }

  return factory()
}

export function useCallback<T extends Function>(
  callback: T,
  deps: unknown[],
): T {
  const currentInstance = currentApp
  if (currentInstance) {
    return memoImpl(currentInstance, () => callback, deps)
  }

  if (__DEV__) {
    console.warn(
      'useCallback() hook can only be called during execution of render().',
    )
  }

  return callback
}
