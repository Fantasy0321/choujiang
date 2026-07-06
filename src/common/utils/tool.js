const baseUrl = import.meta.env.VITE_BASE_URL
const assetsUrl = import.meta.env.VITE_ASSETSURL

/**
 * 工具类 - 提供常用的工具方法
 * @class Tool
 */
class Tool {
  constructor() {
    // 图标类型映射
    this.ICON_TYPES = {
      NONE: 0,
      SUCCESS: 1,
      LOADING: 2,
    }

    // 字体加载状态缓存
    this.loadedFonts = new Set()
  }

  /**
   * 文字轻提示
   * @param {string} str 提示文字
   * @param {number} [icon=0] 提示icon (0: none, 1: success, 2: loading)
   * @param {number} [duration=1500] 提示时间(毫秒)
   */
  alert(str, icon = this.ICON_TYPES.NONE, duration = 1500) {
    return new Promise((resolve, reject) => {
      if (!str && str !== 0) {
        console.warn('alert方法需要提供提示文字')
        return
      }

      const iconMap = {
        [this.ICON_TYPES.NONE]: 'none',
        [this.ICON_TYPES.SUCCESS]: 'success',
        [this.ICON_TYPES.LOADING]: 'loading',
      }

      uni.showToast({
        title: String(str),
        icon: iconMap[icon] || 'none',
        mask: true,
        duration,
        success: () => {
          setTimeout(resolve, duration)
        },
        fail: reject,
      })
    })
  }

  /**
   * 显示loading加载
   * @param {string} [title=' '] 加载文案
   * @param {boolean} [mask=true] 是否显示遮罩
   */
  loading(title = ' ', mask = true) {
    uni.showLoading({ title, mask })
  }

  /**
   * 关闭loading提示框
   */
  hideLoading() {
    uni.hideLoading()
  }

  /**
   * 统一处理URL格式，确保以/开头
   * @param {string} url 页面地址
   * @returns {string} 格式化后的URL
   * @private
   */
  _formatUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL必须是字符串')
    }

    return url.startsWith('/') ? url : `/${url}`
  }

  /**
   * 可返回跳转（导航到新页面）
   * @param {string} url 页面地址
   */
  navigateTo(url) {
    const formattedUrl = this._formatUrl(url)

    uni.navigateTo({
      url: formattedUrl,
      fail: err => {
        console.warn('navigateTo失败，尝试switchTab:', err)
        uni.switchTab({ url: formattedUrl })
      },
    })
  }

  /**
   * 不可返回跳转（重定向到新页面）
   * @param {string} url 页面地址
   */
  redirectTo(url) {
    uni.redirectTo({ url: this._formatUrl(url) })
  }

  /**
   * 清除页面栈跳转（重新启动到新页面）
   * @param {string} url 页面地址
   */
  reLaunch(url) {
    uni.reLaunch({ url: this._formatUrl(url) })
  }

  /**
   * 跳转tabBar页
   * @param {string} url 页面地址
   */
  switchTab(url) {
    uni.switchTab({ url: this._formatUrl(url) })
  }

  /**
   * 返回上一页面或指定页面
   * @param {number} [delta=1] 返回的页面数
   * @param {string} [fallbackUrl='/pages/index/index'] 无上一页时的回退地址
   */
  navigateBack(delta = 1, fallbackUrl = '/pages/index/index') {
    const pages = getCurrentPages()

    if (pages.length <= 1) {
      console.warn('无上一页，使用回退地址')
      uni.reLaunch({ url: fallbackUrl })
    } else {
      uni.navigateBack({ delta })
    }
  }

  /**
   * 操作本地缓存
   * @param {string} key 缓存键值
   * @param {any} [value] 缓存数据，不传则为读取
   * @returns {any|undefined} 读取操作时返回数据
   */
  storage(key, value) {
    if (typeof key !== 'string') {
      throw new Error('key必须是字符串')
    }

    // 设置操作
    if (value !== undefined && value !== null) {
      uni.setStorageSync(key, value)
      return
    }

    // 读取操作
    if (key !== '#') {
      return uni.getStorageSync(key)
    }

    // 特殊操作
    if (key === '#') {
      uni.clearStorageSync()
    }
  }

  /**
   * 删除指定缓存
   * @param {string} key 要删除的缓存键
   */
  removeStorage(key) {
    if (typeof key !== 'string') {
      throw new Error('key必须是字符串')
    }

    uni.removeStorageSync(key)
  }

  /**
   * 获取缓存信息
   * @returns {Object} 缓存信息
   */
  getStorageInfo() {
    return uni.getStorageInfoSync()
  }

  /**
   * 复制文本到剪贴板
   * @param {string} data 要复制的文本
   * @returns {Promise<boolean>} 复制是否成功
   */
  async copy(data) {
    if (!data && data !== 0) {
      this.alert('暂无内容')
      return false
    }

    try {
      await new Promise((resolve, reject) => {
        uni.setClipboardData({
          data: String(data),
          success: resolve,
          fail: reject,
        })
      })

      this.alert('复制成功')
      return true
    } catch (error) {
      console.error('复制失败:', error)
      this.alert('复制失败，请重试')
      return false
    }
  }

  /**
   * 导入外部字体
   * @param {string} fontName 字体文件名（不含路径）
   * @returns {Promise<boolean>} 字体加载是否成功
   */
  async loadFont(fontName) {
    if (!fontName || typeof fontName !== 'string') {
      throw new Error('字体名称必须是字符串')
    }

    // 检查是否已加载过
    if (this.loadedFonts.has(fontName)) {
      return true
    }

    try {
      const fontFamily = fontName.replace(/\.[^/.]+$/, '') // 移除文件扩展名

      await new Promise((resolve, reject) => {
        uni.loadFontFace({
          family: fontFamily,
          source: `url(${assetsUrl}${fontName})`,
          global: true,
          success: resolve,
          fail: reject,
        })
      })

      this.loadedFonts.add(fontName)
      return true
    } catch (error) {
      console.error(`字体加载失败: ${fontName}`, error)
      return false
    }
  }

  /**
   * 保存图片到相册
   * @param {string} url 图片URL
   * @returns {Promise<boolean>} 保存是否成功
   */
  async saveImageToPhotos(url) {
    if (!url) {
      this.alert('图片地址不能为空')
      return false
    }

    try {
      // 检查权限
      const { authSetting } = await new Promise((resolve, reject) => {
        uni.getSetting({
          success: resolve,
          fail: reject,
        })
      })

      if (!authSetting['scope.writePhotosAlbum']) {
        // 请求权限
        await new Promise((resolve, reject) => {
          uni.authorize({
            scope: 'scope.writePhotosAlbum',
            success: resolve,
            fail: reject,
          })
        })
      }

      // 获取图片信息
      const { path } = await new Promise((resolve, reject) => {
        uni.getImageInfo({
          src: url,
          success: resolve,
          fail: reject,
        })
      })

      // 保存到相册
      await new Promise((resolve, reject) => {
        uni.saveImageToPhotosAlbum({
          filePath: path,
          success: resolve,
          fail: reject,
        })
      })

      this.alert('已保存到相册')
      return true
    } catch (error) {
      console.error('保存图片失败:', error)

      if (error.errMsg && error.errMsg.includes('auth')) {
        // 权限相关错误
        await new Promise(resolve => {
          uni.showModal({
            title: '保存失败',
            content: '请开启访问手机相册权限',
            showCancel: false,
            success: resolve,
          })
        })

        uni.openSetting()
      } else {
        this.alert('保存失败，请重试')
      }

      return false
    }
  }

  /**
   * 微信支付
   * @param {Object} paymentData 支付参数
   * @returns {Promise<Object>} 支付结果
   */
  requestPayment(paymentData) {
    return new Promise((resolve, reject) => {
      uni.requestPayment({
        provider: 'wxpay',
        ...paymentData,
        success: resolve,
        fail: reject,
      })
    })
  }

  /**
   * 文件上传
   * @param {String} filePath 文件临时路径
   * @returns {Promise<Object>} 文件上传结果
   */
  upload(filePath) {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: `${baseUrl}file/upload`,
        fileType: 'image',
        header: {
          Authorization: `Bearer ${this.storage('token')}`,
        },
        filePath,
        name: 'file',
        success: ({ data }) => {
          resolve(JSON.parse(data))
        },
        fail: error => {
          reject(error)
        },
      })
    })
  }
}

// 创建单例并导出
export default new Tool()
