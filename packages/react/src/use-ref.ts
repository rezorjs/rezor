import { getCurrentInstanceAll } from './instance'
import { getHooksStore, isHookKind } from './store'

export function useRef<T>(initialValue: T): { current: T } {
  const currentInstance = getCurrentInstanceAll()
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

  if (__DEV__) {
    console.warn(
      'useRef() hook can only be called during execution of render().',
    )
  }

  return { current: initialValue }
}
