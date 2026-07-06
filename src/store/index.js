import { createStore } from 'vuex'

const store = createStore({
  state() {
    return {
      // 用户信息
      userInfo: {},
      // 核弹版本（远端控制）
      version: 1.0,
      // 核弹原始配置（完整的远端配置，供业务自行取用）
      nukeConfig: null,
    }
  },
  mutations: {
    setUserInfo(state, params) {
      state.userInfo = params
    },
    // 设置核弹版本
    setVersion(state, params) {
      state.version = Number(params)
    },
    // 设置完整的核弹配置
    setNukeConfig(state, config) {
      state.nukeConfig = config
    },
  },
  actions: {},
  getters: {},
})

export default store
