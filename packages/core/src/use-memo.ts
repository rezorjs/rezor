import { currentApp, getHooksStore, isHookKind } from './instance'

function areHookInputsEqual(prevDeps: unknown[], nextDeps: unknown[]): boolean {
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

export function useMemo<T>(factory: () => T, deps: unknown[]): T {
  const currentInstance = currentApp
  if (currentInstance) {
    const store = getHooksStore(currentInstance)
    const index = store.cursor
    let memoSlot = store.slots[index]
    if (
      !isHookKind(memoSlot, 'memo') ||
      !areHookInputsEqual(memoSlot.deps, deps)
    ) {
      memoSlot = { kind: 'memo', value: factory(), deps }
      store.slots[index] = memoSlot
    }

    store.cursor += 1
    return memoSlot.value
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
  return useMemo(() => callback, deps)
}
