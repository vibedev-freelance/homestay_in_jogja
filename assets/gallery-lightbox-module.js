const dialog = document.createElement('dialog');
dialog.className = 'gallery-lightbox';
dialog.setAttribute('aria-label', 'Galeri foto');
dialog.innerHTML =
 '<div class="gallery-lightbox__layout">' +
  '<button class="gallery-lightbox__close" type="button" aria-label="Tutup galeri"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"></path></svg></button>' +
  '<img class="gallery-lightbox__image" alt="">' +
  '<div class="gallery-lightbox__controls" aria-label="Kontrol zoom">' +
   '<button class="gallery-lightbox__zoom-button" type="button" data-zoom="-1" aria-label="Perkecil gambar">&minus;</button>' +
   '<span class="gallery-lightbox__zoom-level" aria-live="polite">100%</span>' +
   '<button class="gallery-lightbox__zoom-button" type="button" data-zoom="1" aria-label="Perbesar gambar">+</button>' +
   '<button class="gallery-lightbox__zoom-button" type="button" data-zoom="reset" aria-label="Atur ulang zoom">Reset</button>' +
  '</div>' +
 '</div>';
document.body.appendChild(dialog);

const lightboxImage = dialog.querySelector('.gallery-lightbox__image');
const zoomLevel = dialog.querySelector('.gallery-lightbox__zoom-level');
const closeButton = dialog.querySelector('.gallery-lightbox__close');
let scale = 1;
let previousBodyOverflow = '';

function setScale(nextScale) {
 scale = Math.max(1, Math.min(3, nextScale));
 lightboxImage.style.transform = 'scale(' + scale + ')';
 lightboxImage.classList.toggle('is-zoomed', scale > 1);
 zoomLevel.textContent = Math.round(scale * 100) + '%';
}

export function openImage(image) {
 lightboxImage.src = image.dataset.fullSrc || image.src;
 lightboxImage.alt = image.alt;
 setScale(1);
 previousBodyOverflow = document.body.style.overflow;
 document.body.style.overflow = 'hidden';
 dialog.showModal();
 closeButton.focus();
}

function closeDialog() {
 dialog.close();
}

closeButton.addEventListener('click', closeDialog);
dialog.addEventListener('click', function (event) {
 if (event.target === dialog) closeDialog();
});
dialog.addEventListener('close', function () {
 document.body.style.overflow = previousBodyOverflow;
});

dialog.querySelectorAll('[data-zoom]').forEach(function (button) {
 button.addEventListener('click', function () {
  const zoom = button.getAttribute('data-zoom');
  if (zoom === 'reset') setScale(1);
  else setScale(scale + Number(zoom) * 0.25);
 });
});

lightboxImage.addEventListener('click', function () {
 setScale(scale === 1 ? 2 : 1);
});
lightboxImage.addEventListener('wheel', function (event) {
 event.preventDefault();
 setScale(scale + (event.deltaY < 0 ? 0.25 : -0.25));
}, { passive: false });
