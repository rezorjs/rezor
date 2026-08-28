import type { EffectHookSlot } from './instance'
import { getCurrentInstance } from './instance'
import { getHooksStore, isHookKind } from './store'
import { queuePostFlushCb, SchedulerJobFlags } from './scheduler'
import { areHookDepsEqual, warn } from './utils'

export type EffectCallback = () => void | (() => void)

export function useEffect(
  callback: EffectCallback,
  deps?: readonly unknown[],
): void {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    const store = getHooksStore(currentInstance)
    const index = store.cursor
    let effectSlot = store.slots[index]
    if (!isHookKind(effectSlot, 'effect')) {
      effectSlot = { kind: 'effect', deps, cleanup: undefined }
      store.slots[index] = effectSlot
      const job = () => {
        ;(effectSlot as EffectHookSlot).job = undefined
        ;(effectSlot as EffectHookSlot).cleanup = callback()
      }
      effectSlot.job = job
      queuePostFlushCb(job)
    } else if (!areHookDepsEqual(effectSlot.deps, deps)) {
      if (effectSlot.job) {
        // Same tick may render multiple times, drop the pending job
        effectSlot.job.flags! |= SchedulerJobFlags.DISPOSED
      }
      effectSlot.deps = deps
      const job = () => {
        ;(effectSlot as EffectHookSlot).job = undefined

        const cleanup = (effectSlot as EffectHookSlot).cleanup
        if (cleanup) {
          // In case cleanup or callback throws
          ;(effectSlot as EffectHookSlot).cleanup = undefined
          cleanup()
        }

        ;(effectSlot as EffectHookSlot).cleanup = callback()
      }
      effectSlot.job = job
      queuePostFlushCb(job)
    }

    store.cursor += 1
    return
  }

  /* istanbul ignore else -- @preserve  */
  if (__DEV__) {
    warn('useEffect() hook can only be called during execution of render().')
  }
}
