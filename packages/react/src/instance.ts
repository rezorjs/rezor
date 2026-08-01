import type { SchedulerJob } from './scheduler'

export type Bindings = Record<string, any> | void
export type Render = () => void
export type RefHookSlot = { kind: 'ref'; ref: { current: any } }
export type MemoHookSlot = {
  kind: 'memo'
  value: any
  deps: readonly unknown[]
}
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
export type EffectEventHookSlot = {
  kind: 'effectEvent'
  fn: Function
}
export type ContextHookSlot = {
  kind: 'context'
  cleanup: () => void
}
export type HookSlot =
  | RefHookSlot
  | MemoHookSlot
  | StateHookSlot
  | ReducerHookSlot
  | EffectHookSlot
  | EffectEventHookSlot
  | ContextHookSlot
export type HooksStore = { cursor: number; slots: HookSlot[] }
type LifecycleStore = Record<string, { cursor: number; handlers: Function[] }>

export type AppInstance = {
  [key: string]: any
  __v_render: Render
  __v_hooks?: HooksStore
  __v_lifecycle?: LifecycleStore
}
export let currentApp: AppInstance | null = null
export function setCurrentApp(app: AppInstance): void {
  currentApp = app
}
export function unsetCurrentApp(): void {
  currentApp = null
}

export type ComponentInstance = WechatMiniprogram.Component.InstanceProperties &
  WechatMiniprogram.Component.InstanceMethods<Record<string, unknown>> & {
    [key: string]: any
    __v_isInjectedShareToOthersHook?: () => true
    __v_isInjectedShareToTimelineHook?: () => true
    __v_isInjectedFavoritesHook?: () => true
    __v_isInjectedExitStateHook?: () => true
    __v_listenPageScroll?: () => true
    __v_render: Render
    __v_hooks?: HooksStore
    __v_lifecycle?: LifecycleStore
    __v_props: Record<string, any>
  }
export let currentComponent: ComponentInstance | null = null
export function setCurrentComponent(component: ComponentInstance): void {
  currentComponent = component
}
export function unsetCurrentComponent(): void {
  currentComponent = null
}

export function getCurrentInstance(): AppInstance | ComponentInstance | null {
  return currentApp || currentComponent
}
