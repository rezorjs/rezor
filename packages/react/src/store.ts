import type {
  RefHookSlot,
  MemoHookSlot,
  StateHookSlot,
  ReducerHookSlot,
  EffectHookSlot,
  EffectEventHookSlot,
  ContextHookSlot,
  HookSlot,
  HooksStore,
  AppInstance,
  PageInstance,
  ComponentInstance,
} from './instance'

type HookKind =
  'ref' | 'memo' | 'state' | 'reducer' | 'effect' | 'effectEvent' | 'context'
type HookSlotByKind = {
  ref: RefHookSlot
  memo: MemoHookSlot
  state: StateHookSlot
  reducer: ReducerHookSlot
  effect: EffectHookSlot
  effectEvent: EffectEventHookSlot
  context: ContextHookSlot
}

export function getHooksStore(
  instance: AppInstance | PageInstance | ComponentInstance,
): HooksStore {
  if (instance.__v_hooks === undefined) {
    instance.__v_hooks = { cursor: 0, slots: [] }
  }
  return instance.__v_hooks
}

export function resetHooksCursor(
  instance: AppInstance | PageInstance | ComponentInstance,
): void {
  const store = instance.__v_hooks
  if (store === undefined) {
    return
  }
  store.cursor = 0
}

export function trimHooksStore(
  instance: AppInstance | PageInstance | ComponentInstance,
): void {
  const store = instance.__v_hooks
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
  const store = instance.__v_lifecycle
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
  const store = instance.__v_lifecycle
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
  if (instance.__v_lifecycle === undefined) {
    instance.__v_lifecycle = {}
  }

  const store = instance.__v_lifecycle
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
  const store = instance.__v_lifecycle
  if (store === undefined || store[lifecycle] === undefined) {
    return 0
  }
  return store[lifecycle].cursor
}

export function getLifecycleHooks(
  instance: AppInstance | PageInstance | ComponentInstance,
  lifecycle: string,
): Function[] {
  const store = instance.__v_lifecycle
  if (store === undefined || store[lifecycle] === undefined) {
    return []
  }
  return store[lifecycle].handlers
}
