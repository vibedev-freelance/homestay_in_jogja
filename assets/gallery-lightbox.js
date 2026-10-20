(function () {
 const galleryRoots = document.querySelectorAll('#detail-gallery-root, #homepage-gallery-root');
 if (!galleryRoots.length) return;

 let lightboxPromise;
 function loadLightbox() {
  if (!lightboxPromise) {
   const scriptUrl = document.querySelector('script[src*="gallery-lightbox"]')?.src;
   lightboxPromise = Promise.all([
    import('./gallery-lightbox-module.js'),
    new Promise(function (resolve, reject) {
     const stylesheet = document.createElement('link');
     stylesheet.rel = 'stylesheet';
     stylesheet.href = new URL('./gallery-lightbox.css', scriptUrl || document.baseURI).href;
     stylesheet.onload = resolve;
     stylesheet.onerror = reject;
     document.head.appendChild(stylesheet);
    })
   ]).then(function (results) { return results[0]; });
  }
  return lightboxPromise;
 }

 function activateCard(card) {
  const image = card && card.querySelector('img');
  if (!image) return;
  loadLightbox().then(function (module) {
   module.openImage(image);
  }).catch(function (error) {
   lightboxPromise = null;
   console.error('Unable to load gallery lightbox', error);
  });
 }

 function prepareImages(root) {
  root.querySelectorAll('img').forEach(function (image) {
   const card = image.parentElement;
   if (!card) return;
   card.classList.add('detail-gallery-card');
   card.setAttribute('role', 'button');
   card.setAttribute('tabindex', '0');
   card.setAttribute('aria-label', 'Perbesar ' + image.alt);
  });
 }

 galleryRoots.forEach(function (galleryRoot) {
  prepareImages(galleryRoot);
  if (galleryRoot.id === 'detail-gallery-root') {
   new MutationObserver(function (records) {
    records.forEach(function (record) {
     record.addedNodes.forEach(function (node) {
      if (node.nodeType !== 1) return;
      if (node.matches('img')) {
       const card = node.parentElement;
       if (!card) return;
       card.classList.add('detail-gallery-card');
       card.setAttribute('role', 'button');
       card.setAttribute('tabindex', '0');
       card.setAttribute('aria-label', 'Perbesar ' + node.alt);
      } else {
       prepareImages(node);
      }
     });
    });
   }).observe(galleryRoot, { childList: true, subtree: true });
  }

  galleryRoot.addEventListener('click', function (event) {
   const card = event.target.closest('.detail-gallery-card');
   if (card && galleryRoot.contains(card)) activateCard(card);
  });

  galleryRoot.addEventListener('keydown', function (event) {
   if (event.key !== 'Enter' && event.key !== ' ') return;
   const card = event.target.closest('.detail-gallery-card');
   if (!card || !galleryRoot.contains(card)) return;
   event.preventDefault();
   activateCard(card);
  });
 });
})();
