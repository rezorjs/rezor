import { getCurrentInstanceAll } from './instance'
import type { StateHookSlot } from './store'
import { getHooksStore, isHookKind } from './store'
import { isFunction } from './utils'
import { queueJob } from './scheduler'

export type Dispatch<A> = (value: A) => void
export type SetStateAction<S> = S | ((prevState: S) => S)

export function useState<S>(
  initialState: S | (() => S),
): [S, Dispatch<SetStateAction<S>>]
export function useState<S = undefined>(): [
  S | undefined,
  Dispatch<SetStateAction<S | undefined>>,
]
export function useState<S>(
  initialState?: S | (() => S),
): [S | undefined, Dispatch<SetStateAction<S>>] {
  const getState = () =>
    isFunction(initialState) ? initialState() : initialState

  const currentInstance = getCurrentInstanceAll()
  if (currentInstance) {
    const store = getHooksStore(currentInstance)
    const index = store.cursor
    let stateSlot = store.slots[index]
    if (!isHookKind(stateSlot, 'state')) {
      const setState = (newState: S | ((prevState: S) => S)) => {
        const prevState = (stateSlot as StateHookSlot).value
        const nextState = isFunction(newState) ? newState(prevState) : newState
        if (Object.is(prevState, nextState)) {
          return
        }

        ;(stateSlot as StateHookSlot).value = nextState
        queueJob(currentInstance.__render__)
      }

      stateSlot = { kind: 'state', value: getState(), setState }
      store.slots[index] = stateSlot
    }

    store.cursor += 1
    return [stateSlot.value, stateSlot.setState]
  }

  /* istanbul ignore else -- @preserve  */
  if (__DEV__) {
    console.warn(
      'useState() hook can only be called during execution of render().',
    )
  }

  return [getState(), () => {}]
}
