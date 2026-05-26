import type { SchedulerJob } from './scheduler'
import { flushPostFlushCbs, SchedulerJobFlags } from './scheduler'
import type { Bindings, PageInstance } from './instance'
import { setCurrentPage, unsetCurrentPage } from './instance'
import {
  resetHooksCursor,
  resetLifecycleCursors,
  trimHooksStore,
  trimLifecycleBuckets,
  getHooksStore,
  getLifecycleHooks,
} from './store'
import { extend, exclude, hasOwn, isFunction } from './utils'

export type Query = Record<string, string | undefined>
export type PageContext = WechatMiniprogram.Page.InstanceProperties &
  Omit<
    WechatMiniprogram.Page.InstanceMethods<Record<string, any>>,
    | 'setData'
    | 'groupSetData'
    | 'hasBehavior'
    | 'triggerEvent'
    | 'selectOwnerComponent'
    | 'getRelationNodes'
  >
export type PageRender = (
  this: void,
  query: Query,
  context: PageContext,
) => Bindings
export type PageOptions<
  Data extends WechatMiniprogram.Page.DataOption,
  Custom extends WechatMiniprogram.Page.CustomOption,
> = { render?: PageRender } & WechatMiniprogram.Page.Options<Data, Custom>
export interface Config {
  listenPageScroll?: boolean
  canShareToOthers?: boolean
  canShareToTimeline?: boolean
}
type Options = Record<string, any>

export enum PageLifecycle {
  ON_LOAD = 'onLoad',
  ON_SHOW = 'onShow',
  ON_READY = 'onReady',
  ON_HIDE = 'onHide',
  ON_UNLOAD = 'onUnload',
  ON_ROUTE_DONE = 'onRouteDone',
  ON_PULL_DOWN_REFRESH = 'onPullDownRefresh',
  ON_REACH_BOTTOM = 'onReachBottom',
  ON_PAGE_SCROLL = 'onPageScroll',
  ON_SHARE_APP_MESSAGE = 'onShareAppMessage',
  ON_SHARE_TIMELINE = 'onShareTimeline',
  ON_ADD_TO_FAVORITES = 'onAddToFavorites',
  ON_RESIZE = 'onResize',
  ON_TAB_ITEM_TAP = 'onTabItemTap',
  ON_SAVE_EXIT_STATE = 'onSaveExitState',
}

export const pageLifeHooks: PageLifecycle[] = [
  PageLifecycle.ON_SHOW,
  PageLifecycle.ON_HIDE,
  PageLifecycle.ON_ROUTE_DONE,
  PageLifecycle.ON_PULL_DOWN_REFRESH,
  PageLifecycle.ON_REACH_BOTTOM,
  PageLifecycle.ON_PAGE_SCROLL,
  PageLifecycle.ON_SHARE_APP_MESSAGE,
  PageLifecycle.ON_SHARE_TIMELINE,
  PageLifecycle.ON_ADD_TO_FAVORITES,
  PageLifecycle.ON_RESIZE,
  PageLifecycle.ON_TAB_ITEM_TAP,
  PageLifecycle.ON_SAVE_EXIT_STATE,
]

export function definePage(render: PageRender, config?: Config): void
export function definePage<
  Data extends WechatMiniprogram.Page.DataOption,
  Custom extends WechatMiniprogram.Page.CustomOption,
>(options: PageOptions<Data, Custom>, config?: Config): void
export function definePage(optionsOrRender: any, config?: Config): void {
  config = extend(
    {
      listenPageScroll: false,
      canShareToOthers: false,
      canShareToTimeline: false,
    },
    config,
  )
  let render: PageRender
  let options: Options
  if (isFunction(optionsOrRender)) {
    render = optionsOrRender
    options = {}
  } else {
    if (optionsOrRender.render === undefined) {
      Page(optionsOrRender)
      return
    }

    render = optionsOrRender.render
    options = exclude(optionsOrRender, ['render'])
  }

  const originOnLoad = options[PageLifecycle.ON_LOAD]
  options[PageLifecycle.ON_LOAD] = function (this: PageInstance, query: Query) {
    const context: PageContext = {
      is: this.is,
      route: this.route,
      options: this.options,
      exitState: this.exitState,
      router: this.router,
      pageRouter: this.pageRouter,
      renderer: this.renderer,
      createSelectorQuery: this.createSelectorQuery.bind(this),
      createIntersectionObserver: this.createIntersectionObserver.bind(this),
      createMediaQueryObserver: this.createMediaQueryObserver.bind(this),
      selectComponent: this.selectComponent.bind(this),
      selectAllComponents: this.selectAllComponents.bind(this),
      getTabBar: this.getTabBar.bind(this),
      getPageId: this.getPageId.bind(this),
      animate: this.animate.bind(this),
      clearAnimation: this.clearAnimation.bind(this),
      getOpenerEventChannel: this.getOpenerEventChannel.bind(this),
      applyAnimatedStyle: this.applyAnimatedStyle.bind(this),
      clearAnimatedStyle: this.clearAnimatedStyle.bind(this),
      setUpdatePerformanceListener:
        this.setUpdatePerformanceListener.bind(this),
      getPassiveEvent: this.getPassiveEvent.bind(this),
      setPassiveEvent: this.setPassiveEvent.bind(this),
      setInitialRenderingCache: this.setInitialRenderingCache.bind(this),
      getAppBar: this.getAppBar && this.getAppBar.bind(this),
    }

    this.__render__ = () => {
      setCurrentPage(this)
      resetHooksCursor(this)
      resetLifecycleCursors(this, pageLifeHooks)

      let bindings: Bindings
      try {
        bindings = render(query, context)
      } finally {
        unsetCurrentPage()
      }

      trimHooksStore(this)
      trimLifecycleBuckets(this, pageLifeHooks)

      if (bindings !== undefined) {
        let data: Record<string, unknown> | undefined
        Object.keys(bindings).forEach((key) => {
          const value = bindings[key]
          if (isFunction(value) && !value.__data__) {
            this[key] = value
            return
          }

          if (!hasOwn(this.data, key) || !Object.is(this.data[key], value)) {
            data = data || {}
            data[key] = value
          }
        })
        if (data !== undefined) {
          // May call sub component's render synchronously, so should call after unsetCurrentPage()
          this.setData(data, flushPostFlushCbs)
        }
      }
    }

    this.__render__()

    if (originOnLoad !== undefined) {
      originOnLoad.call(this, query)
    }
  }

  const originOnReady = options[PageLifecycle.ON_READY] as Function
  options[PageLifecycle.ON_READY] = function (this: PageInstance) {
    flushPostFlushCbs()
    if (originOnReady !== undefined) {
      originOnReady.call(this)
    }
  }

  const originOnUnload = options[PageLifecycle.ON_UNLOAD] as Function
  options[PageLifecycle.ON_UNLOAD] = function (this: PageInstance) {
    const renderJob: SchedulerJob = this.__render__
    renderJob.flags! |= SchedulerJobFlags.DISPOSED

    const store = getHooksStore(this)
    store.slots.forEach((slot) => {
      if (slot.kind === 'effect') {
        if (slot.job) {
          slot.job.flags! |= SchedulerJobFlags.DISPOSED
          slot.job = undefined
        }

        if (slot.cleanup) {
          slot.cleanup()
        }
      } else if (slot.kind === 'context') {
        slot.cleanup()
      }
    })
    if (originOnUnload !== undefined) {
      originOnUnload.call(this)
    }
  }

  if (options[PageLifecycle.ON_PAGE_SCROLL] || config.listenPageScroll) {
    options[PageLifecycle.ON_PAGE_SCROLL] = createLifecycle(
      options,
      PageLifecycle.ON_PAGE_SCROLL,
    )
    /* istanbul ignore next -- @preserve */
    options.__listenPageScroll__ = () => true
  }

  if (
    options[PageLifecycle.ON_SHARE_APP_MESSAGE] === undefined &&
    config.canShareToOthers
  ) {
    options[PageLifecycle.ON_SHARE_APP_MESSAGE] = createReturnLifecycle(
      PageLifecycle.ON_SHARE_APP_MESSAGE,
      () => ({}),
    )

    /* istanbul ignore next -- @preserve */
    options.__isInjectedShareToOthersHook__ = () => true
  }

  if (
    options[PageLifecycle.ON_SHARE_TIMELINE] === undefined &&
    config.canShareToTimeline
  ) {
    options[PageLifecycle.ON_SHARE_TIMELINE] = createReturnLifecycle(
      PageLifecycle.ON_SHARE_TIMELINE,
      () => ({}),
    )

    /* istanbul ignore next -- @preserve */
    options.__isInjectedShareToTimelineHook__ = () => true
  }

  if (options[PageLifecycle.ON_ADD_TO_FAVORITES] === undefined) {
    options[PageLifecycle.ON_ADD_TO_FAVORITES] = createReturnLifecycle(
      PageLifecycle.ON_ADD_TO_FAVORITES,
      () => ({}),
    )

    /* istanbul ignore next -- @preserve */
    options.__isInjectedFavoritesHook__ = () => true
  }

  if (options[PageLifecycle.ON_SAVE_EXIT_STATE] === undefined) {
    options[PageLifecycle.ON_SAVE_EXIT_STATE] = createReturnLifecycle(
      PageLifecycle.ON_SAVE_EXIT_STATE,
      () => ({ data: undefined }),
    )

    /* istanbul ignore next -- @preserve */
    options.__isInjectedExitStateHook__ = () => true
  }

  options[PageLifecycle.ON_SHOW] = createLifecycle(
    options,
    PageLifecycle.ON_SHOW,
  )
  options[PageLifecycle.ON_HIDE] = createLifecycle(
    options,
    PageLifecycle.ON_HIDE,
  )
  options[PageLifecycle.ON_ROUTE_DONE] = createLifecycle(
    options,
    PageLifecycle.ON_ROUTE_DONE,
  )
  options[PageLifecycle.ON_PULL_DOWN_REFRESH] = createLifecycle(
    options,
    PageLifecycle.ON_PULL_DOWN_REFRESH,
  )
  options[PageLifecycle.ON_REACH_BOTTOM] = createLifecycle(
    options,
    PageLifecycle.ON_REACH_BOTTOM,
  )
  options[PageLifecycle.ON_RESIZE] = createLifecycle(
    options,
    PageLifecycle.ON_RESIZE,
  )
  options[PageLifecycle.ON_TAB_ITEM_TAP] = createLifecycle(
    options,
    PageLifecycle.ON_TAB_ITEM_TAP,
  )

  Page(options)
}

function createLifecycle(
  options: Options,
  lifecycle: PageLifecycle,
): (...args: any[]) => void {
  const originLifecycle = options[lifecycle]
  return function (this: PageInstance, ...args: any[]) {
    getLifecycleHooks(this, lifecycle).forEach((hook) => hook(...args))

    if (originLifecycle !== undefined) {
      originLifecycle.call(this, ...args)
    }
  }
}

function createReturnLifecycle(
  lifecycle: PageLifecycle,
  getDefaultValue: () => any,
): (...args: any[]) => any {
  return function (this: PageInstance, ...args: any[]) {
    const [hook] = getLifecycleHooks(this, lifecycle)
    if (hook) {
      return hook(...args)
    }

    return getDefaultValue()
  }
}
