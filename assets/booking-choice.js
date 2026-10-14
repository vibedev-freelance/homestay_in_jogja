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
  { name: 'Airbnb', listings: [
   {
    name: 'Omah Kadipaten',
    url: 'https://www.airbnb.co.id/rooms/1684113982771063960?unique_share_id=a0124c15-2271-487f-a27c-b10a4674fef6&viralityEntryPoint=1&s=76'
   },
   {
    name: 'Griya Pojok',
    url: 'https://www.airbnb.co.id/rooms/1684125429962686068?unique_share_id=54ac0cf9-5778-4ae7-9449-1031394dd44f&viralityEntryPoint=1&s=76'
   },
   {
    name: 'Omah Pakualaman',
    url: 'https://www.airbnb.co.id/rooms/1710045846866173250?unique_share_id=0a8bedff-6236-4302-b320-dbb46fa9367b&viralityEntryPoint=1&s=76'
   },
   {
    name: 'Girly Homestay',
    url: 'https://www.airbnb.co.id/rooms/1710049376735412182?unique_share_id=b8eb1940-3b07-4fba-ade1-58528d4cb1a8&viralityEntryPoint=1&s=76'
   }
  ] },
  { name: 'Tiket.com', listings: [
   { name: 'Omah Kadipaten', url: 'https://app.tiket.com/nAPooJ' },
   { name: 'Omah Pakualaman', url: 'https://app.tiket.com/ou9L0Y' },
   { name: 'Griya Pojok', url: 'https://app.tiket.com/AjqSJ4' },
   { name: 'Girly Homestay', url: 'https://app.tiket.com/jgi9IC' }
  ] }
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
 const headerBookingLink = document.getElementById('btn-reservasi-header');
 const defaultWhatsAppUrl = headerBookingLink ? headerBookingLink.href : '';
 let previousBodyOverflow = '';

 function showPlatformChoices() {
  title.textContent = 'Pilih Aplikasi Booking';
  description.textContent = 'Pilih aplikasi untuk melihat pilihan unit homestay.';
  methods.hidden = true;
  platforms.hidden = false;
  backButton.hidden = false;
  backButton.dataset.destination = 'methods';
  platforms.replaceChildren();

  bookingPlatforms.forEach(function (platform) {
   const button = document.createElement('button');
   button.className = 'booking-choice__action booking-choice__action--app';
   button.type = 'button';
   button.dataset.bookingPlatform = platform.name;
   button.textContent = platform.name;
   platforms.appendChild(button);
  });
 }

 function showListingChoices(platform) {
  title.textContent = 'Pilih Homestay';
  description.textContent = 'Pilih unit homestay untuk melanjutkan pemesanan melalui ' + platform.name + '.';
  backButton.dataset.destination = 'platforms';
  platforms.replaceChildren();

  platform.listings.forEach(function (listing) {
   const link = document.createElement('a');
   link.className = 'booking-choice__action booking-choice__action--app';
   link.href = listing.url;
   link.target = '_blank';
   link.rel = 'noopener noreferrer';
   link.textContent = listing.name;
   platforms.appendChild(link);
  });
 }

 function showBookingMethods() {
  title.textContent = 'Pilih Cara Booking';
  description.textContent = 'Silakan pilih metode pemesanan yang Anda inginkan.';
  methods.hidden = false;
  platforms.hidden = true;
  backButton.hidden = true;
  delete backButton.dataset.destination;
 }

 function openDialog(trigger) {
  whatsappLink.href = trigger.href || defaultWhatsAppUrl;
  showBookingMethods();
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  dialog.showModal();
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
  openDialog(trigger);
 });

 dialog.querySelector('[data-booking-app]').addEventListener('click', showPlatformChoices);
 platforms.addEventListener('click', function (event) {
  const button = event.target.closest('[data-booking-platform]');
  if (!button) return;

  const selectedPlatform = bookingPlatforms.find(function (platform) {
   return platform.name === button.dataset.bookingPlatform;
  });
  if (selectedPlatform) showListingChoices(selectedPlatform);
 });
 backButton.addEventListener('click', function () {
  if (backButton.dataset.destination === 'platforms') {
   showPlatformChoices();
  } else {
   showBookingMethods();
  }
 });

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
