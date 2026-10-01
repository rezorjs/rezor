# 创建小程序

每个小程序都需要在 `app.js` 中调用 `createApp` 函数创建小程序实例。它是 `App` 函数的超集，它额外接收一个 `render` 函数。

```js [app.js]
import { createApp, useState } from 'rezor'

createApp({
  render() {
    const [greeting, setGreeting] = useState('Hello World!')
    return { greeting, setGreeting }
  },
})
```

如果 `render` 函数返回一个对象，则对象的属性将会被原样合并到小程序实例上。

```js [xxx.js]
const app = getApp()
console.log(app.greeting) // Hello World!
```

## render

- **调用时机**

`render` 会在 `onLaunch` 阶段被调用。返回的数据和方法也是在此时才会被合并到小程序实例上。

- **参数**

`render` 接收与 `onLaunch` 相同的参数。

```js [app.js]
import { createApp } from 'rezor'

createApp({
  render(options) {
    // options 为小程序启动参数
  },
})
```

- **纯函数**

请时刻牢记，与 React 一样 Rezor 的 `render` 函数也会被重复调用，因此 `render` 函数必须是纯函数，不能包含任何副作用。如果你需要执行某些副作用，请使用 `useEffect`。

```js [app.js]
import { createApp, useEffect } from 'rezor'

createApp({
  render() {
    useEffect(() => {
      console.log('App Launched!')
    }, [])
  },
})
```

- **同步函数**

`render` 必须是同步函数，Rezor 不支持异步 `render` 函数。

- **this**

`this` 在 `render` 中**不可用**，这是为了避免混乱。

## 生命周期

Rezor 为每个生命周期都提供了一个对应的 `useXXX` 钩子函数，你可以使用它们来注册生命周期回调，回调函数所接受的参数与对应的生命周期一致。每个 `useXXX` 钩子函数都能被多次调用。

```js [app.js]
import { createApp, useEffect, useAppShow, useThemeChange } from 'rezor'

createApp({
  render() {
    useEffect(() => {
      console.log('launch')
    }, [])
    useAppShow(() => {
      console.log('show')
    })
    useThemeChange(({ theme }) => {
      console.log(`theme: ${theme}`)
    })
  },
})
```

这些钩子函数只能在 `render` 执行期间同步调用，其他场景下调用这些函数会被忽略并打印一个警告（开发环境）。

- **生命周期对应关系**
  - `onLaunch` -> `useEffect`
  - `onShow` -> `useAppShow`
  - `onHide` -> `useAppHide`
  - `onError` -> `useAppError`
  - `onPageNotFound` -> `usePageNotFound`
  - `onUnhandledRejection` -> `useUnhandledRejection`
  - `onThemeChange` -> `useThemeChange`

## 与原生语法混用

因为 `createApp` 是 `App` 的超集，所以你也能使用原生语法。

```js [app.js]
import { createApp, useAppShow } from 'rezor'

createApp({
  render() {
    const hello = 'Hello'

    useAppShow(() => {
      console.log('from render')
    })

    return { hello }
  },
  onShow() {
    console.log('from option')
  },
  world: 'World!',
})
```

如果名称相同，`render` 函数返回值的属性会覆盖原生语法声明的属性。你应该避免出现这种情况。

另外不建议在 `render` 函数外访问 `render` 函数中声明的状态或函数，这容易引起混乱。如果确实有此需求，建议将相关逻辑迁移到 `render` 函数内。

## 简洁语法

如果你不需要使用原生语法，也可以直接传递一个 `render` 函数给 `createApp`。

```js [app.js]
import { createApp } from 'rezor'

createApp(() => {
  const [greeting, setGreeting] = useState('Hello World!')
  return { greeting, setGreeting }
})
```
