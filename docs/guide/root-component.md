# 定义页面根组件

Rezor 推荐使用[页面根组件](https://developers.weixin.qq.com/miniprogram/dev/framework/component-framework/)而非传统的页面，因此 Rezor 没有提供与 `Page` 函数对应的 API。定义页面根组件与定义普通组件一样，都是使用 `defineComponent` 函数。

## render

- **参数**

页面根组件的 `props` 可以用于接收页面的参数。

```js [root-component.js]
import { defineComponent } from 'rezor'

defineComponent({
  properties: {
    id: Number,
    category: String,
  },
  render(props) {
    // /pages/detail/index?id=123&category=food
    props.id // 123
    props.category // 'food'
  },
})
```

## 生命周期

```js [root-component.js]
import { defineComponent } from 'rezor'

defineComponent({
  lifetimes: {
    created() {
      console.log('created')
    },
    attached() {
      console.log('attached')
    },
    ready() {
      console.log('ready')
    },
    moved() {
      console.log('moved')
    },
    detached() {
      console.log('detached')
    },
    error() {
      console.log('error')
    },
  },
  pageLifetimes: {
    show() {
      console.log('show')
    },
    hide() {
      console.log('hide')
    },
    resize() {
      console.log('resize')
    },
    routeDone() {
      console.log('routeDone')
    },
  },
  methods: {
    onLoad() {
      console.log('onLoad')
    },
    onShow() {
      console.log('onShow')
    },
    onReady() {
      console.log('onReady')
    },
    onHide() {
      console.log('onHide')
    },
    onUnload() {
      console.log('onUnload')
    },
    onRouteDone() {
      console.log('onRouteDone')
    },
    onPullDownRefresh() {
      console.log('onPullDownRefresh')
    },
    onReachBottom() {
      console.log('onReachBottom')
    },
    onShareAppMessage() {
      console.log('onShareAppMessage')
    },
    onShareTimeline() {
      console.log('onShareTimeline')
    },
    onAddToFavorites() {
      console.log('onAddToFavorites')
    },
    onPageScroll() {
      console.log('onPageScroll')
    },
    onResize() {
      console.log('onResize')
    },
    onTabItemTap() {
      console.log('onTabItemTap')
    },
    onSaveExitState() {
      console.log('onSaveExitState')
    },
  },
})
```

相较于普通组件，页面根组件有一些额外的生命周期。以上是页面根组件可用的所有生命周期。

Rezor 为每个小程序页面根组件生命周期都提供了一个对应的 `useXXX` 钩子函数，你可以使用它们来注册生命周期回调，回调函数所接受的参数与对应的生命周期一致。除 `useShareAppMessage`、`useShareTimeline`、 `useAddToFavorites` 和 `useSaveExitState` 外每个 `useXXX` 钩子函数都能被多次调用。

- **usePageScroll**

监听页面滚动会导致额外的性能消耗。为了避免定义空的 `onPageScroll` 监听进而造成不必要的性能损耗，你需要使用 `defineComponent` 函数的第二个参数来提前告知 Rezor 是否会调用 `usePageScroll` 钩子函数。

```js [root-component.js]
import { defineComponent, usePageScroll } from 'rezor'

defineComponent(
  {
    render() {
      usePageScroll(({ scrollTop }) => {
        console.log('scrollTop:', scrollTop)
      })
    },
  },
  {
    listenPageScroll: true, // 默认为 false
  },
)
```

如果已存在另外的 `onPageScroll` 方法，那么可以忽略此参数。

```js [root-component.js]
import { defineComponent, usePageScroll } from 'rezor'

defineComponent({
  render() {
    usePageScroll(({ scrollTop }) => {
      console.log('scrollTop (from render):', scrollTop)
    })
  },
  methods: {
    onPageScroll({ scrollTop }) {
      console.log('scrollTop (from option):', scrollTop)
    },
  },
})
```

如果以上两个条件都不满足，在 `render` 中调用 `usePageScroll` 钩子函数会被忽略并打印一个警告（开发环境）。

- **useShareAppMessage**

由于小程序会根据是否定义了 `onShareAppMessage` 监听来决定页面是否可以转发，所以你需要使用 `defineComponent` 函数的第二个参数来提前告知 Rezor 是否会调用 `useShareAppMessage` 钩子函数。又由于 `onShareAppMessage` 会返回自定义转发内容，所以一个页面只能有一个 `onShareAppMessage` 监听。

```js [root-component.js]
import { defineComponent, useShareAppMessage } from 'rezor'

defineComponent(
  {
    render() {
      // 仅第一次调用，且 `canShareToOthers` 为 `true`，且 `onShareAppMessage` 方法不存在时才生效。
      useShareAppMessage(() => {
        return {
          title: '自定义标题',
          path: '/my/page/path',
          imageUrl: 'https://hosts.com/my-image.png',
        }
      })
    },
  },
  {
    canShareToOthers: true, // 默认为 false
  },
)
```

如果条件不满足，在 `render` 中调用 `useShareAppMessage` 钩子函数会被忽略并打印一个警告（开发环境）。

- **useShareTimeline**

由于小程序会根据是否定义了 `onShareTimeline` 监听来决定页面是否可以分享到朋友圈，所以你需要使用 `defineComponent` 函数的第二个参数来提前告知 Rezor 是否会调用 `useShareTimeline` 钩子函数。又由于 `onShareTimeline` 会返回自定义分享内容，所以一个页面只能有一个 `onShareTimeline` 监听。

```js [root-component.js]
import { defineComponent, useShareTimeline } from 'rezor'

defineComponent(
  {
    render() {
      // 仅第一次调用，且 `canShareToTimeline` 为 `true`，且 `onShareTimeline` 方法不存在时才生效。
      useShareTimeline(() => {
        return {
          title: '自定义标题',
          query: 'a=1&b=2',
          imageUrl: 'https://hosts.com/my-image.png',
        }
      })
    },
  },
  {
    canShareToTimeline: true, // 默认为 false
  },
)
```

如果条件不满足，在 `render` 中调用 `useShareTimeline` 钩子函数会被忽略并打印一个警告（开发环境）。

- **useAddToFavorites**

由于 `onAddToFavorites` 会返回自定义收藏内容，所以一个页面只能有一个 `onAddToFavorites` 监听。

```js [root-component.js]
import { defineComponent, useAddToFavorites } from 'rezor'

defineComponent({
  render() {
    // 仅第一次调用，且 `onAddToFavorites` 方法不存在时才生效。
    useAddToFavorites(() => {
      return {
        title: '自定义标题',
        query: 'a=xxx&b=xxx',
        imageUrl: 'https://hosts.com/my-image.png',
      }
    })
  },
})
```

如果条件不满足，在 `render` 中调用 `useAddToFavorites` 钩子函数会被忽略并打印一个警告（开发环境）。

- **useSaveExitState**

由于 `onSaveExitState` 会返回需要保存的状态，所以一个页面只能有一个 `onSaveExitState` 监听。

```js [root-component.js]
import { defineComponent, useState, useSaveExitState } from 'rezor'

defineComponent({
  render(_, context) {
    const [foo, setFoo] = useState(context.exitState?.foo ?? '')

    // 仅第一次调用，且 `onSaveExitState` 方法不存在时才生效。
    useSaveExitState(() => {
      return {
        data: { foo: 'foo' },
      }
    })

    // ...
  },
})
```

如果条件不满足，在 `render` 中调用 `useSaveExitState` 钩子函数会被忽略并打印一个警告（开发环境）。

- **生命周期对应关系**

| 生命周期                  | 钩子函数           | 执行时机完全相同 |
| ------------------------- | ------------------ | ---------------- |
| lifetimes.created         | useEffect          | 否               |
| lifetimes.attached        | useEffect          | 否               |
| lifetimes.ready           | useEffect          | 否               |
| lifetimes.moved           | useMove            | 是               |
| lifetimes.detached        | useEffect          | 是               |
| lifetimes.error           | useError           | 是               |
| pageLifetimes.show        | useShow            | 是               |
| pageLifetimes.hide        | useHide            | 是               |
| pageLifetimes.resize      | useResize          | 是               |
| pageLifetimes.routeDone   | useRouteDone       | 是               |
| methods.onLoad            | useEffect          | 否               |
| methods.onShow            | useShow            | 是               |
| methods.onReady           | useEffect          | 否               |
| methods.onHide            | useHide            | 是               |
| methods.onUnload          | useEffect          | 是               |
| methods.onRouteDone       | useRouteDone       | 是               |
| methods.onPullDownRefresh | usePullDownRefresh | 是               |
| methods.onReachBottom     | useReachBottom     | 是               |
| methods.onShareAppMessage | useShareAppMessage | 是               |
| methods.onShareTimeline   | useShareTimeline   | 是               |
| methods.onAddToFavorites  | useAddToFavorites  | 是               |
| methods.onPageScroll      | usePageScroll      | 是               |
| methods.onResize          | useResize          | 是               |
| methods.onTabItemTap      | useTabItemTap      | 是               |
| methods.onSaveExitState   | useSaveExitState   | 是               |
