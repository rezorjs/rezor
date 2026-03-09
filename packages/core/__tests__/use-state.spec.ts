import { describe, test, expect, vi } from 'vitest'
import { createApp, useState, nextTick } from '../src'

// Mocks
let app: Record<string, any>
// @ts-expect-error
globalThis.App = (options: Record<string, any>) => {
  app = options
}

describe('useState', () => {
  test('returns initial value', () => {
    createApp(() => {
      const [count] = useState(0)
      return { count }
    })
    app.onLaunch()
    expect(app.count).toBe(0)
  })

  test('returns same state across renders', async () => {
    const obj = {}
    createApp(() => {
      const [state] = useState(obj)
      const [count, setCount] = useState(0)
      return { state, count, setCount }
    })
    app.onLaunch()
    expect(app.state).toBe(obj)
    expect(app.count).toBe(0)

    app.setCount(1)
    await nextTick()
    expect(app.state).toBe(obj)
    expect(app.count).toBe(1)
  })

  test('accepts initializer function', () => {
    const init = vi.fn(() => 42)
    createApp(() => {
      const [value] = useState(init)
      return { value }
    })
    app.onLaunch()
    expect(app.value).toBe(42)
    expect(init).toHaveBeenCalledTimes(1)
  })

  test('initializer only called once across renders', async () => {
    const init = vi.fn(() => 0)
    createApp(() => {
      const [value, setValue] = useState(init)
      return { value, setValue }
    })
    app.onLaunch()
    expect(app.value).toBe(0)
    expect(init).toHaveBeenCalledTimes(1)

    app.setValue(1)
    await nextTick()
    expect(app.value).toBe(1)
    expect(init).toHaveBeenCalledTimes(1)
  })

  test('setState is stable across renders', async () => {
    let setState: Function | undefined
    createApp(() => {
      const [count, setCount] = useState(0)
      if (!setState) {
        setState = setCount
      }
      return { count, setCount }
    })
    app.onLaunch()
    expect(app.count).toBe(0)
    expect(app.setCount).toBe(setState)

    app.setCount(1)
    await nextTick()
    expect(app.count).toBe(1)
    expect(app.setCount).toBe(setState)
  })

  test('setState triggers re-render', async () => {
    const renderSpy = vi.fn()
    createApp(() => {
      renderSpy()
      const [count, setCount] = useState(0)
      return { count, setCount }
    })
    app.onLaunch()
    expect(app.count).toBe(0)
    expect(renderSpy).toHaveBeenCalledTimes(1)

    app.setCount(1)
    await nextTick()
    expect(app.count).toBe(1)
    expect(renderSpy).toHaveBeenCalledTimes(2)
  })

  test('setState with updater function', async () => {
    createApp(() => {
      const [count, setCount] = useState(0)
      return { count, setCount }
    })
    app.onLaunch()

    app.setCount((prev: number) => prev + 1)
    await nextTick()
    expect(app.count).toBe(1)

    app.setCount((prev: number) => prev + 10)
    await nextTick()
    expect(app.count).toBe(11)
  })

  test('bails out when value is the same (Object.is)', async () => {
    const renderSpy = vi.fn()
    createApp(() => {
      renderSpy()
      const [count, setCount] = useState(0)
      return { count, setCount }
    })
    app.onLaunch()
    expect(renderSpy).toHaveBeenCalledTimes(1)

    app.setCount(0)
    await nextTick()
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })

  test('multiple states are independent', async () => {
    createApp(() => {
      const [a, setA] = useState('hello')
      const [b, setB] = useState(100)
      return { a, setA, b, setB }
    })
    app.onLaunch()
    expect(app.a).toBe('hello')
    expect(app.b).toBe(100)

    app.setA('world')
    await nextTick()
    expect(app.a).toBe('world')
    expect(app.b).toBe(100)

    app.setB(200)
    await nextTick()
    expect(app.a).toBe('world')
    expect(app.b).toBe(200)
  })

  test('batches multiple setState calls', async () => {
    const renderSpy = vi.fn()
    createApp(() => {
      renderSpy()
      const [count, setCount] = useState(0)
      return { count, setCount }
    })
    app.onLaunch()
    expect(renderSpy).toHaveBeenCalledTimes(1)

    app.setCount(1)
    app.setCount(2)
    app.setCount(3)
    await nextTick()
    // Should only re-render once despite 3 setState calls
    expect(renderSpy).toHaveBeenCalledTimes(2)
    expect(app.count).toBe(3)
  })

  test('warning outside render', () => {
    useState(0)
    expect('useState() hook can only be').toHaveBeenWarned()
  })
})
