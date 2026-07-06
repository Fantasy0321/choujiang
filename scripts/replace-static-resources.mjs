import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

/**
 * 转义正则特殊字符
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ASSETSURL = process.env.VITE_ASSETSURL || '';

if (!ASSETSURL) {
  console.error('❌ 未找到 VITE_ASSETSURL 环境变量，请检查 .env 文件');
  process.exit(1);
}

// 从 VITE_ASSETSURL 提取 CDN 基础路径（移除末尾斜杠）
const ASSETSURL_BASE = ASSETSURL.replace(/\/$/, '');

/**
 * 遍历目录查找所有 .vue 文件
 */
function findVueFiles(dir, files = []) {
  // 需要过滤的目录
  const excludeDirs = ['uview-plus', 'uni_modules'];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 跳过需要排除的目录
      if (!excludeDirs.includes(entry.name)) {
        findVueFiles(fullPath, files);
      }
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 从 URL 中提取纯净的文件名（不含查询参数和哈希）
 * 例如: https://cdn.vrupup.com/s/1747/images/avatar.png?v=1 -> avatar.png
 */
function extractFilename(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split('/').pop();
  } catch {
    const questionMark = url.indexOf('?');
    const cleanUrl = questionMark !== -1 ? url.substring(0, questionMark) : url;
    return cleanUrl.split('/').pop();
  }
}

/**
 * 从属性值字符串中提取所有 CDN URL
 * 支持嵌套在 JavaScript 表达式中的 URL（如三元表达式）
 */
function extractCdnUrls(attrValue) {
  const urls = [];
  // 匹配以 ASSETSURL_BASE 开头且未包含 ${ 或 ASSETSURL 的 URL
  const urlPattern = new RegExp(escapeRegExp(ASSETSURL_BASE) + '/[^"\'\\s]*', 'gi');
  let match;
  while ((match = urlPattern.exec(attrValue)) !== null) {
    const url = match[0];
    if (!url.includes('${') && !url.includes('ASSETSURL')) {
      urls.push(url);
    }
  }
  return urls;
}

/**
 * 替换任意属性值中的静态资源 URL（两步替换法）
 * 避免直接写入 `${}` 导致模板字符串转义问题
 */
function replaceAnyAttr(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(projectRoot, filePath);

  let modified = false;

  // ====== 第一步：将属性中的 URL 替换为占位符 ====》
  // 匹配任意属性 = "..." 或 属性 = '...'
  // 支持 Vue 的 :attr 语法（v-bind:attr 简写）
  // 需要分别处理双引号和单引号，因为属性值可能包含另一种引号（如 :name="a ? 'url1' : 'url2'"）
  // 捕获组1: 属性名(可能有冒号前缀), 捕获组2: 完整的属性值字符串（不包括外层引号）

  // 双引号属性: :name="..." 或 name="..."
  const doubleQuoteAttrRegex = /(:?\w+)="((?:[^"\\]|\\.)*)"/gi;
  // 单引号属性: :name='...' 或 name='...'
  const singleQuoteAttrRegex = /(:?\w+)='((?:[^'\\]|\\.)*)'/gi;

  const processMatch = (match, attr, attrValue) => {
    // 从属性值中提取所有 CDN URL
    const urls = extractCdnUrls(attrValue);
    if (urls.length === 0) {
      return match; // 没有 CDN URL，不处理
    }

    let newAttrValue = attrValue;
    for (const url of urls) {
      const filename = extractFilename(url);
      // 将属性值中的 CDN URL 替换为占位符
      newAttrValue = newAttrValue.split(url).join(`__TPL__${filename}__`);
    }

    modified = true;
    console.log(`  ✅ ${relativePath}: ${match}`);
    // 转换为 :attr=".." (原本就有冒号前缀则保持)
    const hasBindingPrefix = attr.startsWith(':');
    const cleanAttr = hasBindingPrefix ? attr.slice(1) : attr;
    return `:${cleanAttr}="${newAttrValue}"`;
  };

  // 处理双引号属性
  let newContent = content.replace(doubleQuoteAttrRegex, processMatch);
  // 处理单引号属性
  newContent = newContent.replace(singleQuoteAttrRegex, processMatch);

  // 匹配 CSS url(...) 函数
  const urlRegex = new RegExp(
    `url\\(["']?(${escapeRegExp(ASSETSURL_BASE)}[^"')]+)["']?\\)`,
    'gi'
  );
  newContent = newContent.replace(urlRegex, (match, url) => {
    if (url.includes('ASSETSURL') || url.includes('${')) {
      return match;
    }
    const filename = extractFilename(url);
    modified = true;
    console.log(`  ✅ ${relativePath}: ${match}`);
    // CSS url() 中使用 __CSS_TPL__ 占位符
    return `url(__CSS_TPL__${filename}__)`;
  });

  // ====== 第二步：将占位符替换为真正的模板语法 ====》
  // 属性值中使用 `${ASSETSURL}filename` 格式
  newContent = newContent.replace(/__TPL__(.*?)__/g, (match, filename) => {
    return '`${ASSETSURL}' + filename + '`';
  });

  // ====== 第三步：去掉属性值中多余的单引号包裹 =====》
  // 原始 JS 字符串如 'url1' 会被替换为 ''`${ASSETSURL}xxx`''
  // 需要去掉多余的单引号，因为模板字符串不需要再用单引号包裹
  // 匹配模式：单引号 + 反引号包裹的模板字符串 + 单引号
  newContent = newContent.replace(/'\`(.*?)\`'/g, (match, p1) => (`\`` + p1 + `\``));

  // ====== 第四步：将 CSS url() 中的占位符替换为 $ASSETSURL + 'filename' 语法 =====》
  // CSS url() 中不能使用模板字符串语法，需要使用字符串拼接
  newContent = newContent.replace(/__CSS_TPL__(.*?)__/g, (match, filename) => {
    return '$ASSETSURL + \'' + filename + '\'';
  });

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    return 1;
  }

  return 0;
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 开始扫描 src 目录下的 .vue 文件...\n');
  console.log(`📦 当前 VITE_ASSETSURL = ${ASSETSURL}\n`);

  const vueFiles = findVueFiles(srcDir);
  console.log(`📄 共找到 ${vueFiles.length} 个 .vue 文件\n`);

  let modifiedCount = 0;

  for (const file of vueFiles) {
    const count = replaceAnyAttr(file);
    modifiedCount += count;
  }

  console.log(`\n✨ 完成！共修改了 ${modifiedCount} 个文件。`);
}

main().catch((error) => {
  console.error('❌ 执行失败：', error);
  process.exit(1);
});
