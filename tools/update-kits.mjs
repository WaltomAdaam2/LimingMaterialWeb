import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = process.argv[2] ?? 'C:\\Users\\Walto\\.codex\\.chatgpt-projects\\g-p-69e4ce1da9b08191af6899abed983235\\limw-kit-previews';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(sourceRoot, 'manifest.csv');
const kitRoot = path.join(repoRoot, 'Data', 'Kits');
const dirNames = ['equipment', 'supply', 'all-items', 'contraband', 'more-items'];
const expectedCount = 112;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [rawHeaders, ...records] = rows;
  const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/, ''));
  return records.filter((record) => record.length === headers.length).map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index]])),
  );
}

function html(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function imagePath(row, categoryDirs) {
  return `Data/Kits/${categoryDirs.get(row.category)}/${String(Number(row.order)).padStart(3, '0')}.png`;
}

const sourceRows = parseCsv(fs.readFileSync(manifestPath, 'utf8'));
const categories = [...new Set(sourceRows.map((row) => row.category))];
const categoryDirs = new Map(categories.map((category, index) => [category, dirNames[index]]));
const rows = sourceRows
  .filter((row) => !row.image_url.endsWith('/images/4-5.png'))
  .sort((a, b) => categories.indexOf(a.category) - categories.indexOf(b.category) || Number(a.order) - Number(b.order));

if (rows.length !== expectedCount) {
  throw new Error(`Expected ${expectedCount} kits after removing spawner, got ${rows.length}.`);
}

for (const dir of categoryDirs.values()) {
  fs.mkdirSync(path.join(kitRoot, dir), { recursive: true });
}

for (const row of rows) {
  const source = path.join(sourceRoot, row.relative_path);
  const target = path.join(repoRoot, imagePath(row, categoryDirs));
  fs.copyFileSync(source, target);
}

const navLinks = categories.map((category) =>
  `          <a href="#${categoryDirs.get(category)}">${html(category)}</a>`,
).join('\n');

const sections = categories.map((category) => {
  const cards = rows.filter((row) => row.category === category).map((row) => {
    const name = html(row.kit_name);
    const src = imagePath(row, categoryDirs);
    return `        <article class="kit-card">\n          <h3>${name}</h3>\n          <img src="${src}" width="341" height="139" alt="${name}">\n        </article>`;
  }).join('\n');

  return `    <section id="${categoryDirs.get(category)}" class="kit-section">\n      <h2>${html(category)}</h2>\n      <div class="kit-grid">\n${cards}\n      </div>\n    </section>`;
}).join('\n\n');

const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>黎明物资</title>
  <link rel="icon" href="Data/Liming.jpg">
  <script>
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    if (!location.hash) {
      const topOnEntry = () => {
        scrollTo(0, 0);
        requestAnimationFrame(() => scrollTo(0, 0));
        [50, 250, 1000].forEach((delay) => setTimeout(() => scrollTo(0, 0), delay));
      };

      addEventListener('DOMContentLoaded', topOnEntry, { once: true });
      addEventListener('load', topOnEntry, { once: true });
      addEventListener('pageshow', topOnEntry);
    }
  </script>
  <style>
    :root {
      color-scheme: dark;
      font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
      background: #111;
      color: #fff;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
      overflow-anchor: none;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background: #111 url("Data/BackGround.png") center top / cover fixed;
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      z-index: -1;
      background: rgba(0, 0, 0, 0.58);
    }

    a {
      color: inherit;
    }

    .page {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 24px 0 48px;
    }

    .site-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 18px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.42);
      backdrop-filter: blur(6px);
    }

    .site-logo {
      width: 128px;
      height: 128px;
      object-fit: cover;
      border-radius: 6px;
    }

    .site-header h1 {
      margin: 0 0 8px;
      font-size: clamp(2rem, 5vw, 3.8rem);
      line-height: 1.1;
    }

    .site-header p {
      margin: 0;
      color: #e6e6e6;
      font-size: 1.15rem;
    }

    .notice {
      margin: 20px 0;
      padding: 18px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.5);
      color: #f2f2f2;
      line-height: 1.8;
    }

    .notice p {
      margin: 0 0 8px;
    }

    .notice p:last-child {
      margin-bottom: 0;
    }

    .category-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 18px 0 24px;
    }

    .category-nav a {
      padding: 8px 12px;
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.45);
      text-decoration: none;
    }

    .kit-section {
      margin-top: 28px;
    }

    .kit-section h2,
    .business h2 {
      margin: 0 0 14px;
      padding-bottom: 8px;
      border-bottom: 3px solid #6495ed;
      font-size: 1.8rem;
    }

    .kit-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(341px, 1fr));
      gap: 18px;
      align-items: start;
    }

    .kit-card {
      min-width: 0;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.48);
      text-align: center;
    }

    .kit-card h3 {
      min-height: 2.6em;
      margin: 0 0 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.05rem;
      line-height: 1.3;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .kit-card img {
      display: block;
      width: 341px;
      height: 139px;
      max-width: 100%;
      margin: 0 auto;
      object-fit: contain;
      background: #fff;
    }

    .business,
    .footer {
      margin-top: 34px;
      padding-top: 18px;
      border-top: 3px solid #6495ed;
    }

    .business-images {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 12px;
    }

    .business-images img {
      width: 100%;
      max-width: 500px;
      border-radius: 6px;
    }

    .back-top {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 96px;
      height: 44px;
      border: 2px solid #98f5ff;
      border-radius: 6px;
      background: #6495ed;
      color: #000;
      display: grid;
      place-items: center;
      text-decoration: none;
      font-weight: 700;
    }

    @media (max-width: 520px) {
      .page {
        width: min(100% - 20px, 1180px);
      }

      .site-header {
        align-items: flex-start;
      }

      .site-logo {
        width: 84px;
        height: 84px;
      }

      .kit-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div id="top" class="page">
    <header class="site-header">
      <img class="site-logo" src="Data/Liming.jpg" alt="黎明物资">
      <div>
        <h1>黎明物资</h1>
        <p>在这里您可以挑选想要的物资</p>
      </div>
    </header>

    <section class="notice" aria-label="购买说明">
      <p>免责声明：物资一经售出，概不负责。</p>
      <p>更多物资您也可以咨询我们。如需购买物资，请加群：QQ 1018192346。</p>
      <p>所有物品统一 0.2r 一盒，买多送多，更多优惠可以咨询我们。</p>
      <p>自出生点 0.0 起，10w 内 5r；11w-40w 每 10w 加 2.5r；40w 以上每 10w 加 5r。地狱配送价格由主世界换算，更远的位置视情况而定。</p>
      <p>您也可以一次性购买 4r 的物资，4r 25 盒，价格更实惠。</p>
      <p>我们还有跑图、代跑出生点、建基地等业务，路费和配送价格相同，建基地的价格视情况而定。耗材、装备、鸡刷价格和上文相同。</p>
      <p>定制物资：小于等于 5 盒收 0.4r 每盒，小于等于 10 盒 0.3r，大于 10 盒 0.2r。</p>
    </section>

    <nav class="category-nav" aria-label="商品分类">
${navLinks}
      <a href="#More">其他业务</a>
    </nav>

${sections}

    <section id="More" class="business">
      <h2>其他业务</h2>
      <p>代宣传业务，可保证 7*24H 不离线，宣传工具代码开源。</p>
      <div class="business-images">
        <img src="Data/Business/DaiXuanChuan1.png" alt="代宣传业务图 1">
        <img src="Data/Business/DaiXuanChuan2.png" alt="代宣传业务图 2">
      </div>
    </section>

    <footer class="footer">
      <p>本站由 GitHub Pages 驱动。</p>
      <p><a href="https://home.mcocet.top">2025 @黎明物资 MCOCET 提供技术支持</a></p>
    </footer>
  </div>

  <a class="back-top" href="#top">返回顶部</a>
</body>
</html>
`;

fs.writeFileSync(path.join(repoRoot, 'index.html'), page, 'utf8');
console.log(`Generated index.html with ${rows.length} kits.`);
