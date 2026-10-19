const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// Exact old block (from diagnostic output)
const oldBlock = `<!-- Fixed Background Compatibility for iOS / Touch Devices -->\r\n <script>\r\n  (function () {\r\n   var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||\r\n    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);\r\n   if (!isIOS) return;\r\n\r\n   var bgEls = document.querySelectorAll('.hero-fixed-bg');\r\n   if (!bgEls.length) return;\r\n\r\n   bgEls.forEach(function (el) {\r\n    el.style.setProperty('background-attachment', 'scroll', 'important');\r\n   });\r\n\r\n   var ticking = false;\r\n   function syncFixedBg() {\r\n    var scrollY = window.pageYOffset || document.documentElement.scrollTop;\r\n    bgEls.forEach(function (el) {\r\n     var parent = el.parentElement;\r\n     var parentRect = parent ? parent.getBoundingClientRect() : el.getBoundingClientRect();\r\n     if (parentRect.bottom > 0 && parentRect.top < window.innerHeight) {\r\n      el.style.backgroundPositionY = scrollY + 'px';\r\n     }\r\n    });\r\n    ticking = false;\r\n   }\r\n\r\n   window.addEventListener('scroll', function () {\r\n    if (!ticking) {\r\n     window.requestAnimationFrame(syncFixedBg);\r\n     ticking = true;\r\n    }\r\n   }, { passive: true });\r\n   syncFixedBg();\r\n  })();\r\n </script>`;

// New block — works with img.hero-fixed-bg instead of div with CSS background
const newBlock = `<!-- Fixed Background Compatibility for iOS / Touch Devices -->\r\n <script>\r\n  (function () {\r\n   // iOS does not support position:fixed reliably inside overflow:hidden containers.\r\n   // We switch the hero img from position:fixed to position:absolute on iOS.\r\n   var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||\r\n    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);\r\n   if (!isIOS) return;\r\n\r\n   var bgImgs = document.querySelectorAll('img.hero-fixed-bg');\r\n   if (!bgImgs.length) return;\r\n\r\n   bgImgs.forEach(function (img) {\r\n    // Add is-scroll class which CSS converts to absolute positioning\r\n    img.classList.add('is-scroll');\r\n   });\r\n  })();\r\n </script>`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  console.log('SUCCESS: iOS compatibility script updated');
} else {
  console.error('FAIL: Old block not found');
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('File saved.');
