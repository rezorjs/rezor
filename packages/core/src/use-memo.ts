import { currentApp } from './instance'
import { toHiddenField } from './utils'

function areHookInputsEqual(nextDeps: any[], prevDeps: any[]): boolean {
  if (prevDeps === undefined || nextDeps.length !== prevDeps.length) {
    return false
  }

  for (let i = 0; i < nextDeps.length; i++) {
    if (!Object.is(nextDeps[i], prevDeps[i])) {
      return false
    }
  }

  return true
}

export function useMemo<T>(factory: () => T, deps: any[]): T {
  const currentInstance = currentApp
  if (currentInstance) {
    const field = toHiddenField('memo')
    if (currentInstance[field] === undefined) {
      currentInstance[field] = []
      currentInstance[field].index = 0
    }

    const memo = currentInstance[field]
    const index = memo.index
    if (
      memo[index] === undefined ||
      !areHookInputsEqual(deps, memo[index].deps)
    ) {
      memo[index] = { value: factory(), deps }
    }

    memo.index += 1
    return memo[index].value
  }

  if (__DEV__) {
    console.warn(
      'useMemo() hook can only be called during execution of render().',
    )
  }

  return factory()
}

export function useCallback<T extends Function>(callback: T, deps: any[]): T {
  return useMemo(() => callback, deps)
}
