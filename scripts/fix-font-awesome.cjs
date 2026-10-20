const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

// Threads SVG - official brand icon path
const threadsSvg = '<svg viewBox="0 0 192 192" class="w-4 h-4 fill-current" aria-hidden="true"><path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.05l13.78 9.428c5.73-8.695 14.724-10.548 21.347-10.548h.23c8.249.053 14.474 2.452 18.502 7.13 2.932 3.405 4.893 8.11 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.35-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.206 17.11 97.015 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 10.646 125.202 1.205 97.144 1h-.36C68.741 1.205 47.08 10.68 32.76 28.256 19.962 43.838 13.36 65.67 13.14 95.933l-.002.067.002.067c.22 30.262 6.821 52.095 19.618 67.676 14.32 17.576 36.18 26.82 65.396 27.024h.4c25.895-.174 44.35-6.971 59.325-21.936 19.363-19.617 18.76-43.968 12.384-58.74-4.506-10.506-13.232-19.044-28.728-24.104Z"/></svg>';

const faIconPattern = '<i class="fa-brands fa-threads text-base" aria-hidden="true"></i>';

// Find all HTML files recursively
function findHtmlFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findHtmlFiles(fullPath, results);
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const htmlFiles = findHtmlFiles(root);
let totalFixed = 0;

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // 1. Replace fa-brands icon with inline SVG
  if (content.includes(faIconPattern)) {
    content = content.split(faIconPattern).join(threadsSvg);
    modified = true;
    console.log(`  [SVG] Replaced Threads icon in: ${path.relative(root, file)}`);
  }

  // 2. Remove standalone FA link (synchronous, without preload wrapper — used in product pages)
  // Pattern: <link rel="stylesheet" href="...font-awesome..." .../>
  if (content.includes('font-awesome') && content.includes('cdnjs.cloudflare.com')) {
    // Remove standalone synchronous link tag for Font Awesome
    const before = content;
    // Match single-line <link ... font-awesome ... />  followed by newline
    content = content.replace(/[ \t]*<link[^>]*font-awesome[^>]*\/>\r?\n/g, '');
    // Match preload+noscript block (from index.html pattern)
    content = content.replace(
      /[ \t]*<!--[^>]*Font Awesome[^>]*-->\r?\n[ \t]*<link[^>]*font-awesome[^>]*\/>\r?\n[ \t]*<noscript>[^<]*<\/noscript>\r?\n/g,
      ' <!-- Font Awesome removed: Threads icon replaced with inline SVG -->\n'
    );
    if (content !== before) {
      modified = true;
      console.log(`  [CSS] Removed Font Awesome CSS link from: ${path.relative(root, file)}`);
    }
  }

  // 3. Also remove any remaining FA noscript orphan
  if (content.includes('font-awesome')) {
    const before = content;
    content = content.replace(/[ \t]*<noscript><link[^>]*font-awesome[^>]*\/><\/noscript>\r?\n/g, '');
    if (content !== before) {
      modified = true;
      console.log(`  [noscript] Removed orphan FA noscript from: ${path.relative(root, file)}`);
    }
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
  }
}

console.log(`\nDone. Modified ${totalFixed} file(s).`);
// Verify no FA references remain
console.log('\nChecking for remaining font-awesome references...');
const remaining = htmlFiles.filter(f => fs.readFileSync(f, 'utf8').includes('font-awesome'));
if (remaining.length === 0) {
  console.log('✓ No font-awesome references remain in any HTML file.');
} else {
  console.log('⚠ Still found font-awesome in:');
  remaining.forEach(f => console.log('  ', path.relative(root, f)));
}
