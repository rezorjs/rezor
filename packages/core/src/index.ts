/// <reference types="miniprogram-api-typings" preserve="true" />

// Core API ------------------------------------------------------------------

export { createApp } from './app'
export {
  onAppShow,
  onAppHide,
  onAppError,
  onPageNotFound,
  onUnhandledRejection,
  onThemeChange,
} from './lifecycle'

// Types -----------------------------------------------------------------------

export type { AppRender, AppOptions } from './app'
