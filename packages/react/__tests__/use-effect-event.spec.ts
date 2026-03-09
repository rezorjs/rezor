import { describe, test, expect } from 'vitest'
import {
  createApp,
  useState,
  useEffect,
  useEffectEvent,
  nextTick,
} from '../src'
import { flushPostFlushCbs } from '../src/scheduler'

// Mocks
let app: Record<string, any>
// @ts-expect-error
globalThis.App = (options: Record<string, any>) => {
  app = options
}

describe('useEffectEvent', () => {
  test('returns a function that calls the latest callback', async () => {
    const calls: number[] = []
    createApp(() => {
      const [count, setCount] = useState(0)
      const onTick = useEffectEvent(() => {
        calls.push(count)
      })
      return { count, setCount, onTick }
    })
    app.onLaunch()

    app.onTick()
    expect(calls).toEqual([0])

    app.setCount(1)
    await nextTick()

    app.onTick()
    expect(calls).toEqual([0, 1])
  })

  test('function identity changes on every render', async () => {
    createApp(() => {
      const [count, setCount] = useState(0)
      const handler = useEffectEvent(() => {})
      return { count, setCount, handler }
    })
    app.onLaunch()
    const first = app.handler

    app.setCount(1)
    await nextTick()
    expect(app.handler).not.toBe(first)
  })

  test('old wrapper still calls latest callback', async () => {
    const calls: string[] = []
    createApp(() => {
      const [count, setCount] = useState(0)
      const handler = useEffectEvent(() => {
        calls.push(`count:${count}`)
      })
      return { count, setCount, handler }
    })
    app.onLaunch()
    const firstHandler = app.handler

    app.setCount(5)
    await nextTick()

    // Call the OLD wrapper — should still invoke the latest callback
    firstHandler()
    expect(calls).toEqual(['count:5'])
  })

  test('works with useEffect', async () => {
    const calls: string[] = []
    createApp(() => {
      const [count, setCount] = useState(0)
      const onTick = useEffectEvent(() => {
        calls.push(`effect:${count}`)
      })
      // Effect runs once, but onTick always sees latest count
      useEffect(() => {
        onTick()
      }, [])
      return { count, setCount }
    })
    app.onLaunch()
    flushPostFlushCbs()
    expect(calls).toEqual(['effect:0'])

    app.setCount(42)
    await nextTick()
    // Effect didn't re-run (empty deps), but if we flush again nothing new
    flushPostFlushCbs()
    expect(calls).toEqual(['effect:0'])
  })

  test('passes arguments through', () => {
    let result: unknown
    createApp(() => {
      const handler = useEffectEvent((a: number, b: string) => {
        result = `${a}-${b}`
        return result
      })
      return { handler }
    })
    app.onLaunch()

    const ret = app.handler(1, 'hello')
    expect(result).toBe('1-hello')
    expect(ret).toBe('1-hello')
  })

  test('multiple effect events are independent', async () => {
    createApp(() => {
      const [count, setCount] = useState(0)
      const handlerA = useEffectEvent(() => `a:${count}`)
      const handlerB = useEffectEvent(() => `b:${count}`)
      return { count, setCount, handlerA, handlerB }
    })
    app.onLaunch()
    expect(app.handlerA()).toBe('a:0')
    expect(app.handlerB()).toBe('b:0')

    app.setCount(3)
    await nextTick()
    expect(app.handlerA()).toBe('a:3')
    expect(app.handlerB()).toBe('b:3')
  })

  test('warning outside render', () => {
    useEffectEvent(() => {})
    expect('useEffectEvent() hook can only be').toHaveBeenWarned()
  })
})
