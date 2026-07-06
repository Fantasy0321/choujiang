import App from './App'
import uviewPlus from './uview-plus'
import globalMixin from './mixins/global'
import store from './store'
import { createSSRApp } from 'vue'
import './uni.promisify.adaptor'
import { initErrorMonitor } from 'uniapp-error-monitor'

uni.$zp = {
  config: {
    'empty-view-text': '空空如也~~',
    'refresher-enabled': true,
  },
}

export function createApp() {
  const app = createSSRApp(App)
  app.use(uviewPlus)
  app.use(globalMixin)
  app.use(store)
  
  // 初始化错误监控
  initErrorMonitor({
    webhookUrl: import.meta.env.VITE_WEBHOOK, // 必填
    // forceEnable: true,
  })

  return { app }
}
