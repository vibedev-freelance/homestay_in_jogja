const fs = require('node:fs/promises');
const { createHash } = require('node:crypto');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assetsDirectory = path.join(root, 'assets');

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
  const indexPath = path.join(root, 'index.html');
  let html = await fs.readFile(indexPath, 'utf8');

  html = html.replace(
    /assets\/site(?:-[a-f0-9]{12})?\.css/g,
    `assets/${stylesheet}`
  );
  html = html.replace(
    /assets\/gallery-lightbox(?:-[a-f0-9]{12})?\.js/g,
    `assets/${lightboxScript}`
  );

  await fs.writeFile(indexPath, html);
  await fs.rm(path.join(assetsDirectory, 'site.css'), { force: true });
}

main().catch((error) => {
  console.error('Asset fingerprinting failed:', error);
  process.exitCode = 1;
});
