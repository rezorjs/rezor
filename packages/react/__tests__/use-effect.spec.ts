import { describe, test, expect, vi } from 'vitest'
import { createApp, useState, useEffect, nextTick } from '../src'
import { flushPostFlushCbs } from '../src/scheduler'

// Mocks
let app: Record<string, any>
// @ts-expect-error
globalThis.App = (options: Record<string, any>) => {
  app = options
}

describe('useEffect', () => {
  test('runs after render', () => {
    const effect = vi.fn()
    createApp(() => {
      useEffect(effect)
    })
    app.onLaunch()
    // Effect should not run during render
    expect(effect).toBeCalledTimes(0)
    flushPostFlushCbs()
    expect(effect).toBeCalledTimes(1)
  })

  test('runs after every render when no deps', async () => {
    const effect = vi.fn()
    createApp(() => {
      const [count, setCount] = useState(0)
      useEffect(effect)
      return { count, setCount }
    })
    app.onLaunch()
    flushPostFlushCbs()
    expect(effect).toBeCalledTimes(1)

    app.setCount(1)
    await nextTick()
    flushPostFlushCbs()
    expect(effect).toBeCalledTimes(2)

    app.setCount(2)
    await nextTick()
    flushPostFlushCbs()
    expect(effect).toBeCalledTimes(3)
  })

  test('runs only once with empty deps', async () => {
    const effect = vi.fn()
    createApp(() => {
      const [count, setCount] = useState(0)
      useEffect(effect, [])
      return { count, setCount }
    })
    app.onLaunch()
    flushPostFlushCbs()
    expect(effect).toBeCalledTimes(1)

    app.setCount(1)
    await nextTick()
    flushPostFlushCbs()
    expect(effect).toBeCalledTimes(1)
  })

  test('runs when deps change', async () => {
    const effect = vi.fn()
    createApp(() => {
      const [count, setCount] = useState(0)
      useEffect(effect, [count])
      return { count, setCount }
    })
    app.onLaunch()
    flushPostFlushCbs()
    expect(effect).toBeCalledTimes(1)

    app.setCount(1)
    await nextTick()
    flushPostFlushCbs()
    expect(effect).toBeCalledTimes(2)

    // Same value — should not re-run (useState bails out)
    app.setCount(1)
    await nextTick()
    flushPostFlushCbs()
    expect(effect).toBeCalledTimes(2)
  })

  test('runs cleanup before re-running effect', async () => {
    const calls: string[] = []
    createApp(() => {
      const [count, setCount] = useState(0)
      useEffect(() => {
        calls.push(`effect ${count}`)
        return () => {
          calls.push(`cleanup ${count}`)
        }
      }, [count])
      return { count, setCount }
    })
    app.onLaunch()
    flushPostFlushCbs()
    expect(calls).toEqual(['effect 0'])

    app.setCount(1)
    await nextTick()
    flushPostFlushCbs()
    expect(calls).toEqual(['effect 0', 'cleanup 0', 'effect 1'])

    app.setCount(2)
    await nextTick()
    flushPostFlushCbs()
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
      useEffect(() => {
        calls.push('effect')
        return () => {
          calls.push('cleanup')
        }
      })
      return { count, setCount }
    })
    app.onLaunch()
    flushPostFlushCbs()
    expect(calls).toEqual(['effect'])

    app.setCount(1)
    await nextTick()
    flushPostFlushCbs()
    expect(calls).toEqual(['effect', 'cleanup', 'effect'])
  })

  test('warning outside render', () => {
    useEffect(() => {})
    expect('useEffect() hook can only be').toHaveBeenWarned()
  })
})
