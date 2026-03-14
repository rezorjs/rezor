import { describe, test, expect, vi } from 'vitest'
import { createApp, definePage, useState, useEffect, nextTick } from '../src'

// Mocks
let app: Record<string, any>
// @ts-expect-error
globalThis.App = (options: Record<string, any>) => {
  app = options
}
let page: Record<string, any>
let renderCb: () => void
// @ts-expect-error
globalThis.Page = (options: Record<string, any>) => {
  page = {
    ...options,
    is: '',
    route: '',
    options: {},
    createSelectorQuery() {},
    createIntersectionObserver() {},
    createMediaQueryObserver() {},
    selectComponent() {},
    selectAllComponents() {},
    getTabBar() {},
    getPageId() {},
    animate() {},
    clearAnimation() {},
    getOpenerEventChannel() {},
    applyAnimatedStyle() {},
    clearAnimatedStyle() {},
    setUpdatePerformanceListener() {},
    getPassiveEvent() {},
    setPassiveEvent() {},
    setInitialRenderingCache() {},
    setData(data: Record<string, unknown>, callback: () => void) {
      this.data = this.data || {}
      Object.keys(data).forEach((key) => {
        this.data[key] = data[key]
      })

      renderCb = callback
    },
  }
}

describe('useEffect', () => {
  test('runs after render', () => {
    const effect1 = vi.fn()
    const effect2 = vi.fn()
    createApp(() => {
      useEffect(effect1)
    })
    app.onLaunch()
    definePage(() => {
      const [count, setCount] = useState(0)
      useEffect(effect2)
      return { count, setCount }
    })
    page.onLoad()
    // Effect should not run during render
    expect(effect1).toBeCalledTimes(0)
    expect(effect2).toBeCalledTimes(0)

    page.onReady()
    renderCb()
    expect(effect1).toBeCalledTimes(1)
    expect(effect2).toBeCalledTimes(1)
  })

  test('runs after every render when no deps', async () => {
    const effect = vi.fn()
    definePage(() => {
      const [count, setCount] = useState(0)
      useEffect(effect)
      return { count, setCount }
    })
    page.onLoad()
    page.onReady()
    renderCb()
    expect(effect).toBeCalledTimes(1)

    page.setCount(1)
    await nextTick()
    renderCb()
    expect(effect).toBeCalledTimes(2)

    page.setCount(2)
    await nextTick()
    renderCb()
    expect(effect).toBeCalledTimes(3)
  })

  test('runs only once with empty deps', async () => {
    const effect = vi.fn()
    definePage(() => {
      const [count, setCount] = useState(0)
      useEffect(effect, [])
      return { count, setCount }
    })
    page.onLoad()
    page.onReady()
    renderCb()
    expect(effect).toBeCalledTimes(1)

    page.setCount(1)
    await nextTick()
    renderCb()
    expect(effect).toBeCalledTimes(1)
  })

  test('runs when deps change', async () => {
    const effect = vi.fn()
    definePage(() => {
      const [count, setCount] = useState(0)
      useEffect(effect, [count])
      return { count, setCount }
    })
    page.onLoad()
    page.onReady()
    renderCb()
    expect(effect).toBeCalledTimes(1)

    page.setCount(1)
    await nextTick()
    renderCb()
    expect(effect).toBeCalledTimes(2)

    // Same value — should not re-run (useState bails out)
    page.setCount(1)
    await nextTick()
    renderCb()
    expect(effect).toBeCalledTimes(2)
  })

  test('runs cleanup before re-running effect', async () => {
    const calls: string[] = []
    definePage(() => {
      const [count, setCount] = useState(0)
      useEffect(() => {
        calls.push(`effect ${count}`)
        return () => {
          calls.push(`cleanup ${count}`)
        }
      }, [count])
      return { count, setCount }
    })
    page.onLoad()
    page.onReady()
    renderCb()
    expect(calls).toEqual(['effect 0'])

    page.setCount(1)
    await nextTick()
    renderCb()
    expect(calls).toEqual(['effect 0', 'cleanup 0', 'effect 1'])

    page.setCount(2)
    await nextTick()
    renderCb()
    expect(calls).toEqual([
      'effect 0',
      'cleanup 0',
      'effect 1',
      'cleanup 1',
      'effect 2',
    ])
  })

  test('runs cleanup on no-deps effect', async () => {
    const calls: string[] = []
    definePage(() => {
      const [count, setCount] = useState(0)
      useEffect(() => {
        calls.push('effect')
        return () => {
          calls.push('cleanup')
        }
      })
      return { count, setCount }
    })
    page.onLoad()
    page.onReady()
    renderCb()
    expect(calls).toEqual(['effect'])

    page.setCount(1)
    await nextTick()
    renderCb()
    expect(calls).toEqual(['effect', 'cleanup', 'effect'])
  })

  test('warning outside render', () => {
    useEffect(() => {})
    expect('useEffect() hook can only be').toHaveBeenWarned()
  })
})
