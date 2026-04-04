import type { AppInstance, PageInstance, ComponentInstance } from './instance'
import { getCurrentInstanceAll } from './instance'
import type { EffectHookSlot } from './store'
import { getHooksStore, isHookKind } from './store'
import type { SchedulerJob } from './scheduler'
import { queueJob, queuePostFlushCb } from './scheduler'
import { areHookDepsEqual } from './utils'

export type EffectCallback = () => void | (() => void)

function effectImpl(
  currentInstance: AppInstance | PageInstance | ComponentInstance,
  queue: (job: SchedulerJob) => void,
  callback: EffectCallback,
  deps?: readonly unknown[],
): void {
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
    queue(job)
  } else if (!areHookDepsEqual(effectSlot.deps, deps)) {
    effectSlot.deps = deps
    const job = () => {
      ;(effectSlot as EffectHookSlot).job = undefined

      if ((effectSlot as EffectHookSlot).cleanup) {
        ;(effectSlot as EffectHookSlot).cleanup!()
      }

      ;(effectSlot as EffectHookSlot).cleanup = callback()
    }
    effectSlot.job = job
    queue(job)
  }

  store.cursor += 1
}

export function useEffect(
  callback: EffectCallback,
  deps?: readonly unknown[],
): void {
  const currentInstance = getCurrentInstanceAll()
  if (currentInstance) {
    effectImpl(currentInstance, queuePostFlushCb, callback, deps)
    return
  }

  /* istanbul ignore else -- @preserve  */
  if (__DEV__) {
    console.warn(
      'useEffect() hook can only be called during execution of render().',
    )
  }
}

export function useRenderEffect(
  callback: EffectCallback,
  deps?: readonly unknown[],
): void {
  const currentInstance = getCurrentInstanceAll()
  if (currentInstance) {
    effectImpl(currentInstance, queueJob, callback, deps)
    return
  }

  /* istanbul ignore else -- @preserve  */
  if (__DEV__) {
    console.warn(
      'useRenderEffect() hook can only be called during execution of render().',
    )
  }
}
