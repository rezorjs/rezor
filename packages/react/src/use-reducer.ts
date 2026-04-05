import { getCurrentInstanceAll } from './instance'
import type { ReducerHookSlot } from './store'
import { getHooksStore, isHookKind } from './store'
import { queueJob } from './scheduler'

export type ActionDispatch<A> = (action: A) => void

export function useReducer<S, A>(
  reducer: (prevState: S, action: A) => S,
  initialArg: S,
): [S, ActionDispatch<A>]
export function useReducer<S, I, A>(
  reducer: (prevState: S, action: A) => S,
  initialArg: I,
  init: (i: I) => S,
): [S, ActionDispatch<A>]
export function useReducer<S, I, A>(
  reducer: (prevState: S, action: A) => S,
  initialArg: S | I,
  init?: (i: I) => S,
): [S, ActionDispatch<A>] {
  const getState = () =>
    init === undefined ? (initialArg as S) : init(initialArg as I)

  const currentInstance = getCurrentInstanceAll()
  if (currentInstance) {
    const store = getHooksStore(currentInstance)
    const index = store.cursor
    let reducerSlot = store.slots[index]
    if (!isHookKind(reducerSlot, 'reducer')) {
      const dispatch = (action: A) => {
        const prevState = (reducerSlot as ReducerHookSlot).value
        const nextState = (reducerSlot as ReducerHookSlot).reducer(
          prevState,
          action,
        )
        if (Object.is(prevState, nextState)) {
          return
        }

        ;(reducerSlot as ReducerHookSlot).value = nextState
        queueJob(currentInstance.__render__)
      }

      reducerSlot = { kind: 'reducer', value: getState(), reducer, dispatch }
      store.slots[index] = reducerSlot
    } else {
      reducerSlot.reducer = reducer
    }

    store.cursor += 1
    return [reducerSlot.value, reducerSlot.dispatch]
  }

  /* istanbul ignore else -- @preserve  */
  if (__DEV__) {
    console.warn(
      'useReducer() hook can only be called during execution of render().',
    )
  }

  return [getState(), () => {}]
}
