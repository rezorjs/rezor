import { describe, test, expect, vi } from 'vitest'
import {
  createApp,
  useAppShow,
  useAppHide,
  useAppError,
  usePageNotFound,
  useUnhandledRejection,
  useThemeChange,
} from '../src'

// Mocks
let app: Record<string, any>
// @ts-expect-error
globalThis.App = (options: Record<string, any>) => {
  app = options
}

describe('app', () => {
  test('binding', () => {
    createApp(() => {
      const num = 0

      return { num }
    })
    app.onLaunch()
    expect(app.num).toBe(0)
  })

  test('onLaunch', () => {
    const arg = {}
    const onLaunch = vi.fn()
    const render = vi.fn()
    createApp({ onLaunch, render })
    app.onLaunch(arg)
    expect(onLaunch).toBeCalledWith(arg)
    expect(render).toBeCalledWith(arg)
  })

  test('onShow', () => {
    const arg = {}
    const fn = vi.fn()
    const injectedFn1 = vi.fn()
    const injectedFn2 = vi.fn()
    createApp({
      onShow: fn,
      render() {
        useAppShow(injectedFn1)
        useAppShow(injectedFn2)
      },
    })
    app.onLaunch()
    app.onShow(arg)
    expect(fn).toBeCalledWith(arg)
    expect(injectedFn1).toBeCalledWith(arg)
    expect(injectedFn2).toBeCalledWith(arg)
  })

  test('onHide', () => {
    const fn = vi.fn()
    const injectedFn1 = vi.fn()
    const injectedFn2 = vi.fn()
    createApp({
      onHide: fn,
      render() {
        useAppHide(injectedFn1)
        useAppHide(injectedFn2)
      },
    })
    app.onLaunch()
    app.onHide()
    expect(fn).toBeCalledTimes(1)
    expect(injectedFn1).toBeCalledTimes(1)
    expect(injectedFn2).toBeCalledTimes(1)
  })

  test('onError', () => {
    const arg = ''
    const fn = vi.fn()
    const injectedFn1 = vi.fn()
    const injectedFn2 = vi.fn()
    createApp({
      onError: fn,
      render() {
        useAppError(injectedFn1)
        useAppError(injectedFn2)
      },
    })
    app.onLaunch()
    app.onError(arg)
    expect(fn).toBeCalledWith(arg)
    expect(injectedFn1).toBeCalledWith(arg)
    expect(injectedFn2).toBeCalledWith(arg)
  })

  test('onPageNotFound', () => {
    const arg = {}
    const fn = vi.fn()
    const injectedFn1 = vi.fn()
    const injectedFn2 = vi.fn()
    createApp({
      onPageNotFound: fn,
      render() {
        usePageNotFound(injectedFn1)
        usePageNotFound(injectedFn2)
      },
    })
    app.onLaunch()
    app.onPageNotFound(arg)
    expect(fn).toBeCalledWith(arg)
    expect(injectedFn1).toBeCalledWith(arg)
    expect(injectedFn2).toBeCalledWith(arg)
  })

  test('onUnhandledRejection', () => {
    const arg = {}
    const fn = vi.fn()
    const injectedFn1 = vi.fn()
    const injectedFn2 = vi.fn()
    createApp({
      onUnhandledRejection: fn,
      render() {
        useUnhandledRejection(injectedFn1)
        useUnhandledRejection(injectedFn2)
      },
    })
    app.onLaunch()
    app.onUnhandledRejection(arg)
    expect(fn).toBeCalledWith(arg)
    expect(injectedFn1).toBeCalledWith(arg)
    expect(injectedFn2).toBeCalledWith(arg)
  })

  test('onThemeChange', () => {
    const arg = {}
    const fn = vi.fn()
    const injectedFn1 = vi.fn()
    const injectedFn2 = vi.fn()
    createApp({
      onThemeChange: fn,
      render() {
        useThemeChange(injectedFn1)
        useThemeChange(injectedFn2)
      },
    })
    app.onLaunch()
    app.onThemeChange(arg)
    expect(fn).toBeCalledWith(arg)
    expect(injectedFn1).toBeCalledWith(arg)
    expect(injectedFn2).toBeCalledWith(arg)
  })

  test('inject lifecycle outside render', () => {
    useAppShow(() => {})
    expect('App specific lifecycle').toHaveBeenWarned()
  })

  test('no injected lifecycle', () => {
    const fn = vi.fn()
    createApp({
      onHide: fn,
      render() {
        return { num: 0 }
      },
    })
    app.onLaunch()
    expect(app.num).toBe(0)

    app.onHide()
    expect(fn).toBeCalledTimes(1)
  })

  test('only injected lifecycle', () => {
    const fn = vi.fn()
    createApp(() => {
      useAppHide(fn)
    })
    app.onLaunch()
    app.onHide()
    expect(fn).toBeCalledTimes(1)
  })

  test('no render', () => {
    const options = {}
    createApp(options)
    expect(app).toBeInstanceOf(Object)
  })
})
