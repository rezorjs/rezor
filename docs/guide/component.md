# 定义组件

Rezor 小程序的组件需要在对应的 JS 文件中使用 `defineComponent` 函数进行定义。`defineComponent` 是 `Component` 函数的超集，它额外接收一个 `render` 函数。

```js [component.js]
import { defineComponent, useState } from 'rezor'

defineComponent({
  render() {
    const [count, setCount] = useState(0)
    const double = count * 2

    const increment = () => {
      setCount(count + 1)
    }

    return { count, double, increment }
  },
})
```

如果 `render` 函数返回一个对象，则对象的属性将会被合并到组件实例上，可以直接在组件模版中使用。

```xml [component.wxml]
<button bind:tap="increment">
  {{ count }} X 2 = {{ double }}
</button>
```

## render

::: tip 注意
`[Component] property "xxx" of "path/to/component" received type-uncompatible value: ...`

你可能会看到上面这样的警告信息，这是因为模板初次渲染时父组件的 `data` 还未初始化。通常来说你都可以忽略此类警告，如果有特别的需要可以使用原生语法为 `data` 设置初始值。
:::

- **调用时机**

`render` 函数会在 `attached` 阶段被调用。返回的数据和方法也是在此时才会被合并到组件实例上，所以模版初次渲染时数据可能是 `undefined`。不过小程序模版对此做了兼容，所以不用担心会报错。

- **调用顺序**

`render` 函数会跟 `attached` 生命周期一样按组件树从上到下依次执行。

- **参数**

`render` 函数接收组件的 `props` 作为其第一个参数，`props` 的声明与小程序原生语法没有差别。`render` 函数无需返回 `props`，它的属性默认就能在模版中使用。

```js [component.js]
import { defineComponent } from 'rezor'

defineComponent({
  properties: {
    count: Number,
  },
  render(props) {
    const double = props.count * 2
    return { double }
  },
})
```

`props` 是只读的，你不应该尝试修改其属性。

`render` 函数的第二个参数是一个上下文对象，这个上下文对象是小程序组件 `this` 的删减版，你可以通过它访问小程序提供的 API 等。

```js [component.js]
import { defineComponent } from 'rezor'

defineComponent({
  render(props, context) {
    context.is
    context.id
    context.dataset
    context.exitState
    context.triggerEvent
    // ...
  },
})
```

`context` 参数是稳定不变的，所以你可以安全的在依赖数组中忽略它，就跟 `setState` 一样。

```js [component.js]
import { defineComponent, useEffect } from 'rezor'

defineComponent({
  render(props, context) {
    useEffect(() => {
      console.log(context)
    }, []) // 可以忽略 context

    useEffect(() => {
      console.log(context.exitState)
      context.triggerEvent(/* ... */)
    }, []) // 可以忽略 context.exitState 和 context.triggerEvent
  },
})
```

- **纯函数**

请时刻牢记，与 React 一样 Rezor 的 `render` 函数也会被重复调用，因此 `render` 函数必须是纯函数，不能包含任何副作用。如果你需要执行某些副作用，请使用 `useEffect`。

```js [component.js]
import { defineComponent, useEffect } from 'rezor'

defineComponent({
  render() {
    useEffect(() => {
      console.log('Component attached!')
    }, [])
  },
})
```

- **同步函数**

`render` 必须是同步函数，Rezor 不支持异步 `render` 函数。

- **this**

`this` 在 `render` 函数中**不可用**，这是为了避免混乱。

## 生命周期

::: tip 注意
Rezor 钩子函数与其对应的小程序组件生命周期的执行时机可能并不完全相同，例如 `useEffect` 并不是在 `attached` 阶段同步执行的。在绝大多数情况下这都不是问题，如果在某些罕见的情况下你需要十分严格的执行时机，例如必须在 `attached` 阶段同步执行某些副作用，你可以使用小程序原生语法。
:::

Rezor 为每个小程序组件生命周期都提供了一个对应的 `useXXX` 钩子函数，你可以使用它们来注册生命周期回调，回调函数所接受的参数与对应的生命周期一致。每个 `useXXX` 钩子函数都能被多次调用。

```js [component.js]
import { defineComponent, useEffect, useMove, useError } from 'rezor'

defineComponent({
  render() {
    useEffect(() => {
      console.log('attached')
      return () => {
        console.log('detached')
      }
    }, [])
    useMove(() => {
      console.log('moved')
    })
    useError((error) => {
      console.log(error)
    })
  },
})
```

这些钩子函数只能在 `render` 执行期间同步调用，其他场景下调用这些函数会被忽略并打印一个警告（开发环境）。

- **生命周期对应关系**

| 生命周期                | 钩子函数     | 执行时机完全相同 |
| ----------------------- | ------------ | ---------------- |
| lifetimes.created       | useEffect    | 否               |
| lifetimes.attached      | useEffect    | 否               |
| lifetimes.ready         | useEffect    | 否               |
| lifetimes.moved         | useMove      | 是               |
| lifetimes.detached      | useEffect    | 是               |
| lifetimes.error         | useError     | 是               |
| pageLifetimes.show      | useShow      | 是               |
| pageLifetimes.hide      | useHide      | 是               |
| pageLifetimes.resize    | useResize    | 是               |
| pageLifetimes.routeDone | useRouteDone | 是               |

## 与原生语法混用

因为 `defineComponent` 是 `Component` 的超集，所以你也能使用原生语法。

```js [component.js]
import { defineComponent, useState } from 'rezor'

defineComponent({
  render() {
    const [count, setCount] = useState(0)

    const increment = () => {
      setCount(count + 1)
    }

    return { count, increment }
  },
  data: {
    number: 0,
  },
  methods: {
    add() {
      this.setData({ number: this.data.number + 1 })
    },
  },
})
```

如果名称相同，`render` 函数返回的数据或方法会覆盖原生语法声明的数据或方法。你应该避免出现这种情况。

另外不建议在 `render` 函数外访问 `render` 函数中声明的数据或方法，这容易引起混乱。如果确实有此需求，建议将相关逻辑迁移到 `render` 函数内。

## 简洁语法

如果你不需要使用原生语法，也可以直接传递一个 `render` 函数给 `defineComponent`。

```js [component.js]
import { defineComponent } from 'rezor'

defineComponent(() => {
  const [count, setCount] = useState(0)

  const increment = () => {
    setCount(count + 1)
  }

  return { count, increment }
})
```
