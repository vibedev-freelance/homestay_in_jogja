$path = "index.html"
$content = Get-Content $path -Raw -Encoding UTF8

# Test if we can find the pattern
if ($content -match 'function getVisibleCount') {
    Write-Host "FOUND getVisibleCount pattern"
} else {
    Write-Host "NOT FOUND - cannot proceed"
    exit 1
}

# Replace getVisibleCount + getMaxIndex + updateCarousel
$oldPattern = '    function getVisibleCount\(\) \{' + "`r`n" +
'     if \(window\.innerWidth >= 1024\) return 3;' + "`r`n" +
'     if \(window\.innerWidth >= 640\) return 2;' + "`r`n" +
'     return 1;' + "`r`n" +
'    \}' + "`r`n`r`n" +
'    function getMaxIndex\(\) \{' + "`r`n" +
'     return Math\.max\(0, totalSlides - getVisibleCount\(\)\);' + "`r`n" +
'    \}' + "`r`n`r`n" +
'    function updateCarousel\(\) \{' + "`r`n" +
'     var visible = getVisibleCount\(\);' + "`r`n" +
'     var slideWidth = 100 / visible;' + "`r`n" +
'     var maxIndex = getMaxIndex\(\);' + "`r`n" +
'     if \(currentIndex > maxIndex\) currentIndex = maxIndex;' + "`r`n" +
'     if \(currentIndex < 0\) currentIndex = 0;' + "`r`n`r`n" +
'     track\.style\.transform = ' + "'translateX\(-' \+ \(currentIndex \* slideWidth\) \+ '%\)';" + "`r`n`r`n" +
'     var progressPct = maxIndex === 0 \? 100 : \(\(currentIndex / maxIndex\) \* 100\);' + "`r`n" +
'     if \(progress\) progress\.style\.width = progressPct \+ ' + "'%';" + "`r`n`r`n" +
'     if \(prevBtn\) prevBtn\.style\.opacity = currentIndex === 0 \? ' + "'0\.4' : '1';" + "`r`n" +
'     if \(nextBtn\) nextBtn\.style\.opacity = currentIndex >= maxIndex \? ' + "'0\.4' : '1';" + "`r`n" +
'    \}'

$newContent = '   function getVisibleCount(w) {' + "`r`n" +
'     // Accept pre-read viewport width to avoid repeated layout queries' + "`r`n" +
'     if (w >= 1024) return 3;' + "`r`n" +
'     if (w >= 640) return 2;' + "`r`n" +
'     return 1;' + "`r`n" +
'    }' + "`r`n`r`n" +
'    function updateCarousel() {' + "`r`n" +
'     // Batch all layout reads before DOM writes to avoid forced synchronous layout' + "`r`n" +
'     var w = window.innerWidth;' + "`r`n" +
'     var visible = getVisibleCount(w);' + "`r`n" +
'     var slideWidth = 100 / visible;' + "`r`n" +
'     var maxIndex = Math.max(0, totalSlides - visible);' + "`r`n" +
'     if (currentIndex > maxIndex) currentIndex = maxIndex;' + "`r`n" +
'     if (currentIndex < 0) currentIndex = 0;' + "`r`n" +
'     var progressPct = maxIndex === 0 ? 100 : ((currentIndex / maxIndex) * 100);' + "`r`n" +
'     var atStart = currentIndex === 0;' + "`r`n" +
'     var atEnd = currentIndex >= maxIndex;' + "`r`n`r`n" +
'     // Apply all DOM writes grouped after reads' + "`r`n" +
"     track.style.transform = 'translateX(-' + (currentIndex * slideWidth) + '%)';`r`n" +
"     if (progress) progress.style.width = progressPct + '%';`r`n" +
"     if (prevBtn) prevBtn.style.opacity = atStart ? '0.4' : '1';`r`n" +
"     if (nextBtn) nextBtn.style.opacity = atEnd ? '0.4' : '1';`r`n" +
'    }'

$result = $content -replace $oldPattern, $newContent

# Replace getMaxIndex() call in nextBtn click handler
$result = $result -replace 'currentIndex = Math\.min\(getMaxIndex\(\), currentIndex \+ 1\);', 'var wn = window.innerWidth; currentIndex = Math.min(Math.max(0, totalSlides - getVisibleCount(wn)), currentIndex + 1);'

# Replace bare resize listener with debounced rAF version
$oldResize = '    window\.addEventListener\(' + "'resize', updateCarousel\);"
$newResize = '    var _rafPending = false;' + "`r`n" +
'    window.addEventListener(' + "'resize'" + ', function () {' + "`r`n" +
'     if (!_rafPending) {' + "`r`n" +
'      _rafPending = true;' + "`r`n" +
'      window.requestAnimationFrame(function () { _rafPending = false; updateCarousel(); });' + "`r`n" +
'     }' + "`r`n" +
'    });'
$result = $result -replace $oldResize, $newResize

if ($result -ne $content) {
    [System.IO.File]::WriteAllText((Resolve-Path $path), $result, [System.Text.Encoding]::UTF8)
    Write-Host "SUCCESS: File updated"
} else {
    Write-Host "WARNING: No changes made - patterns may not have matched"
}
