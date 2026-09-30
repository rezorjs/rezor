# 快速上手

## 创建一个 Rezor 小程序

:::tip 前提条件

- 熟悉命令行
- 已安装 ^22.18.0 或 >= 24.11.0 版本的 [Node.js](https://nodejs.org)

:::

创建 Rezor 小程序最推荐的方案是 [create-rezor](https://github.com/rezorjs/create-rezor)，它是官方项目脚手架工具。你可以在终端内直接运行以下命令（不要带上 `$` 符号）：

::: code-group

```sh [npm]
$ npm create rezor@latest
```

```sh [pnpm]
$ pnpm create rezor@latest
```

```sh [yarn]
$ yarn create rezor
```

```sh [bun]
$ bun create rezor@latest
```

:::

然后你将会看到一些诸如 Skyline 和 TypeScript 之类的可选功能提示：

<div class="language-sh"><pre class="shiki"><code><span style="color:#42b883;">✔</span> <span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">请输入项目名称：<span style="color:#888;">… <span style="--shiki-light:#00B6FF;--shiki-dark:#89DDFF;">&lt;</span><span style="color:#888;">your-project-name</span><span style="--shiki-light:#00B6FF;--shiki-dark:#89DDFF;">&gt;</span></span></span>
<span style="color:#42b883;">✔</span> <span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">是否使用 Skyline 渲染？<span style="color:#888;">… <span style="--shiki-light:#00B6FF;--shiki-dark:#89DDFF;text-decoration:underline">否</span> / 是</span></span>
<span style="color:#42b883;">✔</span> <span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">是否使用 TypeScript 语法？<span style="color:#888;">… <span style="--shiki-light:#00B6FF;--shiki-dark:#89DDFF;text-decoration:underline">否</span> / 是</span></span>
<span style="color:#42b883;">✔</span> <span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">是否引入 Vitest 用于单元测试？<span style="color:#888;">… <span style="--shiki-light:#00B6FF;--shiki-dark:#89DDFF;text-decoration:underline">否</span> / 是</span></span>
<span style="color:#42b883;">✔</span> <span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">是否引入 ESLint 用于 JS 代码质量检测？<span style="color:#888;">… <span style="--shiki-light:#00B6FF;--shiki-dark:#89DDFF;text-decoration:underline">否</span> / 是</span></span>
<span style="color:#42b883;">✔</span> <span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">是否引入 Stylelint 用于 CSS 代码质量检测？<span style="color:#888;">… <span style="--shiki-light:#00B6FF;--shiki-dark:#89DDFF;text-decoration:underline">否</span> / 是</span></span>
<span style="color:#42b883;">✔</span> <span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">是否引入 Prettier 用于代码格式化？<span style="color:#888;">… <span style="--shiki-light:#00B6FF;--shiki-dark:#89DDFF;text-decoration:underline">否</span> / 是</span></span>
<span></span>
<span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">正在初始化项目 ./<span style="--shiki-light:#00B6FF;--shiki-dark:#89DDFF;">&lt;</span><span style="color:#888;">your-project-name</span><span style="--shiki-light:#00B6FF;--shiki-dark:#89DDFF;">&gt;</span>...</span>
<span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">项目初始化完成。</span></code></pre></div>

如果不确定是否要开启某个功能，你可以直接按下回车键选择`否`。在项目被创建后，通过以下步骤安装依赖并启动开发服务器：

::: code-group

```sh [npm]
$ cd <your-project-name>
$ npm install
$ npm run dev
```

```sh [pnpm]
$ cd <your-project-name>
$ pnpm install
$ pnpm dev
```

```sh [yarn]
$ cd <your-project-name>
$ yarn
$ yarn dev
```

```sh [bun]
$ cd <your-project-name>
$ bun install
$ bun run dev
```

:::

你现在应该已经运行起来了你的第一个 Rezor 项目！现在你可以将项目导入[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)，注意选择项目根目录而非 `dist` 目录。因为 project.config.json 的 miniprogramRoot 字段指定了 dist 目录，微信开发者工具会根据这个配置自动找到 dist 目录。

当你准备将小程序发布上线时，请运行：

::: code-group

```sh [npm]
$ npm run build
```

```sh [pnpm]
$ pnpm build
```

```sh [yarn]
$ yarn build
```

```sh [bun]
$ bun run build
```

:::

然后使用微信开发者工具上传。请忽略微信开发者工具关于 JS 代码未压缩的警告，上述命令已经对 JS 代码做了自定义压缩。

## 使用包管理器安装

你也可以使用下列命令安装 Vue Mini：

::: code-group

```sh [npm]
$ npm install rezor
```

```sh [pnpm]
$ pnpm install rezor
```

```sh [yarn]
$ yarn add rezor
```

```sh [bun]
$ bun add rezor
```

:::
