import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

// 自定义插件：替换 manifest.json 中的 appid
// 仅首次编译时执行，热重载时跳过
function replaceManifestAppid(env) {
  let hasRun = false
  return {
    name: 'replace-manifest-appid',
    buildStart() {
      if (hasRun) {
        console.log('跳过 manifest appid 更新（已执行过首次编译）')
        return
      }

      const appid = env.VITE_APPID
      const appName = env.VITE_APPNAME
      const uni_appId = env.VITE_UNI_APPID
      const libVersion = env.VITE_LIBVERSION || '3.0.0'

      if (appid) {
        const manifestPath = resolve(__dirname, 'src', 'manifest.json')
        let manifestContent = readFileSync(manifestPath, 'utf-8')
        const manifest = JSON.parse(manifestContent)
        manifest.appid = uni_appId
        manifest.name = appName

        if (manifest['mp-weixin']) {
          manifest['mp-weixin'].appid = appid
          manifest['mp-weixin'].libVersion = libVersion
        }

        writeFileSync(manifestPath, JSON.stringify(manifest, null, 4))
        hasRun = true
        uni_appId && console.log(`Manifest appid 已更新为: ${uni_appId}`)
        console.log(`Manifest mp-weixin appid 已更新为: ${appid}`)
      } else {
        console.warn('未找到 VITE_APPID 环境变量，使用默认值')
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const isProd = mode === 'production'

  return {
    plugins: [replaceManifestAppid(env), uni()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        'uview-plus': resolve(__dirname, 'uview-plus'),
      },
    },
    build: {
      minify: isProd ? 'terser' : false,
      terserOptions: isProd
        ? {
            compress: {
              drop_console: true,
            },
          }
        : {},
    },
  }
})
