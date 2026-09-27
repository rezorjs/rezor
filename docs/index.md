---
layout: home

title: Rezor
titleTemplate: 最快的 React 小程序框架

hero:
  name: Rezor
  text: 最快的 React 小程序框架，没有之一！
  tagline: 简单，强大，高性能。为你和 AI 打造。
  image:
    src: /logo.svg
    alt: Rezor
  actions:
    - theme: brand
      text: 开始
      link: /guide/
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/rezorjs/rezor

features:
  - icon: 🧩
    title: Hooks
    details: Hooks 能赋予你最灵活的代码编写方式，以及最强大的代码抽象能力。
  - icon: 📝
    title: 类型友好
    details: 拥有无缝且完善的 TS 支持，即使你不使用 TS 也能因此受益。
  - icon: 👣
    title: 渐进式
    details: 与小程序原生语法完全兼容，甚至你还可以在 Taro 中使用。
  - icon: 🤏
    title: 小巧
    details: Gzip 后仅 4KB，不会占用你宝贵的小程序空间。
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(90deg, #139fcd 25%, #7b61ff);
  --vp-home-hero-image-background-image: radial-gradient(transparent, transparent 50%, #139fcd 50%, #139fcd);
  --vp-home-hero-image-filter: blur(44px);
  --vp-button-brand-bg: #139fcd;
  --vp-button-brand-hover-bg: #108ab3;
  --vp-button-brand-active-bg: #0b7196;
}

@media (width >= 40rem) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (width >= 60rem) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>
