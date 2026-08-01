// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// FAQ toggle
document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    q.parentElement.classList.toggle('open');
  });
});

// Hub Directory notify form
const hubForm = document.getElementById('hub-form');
const hubSuccess = document.getElementById('hub-success');
if (hubForm) {
  hubForm.addEventListener('submit', e => {
    e.preventDefault();
    const row = hubForm.querySelector('.hub-input-row');
    if (row) row.style.display = 'none';
    if (hubSuccess) hubSuccess.classList.add('show');
  });
}

// Shared Brevo subscribe helper — used by footer and banner forms
function subscribeToBrevo(email, onSuccess, onError) {
  fetch('/.netlify/functions/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email })
  })
  .then(function (res) { return res.json(); })
  .then(function (data) { data.result === 'success' ? onSuccess() : onError(); })
  .catch(function () { onError(); });
}

// Footer devos newsletter form (present on every page)
const devosForm = document.getElementById('devos-form');
if (devosForm) {
  devosForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = devosForm.querySelector('input[type="email"]');
    var btn = devosForm.querySelector('button[type="submit"]');
    var email = input ? input.value.trim() : '';
    if (!email || !email.includes('@')) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Subscribing...'; }
    subscribeToBrevo(email, function () {
      devosForm.innerHTML = '<div style="color:var(--lime);font-family:var(--font-mono);font-size:13px;letter-spacing:.1em;">Almost there. Check your email to confirm your subscription.</div>';
    }, function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
      var err = devosForm.querySelector('.sub-err');
      if (!err) {
        err = document.createElement('p');
        err.className = 'sub-err';
        err.style.cssText = 'color:var(--amber-deep);font-size:12px;margin-top:6px;margin-bottom:0;';
        devosForm.appendChild(err);
      }
      err.textContent = 'Something went wrong. Please try again.';
    });
  });
}

// Registration form — POST to Google Apps Script
var REG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyP0sMkxCmzmNqnZ0H_0UeZrEIVeINoDjnxi7NH7xyHwhM_LvjT2gtMs5DGb6dbriNc9A/exec';

const regForm = document.getElementById('registration-form');
const regSuccess = document.getElementById('success');
if (regForm) {
  regForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var fFirstName = regForm.querySelector('[name="firstName"]');
    var fLastName  = regForm.querySelector('[name="lastName"]');
    var fEmail     = regForm.querySelector('[name="email"]');
    var fPhone     = regForm.querySelector('[name="phone"]');
    var fTrack     = regForm.querySelector('[name="skillTrack"]');
    var fHeard     = regForm.querySelector('[name="heardAbout"]');
    var submitBtn  = regForm.querySelector('.form-submit');
    var submitErr  = document.getElementById('reg-submit-error');

    // Clear previous error states
    regForm.querySelectorAll('.form-field-error').forEach(function (el) {
      el.textContent = '';
      el.classList.remove('show');
    });
    regForm.querySelectorAll('.is-error').forEach(function (el) {
      el.classList.remove('is-error');
    });
    if (submitErr) { submitErr.innerHTML = ''; submitErr.classList.remove('show'); }

    // Inline field validation
    var valid = true;
    function fieldError(input, msg) {
      valid = false;
      input.classList.add('is-error');
      var el = input.parentElement.querySelector('.form-field-error');
      if (el) { el.textContent = msg; el.classList.add('show'); }
    }

    if (!fFirstName.value.trim()) fieldError(fFirstName, 'First name is required.');
    if (!fLastName.value.trim())  fieldError(fLastName,  'Last name is required.');
    if (!fEmail.value.trim()) {
      fieldError(fEmail, 'Email address is required.');
    } else if (!fEmail.value.includes('@')) {
      fieldError(fEmail, 'Enter a valid email address.');
    }
    if (!fPhone.value.trim()) fieldError(fPhone, 'Phone number is required.');

    if (!valid) return;

    // Disable button while in flight
    var origHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Reserving...';

    fetch(REG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        firstName:  fFirstName.value.trim(),
        lastName:   fLastName.value.trim(),
        email:      fEmail.value.trim(),
        phone:      fPhone.value.trim(),
        skillTrack: fTrack.value,
        heardAbout: fHeard.value
      })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.result === 'success') {
        var content = document.querySelector('.reg-form-content');
        if (content) content.style.display = 'none';
        if (regSuccess) {
          regSuccess.classList.add('show');
          regSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        throw new Error('result not success');
      }
    })
    .catch(function () {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHTML;
      if (submitErr) {
        submitErr.innerHTML = 'Something went wrong. Please try again, or email <a href="mailto:hello@seedempowermentprogram.com">hello@seedempowermentprogram.com</a>.';
        submitErr.classList.add('show');
      }
    });
  });
}

// Donate form (prototype)
const donateForm = document.getElementById('donate-form');
if (donateForm) {
  donateForm.addEventListener('submit', e => {
    e.preventDefault();
    donateForm.innerHTML = '<div class="success-msg show"><div class="success-icon">✓</div><h4>Thank you for your generosity.</h4><p>We\'ll be in touch with details of how your donation will be used.</p></div>';
  });
}

// Donation amount selector
document.querySelectorAll('.amount-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const customInput = document.getElementById('custom-amount');
    if (customInput) customInput.value = btn.dataset.amount || '';
  });
});

// Netlify form AJAX handler — prevents page redirect, shows inline success
function handleNotifyForm(formId, successId) {
  const form = document.getElementById(formId);
  const success = document.getElementById(successId);
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(() => {
      form.style.display = 'none';
      if (success) success.classList.add('show');
    }).catch(() => {
      form.style.display = 'none';
      if (success) success.classList.add('show');
    });
  });
}
handleNotifyForm('webinar-form', 'webinar-success');
handleNotifyForm('career-form', 'career-success');
handleNotifyForm('hub-waitlist', 'hub-waitlist-success');

// Events page Business Devotionals banner — wired to Brevo
(function () {
  var form = document.getElementById('devos-banner-form');
  var successEl = document.getElementById('devos-banner-success');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = form.querySelector('input[type="email"]');
    var btn = form.querySelector('button[type="submit"]');
    var email = input ? input.value.trim() : '';
    if (!email || !email.includes('@')) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Subscribing...'; }
    subscribeToBrevo(email, function () {
      form.style.display = 'none';
      if (successEl) successEl.classList.add('show');
    }, function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Get the newsletter free →'; }
      var err = form.querySelector('.sub-err');
      if (!err) {
        err = document.createElement('p');
        err.className = 'sub-err';
        err.style.cssText = 'color:var(--amber);font-size:12px;margin-top:6px;margin-bottom:0;';
        form.appendChild(err);
      }
      err.textContent = 'Something went wrong. Please try again.';
    });
  });
}());

// Copy account number to clipboard (donate.html)
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.dataset.copy;
    if (!text) return;
    const orig = btn.textContent;
    const finish = () => {
      btn.textContent = 'Copied ✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2200);
    };
    navigator.clipboard ? navigator.clipboard.writeText(text).then(finish).catch(finish) : (() => {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      Object.assign(ta.style, { position: 'fixed', opacity: '0' });
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      finish();
    })();
  });
});

// Scroll-triggered fade-in
const fadeEls = document.querySelectorAll('.growth-year, .about-item, .skill-card, .speaker-card, .day-card, .testi-card, .program-card, .blog-card, .day-session-card, .about-stat-card, .stage-card, .facilitator-card, .impact-point');
if (fadeEls.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  fadeEls.forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

// ============ LIGHTBOX ============
const galleryItems = document.querySelectorAll('.gallery-item');
const lightbox = document.getElementById('lightbox');
const lbStage = document.getElementById('lb-stage');
const lbCaption = document.getElementById('lb-caption');
const lbClose = document.getElementById('lb-close');
const lbPrev = document.getElementById('lb-prev');
const lbNext = document.getElementById('lb-next');
let currentIndex = 0;

if (galleryItems.length && lightbox) {
  function openLightbox(index) {
    currentIndex = index;
    const item = galleryItems[index];
    const inner = item.querySelector('img, .gallery-ph');
    lbStage.innerHTML = '';
    lbStage.appendChild(inner.cloneNode(true));
    lbCaption.textContent = item.dataset.caption || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }
  function navigate(delta) {
    currentIndex = (currentIndex + delta + galleryItems.length) % galleryItems.length;
    openLightbox(currentIndex);
  }
  galleryItems.forEach((item, i) => item.addEventListener('click', () => openLightbox(i)));
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', () => navigate(-1));
  if (lbNext) lbNext.addEventListener('click', () => navigate(1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.hidden) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    }
  });
}

// ============ LITE YOUTUBE EMBEDS ============
document.querySelectorAll('.lite-yt').forEach(el => {
  const id = el.dataset.videoId;
  if (id && !id.startsWith('VIDEO_ID_')) {
    el.style.backgroundImage = `url("https://i.ytimg.com/vi/${id}/hqdefault.jpg")`;
    el.classList.add('has-thumb');
  }
  el.addEventListener('click', () => {
    if (!id || id.startsWith('VIDEO_ID_')) {
      console.log('Placeholder video — replace data-video-id with a real YouTube ID');
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.title = el.dataset.title || 'YouTube video';
    el.innerHTML = '';
    el.appendChild(iframe);
  });
});

// ============ MAILTO HANDLER ============
// Triggers the OS/browser mail handler AND copies address to clipboard
// so desktop users without a configured mail client still get the address.
(function () {
  function showEmailCopied(link) {
    var tip = document.createElement('span');
    tip.textContent = 'Email copied ✓';
    var rect = link.getBoundingClientRect();
    tip.style.cssText = [
      'position:fixed',
      'left:' + Math.round(rect.left + rect.width / 2) + 'px',
      'top:' + Math.round(rect.top - 40) + 'px',
      'transform:translateX(-50%)',
      'background:var(--forest-deep)',
      'color:#fff',
      'font-family:var(--font-mono)',
      'font-size:11px',
      'letter-spacing:.05em',
      'padding:5px 14px',
      'border-radius:20px',
      'white-space:nowrap',
      'pointer-events:none',
      'z-index:9999',
      'opacity:1',
      'transition:opacity .35s ease'
    ].join(';');
    document.body.appendChild(tip);
    setTimeout(function () { tip.style.opacity = '0'; }, 1600);
    setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 2000);
  }

  document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var href = link.getAttribute('href');
      var email = href.replace('mailto:', '').split('?')[0];

      // Open mail app or configured web mail handler
      window.location.href = href;

      // Copy address to clipboard as fallback for desktop without a mail client
      try {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(email).then(function () { showEmailCopied(link); }).catch(function () {});
        } else {
          var ta = Object.assign(document.createElement('textarea'), { value: email });
          Object.assign(ta.style, { position: 'fixed', opacity: '0' });
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showEmailCopied(link);
        }
      } catch (err) {}
    });
  });
}());

// Smooth-scroll offset for fixed nav
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href.length > 1) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    }
  });
});

// ============ GALLERY PHOTO CAROUSEL ============
(function () {
  var track = document.getElementById('gallery-track');
  if (!track) return;
  var carousel = track.closest('.gallery-carousel');
  var items = Array.from(track.querySelectorAll('.gallery-item'));
  var current = 0;
  var timer = null;

  function perPage() { return window.innerWidth >= 900 ? 4 : window.innerWidth >= 500 ? 2 : 1; }
  function maxIdx() { return Math.max(0, items.length - perPage()); }

  function goTo(idx) {
    current = Math.min(Math.max(0, idx), maxIdx());
    track.style.transform = 'translateX(-' + (current * (items[0].offsetWidth + 14)) + 'px)';
    document.querySelectorAll('.gallery-dots .carousel-dot').forEach(function (d, i) {
      d.classList.toggle('active', i === current);
    });
  }

  function buildDots() {
    var old = carousel.querySelector('.gallery-dots');
    if (old) old.remove();
    var max = maxIdx();
    if (max < 1) return;
    var wrap = document.createElement('div');
    wrap.className = 'carousel-dots gallery-dots';
    for (var i = 0; i <= max; i++) {
      var btn = document.createElement('button');
      btn.className = 'carousel-dot' + (i === current ? ' active' : '');
      btn.setAttribute('aria-label', 'Slide ' + (i + 1));
      (function (idx) { btn.addEventListener('click', function () { goTo(idx); resetTimer(); }); }(i));
      wrap.appendChild(btn);
    }
    carousel.appendChild(wrap);
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function advance() { goTo(current >= maxIdx() ? 0 : current + 1); }
  function resetTimer() { clearInterval(timer); if (!reducedMotion) timer = setInterval(advance, 2500); }

  carousel.addEventListener('mouseenter', function () { clearInterval(timer); });
  carousel.addEventListener('mouseleave', resetTimer);

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { resetTimer(); } else { clearInterval(timer); }
  }, { threshold: 0.1 }).observe(carousel);

  window.addEventListener('resize', function () { current = Math.min(current, maxIdx()); buildDots(); goTo(current); });

  buildDots();
  goTo(0);
  resetTimer();
}());

// ============ WEBINAR CAROUSEL ============
(function () {
  var track = document.getElementById('webinar-track');
  if (!track) return;
  var section = track.closest('section');
  var trackWrap = track.parentElement;
  var cards = Array.from(track.querySelectorAll('.webinar-card'));
  var current = 0;
  var timer = null;

  function perPage() { return window.innerWidth >= 900 ? 3 : window.innerWidth >= 580 ? 2 : 1; }
  function maxIdx() { return Math.max(0, cards.length - perPage()); }

  function goTo(idx) {
    current = Math.min(Math.max(0, idx), maxIdx());
    track.style.transform = 'translateX(-' + (current * (cards[0].offsetWidth + 20)) + 'px)';
    document.querySelectorAll('.webinar-dots .carousel-dot').forEach(function (d, i) {
      d.classList.toggle('active', i === current);
    });
  }

  function buildDots() {
    var old = section.querySelector('.webinar-dots');
    if (old) old.remove();
    var max = maxIdx();
    if (max < 1) return;
    var wrap = document.createElement('div');
    wrap.className = 'carousel-dots webinar-dots';
    for (var i = 0; i <= max; i++) {
      var btn = document.createElement('button');
      btn.className = 'carousel-dot' + (i === current ? ' active' : '');
      btn.setAttribute('aria-label', 'Slide ' + (i + 1));
      (function (idx) { btn.addEventListener('click', function () { goTo(idx); resetTimer(); }); }(i));
      wrap.appendChild(btn);
    }
    trackWrap.after(wrap);
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function advance() { goTo(current >= maxIdx() ? 0 : current + 1); }
  function resetTimer() { clearInterval(timer); if (!reducedMotion) timer = setInterval(advance, 4000); }

  section.addEventListener('mouseenter', function () { clearInterval(timer); });
  section.addEventListener('mouseleave', resetTimer);

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { resetTimer(); } else { clearInterval(timer); }
  }, { threshold: 0.1 }).observe(section);

  window.addEventListener('resize', function () { current = Math.min(current, maxIdx()); buildDots(); goTo(current); });

  buildDots();
  goTo(0);
  resetTimer();
}());

// ============ BUSINESS DEVOTIONAL POPUP ============
// In-memory flag — resets on page load (intentional, privacy-friendly)
(function () {
  let dismissed = false;

  function buildPopup() {
    const list = (typeof SEP_DEVOTIONALS !== 'undefined' && SEP_DEVOTIONALS.length)
      ? SEP_DEVOTIONALS : null;
    if (!list || dismissed) return;

    const devo = list[Math.floor(Math.random() * list.length)];

    const popup = document.createElement('div');
    popup.id = 'devos-popup';
    popup.className = 'devos-popup';
    popup.setAttribute('role', 'complementary');
    popup.setAttribute('aria-label', 'Business Devotional');

    popup.innerHTML =
      '<div class="devos-popup-header">' +
        '<span class="devos-popup-label">Business Devotional</span>' +
        '<button class="devos-popup-close" aria-label="Close devotional">&times;</button>' +
      '</div>' +
      '<p class="devos-popup-text">' + devo.text + '</p>' +
      '<div class="devos-popup-verse">' + devo.verse + '</div>' +
      '<a href="#devos-form" class="devos-popup-cta">Get monthly devotionals →</a>';

    document.body.appendChild(popup);

    // Animate in (double rAF ensures the initial state is painted first)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { popup.classList.add('show'); });
    });

    function dismiss() {
      dismissed = true;
      popup.classList.remove('show');
      popup.classList.add('hide');
      setTimeout(function () { if (popup.parentNode) popup.parentNode.removeChild(popup); }, 350);
    }

    popup.querySelector('.devos-popup-close').addEventListener('click', dismiss);

    // CTA: smooth-scroll to footer signup then close
    popup.querySelector('.devos-popup-cta').addEventListener('click', function (e) {
      e.preventDefault();
      dismiss();
      var target = document.getElementById('devos-form');
      if (target) {
        var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  }

  setTimeout(buildPopup, 8000);
}());

// ============ SUBSCRIPTION CONFIRMED BANNER ============
(function () {
  if (!/[?&]subscribed=true/.test(window.location.search)) return;

  // Clean the param from the URL without triggering a reload
  var cleanUrl = window.location.pathname + window.location.search.replace(/[?&]subscribed=true/, '').replace(/^\?$/, '') + window.location.hash;
  history.replaceState(null, '', cleanUrl);

  var banner = document.createElement('div');
  banner.className = 'confirmed-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML =
    '<div class="confirmed-banner-icon">✓</div>' +
    '<span>You\'re confirmed! Welcome to SEP Business Devotionals.</span>' +
    '<button class="confirmed-banner-close" aria-label="Dismiss">&times;</button>';
  document.body.appendChild(banner);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () { banner.classList.add('show'); });
  });

  function dismiss() {
    banner.classList.remove('show');
    banner.classList.add('hide');
    setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 400);
  }

  banner.querySelector('.confirmed-banner-close').addEventListener('click', dismiss);
  setTimeout(dismiss, 7000);
}());
