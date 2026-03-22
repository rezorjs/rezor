import { describe, test, expect, vi } from 'vitest'
import {
  definePage,
  nextTick,
  useState,
  useEffect,
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
let page: Record<string, any>
let renderCb: () => void
// @ts-expect-error
globalThis.Page = (options: Record<string, any>) => {
  page = {
    ...options,
    is: '',
    data: {},
    route: '',
    options: {},
    createSelectorQuery() {},
    createIntersectionObserver() {},
    createMediaQueryObserver() {},
    selectComponent() {},
    selectAllComponents() {},
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

describe('page', () => {
  test('binding', () => {
    definePage(() => {
      const und = undefined
      const nul = null
      const num = 0
      const str = ''
      const bool = true
      const arr: never[] = []
      const obj = {}
      return { und, nul, num, str, bool, arr, obj }
    })
    page.onLoad()
    expect(page.data).toEqual({
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
    definePage(() => {
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
    page.onLoad()
    expect(fn).toBeCalledTimes(1)
    expect(page.data.count).toBe(0)
    expect(page.data.double).toBe(0)

    page.increment()
    await nextTick()
    expect(fn).toBeCalledTimes(2)
    expect(page.data.count).toBe(1)
    expect(page.data.double).toBe(2)

    page.increment()
    page.onUnload()
    await nextTick()
    expect(fn).toBeCalledTimes(2)
  })

  test('skip unchanged states on update', async () => {
    definePage(() => {
      const [foo, setFoo] = useState('')
      const [bar, setBar] = useState('')
      const [baz, setBaz] = useState(undefined)

      return { foo, setFoo, bar, setBar, baz, setBaz }
    })
    page.onLoad()
    expect(page.data.foo).toBe('')
    expect(page.data.bar).toBe('')
    expect(page.data.baz).toBe(undefined)
    expect(Object.prototype.hasOwnProperty.call(page.data, 'baz')).toBe(true)

    page.setData = function (
      data: Record<string, unknown>,
      callback: () => void,
    ) {
      expect(data).toEqual({ foo: 'foo' })

      Object.keys(data).forEach((key) => {
        this.data[key] = data[key]
      })

      renderCb = callback
    }
    page.setFoo('foo')
    await nextTick()
    expect(page.data.foo).toBe('foo')
    expect(page.data.bar).toBe('')
    expect(page.data.baz).toBe(undefined)
    expect(Object.prototype.hasOwnProperty.call(page.data, 'baz')).toBe(true)
  })

  test('useEffect', async () => {
    let dummy: number
    const fn = vi.fn()
    definePage(() => {
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
    page.onLoad()
    page.onReady()
    renderCb()
    expect(fn).toBeCalledTimes(1)
    expect(dummy!).toBe(0)

    page.increment()
    await nextTick()
    renderCb()
    expect(fn).toBeCalledTimes(2)
    expect(dummy!).toBe(1)

    page.increment()
    await nextTick()
    page.onUnload()
    renderCb()
    expect(fn).toBeCalledTimes(2)
    expect(dummy!).toBe(1)
  })

  test('onLoad', () => {
    const arg = {}
    const onLoad = vi.fn()
    const render = vi.fn((query, context) => {
      expect(query).toBe(arg)
      expect(context.is).toBe('')
      expect(context.getOpenerEventChannel).toBeInstanceOf(Function)
      // Low library version does not have getAppBar API, but it should not cause error.
      expect(context.getAppBar).toBe(undefined)
    })
    definePage({ onLoad, render })
    page.onLoad(arg)
    expect(onLoad).toBeCalledWith(arg)
    expect(render).toBeCalledTimes(1)
  })

  test('context: high library version', () => {
    definePage((_, context) => {
      expect(context.getAppBar).toBeInstanceOf(Function)
    })
    const extendedPage = { ...page, getAppBar() {} }
    // @ts-expect-error
    extendedPage.onLoad()
  })

  test('onReady', () => {
    const fn = vi.fn()
    const injectedFn1 = vi.fn()
    const injectedFn2 = vi.fn()
    definePage({
      onReady: fn,
      render() {
        useEffect(injectedFn1, [])
        useEffect(injectedFn2, [])
      },
    })
    page.onLoad()
    page.onReady()
    expect(fn).toBeCalledTimes(1)
    expect(injectedFn1).toBeCalledTimes(1)
    expect(injectedFn2).toBeCalledTimes(1)
  })

  test('onShow', async () => {
    const fn = vi.fn()
    let dummy1: number
    let dummy2: number
    definePage({
      onShow: fn,
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
    page.onLoad()
    page.onShow()
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    page.increment()
    await nextTick()
    page.onShow()
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('onHide', async () => {
    const fn = vi.fn()
    let dummy1: number
    let dummy2: number
    definePage({
      onHide: fn,
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
    page.onLoad()
    page.onHide()
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    page.increment()
    await nextTick()
    page.onHide()
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('onUnload', () => {
    const fn = vi.fn()
    const injectedFn1 = vi.fn()
    const injectedFn2 = vi.fn()
    definePage({
      onUnload: fn,
      render() {
        useEffect(() => injectedFn1, [])
        useEffect(() => injectedFn2, [])
      },
    })
    page.onLoad()
    page.onReady()
    page.onUnload()
    expect(fn).toBeCalledTimes(1)
    expect(injectedFn1).toBeCalledTimes(1)
    expect(injectedFn2).toBeCalledTimes(1)
  })

  test('onRouteDone', async () => {
    const fn = vi.fn()
    let dummy1: number
    let dummy2: number
    definePage({
      onRouteDone: fn,
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
    page.onLoad()
    page.onRouteDone()
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    page.increment()
    await nextTick()
    page.onRouteDone()
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('onPullDownRefresh', async () => {
    const fn = vi.fn()
    let dummy1: number
    let dummy2: number
    definePage({
      onPullDownRefresh: fn,
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
    page.onLoad()
    page.onPullDownRefresh()
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    page.increment()
    await nextTick()
    page.onPullDownRefresh()
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('onReachBottom', async () => {
    const fn = vi.fn()
    let dummy1: number
    let dummy2: number
    definePage({
      onReachBottom: fn,
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
    page.onLoad()
    page.onReachBottom()
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    page.increment()
    await nextTick()
    page.onReachBottom()
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
    definePage({
      onResize: fn,
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
    page.onLoad()
    page.onResize(arg)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    page.increment()
    await nextTick()
    page.onResize(arg)
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
    definePage({
      onTabItemTap: fn,
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
    page.onLoad()
    page.onTabItemTap(arg)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    page.increment()
    await nextTick()
    page.onTabItemTap(arg)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)
  })

  test('onPageScroll', async () => {
    usePageScroll(() => {})
    expect('Page specific lifecycle').toHaveBeenWarned()

    definePage(() => {
      usePageScroll(() => {})
    })
    page.onLoad()
    expect('usePageScroll() hook only').toHaveBeenWarned()

    const arg = {}
    const fn = vi.fn((scroll) => {
      expect(scroll).toBe(arg)
    })
    let dummy1: number
    let dummy2: number
    definePage({
      onPageScroll: fn,
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
    page.onLoad()
    page.onPageScroll(arg)
    expect(fn).toBeCalledTimes(1)
    expect(dummy1!).toBe(0)
    expect(dummy2!).toBe(0)

    page.increment()
    await nextTick()
    page.onPageScroll(arg)
    expect(fn).toBeCalledTimes(2)
    expect(dummy1!).toBe(1)
    expect(dummy2!).toBe(1)

    let dummy: number
    definePage(
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
    page.onLoad()
    page.onPageScroll(arg)
    expect(dummy!).toBe(0)

    page.increment()
    await nextTick()
    page.onPageScroll(arg)
    expect(dummy!).toBe(1)

    definePage(() => {})
    expect(page.onPageScroll).toBeUndefined()
  })

  test('onShareAppMessage', async () => {
    useShareAppMessage(() => ({}))
    expect('Page specific lifecycle').toHaveBeenWarned()

    definePage({
      onShareAppMessage() {
        return {}
      },
      render() {
        useShareAppMessage(() => ({}))
      },
    })
    page.onLoad()
    expect('useShareAppMessage() hook only').toHaveBeenWarnedTimes(1)

    definePage(() => {
      useShareAppMessage(() => ({}))
    })
    page.onLoad()
    expect('useShareAppMessage() hook only').toHaveBeenWarnedTimes(2)

    definePage(
      () => {
        useShareAppMessage(() => ({}))
        useShareAppMessage(() => ({}))
      },
      { canShareToOthers: true },
    )
    page.onLoad()
    expect('useShareAppMessage() hook can only').toHaveBeenWarned()

    const arg = {}
    definePage(
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
    page.onLoad()
    const shareContent = page.onShareAppMessage(arg)
    expect(shareContent).toEqual({ title: 'Hi' })

    page.setTitle('Hello')
    await nextTick()
    const updatedShareContent = page.onShareAppMessage(arg)
    expect(updatedShareContent).toEqual({ title: 'Hello' })

    definePage(() => {}, { canShareToOthers: true })
    expect(page.onShareAppMessage(arg)).toEqual({})

    definePage(() => {})
    expect(page.onShareAppMessage).toBeUndefined()
  })

  test('onShareTimeline', async () => {
    useShareTimeline(() => ({}))
    expect('Page specific lifecycle').toHaveBeenWarned()

    definePage({
      onShareTimeline() {
        return {}
      },
      render() {
        useShareTimeline(() => ({}))
      },
    })
    page.onLoad()
    expect('useShareTimeline() hook only').toHaveBeenWarnedTimes(1)

    definePage(() => {
      useShareTimeline(() => ({}))
    })
    page.onLoad()
    expect('useShareTimeline() hook only').toHaveBeenWarnedTimes(2)

    definePage(
      () => {
        useShareTimeline(() => ({}))
        useShareTimeline(() => ({}))
      },
      { canShareToTimeline: true },
    )
    page.onLoad()
    expect('useShareTimeline() hook can only').toHaveBeenWarned()

    definePage(
      () => {
        const [title, setTitle] = useState('Hi')

        useShareTimeline(() => {
          return { title }
        })

        return { title, setTitle }
      },
      { canShareToTimeline: true },
    )
    page.onLoad()
    const shareContent = page.onShareTimeline()
    expect(shareContent).toEqual({ title: 'Hi' })

    page.setTitle('Hello')
    await nextTick()
    const updatedShareContent = page.onShareTimeline()
    expect(updatedShareContent).toEqual({ title: 'Hello' })

    definePage(() => {}, { canShareToTimeline: true })
    expect(page.onShareTimeline()).toEqual({})

    definePage(() => {})
    expect(page.onShareTimeline).toBeUndefined()
  })

  test('onAddToFavorites', async () => {
    useAddToFavorites(() => ({}))
    expect('Page specific lifecycle').toHaveBeenWarned()

    definePage({
      onAddToFavorites() {
        return {}
      },
      render() {
        useAddToFavorites(() => ({}))
      },
    })
    page.onLoad()
    expect('useAddToFavorites() hook only').toHaveBeenWarned()

    definePage(() => {
      useAddToFavorites(() => ({}))
      useAddToFavorites(() => ({}))
    })
    page.onLoad()
    expect('useAddToFavorites() hook can only').toHaveBeenWarned()

    const arg = {}
    definePage(() => {
      const [title, setTitle] = useState('Hi')

      useAddToFavorites((favorite) => {
        expect(favorite).toBe(arg)
        return { title }
      })

      return { title, setTitle }
    })
    page.onLoad()
    const favoritesContent = page.onAddToFavorites(arg)
    expect(favoritesContent).toEqual({ title: 'Hi' })

    page.setTitle('Hello')
    await nextTick()
    const updatedFavoritesContent = page.onAddToFavorites(arg)
    expect(updatedFavoritesContent).toEqual({ title: 'Hello' })

    definePage(() => {})
    expect(page.onAddToFavorites(arg)).toEqual({})
  })

  test('onSaveExitState', async () => {
    useSaveExitState(() => ({ data: undefined }))
    expect('Page specific lifecycle').toHaveBeenWarned()

    definePage({
      onSaveExitState() {
        return { data: undefined }
      },
      render() {
        useSaveExitState(() => ({ data: undefined }))
      },
    })
    page.onLoad()
    expect('useSaveExitState() hook only').toHaveBeenWarned()

    definePage(() => {
      useSaveExitState(() => ({ data: undefined }))
      useSaveExitState(() => ({ data: undefined }))
    })
    page.onLoad()
    expect('useSaveExitState() hook can only').toHaveBeenWarned()

    definePage(() => {
      const [count, setCount] = useState(0)

      const increment = () => {
        setCount(count + 1)
      }

      useSaveExitState(() => ({ data: { count } }))

      return { count, increment }
    })
    page.onLoad()
    const exitState = page.onSaveExitState()
    expect(exitState).toEqual({ data: { count: 0 } })

    page.increment()
    await nextTick()
    const updatedExitState = page.onSaveExitState()
    expect(updatedExitState).toEqual({ data: { count: 1 } })

    definePage(() => {})
    expect(page.onSaveExitState()).toEqual({ data: undefined })
  })

  test('inject lifecycle outside render', () => {
    useShow(() => {})
    expect('Page specific lifecycle').toHaveBeenWarned()
  })

  test('no render', () => {
    const options = {}
    definePage(options)
    expect(page).toBeInstanceOf(Object)
  })
})
