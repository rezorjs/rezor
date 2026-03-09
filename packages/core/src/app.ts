import type { Bindings, AppInstance } from './instance'
import {
  resetHooksCursor,
  resetLifecycleCursors,
  setCurrentApp,
  trimHooksStore,
  trimLifecycleBuckets,
  unsetCurrentApp,
  getLifecycleHooks,
} from './instance'
import { exclude, isFunction, toHiddenField } from './utils'

export type AppRender = (
  this: void,
  options: WechatMiniprogram.App.LaunchShowOption,
) => Bindings
export type AppOptions<T extends WechatMiniprogram.IAnyObject> = {
  render?: AppRender
} & WechatMiniprogram.App.Options<T>
type Options = Record<string, any>

export enum AppLifecycle {
  ON_LAUNCH = 'onLaunch',
  ON_SHOW = 'onShow',
  ON_HIDE = 'onHide',
  ON_ERROR = 'onError',
  ON_PAGE_NOT_FOUND = 'onPageNotFound',
  ON_UNHANDLED_REJECTION = 'onUnhandledRejection',
  ON_THEME_CHANGE = 'onThemeChange',
}

const appLifeHooks = [
  AppLifecycle.ON_SHOW,
  AppLifecycle.ON_HIDE,
  AppLifecycle.ON_ERROR,
  AppLifecycle.ON_PAGE_NOT_FOUND,
  AppLifecycle.ON_UNHANDLED_REJECTION,
  AppLifecycle.ON_THEME_CHANGE,
]

export function createApp(render: AppRender): void

export function createApp<T extends WechatMiniprogram.IAnyObject>(
  options: AppOptions<T>,
): void

export function createApp(optionsOrRender: any): void {
  let render: AppRender
  let options: Options
  if (isFunction(optionsOrRender)) {
    render = optionsOrRender
    options = {}
  } else {
    if (optionsOrRender.render === undefined) {
      App(optionsOrRender)
      return
    }

    render = optionsOrRender.render
    options = exclude(optionsOrRender, ['render'])
  }

  const originOnLaunch = options[AppLifecycle.ON_LAUNCH]
  options[AppLifecycle.ON_LAUNCH] = function (
    this: AppInstance,
    options: WechatMiniprogram.App.LaunchShowOption,
  ) {
    this[toHiddenField('render')] = () => {
      setCurrentApp(this)
      resetHooksCursor(this)
      resetLifecycleCursors(this, appLifeHooks)

      try {
        const bindings = render(options)
        if (bindings !== undefined) {
          Object.keys(bindings).forEach((key) => {
            this[key] = bindings[key]
          })
        }
      } finally {
        unsetCurrentApp()
      }

      trimHooksStore(this)
      trimLifecycleBuckets(this, appLifeHooks)
    }

    this[toHiddenField('render')]()

    if (originOnLaunch !== undefined) {
      originOnLaunch.call(this, options)
    }
  }

  options[AppLifecycle.ON_SHOW] = createLifecycle(options, AppLifecycle.ON_SHOW)
  options[AppLifecycle.ON_HIDE] = createLifecycle(options, AppLifecycle.ON_HIDE)
  options[AppLifecycle.ON_ERROR] = createLifecycle(
    options,
    AppLifecycle.ON_ERROR,
  )
  options[AppLifecycle.ON_PAGE_NOT_FOUND] = createLifecycle(
    options,
    AppLifecycle.ON_PAGE_NOT_FOUND,
  )
  options[AppLifecycle.ON_UNHANDLED_REJECTION] = createLifecycle(
    options,
    AppLifecycle.ON_UNHANDLED_REJECTION,
  )
  options[AppLifecycle.ON_THEME_CHANGE] = createLifecycle(
    options,
    AppLifecycle.ON_THEME_CHANGE,
  )

  App(options)
}

function createLifecycle(
  options: Options,
  lifecycle: AppLifecycle,
): (...args: any[]) => void {
  const originLifecycle = options[lifecycle] as Function
  return function (this: AppInstance, ...args: any[]) {
    getLifecycleHooks(this, lifecycle).forEach((hook) => hook(...args))

    if (originLifecycle !== undefined) {
      originLifecycle.call(this, ...args)
    }
  }
}
