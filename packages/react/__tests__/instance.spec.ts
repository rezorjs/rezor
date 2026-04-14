import { describe, test, expect } from 'vitest'
import { definePage, defineComponent, useState, nextTick } from '../src'

// Mocks
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
      if (component) {
        component.lifetimes.attached.call(component)
      }
    },
  }
}

describe('instance', () => {
  test('unset current instance', async () => {
    definePage(() => {
      const [count, setCount] = useState(0)
      return { count, setCount }
    })
    page.onLoad()
    expect(page.data.count).toBe(0)

    defineComponent(() => {
      const [count, setCount] = useState(0)
      return { count, setCount }
    })

    page.setCount(1)
    await nextTick()
    expect(page.data.count).toBe(1)
    expect(component.data.count).toBe(0)

    component.setCount(1)
    await nextTick()
    expect(component.data.count).toBe(1)
  })
})
