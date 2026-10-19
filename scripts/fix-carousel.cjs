const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Replace getVisibleCount + getMaxIndex + updateCarousel with optimized versions
// Exact indentation: 3 spaces for function declaration, 4 spaces for body
const oldFunctions =
`   function getVisibleCount() {\r\n    if (window.innerWidth >= 1024) return 3;\r\n    if (window.innerWidth >= 640) return 2;\r\n    return 1;\r\n   }\r\n\r\n   function getMaxIndex() {\r\n    return Math.max(0, totalSlides - getVisibleCount());\r\n   }\r\n\r\n   function updateCarousel() {\r\n    var visible = getVisibleCount();\r\n    var slideWidth = 100 / visible;\r\n    var maxIndex = getMaxIndex();\r\n    if (currentIndex > maxIndex) currentIndex = maxIndex;\r\n    if (currentIndex < 0) currentIndex = 0;\r\n\r\n    track.style.transform = 'translateX(-' + (currentIndex * slideWidth) + '%)';\r\n\r\n    var progressPct = maxIndex === 0 ? 100 : ((currentIndex / maxIndex) * 100);\r\n    if (progress) progress.style.width = progressPct + '%';\r\n\r\n    if (prevBtn) prevBtn.style.opacity = currentIndex === 0 ? '0.4' : '1';\r\n    if (nextBtn) nextBtn.style.opacity = currentIndex >= maxIndex ? '0.4' : '1';\r\n   }`;

const newFunctions =
`   function getVisibleCount(w) {\r\n    // Accept pre-read viewport width to avoid multiple layout reads\r\n    if (w >= 1024) return 3;\r\n    if (w >= 640) return 2;\r\n    return 1;\r\n   }\r\n\r\n   function updateCarousel() {\r\n    // Batch all layout reads before DOM writes - prevents forced synchronous layout\r\n    var w = window.innerWidth;\r\n    var visible = getVisibleCount(w);\r\n    var slideWidth = 100 / visible;\r\n    var maxIndex = Math.max(0, totalSlides - visible);\r\n    if (currentIndex > maxIndex) currentIndex = maxIndex;\r\n    if (currentIndex < 0) currentIndex = 0;\r\n    var progressPct = maxIndex === 0 ? 100 : ((currentIndex / maxIndex) * 100);\r\n    var atStart = currentIndex === 0;\r\n    var atEnd = currentIndex >= maxIndex;\r\n\r\n    // Apply all DOM writes grouped together after all reads\r\n    track.style.transform = 'translateX(-' + (currentIndex * slideWidth) + '%)';\r\n    if (progress) progress.style.width = progressPct + '%';\r\n    if (prevBtn) prevBtn.style.opacity = atStart ? '0.4' : '1';\r\n    if (nextBtn) nextBtn.style.opacity = atEnd ? '0.4' : '1';\r\n   }`;

if (content.includes(oldFunctions)) {
  content = content.replace(oldFunctions, newFunctions);
  console.log('SUCCESS: updateCarousel optimized');
} else {
  console.error('FAIL: updateCarousel pattern not found');
  process.exit(1);
}

// Fix 2: Debounce resize listener
const oldResize = `   window.addEventListener('resize', updateCarousel);\r\n   updateCarousel();`;
const newResize =
`   // Debounce resize via rAF to prevent layout thrashing on rapid resize\r\n   var _rafPending = false;\r\n   window.addEventListener('resize', function () {\r\n    if (!_rafPending) {\r\n     _rafPending = true;\r\n     window.requestAnimationFrame(function () { _rafPending = false; updateCarousel(); });\r\n    }\r\n   });\r\n   updateCarousel();`;

if (content.includes(oldResize)) {
  content = content.replace(oldResize, newResize);
  console.log('SUCCESS: Resize handler debounced');
} else {
  console.error('FAIL: Resize handler pattern not found');
  process.exit(1);
}

// Fix 3: Update nextBtn click to pass width argument
const oldNextClick = `var wn = window.innerWidth; currentIndex = Math.min(Math.max(0, totalSlides - getVisibleCount(wn)), currentIndex + 1);`;
if (content.includes(oldNextClick)) {
  // Already updated from previous script run, good
  console.log('INFO: nextBtn already updated from previous run');
} else {
  // Try original
  const origNextClick = `currentIndex = Math.min(getMaxIndex(), currentIndex + 1);`;
  if (content.includes(origNextClick)) {
    content = content.replace(origNextClick,
      `var _w = window.innerWidth; currentIndex = Math.min(Math.max(0, totalSlides - getVisibleCount(_w)), currentIndex + 1);`
    );
    console.log('SUCCESS: nextBtn click updated');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('File saved successfully.');
