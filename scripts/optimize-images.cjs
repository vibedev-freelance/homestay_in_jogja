const fs = require('node:fs/promises');
const { createHash } = require('node:crypto');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'assets', 'optimized');

const responsiveImages = [
  ['assets/Hero/Prambanan.webp', 'hero-prambanan'],
  ['assets/Omah Pakualaman/IMG_3178.JPG.webp', 'omah-pakualaman'],
  ['assets/Girly Homestay/DSCF1389.webp', 'girly-homestay'],
  ['assets/Griya Pojok/DSCF1710.webp', 'griya-pojok'],
  ['assets/Omah Kadipaten/IMG_0674.webp', 'omah-kadipaten'],
  ['assets/Girly Homestay/DSCF1337.webp', 'gallery-girly'],
  ['assets/Griya Pojok/DSCF1622.webp', 'gallery-griya']
];

function contentHash(buffer) {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 12);
}

async function writeResponsiveImage(source, name) {
  const variants = [];

  const widths = name === 'hero-prambanan' ? [480, 768] : [320, 480, 768, 1024];
  for (const width of widths) {
    const buffer = await sharp(path.join(root, source))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toBuffer();
    variants.push({ width, buffer });
  }

  const version = contentHash(Buffer.concat(variants.map(({ buffer }) => buffer)));
  for (const { width, buffer } of variants) {
    await fs.writeFile(
      path.join(outputDirectory, `${name}-${version}-${width}.webp`),
      buffer
    );
  }

  return version;
}

async function writeSizedImage(source, name, width) {
  const buffer = await sharp(path.join(root, source))
    .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toBuffer();
  const version = contentHash(buffer);

  await fs.writeFile(
    path.join(outputDirectory, name.replace(/\.webp$/, `-${version}.webp`)),
    buffer
  );

  return version;
}

async function main() {
  await fs.mkdir(outputDirectory, { recursive: true });

  const versions = new Map();
  for (const [source, name] of responsiveImages) {
    versions.set(name, await writeResponsiveImage(source, name));
  }

  versions.set('logo-96', await writeSizedImage(
    'assets/Logo/Logo Utama.webp',
    'logo-96.webp',
    96
  ));
  versions.set('cta-1440', await writeSizedImage('assets/Other/CTA.webp', 'cta-1440.webp', 1440));
  versions.set('footer-1440', await writeSizedImage('assets/Other/footer.webp', 'footer-1440.webp', 1440));

  const indexPath = path.join(root, 'index.html');
  let html = await fs.readFile(indexPath, 'utf8');


  for (const [name, version] of versions) {
    if (responsiveImages.some(([, imageName]) => imageName === name)) {
      const widths = name === 'hero-prambanan' ? [480, 768] : [320, 480, 768, 1024];
      for (const width of widths) {
        const asset = `${name}-${version}-${width}.webp`;
        const reference = new RegExp(
          `assets/optimized/${name}-(?:[a-f0-9]{12}-)?${width}\\.webp`,
          'g'
        );
        html = html.replace(reference, `assets/optimized/${asset}`);
      }
    } else {
      const reference = new RegExp(
        `assets/optimized/${name}(?:-[a-f0-9]{12})?\\.webp`,
        'g'
      );
      html = html.replace(reference, `assets/optimized/${name}-${version}.webp`);
    }

    const galleryAsset = new RegExp(
      `(asset: ')${name}(?:-[a-f0-9]{12})?(')`,
      'g'
    );
    html = html.replace(galleryAsset, `$1${name}-${version}$2`);
  }

  const heroVersion = versions.get('hero-prambanan');
  html = html.replace(
    /src="assets\/Hero\/Prambanan\.webp"(?=\s+srcset="assets\/optimized\/hero-prambanan-)/,
    `src="assets/optimized/hero-prambanan-${heroVersion}-768.webp"`
  );

  await fs.writeFile(indexPath, html);
}

main().catch((error) => {
  console.error('Image optimization failed:', error);
  process.exitCode = 1;
});
