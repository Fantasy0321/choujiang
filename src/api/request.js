import Request from '@/lib/luch-request/index.js'
import tool from '@/common/utils/tool.js'
import { reportError } from 'uniapp-error-monitor'

const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:8080/template'
const http = new Request()

/* 设置全局配置 */
http.setConfig(config => {
  config.header = { ...config.header }
  config.sslVerify = false
  config.baseURL = baseUrl
  return config
})

http.interceptors.request.use(
  async config => {
    config.header = { ...config.header }
    return config
  },
  config => {
    return Promise.reject(config)
  }
)

http.interceptors.response.use(response => {
  if (response.statusCode == 500 || response.statusCode == 404 || response.statusCode == 403) {
    console.error(response)
    return tool.alert('网络错误，请稍后重试')
  }

  if (response.statusCode == 401 || response.data?.code == 401) {
  }

  if (response.data && response.data.code !== undefined && response.data.code !== 1 && response.data.code !== 200) {
    reportError('api', response)
    return Promise.reject(response)
  }

  if (response.statusCode == 200) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(response)
  }
})

export default http
