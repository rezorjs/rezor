import { toHiddenField } from './utils'

export type Bindings = Record<string, any> | void

export type AppInstance = Record<string, any>

export let currentApp: AppInstance | null = null

export function setCurrentApp(app: AppInstance): void {
  currentApp = app
}

export function unsetCurrentApp(): void {
  currentApp = null
}

type HookKind = 'ref' | 'memo' | 'state'
type RefHookSlot = { kind: 'ref'; ref: { current: any } }
type MemoHookSlot = { kind: 'memo'; value: any; deps: unknown[] }
export type StateHookSlot = {
  kind: 'state'
  value: any
  setState: (newState: any) => void
}
type HookSlot = StateHookSlot | RefHookSlot | MemoHookSlot
type HooksStore = { cursor: number; slots: HookSlot[] }
type HookSlotByKind = {
  ref: RefHookSlot
  memo: MemoHookSlot
  state: StateHookSlot
}

type LifecycleStore = Record<string, { cursor: number; handlers: Function[] }>

const hooksStoreField = toHiddenField('hooks')
const lifecycleStoreField = toHiddenField('lifecycle')

export function getHooksStore(instance: AppInstance): HooksStore {
  if (instance[hooksStoreField] === undefined) {
    instance[hooksStoreField] = { cursor: 0, slots: [] } satisfies HooksStore
  }
  return instance[hooksStoreField]
}

export function resetHooksCursor(instance: AppInstance): void {
  const store = instance[hooksStoreField] as HooksStore | undefined
  if (store === undefined) {
    return
  }
  store.cursor = 0
}

export function trimHooksStore(instance: AppInstance): void {
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
  instance: AppInstance,
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
  instance: AppInstance,
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
  instance: AppInstance,
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

export function getLifecycleHooks(
  instance: AppInstance,
  lifecycle: string,
): Function[] {
  const store = instance[lifecycleStoreField] as LifecycleStore | undefined
  if (store === undefined || store[lifecycle] === undefined) {
    return []
  }
  return store[lifecycle].handlers
}
