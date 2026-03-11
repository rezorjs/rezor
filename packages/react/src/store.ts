import { toHiddenField } from './utils'
import { AppInstance, PageInstance } from './instance'

type HookKind = 'ref' | 'memo' | 'state' | 'effect' | 'effectEvent'
type RefHookSlot = { kind: 'ref'; ref: { current: any } }
type MemoHookSlot = { kind: 'memo'; value: any; deps: unknown[] }
export type StateHookSlot = {
  kind: 'state'
  value: any
  setState: (newState: any) => void
}
export type EffectHookSlot = {
  kind: 'effect'
  deps?: unknown[]
  cleanup: void | (() => void)
}
type EffectEventHookSlot = {
  kind: 'effectEvent'
  fn: Function
}
type HookSlot =
  | StateHookSlot
  | RefHookSlot
  | MemoHookSlot
  | EffectHookSlot
  | EffectEventHookSlot
type HooksStore = { cursor: number; slots: HookSlot[] }
type HookSlotByKind = {
  ref: RefHookSlot
  memo: MemoHookSlot
  state: StateHookSlot
  effect: EffectHookSlot
  effectEvent: EffectEventHookSlot
}

type LifecycleStore = Record<string, { cursor: number; handlers: Function[] }>

const hooksStoreField = toHiddenField('hooks')
const lifecycleStoreField = toHiddenField('lifecycle')

export function getHooksStore(
  instance: AppInstance | PageInstance,
): HooksStore {
  if (instance[hooksStoreField] === undefined) {
    instance[hooksStoreField] = { cursor: 0, slots: [] } satisfies HooksStore
  }
  return instance[hooksStoreField]
}

export function resetHooksCursor(instance: AppInstance | PageInstance): void {
  const store = instance[hooksStoreField] as HooksStore | undefined
  if (store === undefined) {
    return
  }
  store.cursor = 0
}

export function trimHooksStore(instance: AppInstance | PageInstance): void {
  const store = instance[hooksStoreField] as HooksStore | undefined
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
  instance: AppInstance | PageInstance,
  lifecycles: string[],
): void {
  const store = instance[lifecycleStoreField] as LifecycleStore | undefined
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
  instance: AppInstance | PageInstance,
  lifecycles: string[],
): void {
  const store = instance[lifecycleStoreField] as LifecycleStore | undefined
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
  instance: AppInstance | PageInstance,
  lifecycle: string,
  hook: Function,
): void {
  if (instance[lifecycleStoreField] === undefined) {
    instance[lifecycleStoreField] = {}
  }

  const store = instance[lifecycleStoreField] as LifecycleStore
  if (store[lifecycle] === undefined) {
    store[lifecycle] = { cursor: 0, handlers: [] }
  }

  const bucket = store[lifecycle]
  bucket.handlers[bucket.cursor] = hook
  bucket.cursor += 1
}

export function getLifecycleCursor(
  instance: AppInstance | PageInstance,
  lifecycle: string,
): number {
  const store = instance[lifecycleStoreField] as LifecycleStore | undefined
  if (store === undefined || store[lifecycle] === undefined) {
    return 0
  }
  return store[lifecycle].cursor
}

export function getLifecycleHooks(
  instance: AppInstance | PageInstance,
  lifecycle: string,
): Function[] {
  const store = instance[lifecycleStoreField] as LifecycleStore | undefined
  if (store === undefined || store[lifecycle] === undefined) {
    return []
  }
  return store[lifecycle].handlers
}
