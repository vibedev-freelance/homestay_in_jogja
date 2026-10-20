/**
 * Fix subpage script/CSS loading:
 * 1. Add `defer` to gallery-lightbox.js and booking-choice.js <script> tags
 * 2. Convert gallery-lightbox.css and booking-choice.css from synchronous to
 *    preload+onload (deferred) pattern on pages that still load them blocking
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function findHtmlFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) findHtmlFiles(fullPath, results);
    else if (entry.name.endsWith('.html')) results.push(fullPath);
  }
  return results;
}

const htmlFiles = findHtmlFiles(root);
let totalFixed = 0;

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // 1. Add defer to gallery-lightbox.js script tags (handles both fingerprinted and plain)
  const glScriptPattern = /<script src="([^"]*gallery-lightbox[^"]*\.js)">/g;
  if (glScriptPattern.test(content)) {
    content = content.replace(
      /<script src="([^"]*gallery-lightbox[^"]*\.js)">/g,
      '<script src="$1" defer>'
    );
    modified = true;
    console.log(`  [JS defer] gallery-lightbox.js in: ${path.relative(root, file)}`);
  }

  // 2. Add defer to booking-choice.js script tags
  const bcScriptPattern = /<script src="([^"]*booking-choice\.js)">/g;
  if (bcScriptPattern.test(content)) {
    content = content.replace(
      /<script src="([^"]*booking-choice\.js)">/g,
      '<script src="$1" defer>'
    );
    modified = true;
    console.log(`  [JS defer] booking-choice.js in: ${path.relative(root, file)}`);
  }

  // 3. Convert synchronous gallery-lightbox.css <link> to deferred preload+onload
  // Only for product pages (they have blocking <link rel="stylesheet">)
  // Skip index.html which already uses preload pattern
  if (file !== path.join(root, 'index.html')) {
    // gallery-lightbox.css: synchronous blocking -> deferred
    const glCssPattern = /[ \t]*<link rel="stylesheet" href="([^"]*gallery-lightbox\.css)"\/>\r?\n/g;
    if (glCssPattern.test(content)) {
      content = content.replace(
        /[ \t]*<link rel="stylesheet" href="([^"]*gallery-lightbox\.css)"\/>\r?\n/g,
        (match, href) => ` <link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'"/>\n <noscript><link rel="stylesheet" href="${href}"/></noscript>\n`
      );
      modified = true;
      console.log(`  [CSS defer] gallery-lightbox.css in: ${path.relative(root, file)}`);
    }

    // booking-choice.css: synchronous blocking -> deferred
    const bcCssPattern = /[ \t]*<link rel="stylesheet" href="([^"]*booking-choice\.css)"\/>\r?\n/g;
    if (bcCssPattern.test(content)) {
      content = content.replace(
        /[ \t]*<link rel="stylesheet" href="([^"]*booking-choice\.css)"\/>\r?\n/g,
        (match, href) => ` <link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'"/>\n <noscript><link rel="stylesheet" href="${href}"/></noscript>\n`
      );
      modified = true;
      console.log(`  [CSS defer] booking-choice.css in: ${path.relative(root, file)}`);
    }
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
  }
}

console.log(`\nDone. Modified ${totalFixed} file(s).`);
