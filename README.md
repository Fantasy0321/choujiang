# UniApp + Vue3 + uView-Plus 微信小程序项目模板

这是一个基于 UniApp + Vue3 + uView-Plus 的微信小程序项目模板。它提供了基础的项目结构、常用的工具函数和自动化上传功能，方便快速开发微信小程序。

## 技术栈

- **UniApp**: 跨平台开发框架，用于构建微信小程序
- **Vue3**: 渐进式 JavaScript 框架，使用 Composition API
- **uView-Plus**: 基于 UniApp 的 UI 组件库（本地代码）
- **z-paging**: 高性能分页组件（本地代码）
- **Vuex**: 状态管理库
- **Vite**: 现代化构建工具
- **luch-request**: 网络请求库（本地代码）
- **uniapp-error-monitor**: 错误监控库

## 项目结构

```
.
├── src/                   # 源代码目录（uni-app CLI 标准结构）
│   ├── App.vue           # 应用入口
│   ├── main.js           # 主入口文件
│   ├── manifest.json     # 应用配置
│   ├── pages.json        # 页面配置
│   ├── uni.scss          # 全局样式变量
│   ├── uni.promisify.adaptor.js  # Promise 适配器
│   ├── api/              # 接口相关
│   │   ├── modules/      # 业务接口
│   │   └── request.js    # 请求封装
│   ├── common/           # 公共资源
│   │   ├── styles/       # 全局样式
│   │   │   ├── common.css   # 原子类样式
│   │   │   └── base.scss    # SCSS 变量和 Mixins
│   │   └── utils/        # 工具函数
│   │       └── tool.js   # 常用工具函数
│   ├── components/      # 全局公共组件
│   ├── wxcomponents/     # 微信原生组件
│   │   └── painter/      # 海报绘制组件
│   ├── uni_modules/      # uni-app 组件
│   │   └── z-paging/     # 分页组件库
│   ├── lib/              # 第三方库
│   │   └── luch-request/ # 网络请求库
│   ├── uview-plus/       # uView-Plus 组件库
│   ├── mixins/           # Vue 混入
│   │   └── global.js     # 全局混入
│   ├── pages/            # 主包页面
│   │   └── index/        # 首页
│   ├── subPages/         # 分包页面
│   │   └── welcome/      # 欢迎页
│   ├── static/           # 静态资源
│   │   └── assets/       # 图片资源
│   └── store/            # 状态管理
├── scripts/              # 自动化脚本
│   ├── devtools.dev.mjs        # 开发模式构建
│   ├── devtools.prod.mjs       # 生产模式构建
│   ├── replace-static-resources.mjs  # 静态资源 URL 替换
│   ├── move-dist.mjs          # 移动构建产物
│   ├── open-wechat-devtools.mjs  # 打开微信开发者工具
│   └── upload-weapp.js        # 自动化上传脚本
├── index.html            # HTML 入口
├── vite.config.js        # Vite 编译配置
├── .env                  # 环境变量
├── .nvmdrc               # Node.js 版本要求
└── package.json          # 项目依赖配置
```

## 快速开始

### 环境要求

- Node.js 24.0.1+（版本信息在 `.nvmdrc` 文件中）
- npm 或 yarn
- 微信开发者工具

### 安装依赖

```bash
npm install
```

### 开发命令

```bash
npm run devtools:dev     # 开发模式构建（保留 console）
npm run devtools:prod    # 生产模式构建（移除 console + 替换静态资源）
npm run replace:static   # 单独执行静态资源 URL 替换
npm run upload:weapp     # 自动化上传微信小程序
```

### 构建流程

1. **开发模式**：运行 `npm run devtools:dev`，生成开发版本 `dist/dev/mp-weixin`
2. **生产模式**：运行 `npm run devtools:prod`，生成生产版本 `dist/build/mp-weixin`
3. **上传**：运行 `npm run upload:weapp`（需先完成构建）

### 微信开发者工具

构建完成后，使用微信开发者工具打开项目：

- 开发版本：`dist/dev/mp-weixin`
- 生产版本：`dist/build/mp-weixin`

## 自动化上传微信小程序

项目提供了自动化上传微信小程序的功能，可以快速将编译后的小程序上传到微信开发者平台。

### 使用前准备

1. **配置微信开发者工具CLI路径**

   设置环境变量 `WECHAT_CLI_PATH`：

   - **Windows**: `C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat`
   - **macOS**: `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`

   或者在 `scripts/upload-weapp.js` 中修改 `CONFIG.cliPath` 的值。

2. **编译项目**

   运行生产模式构建：
   ```bash
   npm run devtools:prod
   ```

### 功能特性

自动化上传脚本会自动执行以下操作：

1. **版本号自增** - 自动递增 `manifest.json` 中的版本号
2. **生成上传备注** - 获取 git 日志并转换为中文格式，每条日志带序号
3. **更新配置文件** - 更新 `manifest.json` 中的版本号
4. **上传到微信** - 调用微信开发者工具 CLI 上传

### 上传描述格式

```
[master] (1) 新增功能 (yuantao, 3周前) | (2) 优化性能 (yuantao, 6周前) | (3) 修复bug (yuantao, 7周前)
```

## 静态资源处理

生产构建前，`replace-static-resources.mjs` 脚本会自动处理 `.vue` 文件中的静态资源 URL：

- 将属性中的 CDN URL 替换为模板语法：`:attr="\`${ASSETSURL}filename\`"`
- 将 CSS `url()` 中的 CDN URL 替换为：`url(\`${ASSETSURL}filename\`)`

这使得静态资源路径可以通过环境变量动态配置。

## 开发指南

### 样式规范

- 使用 `uni.scss` 中的全局样式变量
- 优先使用原子类样式（`common.css`）
- 统一使用 SCSS 变量和 Mixins（`base.scss`）

### JavaScript 规范

- 严格遵循 ES6+ 语法规范
- 优先使用函数式编程范式
- 使用 `function` 关键字定义方法函数
- 响应式数据：少于 4 个 `ref` 时直接使用，超过 4 个时使用 `reactive`
- 生命周期：通过 `@dcloudio/uni-app` 按需导入，页面加载使用 `onLoad` 而非 `onMounted`
- 变量命名：小驼峰命名法（`userName`）、常量全大写（`MAX_LENGTH`）、状态类变量（`isLogin`）
- 注释规范：变量和方法必须有注释说明和类型说明
- 异步处理：所有 Promise 类方法使用 `async/await` 写法
- 字符串拼接：使用 ES6 模板语法

### 工具函数 (tool.js)

`common/utils/tool.js` 提供完整的工具函数库：

#### 提示与加载
- `alert()`: 文字轻提示
- `loading()`: 显示加载状态
- `hideLoading()`: 隐藏加载状态

#### 页面跳转
- `navigateTo()`: 跳转到指定页面
- `redirectTo()`: 关闭当前页面并跳转
- `reLaunch()`: 关闭所有页面并跳转
- `switchTab()`: 跳转到 TabBar 页面
- `navigateBack()`: 返回上一页面

#### 本地存储
- `storage()`: 设置或获取本地存储
- `removeStorage()`: 移除本地存储项
- `getStorageInfo()`: 获取存储信息

#### 其他功能
- `copy()`: 复制文本到剪贴板
- `saveImageToPhotos()`: 保存图片到相册
- `requestPayment()`: 发起微信支付
- `upload()`: 文件上传
- `loadFont()`: 动态加载字体

### 网络请求

- 使用 `lib/luch-request` 库进行封装
- 全局配置在 `api/request.js` 中定义
- 包含请求和响应拦截器，用于处理通用逻辑
- 基础 URL 通过环境变量 `VITE_BASE_URL` 配置
- 各业务接口存放在 `api/modules` 下

### 组件使用

#### uView-Plus 组件

通过 `easycom` 自动导入，无需手动引入：

```vue
<template>
  <u-button type="primary">按钮</u-button>
  <u-icon name="home" />
</template>
```

#### z-paging 分页组件

全局配置在 `main.js` 的 `uni.$zp` 中：

```vue
<template>
  <z-paging ref="paging" v-model="dataList" @query="queryList">
    <view v-for="item in dataList" :key="item.id">
      {{ item.name }}
    </view>
  </z-paging>
</template>

<script setup>
import { ref } from 'vue'

const paging = ref(null)
const dataList = ref([])

const queryList = async (pageNo, pageSize) => {
  try {
    const result = await api.getList({ pageNo, pageSize })
    paging.value.complete(result.data.list)
  } catch (error) {
    paging.value.complete(false)
  }
}
</script>
```

### 微信原生功能

- **分享功能**: 使用 `open-type="share"` 属性
- **头像获取**: 使用 `open-type="chooseAvatar"` 属性
- **昵称获取**: 使用 `open-type="nickname"` 属性

### 静态资源访问

使用全局混入的 `ASSETSURL` 变量：

```javascript
// 在 template 中
<image :src="`${ASSETSURL}image.png`" />

// 在 JavaScript 中
const imageUrl = `${ASSETSURL}image.png`
```

## 环境变量

`.env` 文件配置：

- `VITE_BASE_URL`: 接口地址
- `VITE_ASSETSURL`: 静态资源 CDN 地址
- `VITE_APPID`: 微信小程序 APPID
- `VITE_APPNAME`: 小程序名称
- `VITE_UNI_APPID`: UNI-APPID
- `VITE_LIBVERSION`: 微信小程序基础库版本
- `VITE_WEBHOOK`: 企业微信机器人地址（用于错误监控）

## 错误监控

项目集成了 `uniapp-error-monitor` 错误监控库，在 `main.js` 中初始化：

```javascript
import { initErrorMonitor } from 'uniapp-error-monitor'

initErrorMonitor({
  webhookUrl: import.meta.env.VITE_WEBHOOK,
})
```

监控配置：
- `enableGlobalError: true` - 全局错误监控
- `enablePromiseError: true` - Promise 错误监控
- `enableConsoleError: false` - console.error 监控

## 代码提交规范

### 提交信息格式

- **新增功能**: `新增 功能描述`
- **错误修复**: `修复 问题描述`
- **性能优化**: `优化 优化内容`
- **文档更新**: `文档 更新内容`

### 示例

```bash
git commit -m "新增 推广海报生成功能"
git commit -m "修复 购物车数量计算错误"
git commit -m "优化 接口请求性能"
```

## 注意事项

1. 项目使用 uni-app CLI 进行构建和开发
2. 上传前必须先使用 `npm run devtools:prod` 构建项目
3. 确保项目是 git 仓库（用于获取日志）
4. 确保微信开发者工具 CLI 路径配置正确
5. 编译后的文件位于 `dist/build/mp-weixin` 目录
6. 生产构建时静态资源 URL 会自动替换为模板语法

## 最佳实践

### 页面开发
- 使用 Composition API (setup 语法糖)
- 遵循 Vue3 响应式原理
- 合理使用 computed 和 watch

### 组件开发
- 保持组件单一职责
- 使用 props 进行父子通信
- 合理使用 emits 进行事件派发

### 状态管理
- 合理划分 store 模块
- 避免过度依赖全局状态
- 及时清理不需要的状态

### 性能优化
- 使用 z-paging 进行列表优化
- 合理使用图片懒加载
- 避免不必要的重复渲染

## 许可证

MIT