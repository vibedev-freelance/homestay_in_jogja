const fs = require('node:fs/promises');
const { createHash } = require('node:crypto');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assetsDirectory = path.join(root, 'assets');
const htmlFiles = [
  'index.html',
  'faq/index.html',
  'fasilitas/index.html',
  'homestay/index.html',
  'kontak/index.html',
  'product/girly-homestay/index.html',
  'product/griya-pojok/index.html',
  'product/omah-kadipaten/index.html',
  'product/omah-pakualaman/index.html'
];

async function fingerprint(sourceName, outputName) {
  const sourcePath = path.join(assetsDirectory, sourceName);
  const content = await fs.readFile(sourcePath);
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  const extension = path.extname(outputName);
  const basename = path.basename(outputName, extension);
  const fingerprintedName = `${basename}-${hash}${extension}`;

  await fs.writeFile(path.join(assetsDirectory, fingerprintedName), content);
  return fingerprintedName;
}

async function main() {
  const stylesheet = await fingerprint('site.css', 'site.css');
  const lightboxScript = await fingerprint('gallery-lightbox.js', 'gallery-lightbox.js');
  const lightboxModule = await fingerprint('gallery-lightbox-module.js', 'gallery-lightbox-module.js');
  const entryPath = path.join(assetsDirectory, lightboxScript);
  const entryCode = await fs.readFile(entryPath, 'utf8');
  const updatedEntryCode = entryCode.replace(
    /gallery-lightbox-module(?:-[a-f0-9]{12})?\.js/g,
    lightboxModule
  );
  await fs.writeFile(entryPath, updatedEntryCode);

  for (const file of htmlFiles) {
    const indexPath = path.join(root, file);
    let html = await fs.readFile(indexPath, 'utf8');
    const relativeAssets = path.relative(path.dirname(indexPath), assetsDirectory).replaceAll(path.sep, '/');
    html = html.replace(
      new RegExp(`${relativeAssets}/site(?:-[a-f0-9]{12})?\\.css`, 'g'),
      `${relativeAssets}/${stylesheet}`
    );
    if (!html.includes(`href="${relativeAssets}/${stylesheet}"`)) {
      html = html.replace(
        /<link rel="stylesheet" href="(?:\.\.\/)*assets\/site-[a-f0-9]{12}\.css"\/>/,
        `<link rel="stylesheet" href="${relativeAssets}/${stylesheet}"/>`
      );
    }
    html = html.replace(
      new RegExp(`${relativeAssets}/gallery-lightbox-module(?:-[a-f0-9]{12})?\\.js`, 'g'),
      `${relativeAssets}/${lightboxModule}`
    );
    html = html.replace(
      new RegExp(`${relativeAssets}/gallery-lightbox(?:-[a-f0-9]{12})?\\.js`, 'g'),
      `${relativeAssets}/${lightboxScript}`
    );
    const pageStylesheetLink = ` <link rel="stylesheet" href="${relativeAssets}/${stylesheet}"/>`;
    if (html.includes(`href="${relativeAssets}/site-`)) {
      html = html.replace(/<link rel="stylesheet" href="(?:\.\.\/)*assets\/site-[a-f0-9]{12}\.css"\/>/, pageStylesheetLink);
    } else {
      html = html.replace('</head>', `${pageStylesheetLink}\n</head>`);
    }
    await fs.writeFile(indexPath, html);
  }

  await fs.rm(path.join(assetsDirectory, 'site.css'), { force: true });
}

main().catch((error) => {
  console.error('Asset fingerprinting failed:', error);
  process.exitCode = 1;
});
