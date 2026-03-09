import { currentApp } from './instance'
import type { StateHookSlot } from './store'
import { getHooksStore, isHookKind } from './store'
import { isFunction, toHiddenField } from './utils'
import { queueJob } from './scheduler'

export function useState<T>(
  initialState: T | (() => T),
): [T, (newState: T | ((prevState: T) => T)) => void] {
  const getState = () =>
    isFunction(initialState) ? initialState() : initialState

  const currentInstance = currentApp
  if (currentInstance) {
    const store = getHooksStore(currentInstance)
    const index = store.cursor
    let stateSlot = store.slots[index]
    if (!isHookKind(stateSlot, 'state')) {
      const setState = (newState: T | ((prevState: T) => T)) => {
        const prevState = (stateSlot as StateHookSlot).value
        const nextState = isFunction(newState) ? newState(prevState) : newState
        if (Object.is(prevState, nextState)) {
          return
        }

        ;(stateSlot as StateHookSlot).value = nextState
        queueJob(currentInstance[toHiddenField('render')])
      }

      stateSlot = { kind: 'state', value: getState(), setState }
      store.slots[index] = stateSlot
    }

    store.cursor += 1
    return [stateSlot.value, stateSlot.setState]
  }

  if (__DEV__) {
    console.warn(
      'useState() hook can only be called during execution of render().',
    )
  }

  return [getState(), () => {}]
}
