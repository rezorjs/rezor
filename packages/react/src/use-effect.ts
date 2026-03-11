import { getCurrentInstanceAll } from './instance'
import type { EffectHookSlot } from './store'
import { getHooksStore, isHookKind } from './store'
import { queuePostFlushCb } from './scheduler'
import { areHookDepsEqual } from './utils'

export function useEffect(
  callback: () => void | (() => void),
  deps?: unknown[],
): void {
  const currentInstance = getCurrentInstanceAll()
  if (currentInstance) {
    const store = getHooksStore(currentInstance)
    const index = store.cursor
    let effectSlot = store.slots[index]
    if (!isHookKind(effectSlot, 'effect')) {
      effectSlot = { kind: 'effect', deps, cleanup: undefined }
      store.slots[index] = effectSlot
      queuePostFlushCb(() => {
        ;(effectSlot as EffectHookSlot).cleanup = callback()
      })
    } else if (!areHookDepsEqual(effectSlot.deps, deps)) {
      effectSlot.deps = deps
      queuePostFlushCb(() => {
        if ((effectSlot as EffectHookSlot).cleanup) {
          ;(effectSlot as EffectHookSlot).cleanup!()
        }
        ;(effectSlot as EffectHookSlot).cleanup = callback()
      })
    }

    store.cursor += 1
    return
  }

  if (__DEV__) {
    console.warn(
      'useEffect() hook can only be called during execution of render().',
    )
  }
}
