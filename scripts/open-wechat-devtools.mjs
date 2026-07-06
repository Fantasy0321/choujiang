import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveCliPath() {
  const fromEnv = process.env.WECHAT_DEVTOOLS_CLI;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  // 常见的 Windows 安装路径猜测（如果都不存在，会提示用户手动配置环境变量）
  const candidates = [
    'D:\\software\\微信web开发者工具\\cli.bat',
    'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat',
    'C:\\Program Files (x86)\\Tencent\\WeChat DevTools\\cli.bat',
    'C:\\Program Files\\Tencent\\微信web开发者工具\\cli.bat',
    'C:\\Program Files\\Tencent\\WeChat DevTools\\cli.bat',
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const customPath = process.argv[2];
  const mpWeixinProjectPath = customPath
    ? path.resolve(projectRoot, customPath)
    : path.join(projectRoot, 'dist', 'dev', 'mp-weixin');

  if (!fs.existsSync(mpWeixinProjectPath)) {
    console.error(
      `[open-wechat-devtools] 未找到小程序目录: ${mpWeixinProjectPath}，请先运行相关构建命令。`,
    );
    process.exit(1);
  }

  const cliPath = resolveCliPath();

  if (!cliPath) {
    console.error(
      '[open-wechat-devtools] 未能自动找到微信开发者工具 CLI，请在系统环境变量中配置 WECHAT_DEVTOOLS_CLI 指向 cli.bat 的完整路径。',
    );
    console.error('示例路径: C:\\Program Files (x86)\\Tencent\\微信开发者工具\\cli.bat');
    process.exit(1);
  }

  console.log(
    `[open-wechat-devtools] 使用 CLI: ${cliPath} 打开项目: ${mpWeixinProjectPath}`,
  );

  // Windows 下 .bat 必须通过 cmd 执行，否则 spawn 会报 EINVAL
  const isWin = process.platform === 'win32';
  const child = isWin
    ? spawn('cmd', ['/c', cliPath, 'open', '--project', mpWeixinProjectPath], {
        stdio: 'inherit',
      })
    : spawn(cliPath, ['open', '--project', mpWeixinProjectPath], {
        stdio: 'inherit',
      });

  child.on('error', (error) => {
    console.error('[open-wechat-devtools] 启动微信开发者工具失败:', error);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(
        `[open-wechat-devtools] 微信开发者工具退出，退出码: ${code}`,
      );
      process.exit(code ?? 1);
    }
  });
}

main();
