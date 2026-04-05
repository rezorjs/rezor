import type { SchedulerJob } from './scheduler'
import type { AppInstance, PageInstance, ComponentInstance } from './instance'

type HookKind =
  | 'ref'
  | 'memo'
  | 'state'
  | 'reducer'
  | 'effect'
  | 'effectEvent'
  | 'context'
type RefHookSlot = { kind: 'ref'; ref: { current: any } }
type MemoHookSlot = { kind: 'memo'; value: any; deps: readonly unknown[] }
export type StateHookSlot = {
  kind: 'state'
  value: any
  setState: (newState: any) => void
}
export type ReducerHookSlot = {
  kind: 'reducer'
  value: any
  reducer: (prevState: any, action: any) => any
  dispatch: (action: any) => void
}
export type EffectHookSlot = {
  kind: 'effect'
  deps?: readonly unknown[]
  job?: SchedulerJob
  cleanup: void | (() => void)
}
type EffectEventHookSlot = {
  kind: 'effectEvent'
  fn: Function
}
export type ContextHookSlot = {
  kind: 'context'
  cleanup: () => void
}
type HookSlot =
  | RefHookSlot
  | MemoHookSlot
  | StateHookSlot
  | ReducerHookSlot
  | EffectHookSlot
  | EffectEventHookSlot
  | ContextHookSlot
type HooksStore = { cursor: number; slots: HookSlot[] }
type HookSlotByKind = {
  ref: RefHookSlot
  memo: MemoHookSlot
  state: StateHookSlot
  reducer: ReducerHookSlot
  effect: EffectHookSlot
  effectEvent: EffectEventHookSlot
  context: ContextHookSlot
}

type LifecycleStore = Record<string, { cursor: number; handlers: Function[] }>

export function getHooksStore(
  instance: AppInstance | PageInstance | ComponentInstance,
): HooksStore {
  if (instance.__hooks__ === undefined) {
    instance.__hooks__ = { cursor: 0, slots: [] } satisfies HooksStore
  }
  return instance.__hooks__
}

export function resetHooksCursor(
  instance: AppInstance | PageInstance | ComponentInstance,
): void {
  const store = instance.__hooks__ as HooksStore | undefined
  if (store === undefined) {
    return
  }
  store.cursor = 0
}

export function trimHooksStore(
  instance: AppInstance | PageInstance | ComponentInstance,
): void {
  const store = instance.__hooks__ as HooksStore | undefined
  if (store === undefined) {
    return
  }
  store.slots.length = store.cursor
}

export function isHookKind<K extends HookKind>(
  slot: HookSlot | undefined,
  kind: K,
): slot is HookSlotByKind[K] {
  return slot !== undefined && slot.kind === kind
}

export function resetLifecycleCursors(
  instance: AppInstance | PageInstance | ComponentInstance,
  lifecycles: string[],
): void {
  const store = instance.__lifecycle__ as LifecycleStore | undefined
  if (store === undefined) {
    return
  }

  lifecycles.forEach((lifecycle) => {
    if (store[lifecycle] !== undefined) {
      store[lifecycle].cursor = 0
    }
  })
}

export function trimLifecycleBuckets(
  instance: AppInstance | PageInstance | ComponentInstance,
  lifecycles: string[],
): void {
  const store = instance.__lifecycle__ as LifecycleStore | undefined
  if (store === undefined) {
    return
  }

  lifecycles.forEach((lifecycle) => {
    if (store[lifecycle] !== undefined) {
      store[lifecycle].handlers.length = store[lifecycle].cursor
    }
  })
}

export function registerLifecycleHook(
  instance: AppInstance | PageInstance | ComponentInstance,
  lifecycle: string,
  hook: Function,
): void {
  if (instance.__lifecycle__ === undefined) {
    instance.__lifecycle__ = {}
  }

  const store = instance.__lifecycle__ as LifecycleStore
  if (store[lifecycle] === undefined) {
    store[lifecycle] = { cursor: 0, handlers: [] }
  }

  const bucket = store[lifecycle]
  bucket.handlers[bucket.cursor] = hook
  bucket.cursor += 1
}

export function getLifecycleCursor(
  instance: AppInstance | PageInstance | ComponentInstance,
  lifecycle: string,
): number {
  const store = instance.__lifecycle__ as LifecycleStore | undefined
  if (store === undefined || store[lifecycle] === undefined) {
    return 0
  }
  return store[lifecycle].cursor
}

export function getLifecycleHooks(
  instance: AppInstance | PageInstance | ComponentInstance,
  lifecycle: string,
): Function[] {
  const store = instance.__lifecycle__ as LifecycleStore | undefined
  if (store === undefined || store[lifecycle] === undefined) {
    return []
  }
  return store[lifecycle].handlers
}
