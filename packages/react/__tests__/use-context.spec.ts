import { describe, test, expect, vi } from 'vitest'
import {
  createApp,
  definePage,
  defineComponent,
  useState,
  createContext,
  useContext,
  nextTick,
} from '../src'

// Mocks
let app: Record<string, any>
// @ts-expect-error
globalThis.App = (options: Record<string, any>) => {
  app = options
}

let page: Record<string, any>
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
    setData(data: Record<string, unknown>) {
      Object.keys(data).forEach((key) => {
        this.data[key] = data[key]
      })
    },
  }
}

let component: Record<string, any>
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

describe('useContext', () => {
  test('consumer reads default value when no provider', () => {
    const ThemeContext = createContext('light')
    defineComponent(() => {
      const theme = useContext(ThemeContext)
      return { theme }
    })
    component.lifetimes.attached.call(component)
    expect(component.data.theme).toBe('light')
  })

  test('provider sets value, consumer reads it', () => {
    const ThemeContext = createContext('light')

    defineComponent(() => {
      useContext(ThemeContext, 'dark')
    })
    const provider = component
    provider.lifetimes.attached.call(provider)

    defineComponent(() => {
      const theme = useContext(ThemeContext)
      return { theme }
    })
    component.lifetimes.attached.call(component)
    expect(component.data.theme).toBe('dark')
  })

  test('provider value change triggers consumer re-render', async () => {
    const ThemeContext = createContext('light')
    const renderSpy = vi.fn()

    defineComponent(() => {
      const [theme, setTheme] = useState('dark')
      useContext(ThemeContext, theme)
      return { setTheme }
    })
    const provider = component
    provider.lifetimes.attached.call(provider)

    defineComponent(() => {
      renderSpy()
      const theme = useContext(ThemeContext)
      return { theme }
    })
    const consumer = component
    consumer.lifetimes.attached.call(consumer)
    expect(consumer.data.theme).toBe('dark')
    expect(renderSpy).toHaveBeenCalledTimes(1)

    provider.setTheme('blue')
    await nextTick()
    expect(consumer.data.theme).toBe('blue')
    expect(renderSpy).toHaveBeenCalledTimes(2)
  })

  test('provider Object.is bailout', async () => {
    const ThemeContext = createContext('light')
    const renderSpy = vi.fn()

    defineComponent(() => {
      const [count, setCount] = useState(0)
      const [theme, setTheme] = useState('dark')
      useContext(ThemeContext, theme)
      return { count, setCount, setTheme }
    })
    const provider = component
    provider.lifetimes.attached.call(provider)

    defineComponent(() => {
      renderSpy()
      const theme = useContext(ThemeContext)
      return { theme }
    })
    component.lifetimes.attached.call(component)
    expect(renderSpy).toHaveBeenCalledTimes(1)

    // Trigger re-render, but theme didn't change — should not trigger consumer re-render
    provider.setCount(1)
    await nextTick()
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })

  test('consumer unsubscribes on unmount', async () => {
    const ThemeContext = createContext('light')
    const renderSpy = vi.fn()

    defineComponent(() => {
      const [theme, setTheme] = useState('dark')
      useContext(ThemeContext, theme)
      return { setTheme }
    })
    const provider = component
    provider.lifetimes.attached.call(provider)

    defineComponent(() => {
      renderSpy()
      const theme = useContext(ThemeContext)
      return { theme }
    })
    const consumer = component
    consumer.lifetimes.attached.call(consumer)
    expect(renderSpy).toHaveBeenCalledTimes(1)
    expect(ThemeContext.subscribers.size).toBe(1)

    // Unmount consumer
    consumer.lifetimes.detached.call(consumer)
    expect(ThemeContext.subscribers.size).toBe(0)

    // Provider change should not trigger consumer render
    provider.setTheme('blue')
    await nextTick()
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })

  test('provider resets to default on unmount and notifies consumers', async () => {
    const ThemeContext = createContext('light')

    defineComponent(() => {
      useContext(ThemeContext, 'dark')
    })
    const provider = component
    provider.lifetimes.attached.call(provider)

    defineComponent(() => {
      const theme = useContext(ThemeContext)
      return { theme }
    })
    const consumer = component
    consumer.lifetimes.attached.call(consumer)
    expect(consumer.data.theme).toBe('dark')

    // Unmount provider — context resets to default, consumer re-renders
    provider.lifetimes.detached.call(provider)
    await nextTick()
    expect(consumer.data.theme).toBe('light')
  })

  test('provider resets bailout', async () => {
    const fn = vi.fn()
    const ThemeContext = createContext('light')

    defineComponent(() => {
      useContext(ThemeContext, 'light')
    })
    const provider = component
    provider.lifetimes.attached.call(provider)

    defineComponent(() => {
      fn()
      const theme = useContext(ThemeContext)
      return { theme }
    })
    const consumer = component
    consumer.lifetimes.attached.call(consumer)
    expect(consumer.data.theme).toBe('light')
    expect(fn).toHaveBeenCalledTimes(1)

    // Unmount provider — context resets bailout
    provider.lifetimes.detached.call(provider)
    await nextTick()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('multiple providers warn and keep the first provider value', async () => {
    const ThemeContext = createContext('light')

    defineComponent(() => {
      useContext(ThemeContext, 'outer')
    })
    const outerProvider = component
    outerProvider.lifetimes.attached.call(outerProvider)

    defineComponent(() => {
      useContext(ThemeContext, 'inner')
    })
    const innerProvider = component
    innerProvider.lifetimes.attached.call(innerProvider)
    expect('useContext() does not support').toHaveBeenWarned()

    defineComponent(() => {
      const theme = useContext(ThemeContext)
      return { theme }
    })
    const consumer = component
    consumer.lifetimes.attached.call(consumer)
    expect(consumer.data.theme).toBe('outer')

    innerProvider.lifetimes.detached.call(innerProvider)
    await nextTick()
    expect(consumer.data.theme).toBe('outer')
  })

  test('ignored provider becomes active after current provider unmounts', async () => {
    const ThemeContext = createContext('light')

    defineComponent(() => {
      useContext(ThemeContext, 'first')
    })
    const firstProvider = component
    firstProvider.lifetimes.attached.call(firstProvider)

    defineComponent(() => {
      const [theme, setTheme] = useState('')
      useContext(ThemeContext, theme)
      return { theme, setTheme }
    })
    const secondProvider = component
    secondProvider.lifetimes.attached.call(secondProvider)
    expect('useContext() does not support').toHaveBeenWarned()

    defineComponent(() => {
      const theme = useContext(ThemeContext)
      return { theme }
    })
    const consumer = component
    consumer.lifetimes.attached.call(consumer)
    expect(consumer.data.theme).toBe('first')

    firstProvider.lifetimes.detached.call(firstProvider)
    await nextTick()
    expect(consumer.data.theme).toBe('light')

    secondProvider.setTheme('second')
    await nextTick()
    expect(consumer.data.theme).toBe('second')

    secondProvider.lifetimes.detached.call(secondProvider)
    await nextTick()
    expect(consumer.data.theme).toBe('light')
  })

  test('multiple consumers subscribe to same context', async () => {
    const ThemeContext = createContext('light')
    const renderSpy1 = vi.fn()
    const renderSpy2 = vi.fn()

    defineComponent(() => {
      const [theme, setTheme] = useState('dark')
      useContext(ThemeContext, theme)
      return { setTheme }
    })
    const provider = component
    provider.lifetimes.attached.call(provider)

    defineComponent(() => {
      renderSpy1()
      const theme = useContext(ThemeContext)
      return { theme }
    })
    const consumer1 = component
    consumer1.lifetimes.attached.call(consumer1)

    defineComponent(() => {
      renderSpy2()
      const theme = useContext(ThemeContext)
      return { theme }
    })
    const consumer2 = component
    consumer2.lifetimes.attached.call(consumer2)

    expect(consumer1.data.theme).toBe('dark')
    expect(consumer2.data.theme).toBe('dark')
    expect(renderSpy1).toHaveBeenCalledTimes(1)
    expect(renderSpy2).toHaveBeenCalledTimes(1)

    provider.setTheme('blue')
    await nextTick()
    expect(consumer1.data.theme).toBe('blue')
    expect(consumer2.data.theme).toBe('blue')
    expect(renderSpy1).toHaveBeenCalledTimes(2)
    expect(renderSpy2).toHaveBeenCalledTimes(2)
  })

  test('provider in page resets on unload', async () => {
    const ThemeContext = createContext('light')

    definePage(() => {
      useContext(ThemeContext, 'dark')
      return {}
    })
    page.onLoad()

    defineComponent(() => {
      const theme = useContext(ThemeContext)
      return { theme }
    })
    component.lifetimes.attached.call(component)
    expect(component.data.theme).toBe('dark')

    // Unload page — context resets
    page.onUnload()
    await nextTick()
    expect(component.data.theme).toBe('light')
  })

  test('consumer in page unsubscribes on unload', () => {
    const ThemeContext = createContext('light')

    createApp(() => {
      useContext(ThemeContext, 'dark')
    })
    app.onLaunch()

    definePage(() => {
      const theme = useContext(ThemeContext)
      return { theme }
    })
    page.onLoad()
    expect(ThemeContext.subscribers.size).toBe(1)

    page.onUnload()
    expect(ThemeContext.subscribers.size).toBe(0)
  })

  test('warning outside render', () => {
    const ctx = createContext('default')
    useContext(ctx)
    expect('useContext() hook can only be').toHaveBeenWarned()
  })
})
