const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// The actual style block uses 1-space indentation inside
const oldStyle = ` <style>\r\n  .hero-fixed-bg {\r\n   background-attachment: fixed !important;\r\n   background-position: center !important;\r\n   background-size: cover !important;\r\n   background-repeat: no-repeat !important;\r\n  }\r\n </style>`;

const newStyle = ` <style>\r\n  /* hero-fixed-bg on <img>: achieves parallax effect using position:fixed */\r\n  /* The section's overflow:hidden clips it to the hero area */\r\n  img.hero-fixed-bg {\r\n   position: fixed !important;\r\n   top: 0 !important;\r\n   left: 0 !important;\r\n   width: 100% !important;\r\n   height: 100% !important;\r\n   object-fit: cover !important;\r\n   object-position: center !important;\r\n   will-change: transform;\r\n  }\r\n  /* iOS fallback class (added by inline script) - converts to absolute scroll */\r\n  img.hero-fixed-bg.is-scroll {\r\n   position: absolute !important;\r\n  }\r\n </style>`;

if (content.includes(oldStyle)) {
  content = content.replace(oldStyle, newStyle);
  console.log('SUCCESS: hero-fixed-bg style updated for img element');
} else {
  console.log('Pattern still not matching. Checking character by character...');
  const startIdx = content.indexOf('.hero-fixed-bg {');
  if (startIdx >= 0) {
    const chunk = content.slice(startIdx - 30, startIdx + 200);
    console.log('Actual block:', JSON.stringify(chunk));
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
