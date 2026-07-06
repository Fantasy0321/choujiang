const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * 微信小程序自动化上传脚本
 * 功能：
 * 1. 版本号自增
 * 2. 附加git日志为上传备注
 * 3. 调用微信开发者工具CLI上传
 */

// 配置
const CONFIG = {
  // 微信开发者工具CLI路径，需要根据实际情况修改
  // macOS: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
  // Windows: 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat'
  cliPath: process.env.WECHAT_CLI_PATH ? `${process.env.WECHAT_CLI_PATH}\\cli.bat` : 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat',
  // 源项目路径
  sourcePath: path.resolve(__dirname, '..'),
  // 编译后的项目路径（用于上传）
  projectPath: path.resolve(__dirname, '..', 'dist', 'build', 'mp-weixin'),
  // manifest.json路径
  manifestPath: path.resolve(__dirname, '..', 'src', 'manifest.json'),
}

/**
 * 读取manifest.json
 */
function readManifest() {
  try {
    const content = fs.readFileSync(CONFIG.manifestPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('读取manifest.json失败:', error.message)
    process.exit(1)
  }
}

/**
 * 写入manifest.json
 */
function writeManifest(manifest) {
  try {
    fs.writeFileSync(CONFIG.manifestPath, JSON.stringify(manifest, null, 4), 'utf-8')
  } catch (error) {
    console.error('写入manifest.json失败:', error.message)
    process.exit(1)
  }
}

/**
 * 分析git提交类型
 * @param {string} gitLog - git日志字符串
 * @returns {Object} - 包含各类型提交数量的对象
 */
function analyzeCommitTypes(gitLog) {
  const commits = gitLog.split('\n').filter(line => line.trim())
  const types = {
    major: 0, // 破坏性变更
    minor: 0, // 新增功能
    patch: 0, // 修复bug
    other: 0, // 其他类型
  }

  commits.forEach(commit => {
    const lowerCommit = commit.toLowerCase()
    if (lowerCommit.includes('破坏') || lowerCommit.includes('breaking') || lowerCommit.includes('重构')) {
      types.major++
    } else if (lowerCommit.startsWith('新增') || lowerCommit.startsWith('add') || lowerCommit.startsWith('feature')) {
      types.minor++
    } else if (lowerCommit.startsWith('修复') || lowerCommit.startsWith('fix') || lowerCommit.startsWith('bug')) {
      types.patch++
    } else if (lowerCommit.startsWith('优化') || lowerCommit.startsWith('optimize') || lowerCommit.startsWith('perf')) {
      types.patch++
    } else {
      types.other++
    }
  })

  return types
}

/**
 * 根据提交类型和数量动态自增版本号
 * @param {string} version - 当前版本号 (例如: 1.0.0)
 * @param {Object} commitTypes - 提交类型统计对象
 * @returns {string} - 自增后的版本号
 */
function incrementVersion(version, commitTypes) {
  const parts = version.split('.').map(Number)
  const totalCommits = commitTypes.minor + commitTypes.patch + commitTypes.other

  // 破坏性变更：自增主版本号
  if (commitTypes.major > 0) {
    parts[0]++
    parts[1] = 0
    parts[2] = 0
    console.log('   检测到破坏性变更，升级主版本号')
  }
  // 大量新增功能（>=3个）或大量提交（>5个）：自增次版本号
  else if (commitTypes.minor >= 3 || totalCommits > 5) {
    parts[1]++
    parts[2] = 0
    console.log('   检测到大量提交，升级次版本号')
  }
  // 有新增功能：自增次版本号
  else if (commitTypes.minor > 0) {
    parts[1]++
    parts[2] = 0
    console.log('   检测到新增功能，升级次版本号')
  }
  // 修复或优化：自增修订号
  else {
    parts[2]++
    console.log('   检测到修复/优化，升级修订号')
  }

  return parts.join('.')
}

/**
 * 自增versionCode
 * @param {number} code - 当前versionCode
 * @returns {number} - 自增后的versionCode
 */
function incrementVersionCode(code) {
  return parseInt(code) + 1
}

/**
 * 获取当天最新的git提交日志
 * @param {number} count - 获取当天最近几条提交，默认3条
 * @returns {string} - git日志字符串
 */
function getGitLog(count = 3) {
  try {
    // 获取当天最近N条提交的简短日志
    const log = execSync(`git log --since="today" -${count} --pretty=format:"%s"`, {
      encoding: 'utf-8',
      cwd: CONFIG.projectPath,
    })
    const trimmedLog = log.trim()
    // 如果当天没有提交，返回空字符串
    return trimmedLog || ''
  } catch (error) {
    console.warn('获取git日志失败:', error.message)
    return ''
  }
}

/**
 * 获取当前git分支名
 * @returns {string} - 分支名
 */
function getGitBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      cwd: CONFIG.projectPath,
    })
    return branch.trim()
  } catch (error) {
    console.warn('获取git分支名失败:', error.message)
    return 'unknown'
  }
}

/**
 * 获取当前git提交的hash
 * @returns {string} - 提交hash
 */
function getGitCommitHash() {
  try {
    const hash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      cwd: CONFIG.projectPath,
    })
    return hash.trim()
  } catch (error) {
    console.warn('获取git提交hash失败:', error.message)
    return 'unknown'
  }
}

/**
 * 调用微信开发者工具CLI上传
 * @param {string} version - 版本号
 * @param {string} desc - 上传描述
 */
function uploadToWechat(version, desc) {
  try {
    console.log('开始上传微信小程序...')
    console.log('版本号:', version)
    console.log('描述:', desc)
    console.log('CLI路径:', CONFIG.cliPath)
    console.log('项目路径:', CONFIG.projectPath)

    // 将换行符替换为空格，避免命令行参数解析问题
    const safeDesc = desc.replace(/\n/g, ' ').replace(/\r/g, ' ')

    const command = `"${CONFIG.cliPath}" upload --project "${CONFIG.projectPath}" --version ${version} --desc "${safeDesc}"`
    console.log('执行命令:', command)

    execSync(command, { stdio: 'inherit' })
    console.log('上传成功!')
  } catch (error) {
    console.error('上传失败:', error.message)
    process.exit(1)
  }
}

/**
 * 主函数
 */
function main() {
  console.log('=== 微信小程序自动化上传 ===\n')

  // 读取manifest.json
  console.log('1. 读取manifest.json...')
  const manifest = readManifest()
  console.log('   当前版本:', manifest.versionName)
  console.log('   当前版本号:', manifest.versionCode)

  // 获取git信息
  console.log('\n2. 获取git信息...')
  const branch = getGitBranch()
  const commitHash = getGitCommitHash()
  const gitLog = getGitLog()
  console.log('   分支:', branch)
  console.log('   提交:', commitHash)

  // 分析提交类型
  console.log('\n3. 分析提交类型...')
  const commitTypes = analyzeCommitTypes(gitLog)
  console.log('   新增功能:', commitTypes.minor)
  console.log('   修复优化:', commitTypes.patch)
  console.log('   破坏变更:', commitTypes.major)
  console.log('   其他提交:', commitTypes.other)

  // 自增版本号
  console.log('\n4. 自增版本号...')
  const newVersion = incrementVersion(manifest.versionName, commitTypes)
  const newVersionCode = incrementVersionCode(manifest.versionCode)
  console.log('   新版本:', newVersion)
  console.log('   新版本号:', newVersionCode)

  // 构建上传描述
  const logItems = gitLog.split('\n')
  const numberedLogs = logItems.map((item, index) => `(${index + 1}) ${item}`)
  const uploadDesc = `[${branch}] ${numberedLogs.join('；')}`
  console.log('\n上传描述:')
  console.log('---')
  console.log(uploadDesc)
  console.log('---')

  // 更新manifest.json
  console.log('\n5. 更新manifest.json...')
  manifest.versionName = newVersion
  manifest.versionCode = String(newVersionCode)
  writeManifest(manifest)
  console.log('   已更新版本号')

  // 检查编译目录是否存在
  console.log('\n6. 检查编译目录...')
  if (!fs.existsSync(CONFIG.projectPath)) {
    console.error('错误: 编译目录不存在!')
    console.error('请先使用 HBuilderX 编译项目')
    console.error('编译目录:', CONFIG.projectPath)
    process.exit(1)
  }
  console.log('   编译目录存在')

  // 上传到微信
  console.log('\n7. 上传到微信...')
  uploadToWechat(newVersion, uploadDesc)

  console.log('\n=== 上传完成 ===')
  console.log(`新版本: ${newVersion} (${newVersionCode})`)
  console.log('请前往微信公众平台查看上传结果')
}

// 执行主函数
main()
