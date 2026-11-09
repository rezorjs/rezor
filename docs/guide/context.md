# Context

Rezor 的 Context 与 React 略有不同。React 的 Context 是与组件树绑定的，但是由于微信小程序没有提供可靠的组件树访问方式，所以 Rezor 的 Context 是全局共享的。这带来了一些限制。

## 限制

一句话总结就是，在 Rezor 中，一个 Context 在任意时刻最多只能有一个提供者。这意味着如果你要在多个组件中为同一个 Context 提供值，你需要确保这些组件是互斥的，在任意时刻最多只有一个组件会被初始化。即使你只在一个组件中为某个 Context 提供值，你也需要确保这个组件在任意时刻最多只有一个实例。如果一个 Context 已经存在一个提供者，你再次尝试为其提供值时，Rezor 会打印一个警告（开发环境）。

## 创建

你可以使用 `createGlobalContext` 函数创建一个 Context，函数的参数是这个 Context 的默认值。函数的名称是为了提醒使用者 Context 的全局性质。

```js [theme-context.js]
import { createGlobalContext } from 'rezor'

export const ThemeContext = createGlobalContext('light')
```

## 提供

在 Rezor 中为 Context 提供值与 React 不太一样。你可以使用 `useGlobalContext` 函数为 Context 提供值，函数的第一个参数就是你的目标 Context，第二个参数就是你想为其提供的值。如果某个 Context 的提供组件被卸载了，那么这个 Context 也会被重置为初始状态。

```js [app.js]
import { createApp, useState, useGlobalContext, useThemeChange } from 'rezor'
import { ThemeContext } from './theme-context'

createApp(() => {
  const [theme, setTheme] = useState(wx.getAppBaseInfo().theme)

  useGlobalContext(ThemeContext, theme)

  useThemeChange((result) => {
    setTheme(result.theme)
  })
})
```

## 消费

消费侧你也是使用 `useGlobalContext` 函数来获取 Context 的值，与提供侧的差别是你只需要传入一个参数，也就是你的目标 Context。

```js [component.js]
import { defineComponent, useGlobalContext } from 'rezor'
import { ThemeContext } from './theme-context'

defineComponent({
  render() {
    const theme = useGlobalContext(ThemeContext)

    const themeText = theme === 'light' ? '浅色' : '深色'

    return { themeText }
  },
})
```
