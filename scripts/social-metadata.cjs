const fs = require('node:fs/promises');
const { createHash } = require('node:crypto');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'assets', 'optimized');
const pages = [
  { file: 'index.html', image: 'assets/Hero/Prambanan.webp' },
  {
    file: 'product/girly-homestay/index.html',
    image: 'assets/Girly Homestay/DSCF1389.webp'
  },
  {
    file: 'product/griya-pojok/index.html',
    image: 'assets/Griya Pojok/DSCF1710.webp'
  },
  {
    file: 'product/omah-kadipaten/index.html',
    image: 'assets/Omah Kadipaten/IMG_0674.webp'
  },
  {
    file: 'product/omah-pakualaman/index.html',
    image: 'assets/Omah Pakualaman/IMG_3178.JPG.webp'
  }
];

const whatsappTemplateFiles = [
  'index.html',
  'faq/index.html',
  'fasilitas/index.html',
  'homestay/index.html',
  'kontak/index.html',
  ...pages.slice(1).map(({ file }) => file)
];

function escapeAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

async function createSocialImage(source) {
  const image = await sharp(path.join(root, source))
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  const hash = createHash('sha256').update(image).digest('hex').slice(0, 12);
  const filename = `og-${path.basename(source, path.extname(source))}-${hash}.jpg`;

  await fs.writeFile(path.join(outputDirectory, filename), image);
  return `https://homestayinjogja.com/assets/optimized/${filename}`;
}

function cleanWhatsAppTemplates(html) {
  html = html.replace(
    /href="(https:\/\/wa\.me\/628122960504\?text=)([^"]+)"/g,
    (match, prefix, encodedMessage) => {
      const message = decodeURIComponent(encodedMessage.replace(/\+/g, ' '));
      const logoLinkStart = message.lastIndexOf(
        '\n\nhttps://homestayinjogja.com/'
      );

      if (
        logoLinkStart === -1 ||
        !message.slice(logoLinkStart).includes('/assets/Logo/Logo%20Utama.webp')
      ) {
        return match;
      }

      return `href="${prefix}${encodeURIComponent(
        message.slice(0, logoLinkStart)
      )}"`;
    }
  );

  return html.replace(
    /\\n\\nhttps:\/\/homestayinjogja\.com\/assets\/Logo\/Logo%20Utama\.webp/g,
    ''
  );
}

async function updatePage({ file, image }) {
  const filename = path.join(root, file);
  let html = await fs.readFile(filename, 'utf8');
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"\/>/);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const descriptionMatch = html.match(
    /<meta name="description" content="([^"]*)"\/>/
  );

  if (!canonicalMatch || !titleMatch || !descriptionMatch) {
    throw new Error(`Missing canonical, title, or description in ${file}`);
  }

  const canonicalUrl = canonicalMatch[1];
  const title = escapeAttribute(
    titleMatch[1].replace(/&amp;/g, '&')
  );
  const description = descriptionMatch[1];
  const socialImage = await createSocialImage(image);
  const metadata = [
    '<!-- social metadata:start -->',
    '<meta property="og:type" content="website"/>',
    `<meta property="og:url" content="${canonicalUrl}"/>`,
    `<meta property="og:title" content="${title}"/>`,
    `<meta property="og:description" content="${description}"/>`,
    `<meta property="og:image" content="${socialImage}"/>`,
    `<meta property="og:image:secure_url" content="${socialImage}"/>`,
    '<meta property="og:image:type" content="image/jpeg"/>',
    '<meta property="og:image:width" content="1200"/>',
    '<meta property="og:image:height" content="630"/>',
    '<meta name="twitter:card" content="summary_large_image"/>',
    `<meta name="twitter:title" content="${title}"/>`,
    `<meta name="twitter:description" content="${description}"/>`,
    `<meta name="twitter:image" content="${socialImage}"/>`,
    '<!-- social metadata:end -->'
  ].join('\n ');

  html = html.replace(
    /<!-- social metadata:start -->[\s\S]*?<!-- social metadata:end -->/,
    ''
  );
  const headEnd = html.indexOf('</head>');
  if (headEnd === -1) {
    throw new Error(`Missing closing head tag in ${file}`);
  }

  const head = html.slice(0, headEnd).trimEnd();
  html = `${head}\r\n ${metadata}\r\n ${html.slice(headEnd)}`;
  await fs.writeFile(filename, html);
}

async function main() {
  await fs.mkdir(outputDirectory, { recursive: true });

  for (const file of whatsappTemplateFiles) {
    const filename = path.join(root, file);
    const html = await fs.readFile(filename, 'utf8');
    const cleanedHtml = cleanWhatsAppTemplates(html);

    if (cleanedHtml !== html) {
      await fs.writeFile(filename, cleanedHtml);
    }
  }

  for (const page of pages) {
    await updatePage(page);
  }
}

main().catch((error) => {
  console.error('Social image generation failed:', error);
  process.exitCode = 1;
});
