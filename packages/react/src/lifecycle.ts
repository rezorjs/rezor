import { currentApp, getCurrentInstance } from './instance'
import { getLifecycleCursor, registerLifecycleHook } from './store'
import { AppLifecycle } from './app'
import { PageLifecycle } from './page'

const pageHookWarn =
  'Page specific lifecycle hooks can only be used during execution of render() in definePage() or defineComponent().'

export const useAppShow: (
  hook: (options: WechatMiniprogram.App.LaunchShowOption) => void,
) => void = createAppHook(AppLifecycle.ON_SHOW)
export const useAppHide: (hook: () => void) => void = createAppHook(
  AppLifecycle.ON_HIDE,
)
export const useAppError: (hook: (error: string) => void) => void =
  createAppHook(AppLifecycle.ON_ERROR)
export const usePageNotFound: (
  hook: (options: WechatMiniprogram.App.PageNotFoundOption) => void,
) => void = createAppHook(AppLifecycle.ON_PAGE_NOT_FOUND)
export const useUnhandledRejection: (
  hook: (options: WechatMiniprogram.OnUnhandledRejectionListenerResult) => void,
) => void = createAppHook(AppLifecycle.ON_UNHANDLED_REJECTION)
export const useThemeChange: (
  hook: (options: WechatMiniprogram.OnThemeChangeListenerResult) => void,
) => void = createAppHook(AppLifecycle.ON_THEME_CHANGE)

export const useShow: (hook: () => void) => void = createPageHook(
  PageLifecycle.ON_SHOW,
)
export const useHide: (hook: () => void) => void = createPageHook(
  PageLifecycle.ON_HIDE,
)
export const useRouteDone: (hook: () => void) => void = createPageHook(
  PageLifecycle.ON_ROUTE_DONE,
)
export const usePullDownRefresh: (hook: () => void) => void = createPageHook(
  PageLifecycle.ON_PULL_DOWN_REFRESH,
)
export const useReachBottom: (hook: () => void) => void = createPageHook(
  PageLifecycle.ON_REACH_BOTTOM,
)
export const useResize: (
  hook: (resize: WechatMiniprogram.Page.IResizeOption) => void,
) => void = createPageHook(PageLifecycle.ON_RESIZE)
export const useTabItemTap: (
  hook: (tap: WechatMiniprogram.Page.ITabItemTapOption) => void,
) => void = createPageHook(PageLifecycle.ON_TAB_ITEM_TAP)

export const usePageScroll = (
  hook: (scroll: WechatMiniprogram.Page.IPageScrollOption) => void,
): void => {
  const currentInstance = getCurrentInstance()
  /* istanbul ignore else -- @preserve  */
  if (currentInstance) {
    /* istanbul ignore else -- @preserve   */
    if (currentInstance.__listenPageScroll__) {
      registerLifecycleHook(currentInstance, PageLifecycle.ON_PAGE_SCROLL, hook)
    } else if (__DEV__) {
      console.warn(
        'usePageScroll() hook only works when `listenPageScroll` is configured to true.',
      )
    }
  } else if (__DEV__) {
    console.warn(pageHookWarn)
  }
}

export const useShareAppMessage = (
  hook: (
    share: WechatMiniprogram.Page.IShareAppMessageOption,
  ) =>
    | WechatMiniprogram.Page.ICustomShareContent
    | WechatMiniprogram.Page.IAsyncCustomShareContent
    | Promise<WechatMiniprogram.Page.ICustomShareContent>
    | void
    | Promise<void>,
): void => {
  const currentInstance = getCurrentInstance()
  /* istanbul ignore else -- @preserve  */
  if (currentInstance) {
    /* istanbul ignore else -- @preserve  */
    if (currentInstance.__isInjectedShareToOthersHook__) {
      const cursor = getLifecycleCursor(
        currentInstance,
        PageLifecycle.ON_SHARE_APP_MESSAGE,
      )
      /* istanbul ignore else -- @preserve  */
      if (cursor === 0) {
        registerLifecycleHook(
          currentInstance,
          PageLifecycle.ON_SHARE_APP_MESSAGE,
          hook,
        )
      } else if (__DEV__) {
        console.warn('useShareAppMessage() hook can only be called once.')
      }
    } else if (__DEV__) {
      console.warn(
        'useShareAppMessage() hook only works when `onShareAppMessage` option does not exist and `canShareToOthers` is configured to true.',
      )
    }
  } else if (__DEV__) {
    console.warn(pageHookWarn)
  }
}

export const useShareTimeline = (
  hook: () => WechatMiniprogram.Page.ICustomTimelineContent | void,
): void => {
  const currentInstance = getCurrentInstance()
  /* istanbul ignore else -- @preserve  */
  if (currentInstance) {
    /* istanbul ignore else -- @preserve  */
    if (currentInstance.__isInjectedShareToTimelineHook__) {
      const cursor = getLifecycleCursor(
        currentInstance,
        PageLifecycle.ON_SHARE_TIMELINE,
      )
      /* istanbul ignore else -- @preserve  */
      if (cursor === 0) {
        registerLifecycleHook(
          currentInstance,
          PageLifecycle.ON_SHARE_TIMELINE,
          hook,
        )
      } else if (__DEV__) {
        console.warn('useShareTimeline() hook can only be called once.')
      }
    } else if (__DEV__) {
      console.warn(
        'useShareTimeline() hook only works when `onShareTimeline` option does not exist and `canShareToTimeline` is configured to true.',
      )
    }
  } else if (__DEV__) {
    console.warn(pageHookWarn)
  }
}

export const useAddToFavorites = (
  hook: (
    share: WechatMiniprogram.Page.IAddToFavoritesOption,
  ) => WechatMiniprogram.Page.IAddToFavoritesContent,
): void => {
  const currentInstance = getCurrentInstance()
  /* istanbul ignore else -- @preserve  */
  if (currentInstance) {
    /* istanbul ignore else -- @preserve  */
    if (currentInstance.__isInjectedFavoritesHook__) {
      const cursor = getLifecycleCursor(
        currentInstance,
        PageLifecycle.ON_ADD_TO_FAVORITES,
      )
      /* istanbul ignore else -- @preserve  */
      if (cursor === 0) {
        registerLifecycleHook(
          currentInstance,
          PageLifecycle.ON_ADD_TO_FAVORITES,
          hook,
        )
      } else if (__DEV__) {
        console.warn('useAddToFavorites() hook can only be called once.')
      }
    } else if (__DEV__) {
      console.warn(
        'useAddToFavorites() hook only works when `onAddToFavorites` option does not exist.',
      )
    }
  } else if (__DEV__) {
    console.warn(pageHookWarn)
  }
}

export const useSaveExitState = (
  hook: () => WechatMiniprogram.Page.ISaveExitState,
): void => {
  const currentInstance = getCurrentInstance()
  /* istanbul ignore else -- @preserve  */
  if (currentInstance) {
    /* istanbul ignore else -- @preserve  */
    if (currentInstance.__isInjectedExitStateHook__) {
      const cursor = getLifecycleCursor(
        currentInstance,
        PageLifecycle.ON_SAVE_EXIT_STATE,
      )
      /* istanbul ignore else -- @preserve  */
      if (cursor === 0) {
        registerLifecycleHook(
          currentInstance,
          PageLifecycle.ON_SAVE_EXIT_STATE,
          hook,
        )
      } else if (__DEV__) {
        console.warn('useSaveExitState() hook can only be called once.')
      }
    } else if (__DEV__) {
      console.warn(
        'useSaveExitState() hook only works when `onSaveExitState` option does not exist.',
      )
    }
  } else if (__DEV__) {
    console.warn(pageHookWarn)
  }
}

function createAppHook(lifecycle: AppLifecycle) {
  return (hook: Function): void => {
    /* istanbul ignore else -- @preserve  */
    if (currentApp) {
      registerLifecycleHook(currentApp, lifecycle, hook)
    } else if (__DEV__) {
      console.warn(
        'App specific lifecycle hooks can only be used during execution of render() in createApp().',
      )
    }
  }
}

function createPageHook(lifecycle: PageLifecycle) {
  return (hook: Function): void => {
    const currentInstance = getCurrentInstance()
    /* istanbul ignore else -- @preserve  */
    if (currentInstance) {
      registerLifecycleHook(currentInstance, lifecycle, hook)
    } else if (__DEV__) {
      console.warn(pageHookWarn)
    }
  }
}
