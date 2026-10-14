(function () {
 const mobileMenu = document.getElementById('mobile-menu');
 if (mobileMenu) {
  function syncMobileMenuBackdrop() {
   document.body.classList.toggle('mobile-menu-open', !mobileMenu.classList.contains('hidden'));
  }

  new MutationObserver(syncMobileMenuBackdrop).observe(mobileMenu, {
   attributes: true,
   attributeFilter: ['class']
  });
  syncMobileMenuBackdrop();
 }

 const bookingPlatforms = [
  { name: 'Tiket.com', url: 'https://www.tiket.com/' },
  { name: 'Airbnb', url: 'https://www.airbnb.com/' }
 ];
 const dialog = document.createElement('dialog');
 dialog.className = 'booking-choice-dialog';
 dialog.setAttribute('aria-labelledby', 'booking-choice-title');
 dialog.innerHTML =
  '<div class="booking-choice__content">' +
   '<button class="booking-choice__close" type="button" aria-label="Tutup">&times;</button>' +
   '<button class="booking-choice__back" type="button" hidden>&larr; Kembali</button>' +
   '<h2 class="booking-choice__title" id="booking-choice-title">Pilih Cara Booking</h2>' +
   '<p class="booking-choice__description" data-booking-description>Silakan pilih metode pemesanan yang Anda inginkan.</p>' +
   '<div class="booking-choice__methods" data-booking-methods>' +
    '<a class="booking-choice__action" data-booking-whatsapp target="_blank" rel="noopener noreferrer">' +
     '<span class="material-symbols-outlined" aria-hidden="true">chat</span>' +
     '<span>Booking via WhatsApp (Admin Utama)</span>' +
    '</a>' +
    '<button class="booking-choice__action booking-choice__action--app" data-booking-app type="button">' +
     '<span class="material-symbols-outlined" aria-hidden="true">event_available</span>' +
     '<span>Booking via Aplikasi</span>' +
    '</button>' +
   '</div>' +
   '<div class="booking-choice__platforms" data-booking-platforms hidden></div>' +
  '</div>';
 document.body.appendChild(dialog);

 const title = dialog.querySelector('.booking-choice__title');
 const description = dialog.querySelector('[data-booking-description]');
 const whatsappLink = dialog.querySelector('[data-booking-whatsapp]');
 const methods = dialog.querySelector('[data-booking-methods]');
 const platforms = dialog.querySelector('[data-booking-platforms]');
 const backButton = dialog.querySelector('.booking-choice__back');
 const closeButton = dialog.querySelector('.booking-choice__close');
 let previousBodyOverflow = '';

 bookingPlatforms.forEach(function (platform) {
  const link = document.createElement('a');
  link.className = 'booking-choice__action booking-choice__action--app';
  link.href = platform.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = platform.name;
  platforms.appendChild(link);
 });

 function showPlatformChoices() {
  title.textContent = 'Pilih Aplikasi Booking';
  description.textContent = 'Pilih platform untuk melanjutkan pencarian homestay.';
  methods.hidden = true;
  platforms.hidden = false;
  backButton.hidden = false;
 }

 function showBookingMethods() {
  title.textContent = 'Pilih Cara Booking';
  description.textContent = 'Silakan pilih metode pemesanan yang Anda inginkan.';
  methods.hidden = false;
  platforms.hidden = true;
  backButton.hidden = true;
 }

 function openDialog(trigger, choosePlatform) {
  if (trigger.href) whatsappLink.href = trigger.href;
  showBookingMethods();
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  dialog.showModal();
  if (choosePlatform) showPlatformChoices();
  closeButton.focus();
 }

 document.addEventListener('click', function (event) {
  const trigger = event.target.closest(
   '#btn-reservasi-header, #btn-pesan-sekarang, #mobile-menu a[href*="wa.me/628122960504"], [data-booking-app-open]'
  );
  if (!trigger) return;
  if (!trigger.matches('[data-booking-app-open]') && !trigger.href) return;

  event.preventDefault();
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) mobileMenu.classList.add('hidden');
  const mobileMenuIcon = document.getElementById('mobile-menu-icon');
  if (mobileMenuIcon) mobileMenuIcon.textContent = 'menu';
  openDialog(trigger, trigger.matches('[data-booking-app-open]'));
 });

 dialog.querySelector('[data-booking-app]').addEventListener('click', showPlatformChoices);
 backButton.addEventListener('click', showBookingMethods);

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
})();
