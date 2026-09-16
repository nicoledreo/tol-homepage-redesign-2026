/* ==========================================================================
   Tree of Life — 2026 refresh behaviour
   - scroll-linked nav fade (transparent over hero -> solid green)
   - brand carousel re-configured so whole cards fit
   - mobile dot pagination instead of overlapping arrows
   - tagging hooks used by tol-2026.css
   ========================================================================== */
(function () {
  'use strict';

  var MOBILE = function () { return window.matchMedia('(max-width: 767.98px)').matches; };
  var REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- 1. NAV */
  function navFade() {
    var hd = document.querySelector('header.sticky-header, header[class*="header-alignment"]');
    if (!hd) return;
    var hero = document.querySelector('[data-background-video]');
    var ticking = false;

    function compute() {
      ticking = false;
      var heroH = hero ? hero.getBoundingClientRect().height : 600;
      if (!heroH || heroH < 120) heroH = window.innerHeight;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      // stay clear over most of the video, then ease in before the hero ends
      var start = heroH * 0.45;
      var end = heroH * 0.92;
      var t = (y - start) / Math.max(1, end - start);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      t = t * t * (3 - 2 * t);                    // smoothstep
      document.documentElement.style.setProperty('--tol26-nav-solid', t.toFixed(3));
      // keep the theme's own class in sync so its other rules don't fight us
      if (t > 0.5) hd.classList.add('sticky'); else hd.classList.remove('sticky');
    }
    function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(compute); } }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    compute();
  }

  /* ------------------------------------------- 2. CAROUSEL FIT (no cropping) */
  /* The theme configured these with centredSlides/loop and fractional
     slidesPerView, which clipped the first and last card. Re-initialising with
     whole-number slidesPerView makes Swiper compute exact widths, so every card
     sits fully inside the rail and the outer edges line up with the deals rail. */
  function refit(id, breakpoints, opts) {
    opts = opts || {};
    var el = document.getElementById(id);
    if (!el || !window.Swiper) return;
    var old = el.swiper;
    // NB: a `[class*="-next"]` lookup matches Swiper's own `swiper-slide-next`
    // CLASS on a slide, which precedes the real arrow in document order — that
    // bound navigation to a CARD, so the arrows did nothing and clicking a card
    // scrolled the rail. Match the real control classes only, scoped to the rail.
    var nav = (function () {
      var n = el.querySelector('.swiper-controls .swiper-button-next') || el.querySelector('.swiper-button-next') ||
              el.parentElement.querySelector('.swiper-button-next');
      var p = el.querySelector('.swiper-controls .swiper-button-prev') || el.querySelector('.swiper-button-prev') ||
              el.parentElement.querySelector('.swiper-button-prev');
      return (n && p) ? { nextEl: n, prevEl: p } : undefined;
    })();
    try {
      if (old && old.destroy) old.destroy(true, true);
      // The theme's loop clones survive destroy(); left in place they pad a
      // 3-brand rail out to 5 slides and it scrolls past the real brands.
      // (Only the theme's own attribute is needed — the bundled Swiper 11 loop
      // does not clone nodes, so there is no `swiper-slide-duplicate` to catch.)
      el.querySelectorAll('[data-sg-loop-clone]').forEach(function (n) { n.remove(); });

      // Repeat the real slides when a rail has too few to loop smoothly. There
      // are only three brands, so without this the section cannot slide at all.
      var wrap = el.querySelector('.swiper-wrapper');
      if (opts.minSlides && wrap) {
        el.querySelectorAll('[data-tol-dup]').forEach(function (n) { n.remove(); });   // idempotent
        var real = [].slice.call(wrap.querySelectorAll('.swiper-slide'));
        if (real.length && real.length < opts.minSlides) {
          var i = 0;
          while (wrap.querySelectorAll('.swiper-slide').length < opts.minSlides) {
            var c = real[i % real.length].cloneNode(true);
            c.setAttribute('data-tol-dup', '1');
            // `inert` (not aria-hidden): these clones become the visible slide for
            // 2/3 of the cycle, so hiding them from AT while their SHOP NOW links
            // stay tabbable is an aria-hidden-focus / WCAG 4.1.2 violation.
            // inert removes them from the tab order AND the a11y tree together.
            c.inert = true;
            c.setAttribute('inert', '');
            c.removeAttribute('id');
            wrap.appendChild(c);
            i++;
          }
        }
      }

      new window.Swiper(el, {
        slidesPerView: 1,
        spaceBetween: 16,
        centeredSlides: false,
        loop: !!opts.loop,
        watchOverflow: !opts.loop,
        autoHeight: false,
        speed: opts.speed || 600,
        // pauseOnMouseEnter is back — without it the rail slides out from under
        // a parked cursor mid-read, and with the arrows gone there is no other
        // way to hold it. The earlier running:true/paused:true stall is handled
        // by the afterInit start() below. Honour reduced-motion.
        autoplay: (opts.autoplay && !REDUCED_MOTION)
          ? {
              delay: opts.autoplay,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
              // without this the rail can sit at running:true / paused:true,
              // waiting on a transition callback that never settles
              waitForTransition: false,
            }
          : false,
        navigation: nav,
        breakpoints: breakpoints,
        // NB gated on REDUCED_MOTION too — gated on opts.autoplay alone, this
        // hook restarted the autoplay the reduced-motion check had just disabled.
        on: (opts.autoplay && !REDUCED_MOTION) ? {
          // belt-and-braces: if autoplay lands paused (tab hidden at init,
          // pointer already inside the rail), kick it once the rail is ready.
          afterInit: function (s) { setTimeout(function () { try { s.autoplay && s.autoplay.start(); } catch (e) {} }, 400); },
        } : {},
      });
    } catch (e) { /* leave the original carousel alone if anything throws */ }
  }

  function fixCarousels() {
    // brands: 3 whole cards on desktop
    // Whole numbers at every breakpoint — a fractional 1.6 at 576 sliced the
    // second card, which is the exact defect this was meant to remove.
    // Only three brands exist, so the rail is padded out with repeats to nine —
    // that is what lets it loop and slide continuously instead of sitting still.
    refit('gallery-items-i4p1l', {
      0:    { slidesPerView: 1, spaceBetween: 14, centeredSlides: false },
      // 1-up through 899: the card's 60/40 split needs the full rail width.
      // 2-up at 768 just moved the cramped-copy defect into 768-1023 (a 10-line
      // blurb) and made one pixel at 768 swap the card width 2.18x. Stepping at
      // 900 keeps each jump close to the card before it (237px/7 lines at 900).
      576:  { slidesPerView: 1, spaceBetween: 18, centeredSlides: false },
      900:  { slidesPerView: 2, spaceBetween: 20, centeredSlides: false },
      1024: { slidesPerView: 3, spaceBetween: 24, centeredSlides: false },
    }, { loop: true, autoplay: 3200, minSlides: 9, speed: 700 });
    // reviews: 3 whole cards on desktop, nothing clipped on the right
    refit('testimonial-items-iq8d8', {
      0:   { slidesPerView: 1, spaceBetween: 14, centeredSlides: false },
      768: { slidesPerView: 2, spaceBetween: 18, centeredSlides: false },
      992: { slidesPerView: 3, spaceBetween: 20, centeredSlides: false },
    });
  }

  /* ------------------------------------------------------ 3. MOBILE DOT NAV */
  function addDots(swiperEl, onDark) {
    if (!swiperEl) return;
    var sw = swiperEl.swiper;
    if (!sw) return;
    var host = swiperEl.parentElement;
    if (!host || host.querySelector('.tol-dots')) return;

    var wrap = document.createElement('div');
    wrap.className = 'tol-dots' + (onDark ? ' tol-dots--onDark' : '');
    wrap.setAttribute('role', 'tablist');
    wrap.setAttribute('aria-label', 'Carousel page');

    // Count the REAL slides, not the repeats added to make the rail loop —
    // otherwise the pagination advertises 9 pages of the same 3 brands.
    function realCount() {
      var n = swiperEl.querySelectorAll('.swiper-slide:not([data-tol-dup])').length;
      return n || sw.slides.length;
    }
    function pageCount() {
      var per = Math.max(1, Math.round(sw.params.slidesPerView) || 1);
      return Math.max(1, Math.ceil(realCount() / per));
    }
    function build() {
      wrap.innerHTML = '';
      var n = pageCount();
      // a single-page strip is decoration, not navigation
      wrap.style.display = n > 1 ? '' : 'none';
      for (var i = 0; i < n; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.dataset.i = String(i);
        b.addEventListener('click', function () {
          var per = Math.max(1, Math.round(sw.params.slidesPerView) || 1);
          var target = Number(this.dataset.i) * per;
          if (sw.params.loop && sw.slideToLoop) sw.slideToLoop(target);
          else sw.slideTo(target);
        });
        wrap.appendChild(b);
      }
      sync();
    }
    function sync() {
      var per = Math.max(1, Math.round(sw.params.slidesPerView) || 1);
      // realIndex, not activeIndex — with loop:true activeIndex carries the
      // loop offset and would run past the last dot.
      var idx = (sw.params.loop && typeof sw.realIndex === 'number') ? sw.realIndex : (sw.activeIndex || 0);
      var active = Math.floor((idx % realCount()) / per);   // wrap through the repeats
      [].forEach.call(wrap.children, function (b, i) {
        b.setAttribute('aria-current', i === active ? 'true' : 'false');
      });
    }
    host.appendChild(wrap);
    build();
    sw.on('slideChange', sync);
    sw.on('breakpoint', build);
    window.addEventListener('resize', function () { setTimeout(build, 150); }, { passive: true });
  }

  /* Move the reviews arrows out of the (overflow:hidden, inset) rail and make
     them direct children of the section wrapper, so they can sit in the dark
     band beside the cards instead of on top of a review. */
  function liftReviewArrows() {
    var rail = document.getElementById('testimonial-items-iq8d8');
    if (!rail) return;
    var host = rail.parentElement;
    if (!host) return;
    host.classList.add('tol-review-nav-host');
    ['.swiper-button-prev', '.swiper-button-next'].forEach(function (sel) {
      var btn = host.querySelector(sel) || rail.querySelector(sel);
      if (btn && btn.parentElement !== host) host.appendChild(btn);
    });
  }

  function mobileCarouselNav() {
    // Brands + reviews: arrows off on mobile, dots instead (they overlapped the cards).
    // Deals keeps its arrows — they just get centred (see tol-2026.css).
    [
      { id: 'gallery-items-i4p1l', dark: false },
      { id: 'testimonial-items-iq8d8', dark: true },
    ].forEach(function (c) {
      var el = document.getElementById(c.id);
      if (!el) return;
      el.classList.add('tol-hide-arrows-m');
      addDots(el, c.dark);
    });
  }

  /* ------------------------------------------------- 4. TAGGING FOR THE CSS */
  function tag() {
    // blocks that should centre on mobile
    // 'i51ry' is the CALL NOW block — a centred block by the same definition, so
    // its CTA needs the shared width too (it was 148px next to the others' 230px).
    ['iup37', 'isuey', 'i51ry'].forEach(function (id) {
      var h = document.getElementById(id);
      if (!h) return;
      var cell = h.closest('.cell') || h.closest('.col') || h.parentElement;
      if (cell) cell.classList.add('tol-m-center');
    });
    var appH = document.querySelector('.tol-app-h');
    if (appH) {
      var c = appH.closest('.cell') || appH.closest('.col') || appH.parentElement;
      if (c) c.classList.add('tol-m-center');
    }
    // newsletter subtext -> single line
    var ps = document.querySelectorAll('footer p, .section-footer-widgets p');
    [].forEach.call(ps, function (p) {
      if (/Sign up for deals/i.test(p.textContent || '')) p.classList.add('tol-signup-sub');
    });
    // the hand/phone image in the rewards block
    var rew = document.getElementById('isuey');
    if (rew) {
      var row = rew.closest('.row') || rew.closest('.sgb-component-section');
      if (row) {
        var imgs = row.querySelectorAll('img');
        [].forEach.call(imgs, function (im) {
          var s = im.getAttribute('data-src') || im.currentSrc || im.src || '';
          if (/hand|phone|mockup|rewards/i.test(s)) {
            var holder = im.closest('.sgb-component-image') || im.parentElement;
            if (holder) holder.classList.add('tol-hand-img');
          }
        });
      }
    }
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    try { tag(); } catch (e) {}
    try { navFade(); } catch (e) {}
    // carousels are initialised by the theme after DOMContentLoaded
    setTimeout(function () {
      try { fixCarousels(); } catch (e) {}
      setTimeout(function () {
        try { mobileCarouselNav(); } catch (e) {}
        try { liftReviewArrows(); } catch (e) {}
      }, 350);
    }, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
