import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function getLatestSourceDir(distRoot, platform) {
  const candidates = ['dev', 'build']
    .map((envName) => ({
      envName,
      dir: path.join(distRoot, envName, platform),
    }));

  const existing = [];

  for (const item of candidates) {
    if (await pathExists(item.dir)) {
      const stat = await fs.stat(item.dir);
      existing.push({ envName: item.envName, dir: item.dir, mtimeMs: stat.mtimeMs });
    }
  }

  if (existing.length === 0) {
    return null;
  }

  existing.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return existing[0];
}

async function copyDir(src, dest) {
  // 确保目标目录的父目录存在
  await fs.mkdir(path.dirname(dest), { recursive: true });

  // 尝试删除目标目录，如果被占用（EBUSY）则改为清空内容
  try {
    await fs.rm(dest, { recursive: true, force: true });
  } catch (error) {
    if (error.code === 'EBUSY' || error.code === 'ENOTEMPTY') {
      // 目录被占用，改为清空内容
      const entries = await fs.readdir(dest);
      for (const entry of entries) {
        const entryPath = path.join(dest, entry);
        try {
          await fs.rm(entryPath, { recursive: true, force: true });
        } catch {
          // 忽略单个文件/目录删除失败
        }
      }
    } else {
      throw error;
    }
  }

  // 复制源目录到目标目录
  await fs.cp(src, dest, { recursive: true });

  // 源目录和目标目录相同就不再删除，避免误删
  if (path.resolve(src) !== path.resolve(dest)) {
    await fs.rm(src, { recursive: true, force: true });
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const distRoot = path.join(projectRoot, 'dist');

  // 核心需求：不区分 dev / build，只按平台区分目录
  // 统一输出到 dist/dev/<platform>
  const platforms = ['mp-weixin', 'h5'];

  for (const platform of platforms) {
    const latest = await getLatestSourceDir(distRoot, platform);

    if (!latest) {
      // eslint-disable-next-line no-console
      console.log(
        `[move-dist] 跳过 "${platform}"：未找到 dist/dev 或 dist/build 目录`,
      );
      continue;
    }

    // 目标统一放到 dist/dev/<platform>
    const targetDir = path.join(distRoot, 'dev', platform);

    // 如果本身已经是 dist/dev/<platform>，就不做多余操作
    if (path.resolve(latest.dir) === path.resolve(targetDir)) {
      // eslint-disable-next-line no-console
      console.log(
        `[move-dist] "${platform}" 已在 dist/dev/${platform}，无需移动`,
      );
      continue;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[move-dist] 同步 "${platform}" 平台目录：从 dist/${latest.envName}/${platform} 到 dist/dev/${platform}`,
    );

    await copyDir(latest.dir, targetDir);
  }

  // 额外清理：如果 dist/build 目录存在，直接移除（满足"build 空目录不保留"的需求）
  const buildRoot = path.join(distRoot, 'build');
  if (await pathExists(buildRoot)) {
    await fs.rm(buildRoot, { recursive: true, force: true });
    // eslint-disable-next-line no-console
    console.log('[move-dist] 已移除 dist/build 目录');
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[move-dist] 执行失败：', error);
  process.exit(1);
});
