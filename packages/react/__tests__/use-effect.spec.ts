import { describe, test, expect, vi } from 'vitest'
import {
  createApp,
  defineComponent,
  useState,
  useEffect,
  nextTick,
} from '../src'

// Mocks
let app: Record<string, any>
// @ts-expect-error
globalThis.App = (options: Record<string, any>) => {
  app = options
}

let component: Record<string, any>
let renderCb: () => void
// @ts-expect-error
globalThis.Component = (options: Record<string, any>) => {
  component = {
    ...options,
    is: '',
    id: '',
    data: {},
    dataset: {},
    triggerEvent() {},
    createSelectorQuery() {},
    createIntersectionObserver() {},
    createMediaQueryObserver() {},
    selectComponent() {},
    selectAllComponents() {},
    selectOwnerComponent() {},
    getRelationNodes() {},
    groupSetData() {},
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
    defineComponent(() => {
      const [count, setCount] = useState(0)
      useEffect(effect2)
      return { count, setCount }
    })
    component.lifetimes.attached.call(component)
    // Effect should not run during render
    expect(effect1).toHaveBeenCalledTimes(0)
    expect(effect2).toHaveBeenCalledTimes(0)

    component.lifetimes.ready.call(component)
    renderCb()
    expect(effect1).toHaveBeenCalledTimes(1)
    expect(effect2).toHaveBeenCalledTimes(1)
  })

  test('runs after every render when no deps', async () => {
    const effect = vi.fn()
    defineComponent(() => {
      const [count, setCount] = useState(0)
      useEffect(effect)
      return { count, setCount }
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.ready.call(component)
    renderCb()
    expect(effect).toHaveBeenCalledTimes(1)

    component.setCount(1)
    await nextTick()
    renderCb()
    expect(effect).toHaveBeenCalledTimes(2)

    component.setCount(2)
    await nextTick()
    renderCb()
    expect(effect).toHaveBeenCalledTimes(3)
  })

  test('runs only once with empty deps', async () => {
    const effect = vi.fn()
    defineComponent(() => {
      const [count, setCount] = useState(0)
      useEffect(effect, [])
      return { count, setCount }
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.ready.call(component)
    renderCb()
    expect(effect).toHaveBeenCalledTimes(1)

    component.setCount(1)
    await nextTick()
    renderCb()
    expect(effect).toHaveBeenCalledTimes(1)
  })

  test('runs when deps change', async () => {
    const effect = vi.fn()
    defineComponent(() => {
      const [count, setCount] = useState(0)
      useEffect(effect, [count])
      return { count, setCount }
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.ready.call(component)
    renderCb()
    expect(effect).toHaveBeenCalledTimes(1)

    component.setCount(1)
    await nextTick()
    renderCb()
    expect(effect).toHaveBeenCalledTimes(2)

    // Same value — should not re-run (useState bails out)
    component.setCount(1)
    await nextTick()
    renderCb()
    expect(effect).toHaveBeenCalledTimes(2)
  })

  test('runs cleanup before re-running effect', async () => {
    const calls: string[] = []
    defineComponent(() => {
      const [count, setCount] = useState(0)
      useEffect(() => {
        calls.push(`effect ${count}`)
        return () => {
          calls.push(`cleanup ${count}`)
        }
      }, [count])
      return { count, setCount }
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.ready.call(component)
    renderCb()
    expect(calls).toEqual(['effect 0'])

    component.setCount(1)
    await nextTick()
    renderCb()
    expect(calls).toEqual(['effect 0', 'cleanup 0', 'effect 1'])

    component.setCount(2)
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
    defineComponent(() => {
      const [count, setCount] = useState(0)
      useEffect(() => {
        calls.push('effect')
        return () => {
          calls.push('cleanup')
        }
      })
      return { count, setCount }
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.ready.call(component)
    renderCb()
    expect(calls).toEqual(['effect'])

    component.setCount(1)
    await nextTick()
    renderCb()
    expect(calls).toEqual(['effect', 'cleanup', 'effect'])
  })

  test('warning outside render', () => {
    useEffect(() => {})
    expect('[Rezor] useEffect() hook can only be').toHaveBeenWarned()
  })
})
