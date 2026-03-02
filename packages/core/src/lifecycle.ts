import type { AppInstance } from './instance'
import { currentApp } from './instance'
import { AppLifecycle } from './app'
import { toHiddenField } from './utils'

export const useAppShow: (
  hook: (options: WechatMiniprogram.App.LaunchShowOption) => unknown,
) => void = createAppHook(AppLifecycle.ON_SHOW)
export const useAppHide: (hook: () => unknown) => void = createAppHook(
  AppLifecycle.ON_HIDE,
)
export const useAppError: (hook: (error: string) => unknown) => void =
  createAppHook(AppLifecycle.ON_ERROR)
export const usePageNotFound: (
  hook: (options: WechatMiniprogram.App.PageNotFoundOption) => unknown,
) => void = createAppHook(AppLifecycle.ON_PAGE_NOT_FOUND)
export const useUnhandledRejection: (
  hook: (
    options: WechatMiniprogram.OnUnhandledRejectionListenerResult,
  ) => unknown,
) => void = createAppHook(AppLifecycle.ON_UNHANDLED_REJECTION)
export const useThemeChange: (
  hook: (options: WechatMiniprogram.OnThemeChangeListenerResult) => unknown,
) => void = createAppHook(AppLifecycle.ON_THEME_CHANGE)

function createAppHook(lifecycle: AppLifecycle) {
  return (hook: Function): void => {
    /* istanbul ignore else -- @preserve  */
    if (currentApp) {
      injectHook(currentApp, lifecycle, hook)
    } else if (__DEV__) {
      console.warn(
        'App specific lifecycle injection APIs can only be used during execution of render() in createApp().',
      )
    }
  }
}

function injectHook(
  currentInstance: AppInstance,
  lifecycle: AppLifecycle,
  hook: Function,
): void {
  const hiddenField = toHiddenField(lifecycle)
  if (currentInstance[hiddenField] === undefined) {
    currentInstance[hiddenField] = []
    currentInstance[hiddenField].index = 0
  }

  currentInstance[hiddenField][currentInstance[hiddenField].index] = hook
  currentInstance[hiddenField].index += 1
}
