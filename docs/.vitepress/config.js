import { defineConfig } from 'vitepress'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'

export default defineConfig({
  lang: 'zh-cmn-Hans',
  title: 'Rezor',
  description: '最快的 React 小程序框架',
  head: [['link', { rel: 'icon', href: '/logo.svg' }]],
  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [{ icon: 'github', link: 'https://github.com/rezorjs/rezor' }],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present Yang Mingshan',
    },
    nav: [
      {
        text: '指南',
        link: '/guide/',
        activeMatch: '/guide/',
      },
    ],
    sidebar: [
      {
        text: '简介',
        link: '/guide/',
      },
      {
        text: '快速上手',
        link: '/guide/quick-start',
      },
      {
        text: '基础',
        items: [
          { text: '创建小程序', link: '/guide/app' },
          { text: '定义组件', link: '/guide/component' },
        ],
      },
    ],
    outline: {
      label: '本页目录',
    },
    docFooter: {
      prev: '前一篇',
      next: '下一篇',
    },
    darkModeSwitchLabel: '外观',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索',
          },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '重置搜索',
            backButtonTitle: '关闭搜索',
            noResultsText: '无相关结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '向上箭头',
              navigateDownKeyAriaLabel: '向下箭头',
              closeText: '关闭',
              closeKeyAriaLabel: 'esc',
            },
          },
        },
      },
    },
  },
  markdown: {
    config(md) {
      md.use(groupIconMdPlugin)
    },
  },
  vite: {
    plugins: [
      groupIconVitePlugin({
        customIcon: {
          wxml: 'vscode-icons:file-type-wxml',
        },
      }),
    ],
  },
})
