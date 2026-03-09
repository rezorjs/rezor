import { describe, test, expect } from 'vitest'
import { createApp, useRef, useState, nextTick } from '../src'

// Mocks
let app: Record<string, any>
// @ts-expect-error
globalThis.App = (options: Record<string, any>) => {
  app = options
}

describe('useRef', () => {
  test('returns ref object with initial value', () => {
    createApp(() => {
      const ref = useRef(0)
      return { ref }
    })
    app.onLaunch()
    expect(app.ref).toEqual({ current: 0 })
  })

  test('persists the same ref across re-renders', async () => {
    let refObj: { current: number } | undefined
    createApp(() => {
      const [count, setCount] = useState(0)
      const ref = useRef(42)
      if (!refObj) {
        refObj = ref
      }

      return { count, setCount, ref }
    })
    app.onLaunch()
    expect(app.ref.current).toBe(42)

    app.setCount(1)
    await nextTick()
    expect(app.ref).toBe(refObj)
    expect(app.ref.current).toBe(42)
  })

  test('does not reset to initial value on re-render', async () => {
    createApp(() => {
      const [count, setCount] = useState(0)
      const ref = useRef(0)
      return { count, setCount, ref }
    })
    app.onLaunch()

    app.ref.current = 99
    app.setCount(1)
    await nextTick()
    expect(app.ref.current).toBe(99)
  })

  test('multiple refs are independent', () => {
    createApp(() => {
      const ref1 = useRef('a')
      const ref2 = useRef('b')
      return { ref1, ref2 }
    })
    app.onLaunch()
    expect(app.ref1.current).toBe('a')
    expect(app.ref2.current).toBe('b')

    app.ref1.current = 'x'
    expect(app.ref1.current).toBe('x')
    expect(app.ref2.current).toBe('b')
  })

  test('warning outside render', () => {
    useRef(0)
    expect('useRef() hook can only be').toHaveBeenWarned()
  })
})
