import { getCurrentInstance } from './instance'
import { getHooksStore, isHookKind } from './store'
import { warn } from './utils'

export interface RefObject<T> {
  current: T
}

export function useRef<T>(initialValue: T): RefObject<T>
export function useRef<T>(initialValue: T | null): RefObject<T | null>
export function useRef<T>(initialValue: T | undefined): RefObject<T | undefined>
export function useRef<T>(initialValue: T): RefObject<T> {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    const store = getHooksStore(currentInstance)
    const index = store.cursor
    let refSlot = store.slots[index]
    if (!isHookKind(refSlot, 'ref')) {
      refSlot = { kind: 'ref', ref: { current: initialValue } }
      store.slots[index] = refSlot
    }

    store.cursor += 1
    return refSlot.ref
  }

  /* istanbul ignore else -- @preserve  */
  if (__DEV__) {
    warn('useRef() hook can only be called during execution of render().')
  }

  return { current: initialValue }
}
