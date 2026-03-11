import { getCurrentInstanceAll } from './instance'
import type { StateHookSlot } from './store'
import { getHooksStore, isHookKind } from './store'
import { toHiddenField } from './utils'
import { queueJob } from './scheduler'

export function useReducer<S, A>(
  reducer: (prevState: S, action: A) => S,
  initialArg: S,
): [S, (action: A) => void]
export function useReducer<S, I, A>(
  reducer: (prevState: S, action: A) => S,
  initialArg: I,
  init: (i: I) => S,
): [S, (action: A) => void]
export function useReducer<S, I, A>(
  reducer: (prevState: S, action: A) => S,
  initialArg: S | I,
  init?: (i: I) => S,
): [S, (action: A) => void] {
  const getState = () =>
    init === undefined ? (initialArg as S) : init(initialArg as I)

  const currentInstance = getCurrentInstanceAll()
  if (currentInstance) {
    const store = getHooksStore(currentInstance)
    const index = store.cursor
    let stateSlot = store.slots[index]
    if (!isHookKind(stateSlot, 'state')) {
      const dispatch = (action: A) => {
        const prevState = (stateSlot as StateHookSlot).value
        const nextState = reducer(prevState, action)
        if (Object.is(prevState, nextState)) {
          return
        }

        ;(stateSlot as StateHookSlot).value = nextState
        queueJob(currentInstance[toHiddenField('render')])
      }

      stateSlot = {
        kind: 'state',
        value: getState(),
        setState: dispatch as any,
      }
      store.slots[index] = stateSlot
    }

    store.cursor += 1
    return [stateSlot.value, stateSlot.setState]
  }

  if (__DEV__) {
    console.warn(
      'useReducer() hook can only be called during execution of render().',
    )
  }

  return [getState(), () => {}]
}
