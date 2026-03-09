import { describe, test, expect, vi } from 'vitest'
import { createApp, useMemo, useCallback, useState, nextTick } from '../src'

// Mocks
let app: Record<string, any>
// @ts-expect-error
globalThis.App = (options: Record<string, any>) => {
  app = options
}

describe('useMemo', () => {
  test('computes value on first render', () => {
    const factory = vi.fn(() => 42)
    createApp(() => {
      const value = useMemo(factory, [])
      return { value }
    })
    app.onLaunch()
    expect(app.value).toBe(42)
    expect(factory).toHaveBeenCalledTimes(1)
  })

  test('returns cached value when deps unchanged', async () => {
    const factory = vi.fn(() => ({ result: 'computed' }))
    createApp(() => {
      const [count, setCount] = useState(0)
      const value = useMemo(factory, ['stable'])
      return { count, setCount, value }
    })
    app.onLaunch()
    const firstValue = app.value
    expect(factory).toHaveBeenCalledTimes(1)

    app.setCount(1)
    await nextTick()
    expect(app.value).toBe(firstValue)
    expect(factory).toHaveBeenCalledTimes(1)
  })

  test('recomputes when deps change', async () => {
    createApp(() => {
      const [count, setCount] = useState(0)
      const doubled = useMemo(() => count * 2, [count])
      return { count, setCount, doubled }
    })
    app.onLaunch()
    expect(app.doubled).toBe(0)

    app.setCount(3)
    await nextTick()
    expect(app.doubled).toBe(6)

    app.setCount(5)
    await nextTick()
    expect(app.doubled).toBe(10)
  })

  test('multiple memos are independent', async () => {
    const factoryA = vi.fn(() => 'a')
    const factoryB = vi.fn(() => 'b')
    createApp(() => {
      const [count, setCount] = useState(0)
      const a = useMemo(factoryA, [])
      const b = useMemo(factoryB, [count])
      return { count, setCount, a, b }
    })
    app.onLaunch()
    expect(factoryA).toHaveBeenCalledTimes(1)
    expect(factoryB).toHaveBeenCalledTimes(1)

    app.setCount(1)
    await nextTick()
    // a deps unchanged, b deps changed
    expect(factoryA).toHaveBeenCalledTimes(1)
    expect(factoryB).toHaveBeenCalledTimes(2)
  })

  test('warning outside render', () => {
    useMemo(() => 1, [])
    expect('useMemo() hook can only be').toHaveBeenWarned()
  })
})

describe('useCallback', () => {
  test('returns same function when deps unchanged', async () => {
    createApp(() => {
      const [count, setCount] = useState(0)
      const cb = useCallback(() => 'hello', [])
      return { count, setCount, cb }
    })
    app.onLaunch()
    const firstCb = app.cb

    app.setCount(1)
    await nextTick()
    expect(app.cb).toBe(firstCb)
  })

  test('returns new function when deps change', async () => {
    createApp(() => {
      const [count, setCount] = useState(0)
      const cb = useCallback(() => count, [count])
      return { count, setCount, cb }
    })
    app.onLaunch()
    const firstCb = app.cb
    expect(firstCb()).toBe(0)

    app.setCount(1)
    await nextTick()
    expect(app.cb).not.toBe(firstCb)
    expect(app.cb()).toBe(1)
  })

  test('warning outside render', () => {
    useCallback(() => {}, [])
    expect('useCallback() hook can only be').toHaveBeenWarned()
  })
})
