/// <reference types="miniprogram-api-typings" preserve="true" />

// Core API ------------------------------------------------------------------

export { useRef } from './use-ref'
export { useState } from './use-state'
export { useEffect } from './use-effect'
export { useReducer } from './use-reducer'
export { useMemo, useCallback } from './use-memo'
export { useEffectEvent } from './use-effect-event'
export { nextTick } from './scheduler'
export { createApp } from './app'
export { definePage } from './page'
export { defineComponent } from './component'
export {
  useAppShow,
  useAppHide,
  useAppError,
  usePageNotFound,
  useUnhandledRejection,
  useThemeChange,
  useShow,
  useHide,
  useRouteDone,
  usePullDownRefresh,
  useReachBottom,
  useResize,
  useTabItemTap,
  usePageScroll,
  useShareAppMessage,
  useShareTimeline,
  useAddToFavorites,
  useSaveExitState,
  onMove,
  onError,
} from './lifecycle'

// Types -----------------------------------------------------------------------

export type { AppRender, AppOptions } from './app'
export type {
  Query,
  PageContext,
  PageRender,
  PageOptions,
  Config,
} from './page'
export type {
  ComponentContext,
  ComponentRender,
  ComponentOptions,
} from './component'
