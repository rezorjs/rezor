import { currentApp } from './instance'
import { isFunction, toHiddenField } from './utils'

export function useState<T>(
  initialState: T | (() => T),
): [T, (newState: T | ((prevState: T) => T)) => void] {
  const currentInstance = currentApp
  if (currentInstance) {
    const field = toHiddenField('state')
    if (currentInstance[field] === undefined) {
      currentInstance[field] = []
      currentInstance[field].index = 0
    }

    const state = currentInstance[field]
    const index = state.index
    if (state[index] === undefined) {
      state[index] = isFunction(initialState) ? initialState() : initialState
    }

    const setState = (newState: T | ((prevState: T) => T)) => {
      if (isFunction(newState)) {
        state[index] = newState(state[index])
      } else {
        state[index] = newState
      }
      currentInstance[toHiddenField('render')]()
    }

    state.index += 1
    return [state[index], setState]
  }

  if (__DEV__) {
    console.warn(
      'useState() hook can only be called during execution of render().',
    )
  }

  return [isFunction(initialState) ? initialState() : initialState, () => {}]
}
