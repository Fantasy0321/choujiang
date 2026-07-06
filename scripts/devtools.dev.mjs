import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function waitForDir(targetPath, { timeoutMs = 60000, intervalMs = 1000 } = {}) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(targetPath)) {
      resolve();
      return;
    }

    const start = Date.now();

    const timer = setInterval(() => {
      if (fs.existsSync(targetPath)) {
        clearInterval(timer);
        resolve();
        return;
      }

      if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        reject(
          new Error(
            `[wechat-devtools-development] 等待小程序目录超时（>${timeoutMs}ms）：${targetPath}`,
          ),
        );
      }
    }, intervalMs);
  });
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const mpWeixinProjectPath = path.join(projectRoot, 'dist', 'dev', 'mp-weixin');

  console.log('[wechat-devtools-development] 启动 uni mp-weixin 开发服务 (uni -p mp-weixin --mode dev)…');

  const isWin = process.platform === 'win32';

  // 启动 dev 命令（保持监听，不等待其退出）
  const devProc = isWin
    ? spawn('cmd', ['/c', 'uni', '-p', 'mp-weixin', '--mode', 'development'], {
        cwd: projectRoot,
        stdio: 'inherit',
      })
    : spawn('uni', ['-p', 'mp-weixin', '--mode', 'development'], {
        cwd: projectRoot,
        stdio: 'inherit',
      });

  devProc.on('error', (error) => {
    console.error(
      '[wechat-devtools-development] 启动 uni -p mp-weixin --mode dev 失败：',
      error,
    );
  });

  devProc.on('exit', (code) => {
    if (code !== 0) {
      console.error(
        `[wechat-devtools-development] uni -p mp-weixin --mode dev 退出，退出码: ${code}`,
      );
    } else {
      console.log('[wechat-devtools-development] uni -p mp-weixin --mode dev 已正常退出。');
    }
  });

  // 等待 dist/dev/mp-weixin 目录准备好，再打开微信开发者工具
  console.log(
    `[wechat-devtools-development] 等待小程序目录生成：${mpWeixinProjectPath}（最多 60 秒）…`,
  );

  try {
    await waitForDir(mpWeixinProjectPath, { timeoutMs: 60000, intervalMs: 1000 });
  } catch (error) {
    console.error(error.message ?? error);
    process.exit(1);
  }

  console.log('[wechat-devtools-development] 目录已就绪，启动微信开发者工具…');

  const openProc = isWin
    ? spawn('cmd', ['/c', 'node', 'scripts/open-wechat-devtools.mjs'], {
        cwd: projectRoot,
        stdio: 'inherit',
      })
    : spawn('node', ['scripts/open-wechat-devtools.mjs'], {
        cwd: projectRoot,
        stdio: 'inherit',
      });

  openProc.on('error', (error) => {
    console.error('[wechat-devtools-development] 启动 wx:open 失败：', error);
  });

  openProc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[wechat-devtools-development] wx:open 退出，退出码: ${code}`);
    } else {
      console.log('[wechat-devtools-development] 已成功打开微信开发者工具。');
    }
  });
}

main().catch((error) => {
  console.error('[wechat-devtools-development] 执行失败：', error);
  process.exit(1);
});
