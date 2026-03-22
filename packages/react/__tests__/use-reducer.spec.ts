import { describe, test, expect } from 'vitest'
import { createApp, useReducer, nextTick } from '../src'

// Mocks
let app: Record<string, any>
// @ts-expect-error
globalThis.App = (options: Record<string, any>) => {
  app = options
}

function counterReducer(
  state: { count: number },
  action: { type: 'increment' | 'decrement' },
) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 }
    case 'decrement':
      return { count: state.count - 1 }
  }
}

describe('useReducer', () => {
  test('basic dispatch', async () => {
    createApp(() => {
      const [state, dispatch] = useReducer(counterReducer, { count: 0 })
      return { count: state.count, dispatch }
    })
    app.onLaunch()
    expect(app.count).toBe(0)

    app.dispatch({ type: 'increment' })
    await nextTick()
    expect(app.count).toBe(1)

    app.dispatch({ type: 'decrement' })
    await nextTick()
    expect(app.count).toBe(0)
  })

  test('lazy initialization with init function', async () => {
    createApp(() => {
      const [state, dispatch] = useReducer(counterReducer, 10, (initial) => ({
        count: initial * 2,
      }))
      return { count: state.count, dispatch }
    })
    app.onLaunch()
    expect(app.count).toBe(20)

    app.dispatch({ type: 'increment' })
    await nextTick()
    expect(app.count).toBe(21)
  })

  test('bailout when state is the same', async () => {
    let renderCount = 0
    createApp(() => {
      renderCount++
      const [state, dispatch] = useReducer(
        (s: { count: number }, action: { type: 'noop' | 'increment' }) => {
          if (action.type === 'noop') return s
          return { count: s.count + 1 }
        },
        { count: 0 },
      )
      return { count: state.count, dispatch }
    })
    app.onLaunch()
    expect(renderCount).toBe(1)

    app.dispatch({ type: 'noop' })
    await nextTick()
    expect(renderCount).toBe(1)

    app.dispatch({ type: 'increment' })
    await nextTick()
    expect(renderCount).toBe(2)
    expect(app.count).toBe(1)
  })

  test('dispatch is stable across renders', async () => {
    const dispatches: Function[] = []
    createApp(() => {
      const [state, dispatch] = useReducer(counterReducer, { count: 0 })
      dispatches.push(dispatch)
      return { count: state.count, dispatch }
    })
    app.onLaunch()

    app.dispatch({ type: 'increment' })
    await nextTick()

    expect(dispatches.length).toBe(2)
    expect(dispatches[0]).toBe(dispatches[1])
  })

  test('warning outside render', () => {
    const [state, dispatch] = useReducer(counterReducer, { count: 0 })
    expect(state.count).toBe(0)
    dispatch({ type: 'increment' })
    expect('useReducer() hook can only be').toHaveBeenWarned()
  })
})
