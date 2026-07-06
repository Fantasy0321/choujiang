import store from '@/store'
import http from '@/api/request.js'

const ASSETSURL = import.meta.env.VITE_ASSETSURL
const NUKE_CODE = import.meta.env.VITE_NUKE_CODE

/**
 * 获取核弹配置
 */
function fetchNukeConfig() {
  return http.post(`https://api74.vrupup.com/tp/365/public/get_config?type=1&code=${NUKE_CODE}`, {}).then(res => res.data)
}

/**
 * 解析核弹配置到 store
 * - 同步 version
 * - 保存完整配置到 nukeConfig，业务可自行取用
 */
function applyNukeConfig(config) {
  const custom = config?.custom
  if (custom?.version?.val) {
    store.commit('setVersion', custom.version.val)
  }
  // 保存完整配置，业务可自行取用
  store.commit('setNukeConfig', config)
}

export default {
  install(app) {
    app.mixin({
      data() {
        return {
          ASSETSURL,
          // 核弹配置是否已加载
          isNukeLoaded: false,
          // 分享配置
          shareConfig: {},
        }
      },
      onLoad() {
        // #ifdef MP-WEIXIN
        uni.showShareMenu({})
        // #endif
        this.loadNukeConfig()
      },
      onShareAppMessage() {
        return this.shareConfig
      },
      methods: {
        /**
         * 加载核弹配置
         * - 获取远端配置并解析
         * - 同步版本号到 store
         * - 设置分享信息
         */
        loadNukeConfig() {
          if (this.isNukeLoaded) return Promise.resolve(this.shareConfig)
          if (!NUKE_CODE) {
            this.isNukeLoaded = true
            return Promise.resolve(this.shareConfig)
          }
          return fetchNukeConfig()
            .then(({ data: { config_info } }) => {
              const config = JSON.parse(decodeURIComponent(config_info))
              applyNukeConfig(config)
              this.shareConfig = {
                title: config.shareTitle || '',
                imageUrl: config.shareImg || '',
                path: config.sharePath || 'pages/index/index',
              }
              this.isNukeLoaded = true
              return this.shareConfig
            })
            .catch(err => {
              console.error('核弹配置获取失败', err)
            })
        },
      },
    })
  },
}
