import { describe, beforeEach, test, expect, vi } from 'vitest'
import {
  createApp,
  defineComponent,
  useState,
  useEffect,
  nextTick,
} from '../src'

describe('useEffect', () => {
  // Mocks
  let app: Record<string, any>
  let component: Record<string, any>
  beforeEach(() => {
    // @ts-expect-error
    globalThis.App = (options: Record<string, any>) => {
      app = options
    }

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
        setData(data: Record<string, unknown>) {
          Object.keys(data).forEach((key) => {
            this.data[key] = data[key]
          })
        },
      }
    }
  })

  test('runs after render', async () => {
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

    await nextTick()
    expect(effect1).toHaveBeenCalledTimes(1)
    expect(effect2).toHaveBeenCalledTimes(1)
  })

  test('runs after setData', async () => {
    const calls: string[] = []
    defineComponent(() => {
      const [count, setCount] = useState(0)
      useEffect(() => {
        // setData renders synchronously, so the effect must observe the data
        // it was rendered with, both on mount and on update
        calls.push(`effect ${count}, data ${component.data.count}`)
      }, [count])
      return { count, setCount }
    })

    const originSetData = component.setData
    component.setData = function (data: Record<string, unknown>) {
      calls.push(`setData ${String(data.count)}`)
      originSetData.call(this, data)
    }

    component.lifetimes.attached.call(component)
    await nextTick()
    expect(calls).toEqual(['setData 0', 'effect 0, data 0'])

    component.setCount(1)
    await nextTick()
    expect(calls).toEqual([
      'setData 0',
      'effect 0, data 0',
      'setData 1',
      'effect 1, data 1',
    ])
  })

  test('runs after every render when no deps', async () => {
    const effect = vi.fn()
    defineComponent(() => {
      const [count, setCount] = useState(0)
      useEffect(effect)
      return { count, setCount }
    })
    component.lifetimes.attached.call(component)
    await nextTick()
    expect(effect).toHaveBeenCalledTimes(1)

    component.setCount(1)
    await nextTick()
    expect(effect).toHaveBeenCalledTimes(2)

    component.setCount(2)
    await nextTick()
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
    await nextTick()
    expect(effect).toHaveBeenCalledTimes(1)

    component.setCount(1)
    await nextTick()
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
    await nextTick()
    expect(effect).toHaveBeenCalledTimes(1)

    component.setCount(1)
    await nextTick()
    expect(effect).toHaveBeenCalledTimes(2)

    // Same value — should not re-run (useState bails out)
    component.setCount(1)
    await nextTick()
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
    await nextTick()
    expect(calls).toEqual(['effect 0'])

    component.setCount(1)
    await nextTick()
    expect(calls).toEqual(['effect 0', 'cleanup 0', 'effect 1'])

    component.setCount(2)
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
    await nextTick()
    expect(calls).toEqual(['effect'])

    component.setCount(1)
    await nextTick()
    expect(calls).toEqual(['effect', 'cleanup', 'effect'])
  })

  test('warning outside render', () => {
    useEffect(() => {})
    expect('[Rezor] useEffect() hook can only be').toHaveBeenWarned()
  })
})
