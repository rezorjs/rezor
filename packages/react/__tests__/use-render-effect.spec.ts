import { describe, test, expect, vi } from 'vitest'
import { createApp, useState, useRenderEffect, nextTick } from '../src'

// Mocks
let app: Record<string, any>
// @ts-expect-error
globalThis.App = (options: Record<string, any>) => {
  app = options
}

describe('useRenderEffect', () => {
  test('runs after render', async () => {
    const effect = vi.fn()
    createApp(() => {
      useRenderEffect(effect)
    })

    app.onLaunch()
    expect(effect).toHaveBeenCalledTimes(0)

    await nextTick()
    expect(effect).toHaveBeenCalledTimes(1)
  })

  test('runs after every render when no deps', async () => {
    const effect = vi.fn()
    createApp(() => {
      const [count, setCount] = useState(0)
      useRenderEffect(effect)
      return { count, setCount }
    })

    app.onLaunch()
    expect(effect).toHaveBeenCalledTimes(0)

    await nextTick()
    expect(effect).toHaveBeenCalledTimes(1)

    app.setCount(1)
    await nextTick()
    expect(effect).toHaveBeenCalledTimes(2)

    app.setCount(2)
    await nextTick()
    expect(effect).toHaveBeenCalledTimes(3)
  })

  test('runs only once with empty deps', async () => {
    const effect = vi.fn()
    createApp(() => {
      const [count, setCount] = useState(0)
      useRenderEffect(effect, [])
      return { count, setCount }
    })

    app.onLaunch()
    expect(effect).toHaveBeenCalledTimes(0)

    await nextTick()
    expect(effect).toHaveBeenCalledTimes(1)

    app.setCount(1)
    await nextTick()
    expect(effect).toHaveBeenCalledTimes(1)
  })

  test('runs when deps change', async () => {
    const effect = vi.fn()
    createApp(() => {
      const [count, setCount] = useState(0)
      useRenderEffect(effect, [count])
      return { count, setCount }
    })

    app.onLaunch()
    expect(effect).toHaveBeenCalledTimes(0)

    await nextTick()
    expect(effect).toHaveBeenCalledTimes(1)

    app.setCount(1)
    await nextTick()
    expect(effect).toHaveBeenCalledTimes(2)

    // Same value — should not re-run (useState bails out)
    app.setCount(1)
    await nextTick()
    expect(effect).toHaveBeenCalledTimes(2)
  })

  test('runs cleanup before re-running effect', async () => {
    const calls: string[] = []
    createApp(() => {
      const [count, setCount] = useState(0)
      useRenderEffect(() => {
        calls.push(`effect ${count}`)
        return () => {
          calls.push(`cleanup ${count}`)
        }
      }, [count])
      return { count, setCount }
    })
    app.onLaunch()
    expect(calls).toEqual([])

    await nextTick()
    expect(calls).toEqual(['effect 0'])

    app.setCount(1)
    await nextTick()
    expect(calls).toEqual(['effect 0', 'cleanup 0', 'effect 1'])

    app.setCount(2)
    await nextTick()
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
    createApp(() => {
      const [count, setCount] = useState(0)
      useRenderEffect(() => {
        calls.push('effect')
        return () => {
          calls.push('cleanup')
        }
      })
      return { count, setCount }
    })
    app.onLaunch()
    expect(calls).toEqual([])

    await nextTick()
    expect(calls).toEqual(['effect'])

    app.setCount(1)
    await nextTick()
    expect(calls).toEqual(['effect', 'cleanup', 'effect'])
  })

  test('warning outside render', () => {
    useRenderEffect(() => {})
    expect('useRenderEffect() hook can only be').toHaveBeenWarned()
  })
})
