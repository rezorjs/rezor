import { describe, test, expect, vi } from 'vitest'
import {
  defineComponent,
  nextTick,
  useState,
  useEffect,
  useMove,
  useError,
  useShow,
  useHide,
  useRouteDone,
  usePullDownRefresh,
  useReachBottom,
  useResize,
  useTabItemTap,
  usePageScroll,
  useShareAppMessage,
  useShareTimeline,
  useAddToFavorites,
  useSaveExitState,
} from '../src'

// Mocks
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

describe('component', () => {
  test('binding', () => {
    defineComponent(() => {
      const und = undefined
      const nul = null
      const num = 0
      const str = ''
      const bool = true
      const arr: never[] = []
      const obj = {}
      return { und, nul, num, str, bool, arr, obj }
    })
    component.lifetimes.attached.call(component)
    expect(component.data).toEqual({
      und: undefined,
      nul: null,
      num: 0,
      str: '',
      bool: true,
      arr: [],
      obj: {},
    })
  })

  test('render', async () => {
    const fn = vi.fn()
    defineComponent(() => {
      fn()

      const [count, setCount] = useState(0)
      const double = count * 2
      const increment = (): void => {
        setCount(count + 1)
      }

      return {
        count,
        double,
        increment,
      }
    })
    component.lifetimes.attached.call(component)
    expect(fn).toBeCalledTimes(1)
    expect(component.data.count).toBe(0)
    expect(component.data.double).toBe(0)

    component.increment()
    await nextTick()
    expect(fn).toBeCalledTimes(2)
    expect(component.data.count).toBe(1)
    expect(component.data.double).toBe(2)

    component.increment()
    component.lifetimes.detached.call(component)
    await nextTick()
    expect(fn).toBeCalledTimes(2)
  })

  test('skip unchanged states on update', async () => {
    defineComponent(() => {
      const [foo, setFoo] = useState('')
      const [bar, setBar] = useState('')
      const [baz, setBaz] = useState()

      return { foo, setFoo, bar, setBar, baz, setBaz }
    })
    component.lifetimes.attached.call(component)
    expect(component.data.foo).toBe('')
    expect(component.data.bar).toBe('')
    expect(component.data.baz).toBe(undefined)
    expect(Object.prototype.hasOwnProperty.call(component.data, 'baz')).toBe(
      true,
    )

    component.setData = function (
      data: Record<string, unknown>,
      callback: () => void,
    ) {
      expect(data).toEqual({ foo: 'foo' })

      Object.keys(data).forEach((key) => {
        this.data[key] = data[key]
      })

      renderCb = callback
    }
    component.setFoo('foo')
    await nextTick()
    expect(component.data.foo).toBe('foo')
    expect(component.data.bar).toBe('')
    expect(component.data.baz).toBe(undefined)
    expect(Object.prototype.hasOwnProperty.call(component.data, 'baz')).toBe(
      true,
    )
  })

  test('context should be stable', async () => {
    const fn = vi.fn()
    defineComponent((_, context) => {
      const [count, setCount] = useState(0)

      useEffect(fn, [context])

      return { count, setCount }
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.ready.call(component)
    renderCb()
    expect(fn).toBeCalledTimes(1)

    component.setCount(1)
    await nextTick()
    renderCb()
    expect(fn).toBeCalledTimes(1)
  })

  test('useEffect', async () => {
    let dummy: number
    const fn = vi.fn()
    defineComponent(() => {
      const [count, setCount] = useState(0)

      const increment = () => {
        setCount(count + 1)
      }

      useEffect(() => {
        fn()
        dummy = count
      }, [count])

      return { count, increment }
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.ready.call(component)
    renderCb()
    expect(fn).toBeCalledTimes(1)
    expect(dummy!).toBe(0)

    component.increment()
    await nextTick()
    renderCb()
    expect(fn).toBeCalledTimes(2)
    expect(dummy!).toBe(1)

    component.increment()
    await nextTick()
    component.lifetimes.detached.call(component)
    renderCb()
    expect(fn).toBeCalledTimes(2)
    expect(dummy!).toBe(1)
  })

  test('props', async () => {
    defineComponent({
      properties: {
        count: Number,
      },
      render(props) {
        const double = props.count * 2
        return { double }
      },
    })

    component.data = { count: 0 }
    component.observers.count.call(component, component.data.count)
    component.lifetimes.attached.call(component)
    expect(component.data.double).toBe(0)

    component.data.count = 1
    component.observers.count.call(component, component.data.count)
    await nextTick()
    expect(component.data.double).toBe(2)
  })

  test('batches multiple props updates', async () => {
    const renderSpy = vi.fn()
    defineComponent({
      properties: {
        count1: Number,
        count2: Number,
      },
      render(props) {
        renderSpy()
        const double1 = props.count1 * 2
        const double2 = props.count2 * 2
        return { double1, double2 }
      },
    })

    component.data = { count1: 0, count2: 1 }
    component.observers.count1.call(component, component.data.count1)
    component.observers.count2.call(component, component.data.count2)
    component.lifetimes.attached.call(component)
    expect(component.data.double1).toBe(0)
    expect(component.data.double2).toBe(2)
    expect(renderSpy).toBeCalledTimes(1)

    component.data.count1 = 1
    component.data.count2 = 2
    component.observers.count1.call(component, component.data.count1)
    component.observers.count2.call(component, component.data.count2)
    await nextTick()
    expect(component.data.double1).toBe(2)
    expect(component.data.double2).toBe(4)
    expect(renderSpy).toBeCalledTimes(2)
  })

  test('multiple instances', async () => {
    defineComponent({
      properties: {
        count: Number,
      },
      render(props) {
        const double = props.count * 2
        return { double }
      },
    })

    const instance1 = Object.create(component)
    const instance2 = Object.create(component)

    instance1.data = { count: 0 }
    instance2.data = { count: 1 }
    instance1.observers.count.call(instance1, instance1.data.count)
    instance2.observers.count.call(instance2, instance2.data.count)
    instance1.lifetimes.attached.call(instance1)
    instance2.lifetimes.attached.call(instance2)
    expect(instance1.data.double).toBe(0)
    expect(instance2.data.double).toBe(2)

    instance1.data.count = 1
    instance2.data.count = 2
    instance1.observers.count.call(instance1, instance1.data.count)
    instance2.observers.count.call(instance2, instance2.data.count)
    await nextTick()
    expect(instance1.data.double).toBe(2)
    expect(instance2.data.double).toBe(4)
  })

  test('observer', () => {
    const fn = vi.fn()
    defineComponent({
      properties: {
        count: Number,
      },
      render() {},
      observers: {
        count: fn,
      },
    })
    component.data = { count: 0 }
    component.lifetimes.attached.call(component)
    component.observers.count.call(component, component.data.count)
    expect(fn).toBeCalledWith(0)
  })

  test('context', () => {
    defineComponent((_, context) => {
      expect(context.is).toBe('')
      expect(context.triggerEvent).toBeInstanceOf(Function)
      // Low library version does not have getAppBar API, but it should not cause error.
      expect(context.getAppBar).toBe(undefined)
      return { num: 0 }
    })
    component.lifetimes.attached.call(component)
    expect(component.data.num).toBe(0)
  })

  test('context: high library version', () => {
    defineComponent((_, context) => {
      expect(context.getAppBar).toBeInstanceOf(Function)
    })
    const extendedComponent = { ...component, getAppBar() {} }
    // @ts-expect-error
    extendedComponent.lifetimes.attached.call(extendedComponent)
  })

  test('attached', () => {
    const fn = vi.fn()
    defineComponent({
      lifetimes: { attached: fn },
      render() {},
    })
    component.lifetimes.attached.call(component)
    expect(fn).toBeCalledTimes(1)
  })

  test('legacy attached', () => {
    const fn = vi.fn()
    defineComponent({
      attached: fn,
      render() {},
    })
    component.lifetimes.attached.call(component)
    expect(fn).toBeCalledTimes(1)
  })

  test('ready', () => {
    const fn = vi.fn()
    const injectedFn1 = vi.fn()
    const injectedFn2 = vi.fn()
    defineComponent({
      lifetimes: { ready: fn },
      render() {
        useEffect(injectedFn1, [])
        useEffect(injectedFn2, [])
      },
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.ready.call(component)
    expect(fn).toBeCalledTimes(1)
    expect(injectedFn1).toBeCalledTimes(1)
    expect(injectedFn2).toBeCalledTimes(1)
  })

  test('legacy ready', () => {
    const fn = vi.fn()
    defineComponent({
      ready: fn,
      render() {},
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.ready.call(component)
    expect(fn).toBeCalledTimes(1)
  })

  test('moved', async () => {
    const fn = vi.fn()
    let dummy1: number
    let dummy2: number
    defineComponent({
      lifetimes: { moved: fn },
      render() {
        const [count, setCount] = useState(0)

        const increment = () => {
          setCount(count + 1)
        }

        useMove(() => {
          dummy1 = count
        })
        useMove(() => {
          dummy2 = count
        })

        return { count, increment }
      },
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.moved.call(component)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    component.increment()
    await nextTick()
    component.lifetimes.moved.call(component)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('legacy moved', () => {
    const fn = vi.fn()
    defineComponent({
      moved: fn,
      render() {},
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.moved.call(component)
    expect(fn).toBeCalledTimes(1)
  })

  test('detached', () => {
    const fn = vi.fn()
    const injectedFn1 = vi.fn()
    const injectedFn2 = vi.fn()
    defineComponent({
      lifetimes: { detached: fn },
      render() {
        useEffect(() => injectedFn1, [])
        useEffect(() => injectedFn2, [])
      },
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.ready.call(component)
    component.lifetimes.detached.call(component)
    expect(fn).toBeCalledTimes(1)
    expect(injectedFn1).toBeCalledTimes(1)
    expect(injectedFn2).toBeCalledTimes(1)
  })

  test('legacy detached', () => {
    const fn = vi.fn()
    defineComponent({
      detached: fn,
      render() {},
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.detached.call(component)
    expect(fn).toBeCalledTimes(1)
  })

  test('error', async () => {
    const error = new Error('unknown')
    const fn = vi.fn((err) => {
      expect(err).toBe(error)
    })
    let dummy1: number
    let dummy2: number
    defineComponent({
      lifetimes: { error: fn },
      render() {
        const [count, setCount] = useState(0)

        const increment = () => {
          setCount(count + 1)
        }

        useError((err) => {
          expect(err).toBe(error)
          dummy1 = count
        })
        useError((err) => {
          expect(err).toBe(error)
          dummy2 = count
        })

        return { count, increment }
      },
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.error.call(component, error)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    component.increment()
    await nextTick()
    component.lifetimes.error.call(component, error)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('legacy error', () => {
    const error = new Error('unknown')
    const fn = vi.fn()
    defineComponent({
      error: fn,
      render() {},
    })
    component.lifetimes.attached.call(component)
    component.lifetimes.error.call(component, error)
    expect(fn).toBeCalledWith(error)
  })

  test('onPullDownRefresh', async () => {
    const fn = vi.fn()
    let dummy1: number
    let dummy2: number
    defineComponent({
      methods: { onPullDownRefresh: fn },
      render() {
        const [count, setCount] = useState(0)

        const increment = () => {
          setCount(count + 1)
        }

        usePullDownRefresh(() => {
          dummy1 = count
        })
        usePullDownRefresh(() => {
          dummy2 = count
        })

        return { count, increment }
      },
    })
    component.lifetimes.attached.call(component)
    component.methods.onPullDownRefresh.call(component)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    component.increment()
    await nextTick()
    component.methods.onPullDownRefresh.call(component)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('onReachBottom', async () => {
    const fn = vi.fn()
    let dummy1: number
    let dummy2: number
    defineComponent({
      methods: { onReachBottom: fn },
      render() {
        const [count, setCount] = useState(0)

        const increment = () => {
          setCount(count + 1)
        }

        useReachBottom(() => {
          dummy1 = count
        })
        useReachBottom(() => {
          dummy2 = count
        })

        return { count, increment }
      },
    })
    component.lifetimes.attached.call(component)
    component.methods.onReachBottom.call(component)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    component.increment()
    await nextTick()
    component.methods.onReachBottom.call(component)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('onTabItemTap', async () => {
    const arg = {}
    const fn = vi.fn((item) => {
      expect(item).toBe(arg)
    })
    let dummy1: number
    let dummy2: number
    defineComponent({
      methods: { onTabItemTap: fn },
      render() {
        const [count, setCount] = useState(0)

        const increment = () => {
          setCount(count + 1)
        }

        useTabItemTap((item) => {
          expect(item).toBe(arg)
          dummy1 = count
        })
        useTabItemTap((item) => {
          expect(item).toBe(arg)
          dummy2 = count
        })

        return { count, increment }
      },
    })
    component.lifetimes.attached.call(component)
    component.methods.onTabItemTap.call(component, arg)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    component.increment()
    await nextTick()
    component.methods.onTabItemTap.call(component, arg)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('onPageScroll', async () => {
    usePageScroll(() => {})
    expect('Page specific lifecycle').toHaveBeenWarned()

    defineComponent(() => {
      usePageScroll(() => {})
    })
    component.__listenPageScroll__ = component.methods.__listenPageScroll__
    component.lifetimes.attached.call(component)
    expect('usePageScroll() hook only').toHaveBeenWarned()

    const arg = {}
    const fn = vi.fn((scroll) => {
      expect(scroll).toBe(arg)
    })
    let dummy1: number
    let dummy2: number
    defineComponent({
      methods: { onPageScroll: fn },
      render() {
        const [count, setCount] = useState(0)

        const increment = () => {
          setCount(count + 1)
        }

        usePageScroll((scroll) => {
          expect(scroll).toBe(arg)
          dummy1 = count
        })
        usePageScroll((scroll) => {
          expect(scroll).toBe(arg)
          dummy2 = count
        })

        return { count, increment }
      },
    })
    component.__listenPageScroll__ = component.methods.__listenPageScroll__
    component.lifetimes.attached.call(component)
    component.methods.onPageScroll.call(component, arg)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    component.increment()
    await nextTick()
    component.methods.onPageScroll.call(component, arg)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)

    let dummy: number
    defineComponent(
      () => {
        const [count, setCount] = useState(0)

        const increment = () => {
          setCount(count + 1)
        }

        usePageScroll((scroll) => {
          expect(scroll).toBe(arg)
          dummy = count
        })

        return { count, increment }
      },
      { listenPageScroll: true },
    )
    component.__listenPageScroll__ = component.methods.__listenPageScroll__
    component.lifetimes.attached.call(component)
    component.methods.onPageScroll.call(component, arg)
    expect(dummy!).toBe(0)

    component.increment()
    await nextTick()
    component.methods.onPageScroll.call(component, arg)
    expect(dummy!).toBe(1)

    defineComponent(() => {})
    expect(component.methods.onPageScroll).toBeUndefined()
  })

  test('onShareAppMessage', async () => {
    useShareAppMessage(() => ({}))
    expect('Page specific lifecycle').toHaveBeenWarned()

    defineComponent({
      methods: {
        onShareAppMessage() {
          return {}
        },
      },
      render() {
        useShareAppMessage(() => ({}))
      },
    })
    component.onShareAppMessage = component.methods.onShareAppMessage
    component.__isInjectedShareToOthersHook__ =
      component.methods.__isInjectedShareToOthersHook__
    component.lifetimes.attached.call(component)
    expect('useShareAppMessage() hook only').toHaveBeenWarnedTimes(1)

    defineComponent(() => {
      useShareAppMessage(() => ({}))
    })
    component.onShareAppMessage = component.methods.onShareAppMessage
    component.__isInjectedShareToOthersHook__ =
      component.methods.__isInjectedShareToOthersHook__
    component.lifetimes.attached.call(component)
    expect('useShareAppMessage() hook only').toHaveBeenWarnedTimes(2)

    defineComponent(
      () => {
        useShareAppMessage(() => ({}))
        useShareAppMessage(() => ({}))
      },
      { canShareToOthers: true },
    )
    component.onShareAppMessage = component.methods.onShareAppMessage
    component.__isInjectedShareToOthersHook__ =
      component.methods.__isInjectedShareToOthersHook__
    component.lifetimes.attached.call(component)
    expect('useShareAppMessage() hook can only').toHaveBeenWarned()

    const arg = {}
    defineComponent(
      () => {
        const [title, setTitle] = useState('Hi')

        useShareAppMessage((share) => {
          expect(share).toBe(arg)
          return { title }
        })

        return { title, setTitle }
      },
      { canShareToOthers: true },
    )
    component.onShareAppMessage = component.methods.onShareAppMessage
    component.__isInjectedShareToOthersHook__ =
      component.methods.__isInjectedShareToOthersHook__
    component.lifetimes.attached.call(component)
    const shareContent = component.methods.onShareAppMessage.call(
      component,
      arg,
    )
    expect(shareContent).toEqual({ title: 'Hi' })

    component.setTitle('Hello')
    await nextTick()
    const updatedShareContent = component.methods.onShareAppMessage.call(
      component,
      arg,
    )
    expect(updatedShareContent).toEqual({ title: 'Hello' })

    defineComponent(() => {}, { canShareToOthers: true })
    expect(component.methods.onShareAppMessage.call(component, arg)).toEqual({})

    defineComponent(() => {})
    expect(component.methods.onShareAppMessage).toBeUndefined()
  })

  test('onShareTimeline', async () => {
    useShareTimeline(() => ({}))
    expect('Page specific lifecycle').toHaveBeenWarned()

    defineComponent({
      methods: {
        onShareTimeline() {
          return {}
        },
      },
      render() {
        useShareTimeline(() => ({}))
      },
    })
    component.onShareTimeline = component.methods.onShareTimeline
    component.__isInjectedShareToTimelineHook__ =
      component.methods.__isInjectedShareToTimelineHook__
    component.lifetimes.attached.call(component)
    expect('useShareTimeline() hook only').toHaveBeenWarnedTimes(1)

    defineComponent(() => {
      useShareTimeline(() => ({}))
    })
    component.onShareTimeline = component.methods.onShareTimeline
    component.__isInjectedShareToTimelineHook__ =
      component.methods.__isInjectedShareToTimelineHook__
    component.lifetimes.attached.call(component)
    expect('useShareTimeline() hook only').toHaveBeenWarnedTimes(2)

    defineComponent(
      () => {
        useShareTimeline(() => ({}))
        useShareTimeline(() => ({}))
      },
      { canShareToTimeline: true },
    )
    component.onShareTimeline = component.methods.onShareTimeline
    component.__isInjectedShareToTimelineHook__ =
      component.methods.__isInjectedShareToTimelineHook__
    component.lifetimes.attached.call(component)
    expect('useShareTimeline() hook can only').toHaveBeenWarned()

    defineComponent(
      () => {
        const [title, setTitle] = useState('Hi')

        useShareTimeline(() => {
          return { title }
        })

        return { title, setTitle }
      },
      { canShareToTimeline: true },
    )
    component.onShareTimeline = component.methods.onShareTimeline
    component.__isInjectedShareToTimelineHook__ =
      component.methods.__isInjectedShareToTimelineHook__
    component.lifetimes.attached.call(component)
    const shareContent = component.methods.onShareTimeline.call(component)
    expect(shareContent).toEqual({ title: 'Hi' })

    component.setTitle('Hello')
    await nextTick()
    const updatedShareContent =
      component.methods.onShareTimeline.call(component)
    expect(updatedShareContent).toEqual({ title: 'Hello' })

    defineComponent(() => {}, { canShareToTimeline: true })
    expect(component.methods.onShareTimeline.call(component)).toEqual({})

    defineComponent(() => {})
    expect(component.methods.onShareTimeline).toBeUndefined()
  })

  test('onAddToFavorites', async () => {
    useAddToFavorites(() => ({}))
    expect('Page specific lifecycle').toHaveBeenWarned()

    defineComponent({
      methods: {
        onAddToFavorites() {
          return {}
        },
      },
      render() {
        useAddToFavorites(() => ({}))
      },
    })
    component.__isInjectedFavoritesHook__ =
      component.methods.__isInjectedFavoritesHook__
    component.lifetimes.attached.call(component)
    expect('useAddToFavorites() hook only').toHaveBeenWarned()

    defineComponent(() => {
      useAddToFavorites(() => ({}))
      useAddToFavorites(() => ({}))
    })
    component.__isInjectedFavoritesHook__ =
      component.methods.__isInjectedFavoritesHook__
    component.lifetimes.attached.call(component)
    expect('useAddToFavorites() hook can only').toHaveBeenWarned()

    const arg = {}
    defineComponent(() => {
      const [title, setTitle] = useState('Hi')

      useAddToFavorites((favorite) => {
        expect(favorite).toBe(arg)
        return { title }
      })

      return { title, setTitle }
    })
    component.__isInjectedFavoritesHook__ =
      component.methods.__isInjectedFavoritesHook__
    component.lifetimes.attached.call(component)
    const favoritesContent = component.methods.onAddToFavorites.call(
      component,
      arg,
    )
    expect(favoritesContent).toEqual({ title: 'Hi' })

    component.setTitle('Hello')
    await nextTick()
    const updatedFavoritesContent = component.methods.onAddToFavorites.call(
      component,
      arg,
    )
    expect(updatedFavoritesContent).toEqual({ title: 'Hello' })

    defineComponent(() => {})
    expect(component.methods.onAddToFavorites.call(component, arg)).toEqual({})
  })

  test('onSaveExitState', async () => {
    useSaveExitState(() => ({ data: undefined }))
    expect('Page specific lifecycle').toHaveBeenWarned()

    defineComponent({
      methods: {
        onSaveExitState() {
          return { data: undefined }
        },
      },
      render() {
        useSaveExitState(() => ({ data: undefined }))
      },
    })
    component.__isInjectedExitStateHook__ =
      component.methods.__isInjectedExitStateHook__
    component.lifetimes.attached.call(component)
    expect('useSaveExitState() hook only').toHaveBeenWarned()

    defineComponent(() => {
      useSaveExitState(() => ({ data: undefined }))
      useSaveExitState(() => ({ data: undefined }))
    })
    component.__isInjectedExitStateHook__ =
      component.methods.__isInjectedExitStateHook__
    component.lifetimes.attached.call(component)
    expect('useSaveExitState() hook can only').toHaveBeenWarned()

    defineComponent(() => {
      const [count, setCount] = useState(0)

      const increment = () => {
        setCount(count + 1)
      }

      useSaveExitState(() => ({ data: { count } }))

      return { count, increment }
    })
    component.__isInjectedExitStateHook__ =
      component.methods.__isInjectedExitStateHook__
    component.lifetimes.attached.call(component)
    const exitState = component.methods.onSaveExitState.call(component)
    expect(exitState).toEqual({ data: { count: 0 } })

    component.increment()
    await nextTick()
    const updatedExitState = component.methods.onSaveExitState.call(component)
    expect(updatedExitState).toEqual({ data: { count: 1 } })

    defineComponent(() => {})
    expect(component.methods.onSaveExitState.call(component)).toEqual({
      data: undefined,
    })
  })

  test('onShow', async () => {
    const fn = vi.fn()
    let dummy1: number
    let dummy2: number
    defineComponent({
      pageLifetimes: { show: fn },
      render() {
        const [count, setCount] = useState(0)

        const increment = () => {
          setCount(count + 1)
        }

        useShow(() => {
          dummy1 = count
        })
        useShow(() => {
          dummy2 = count
        })

        return { count, increment }
      },
    })
    component.lifetimes.attached.call(component)
    component.pageLifetimes.show.call(component)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    component.increment()
    await nextTick()
    component.pageLifetimes.show.call(component)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('onHide', async () => {
    const fn = vi.fn()
    let dummy1: number
    let dummy2: number
    defineComponent({
      pageLifetimes: { hide: fn },
      render() {
        const [count, setCount] = useState(0)

        const increment = () => {
          setCount(count + 1)
        }

        useHide(() => {
          dummy1 = count
        })
        useHide(() => {
          dummy2 = count
        })

        return { count, increment }
      },
    })
    component.lifetimes.attached.call(component)
    component.pageLifetimes.hide.call(component)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    component.increment()
    await nextTick()
    component.pageLifetimes.hide.call(component)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('onResize', async () => {
    const arg = {}
    const fn = vi.fn((size) => {
      expect(size).toBe(arg)
    })
    let dummy1: number
    let dummy2: number
    defineComponent({
      pageLifetimes: { resize: fn },
      render() {
        const [count, setCount] = useState(0)

        const increment = () => {
          setCount(count + 1)
        }

        useResize((size) => {
          expect(size).toBe(arg)
          dummy1 = count
        })
        useResize((size) => {
          expect(size).toBe(arg)
          dummy2 = count
        })

        return { count, increment }
      },
    })
    component.lifetimes.attached.call(component)
    component.pageLifetimes.resize.call(component, arg)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    component.increment()
    await nextTick()
    component.pageLifetimes.resize.call(component, arg)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('onRouteDone', async () => {
    const fn = vi.fn()
    let dummy1: number
    let dummy2: number
    defineComponent({
      pageLifetimes: { routeDone: fn },
      render() {
        const [count, setCount] = useState(0)

        const increment = () => {
          setCount(count + 1)
        }

        useRouteDone(() => {
          dummy1 = count
        })
        useRouteDone(() => {
          dummy2 = count
        })

        return { count, increment }
      },
    })
    component.lifetimes.attached.call(component)
    component.pageLifetimes.routeDone.call(component)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    component.increment()
    await nextTick()
    component.pageLifetimes.routeDone.call(component)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('inject component lifecycle outside render', () => {
    useMove(() => {})
    expect('Component specific lifecycle').toHaveBeenWarned()
  })

  test('no render', () => {
    const options = {}
    defineComponent(options)
    expect(component).toBeInstanceOf(Object)
  })
})
