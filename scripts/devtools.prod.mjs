import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function waitForDir(targetPath, { timeoutMs = 600000, intervalMs = 1000 } = {}) {
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
            `[wechat-devtools-production] 等待小程序目录超时（>${timeoutMs}ms）：${targetPath}`,
          ),
        );
      }
    }, intervalMs);
  });
}

async function runCommand(label, cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    const child = isWin
      ? spawn('cmd', ['/c', cmd, ...args], {
          cwd,
          stdio: 'inherit',
        })
      : spawn(cmd, args, {
          cwd,
          stdio: 'inherit',
        });

    child.on('error', (error) => {
      console.error(`[wechat-devtools-production] 启动 ${label} 失败：`, error);
      reject(error);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(
          `[wechat-devtools-production] ${label} 退出，退出码: ${code}`,
        );
        reject(new Error(`${label} exit code ${code}`));
      } else {
        console.log(`[wechat-devtools-production] ${label} 已正常完成。`);
        resolve(undefined);
      }
    });
  });
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const mpWeixinProjectPath = path.join(projectRoot, 'dist', 'build', 'mp-weixin');

  console.log(
    '[wechat-devtools-production] 开始构建微信小程序【生产版】(uni build -p mp-weixin --mode prod)…',
  );

  // 1) 先执行生产版构建
  await runCommand(
    'uni build -p mp-weixin --mode prod',
    'uni',
    ['build', '-p', 'mp-weixin', '--mode', 'prod'],
    projectRoot,
  );

  // 2) 等待 dist/build/mp-weixin 目录准备好
  console.log(
    `[wechat-devtools-production] 等待生产版小程序目录生成：${mpWeixinProjectPath}…`,
  );
  try {
    await waitForDir(mpWeixinProjectPath, { timeoutMs: 600000, intervalMs: 2000 });
  } catch (error) {
    console.error(error.message ?? error);
    process.exit(1);
  }

  // 3) 删除小程序包内 static/image/p/（打开开发者工具前）
  const staticImageP = path.join(mpWeixinProjectPath, 'static', 'image', 'p');
  fs.rmSync(staticImageP, { recursive: true, force: true });
  console.log(
    `[wechat-devtools-production] 已删除 static/image/p（若存在）：${staticImageP}`,
  );

  console.log('[wechat-devtools-production] 目录已就绪，启动微信开发者工具预览生产版…');

  // 4) 直接调用打开微信开发者工具的脚本，目录为 dist/build/mp-weixin
  await runCommand(
    'node scripts/open-wechat-devtools.mjs',
    'node',
    ['scripts/open-wechat-devtools.mjs', 'dist/build/mp-weixin'],
    projectRoot,
  );
}

main().catch((error) => {
  console.error('[wechat-devtools-production] 执行失败：', error);
  process.exit(1);
});
