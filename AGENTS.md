# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## 项目概述

基于 UniApp + Vue3 + uView-Plus 的微信小程序项目模板，使用 uni-app CLI 构建。

## 技术栈

### 核心框架
- **UniApp CLI**: 跨平台开发框架（`@dcloudio/uni-app`）
- **Vue3**: 使用 Composition API (setup 语法糖)
- **Vite**: 构建工具（`vite` + `@dcloudio/vite-plugin-uni`）

### 本地组件库（位于 src 目录）
- **uView-Plus**: UI 组件库（`src/uview-plus/`），通过 easycom 自动导入
- **z-paging**: 分页组件（`src/uni_modules/z-paging/`），全局配置在 `main.js` 的 `uni.$zp`
- **luch-request**: 网络请求库（`src/lib/luch-request/`）

### NPM 依赖
- **dayjs**: 日期时间处理
- **dotenv**: 环境变量管理
- **uniapp-error-monitor**: 错误监控库，自动上报到企业微信机器人
- **vuex**: 状态管理（`store/index.js`）

## 开发命令

```bash
npm install                    # 安装依赖
npm run devtools:dev           # 开发模式（编译+打开微信开发者工具）
npm run devtools:prod          # 生产模式（编译+替换静态资源+打开微信开发者工具）
npm run replace:static         # 替换静态资源 URL（生产构建前处理）
npm run upload:weapp           # 上传小程序（需先编译）
```

### 编译输出

- 开发模式: `dist/dev/mp-weixin`
- 生产模式: `dist/build/mp-weixin`

### 开发流程

1. `npm run devtools:dev` 启动开发服务器，编译完成后自动打开微信开发者工具
2. 修改代码后会自动热更新
3. 微信开发者工具中可查看控制台日志和调试

## 架构要点

### 目录结构

```
src/
├── App.vue                    # 应用入口
├── main.js                   # 主入口文件
├── manifest.json             # 应用配置（APPID、名称等）
├── pages.json                # 页面路由配置
├── uni.scss                  # 全局样式变量
├── uni.promisify.adaptor.js  # uni-app Promise 适配器
├── api/                      # 接口相关
│   ├── request.js            # 请求封装和拦截器配置
│   └── modules/              # 业务接口模块
├── common/                   # 公共资源
│   ├── styles/               # 全局样式
│   │   ├── common.css        # 原子类样式
│   │   └── base.scss         # SCSS 变量和 Mixins
│   └── utils/                # 工具函数
│       └── tool.js           # 常用工具函数
├── components/               # 全局公共组件
├── wxcomponents/             # 微信原生组件（如 painter）
├── lib/                      # 第三方库
│   └── luch-request/         # 网络请求库（本地副本）
├── mixins/                   # Vue 混入
│   └── global.js             # 全局混入（ASSETSURL 等）
├── pages/                    # 主包页面
│   └── index/                # 首页
├── static/                   # 静态资源
├── store/                    # Vuex 状态管理
│   └── index.js              # Store 配置
├── subPages/                 # 分包页面
│   └── welcome/              # 欢迎页
├── uni_modules/              # uni-app 插件
│   └── z-paging/            # 分页组件库
└── uview-plus/               # uView-Plus UI 组件库

根目录/
├── index.html                # 入口 HTML
├── vite.config.js           # Vite 编译配置
├── package.json              # 依赖配置
├── .env                      # 环境变量配置
└── scripts/                  # 构建脚本
    ├── devtools.dev.mjs     # 开发模式脚本
    ├── devtools.prod.mjs    # 生产模式脚本
    ├── replace-static-resources.mjs  # 静态资源 URL 替换脚本
    ├── move-dist.mjs        # 移动编译产物脚本
    ├── open-wechat-devtools.mjs  # 打开微信开发者工具脚本
    └── upload-weapp.js      # 上传小程序脚本
```

### 页面路由

- **主包页面**: `pages/` 目录
- **分包页面**: `subPages/` 目录
- **路由配置**: `pages.json`

### 静态资源访问

使用全局混入的 `ASSETSURL` 变量（来自 `mixins/global.js`）:
```javascript
// Template
<image :src="`${ASSETSURL}image.png`"/>

// JavaScript
const ASSETSURL = import.meta.env.VITE_ASSETSURL
```

### 静态资源替换

生产构建前，`replace-static-resources.mjs` 脚本会自动将 `.vue` 文件中的静态资源 URL 替换为模板语法：
- 匹配任意属性中的 CDN URL，转换为 `:attr="\`${ASSETSURL}filename\`"`
- 匹配 CSS `url()` 函数中的 CDN URL，转换为 `url(\`${ASSETSURL}filename\`)`

### 网络请求

- 配置: `api/request.js`
- 业务接口: `api/modules/`
- 基础 URL: 环境变量 `VITE_BASE_URL`
- 响应拦截器自动上报 API 错误到监控服务

### 组件规范

- `uni_modules/` 组件无需导入直接使用
- 全局组件放 `components/`
- 页面级组件放页面根目录的 `components/`
- 微信原生组件放页面根目录的 `wxcomponents/`

## JavaScript 规范

- **生命周期**: 从 `@dcloudio/uni-app` 按需导入，页面加载使用 `onLoad` 而非 `onMounted`
- **响应式数据**: 少于 4 个 ref 时直接使用，超过 4 个使用 reactive 封装
- **函数定义**: 使用 `function` 关键字定义方法
- **异步处理**: 使用 `async/await`，避免 `.then` 嵌套
- **变量命名**: 小驼峰 (`userName`)、常量全大写 (`MAX_VALUE`)、状态类 (`isLogin`)、事件方法 (`onClick`)

## 工具函数

`common/utils/tool.js` 提供常用工具（导入为 `tool`）:
- 提示: `alert()`, `loading()`, `hideLoading()`
- 跳转: `navigateTo()`, `redirectTo()`, `reLaunch()`, `switchTab()`, `navigateBack()`
- 存储: `storage()`, `removeStorage()`, `getStorageInfo()`
- 其他: `copy()`, `saveImageToPhotos()`, `requestPayment()`, `upload()`, `loadFont()`

**注意**: `alert()` 返回 Promise，需要返回操作时使用:
```javascript
await tool.alert('提示')
await tool.navigateBack()
```

## 环境变量

`.env` 文件配置:
- `VITE_BASE_URL`: 接口地址
- `VITE_ASSETSURL`: 静态资源 CDN 地址
- `VITE_APPID`: 微信小程序 APPID
- `VITE_APPNAME`: 小程序名称
- `VITE_UNI_APPID`: UNI-APPID
- `VITE_LIBVERSION`: 微信小程序基础库版本
- `VITE_WEBHOOK`: 企业微信机器人地址（错误监控）

## Vite 配置

`vite.config.js` 关键配置:
- **manifestPath**: 指向 `src/manifest.json`
- **@ alias**: 指向 `src/`
- **uview-plus alias**: 指向 `src/uview-plus/`
- **replaceManifestAppid 插件**: 仅在 HBuilder 首次编译时替换 manifest.json 中的 appid
- **生产构建**: 使用 `terser` 压缩，移除 console

## 代码提交规范

提交格式: `类型 描述`

- 新增功能: `新增 功能描述`
- 错误修复: `修复 问题描述`
- 性能优化: `优化 优化内容`
- 文档更新: `文档 更新内容`

## 微信开放能力

- **分享**: `open-type="share"`
- **头像获取**: `open-type="chooseAvatar"` + `@chooseavatar` 事件
- **昵称获取**: `open-type="nickname"`

## 样式

- 全局变量: `uni.scss`
- 原子类: `common/styles/common.css`
- SCSS 变量/Mixins: `common/styles/base.scss`

## 错误监控

在 `main.js` 通过 `uniapp-error-monitor` 初始化:
```javascript
initErrorMonitor({
  webhookUrl: import.meta.env.VITE_WEBHOOK, // 必填
})
```

配置选项:
- `enableGlobalError: true` (默认)
- `enablePromiseError: true` (默认)
- `enableConsoleError: false` (默认)
- webhook 通过 `VITE_WEBHOOK` 配置