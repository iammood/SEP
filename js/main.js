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
    // toggle() returns true if it just opened, false if it just closed.
    // Screen readers read aria-expanded aloud, so it has to match the real state.
    const open = q.parentElement.classList.toggle('open');
    q.setAttribute('aria-expanded', open ? 'true' : 'false');
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
function subscribeToBrevo(data, onSuccess, onError) {
  fetch('/.netlify/functions/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function (res) { return res.json(); })
  .then(function (d) { d.result === 'success' ? onSuccess() : onError(); })
  .catch(function () { onError(); });
}

// Footer devos newsletter form (present on every page)
const devosForm = document.getElementById('devos-form');
if (devosForm) {
  devosForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var emailInput = devosForm.querySelector('input[name="email"]');
    var btn = devosForm.querySelector('button[type="submit"]');
    var email = emailInput ? emailInput.value.trim() : '';
    var firstName = (devosForm.querySelector('input[name="firstName"]') || {}).value || '';
    var lastName = (devosForm.querySelector('input[name="lastName"]') || {}).value || '';
    if (!email || !email.includes('@')) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Subscribing...'; }
    subscribeToBrevo({ email: email, firstName: firstName.trim(), lastName: lastName.trim() }, function () {
      // A subscriber never needs the devotional banner again
      try { localStorage.setItem('sep_devotionals_dismissed', '1'); } catch (e) {}
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
      var content = document.querySelector('.reg-form-content');
      if (data.result === 'success') {
        if (content) content.style.display = 'none';
        if (regSuccess) {
          regSuccess.classList.add('show');
          regSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (data.result === 'already_registered') {
        if (content) content.style.display = 'none';
        var alreadyMsg = document.createElement('div');
        alreadyMsg.className = 'success-msg show';
        alreadyMsg.innerHTML =
          '<div class="success-icon">✓</div>' +
          '<h4>You are already registered for SEP 2026.</h4>' +
          '<p>We have your seat saved and will see you in October. If you need to make a change, email <a href="mailto:hello@seedempowermentprogram.com">hello@seedempowermentprogram.com</a>.</p>';
        if (content) content.parentNode.appendChild(alreadyMsg);
        alreadyMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    var input = form.querySelector('input[name="email"]') || form.querySelector('input[type="email"]');
    var btn = form.querySelector('button[type="submit"]');
    var email = input ? input.value.trim() : '';
    var firstName = (form.querySelector('input[name="firstName"]') || {}).value || '';
    var lastName = (form.querySelector('input[name="lastName"]') || {}).value || '';
    if (!email || !email.includes('@')) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Subscribing...'; }
    subscribeToBrevo({ email: email, firstName: firstName.trim(), lastName: lastName.trim() }, function () {
      // A subscriber never needs the devotional banner again
      try { localStorage.setItem('sep_devotionals_dismissed', '1'); } catch (e) {}
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

// ============ TOP BANNERS (devotional + register nudge) ============
// Two prompts: the business devotional slides down from the top of the page
// at 8 seconds, and a centred modal nudging the visitor toward the
// registration form opens at 15 seconds. They sit on different layers, so
// both can be on screen at once. Dismissing either one is remembered in
// localStorage, so it stays gone on that visitor's next page load.
(function () {
  var DEVOS_KEY = 'sep_devotionals_dismissed';
  // The register modal is shown every visit, so it has no localStorage key.
  // It stops for good once the event is under way. Month is zero based, so
  // 9 is October. Compared against the visitor's own local clock.
  var REG_CUTOFF = new Date(2026, 9, 10, 0, 0, 0);

  // localStorage throws in Safari private mode and when storage is full, so
  // every read and write is wrapped. If it is unavailable the banners still
  // work, they just show again on the next visit.
  function seen(key) {
    try { return localStorage.getItem(key) === '1'; } catch (e) { return false; }
  }
  function remember(key) {
    try { localStorage.setItem(key, '1'); } catch (e) {}
  }

  // Adds the top banner as the very first element in the body, above the nav,
  // so it pushes the whole page down rather than covering anything. The nav is
  // fixed, so its top offset is kept in step with the bar by hand.
  // Returns the dismiss function so a CTA can close the bar too.
  function mount(el, key) {
    document.body.insertBefore(el, document.body.firstChild);

    var nav = document.querySelector('.nav');

    // Measure the bar at its full height before it is collapsed for the
    // opening animation. Reading offsetHeight mid transition would return the
    // in-between value and leave the nav parked at a couple of pixels.
    el.style.maxHeight = 'none';
    var barHeight = el.offsetHeight;
    el.style.maxHeight = '';

    // The bar is fixed, so it stays put while the visitor scrolls. To keep it
    // from covering anything, the body is padded by the bar height and the
    // fixed nav is offset to match. Both are re-applied on resize in case the
    // bar rewraps to a different height.
    function syncNav() {
      var h = el.offsetHeight > 1 ? el.offsetHeight : barHeight;
      document.body.style.transition = 'padding-top 0.42s ease';
      document.body.style.paddingTop = h + 'px';
      if (nav) nav.style.top = h + 'px';
    }

    // Reading offsetHeight forces a synchronous layout, which commits the
    // collapsed starting state. Adding the class straight after then animates
    // reliably. A rAF callback is not guaranteed to run here, for example in a
    // background tab, and if it does not the bar never gets its show class.
    void el.offsetHeight;
    el.classList.add('show');
    if (nav) nav.style.transition = 'top 0.42s ease';
    syncNav();

    window.addEventListener('resize', syncNav);

    function dismiss() {
      remember(key);
      el.classList.remove('show');
      el.classList.add('hide');
      window.removeEventListener('resize', syncNav);
      document.body.style.paddingTop = '0px';
      if (nav) nav.style.top = '0px';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        // Hand positioning back to the stylesheet
        document.body.style.paddingTop = '';
        document.body.style.transition = '';
        if (nav) { nav.style.top = ''; nav.style.transition = ''; }
      }, 350);
    }

    el.querySelector('.sep-banner-close').addEventListener('click', dismiss);
    return dismiss;
  }

  function scrollToEl(el) {
    var top = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  // ---- Devotional banner, 8 seconds ----
  function buildDevotional() {
    var list = (typeof SEP_DEVOTIONALS !== 'undefined' && SEP_DEVOTIONALS.length)
      ? SEP_DEVOTIONALS : null;
    if (!list || seen(DEVOS_KEY)) return;

    var devo = list[Math.floor(Math.random() * list.length)];

    var el = document.createElement('div');
    el.id = 'devos-banner';
    el.className = 'sep-banner sep-banner-devos';
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', 'Business Devotional');
    // Two identical copies so the 50% slide in @keyframes marquee loops seamlessly
    var message =
      '<span>' +
        '<span class="sep-banner-text">' + devo.text + '</span>' +
        '<span class="sep-banner-verse">' + devo.verse + '</span>' +
      '</span>';

    el.innerHTML =
      '<div class="sep-banner-inner">' +
        '<span class="sep-banner-label">Business Devotional</span>' +
        '<div class="sep-banner-marquee">' +
          '<div class="sep-banner-track">' + message + message + '</div>' +
        '</div>' +
        '<a href="#devos-form" class="sep-banner-cta">' +
          // Long label on desktop, short one on phones, swapped in CSS
          '<span class="sep-banner-cta-long">Get monthly devotionals &rarr;</span>' +
          '<span class="sep-banner-cta-short">Subscribe &rarr;</span>' +
        '</a>' +
        '<button class="sep-banner-close" aria-label="Close devotional">&times;</button>' +
      '</div>';

    var dismiss = mount(el, DEVOS_KEY);

    // CTA: close the bar, then scroll to the footer signup form
    el.querySelector('.sep-banner-cta').addEventListener('click', function (e) {
      e.preventDefault();
      dismiss();
      var target = document.getElementById('devos-form');
      if (target) scrollToEl(target);
    });
  }

  // ---- Register banner, 15 seconds, landing page only ----
  // Skipped entirely if the visitor already reached or touched the register
  // section, since nudging someone toward what they are already looking at
  // is just noise.
  var regSection = document.getElementById('register');
  var regTouched = false;

  if (regSection) {
    if ('IntersectionObserver' in window) {
      var regObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          regTouched = true;
          regObserver.disconnect();
        }
      }, { threshold: 0.15 });
      regObserver.observe(regSection);
    }
    // Focusing or typing in the form counts as interaction too
    regSection.addEventListener('focusin', function () { regTouched = true; });
    regSection.addEventListener('input', function () { regTouched = true; });
  }

  function buildRegister() {
    if (!regSection || regTouched) return;
    if (new Date() >= REG_CUTOFF) return;

    // Overlay covers the page, the card sits centred inside it
    var overlay = document.createElement('div');
    overlay.id = 'register-modal';
    overlay.className = 'reg-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Register for SEP 2026');
    overlay.innerHTML =
      '<div class="reg-modal-card">' +
        '<button class="reg-modal-close" aria-label="Close registration reminder">&times;</button>' +
        '<span class="reg-modal-label">Registration is FREE</span>' +
        '<p class="reg-modal-text">SEP 2026 is free to attend. Reserve your seat before your track fills up.</p>' +
        '<a href="#register" class="reg-modal-cta">Reserve your spot &rarr;</a>' +
      '</div>';

    document.body.appendChild(overlay);

    // Same forced reflow as the banner, so the card animates in reliably
    void overlay.offsetHeight;
    overlay.classList.add('show');

    function dismiss() {
      overlay.classList.remove('show');
      overlay.classList.add('hide');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 300);
    }

    function onKey(e) {
      if (e.key === 'Escape' || e.keyCode === 27) dismiss();
    }

    overlay.querySelector('.reg-modal-close').addEventListener('click', dismiss);

    // Clicking the dimmed area closes it, clicking the card itself does not
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) dismiss();
    });

    document.addEventListener('keydown', onKey);

    overlay.querySelector('.reg-modal-cta').addEventListener('click', function (e) {
      e.preventDefault();
      dismiss();
      scrollToEl(regSection);
    });
  }

  setTimeout(buildDevotional, 8000);
  setTimeout(buildRegister, 3000);
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
