(function () {
  'use strict';

  // ─── SETTINGS ──────────────────────────────────────────────────────────────
  var CONTACT_EMAIL = 'paapasly1@gmail.com';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── HERO: sun travels along the arc ────────────────────────────────────────
  var sun  = document.getElementById('sun');
  var hero = document.querySelector('.hero');
  var arc  = document.querySelector('.hero-arc');

  function pointOnArc(t) {
    // Matches SVG: M-20 300 Q500 -130 1020 300 in a 1000×300 viewBox
    var x = (1 - t) * (1 - t) * -20 + 2 * t * (1 - t) * 500 + t * t * 1020;
    var y = (1 - t) * (1 - t) * 300 + 2 * t * (1 - t) * -130 + t * t * 300;
    var box     = arc.getBoundingClientRect();
    var heroBox = hero.getBoundingClientRect();
    return {
      left: (x / 1000) * box.width,
      top:  (y / 300)  * box.height + (box.top - heroBox.top)
    };
  }

  function placeSun(t) {
    var p = pointOnArc(t);
    sun.style.left = p.left + 'px';
    sun.style.top  = p.top  + 'px';
  }

  var restT = 0.74;
  if (reduce) {
    placeSun(restT);
  } else {
    var start = null, dur = 3200;
    placeSun(0.02);
    requestAnimationFrame(function step(ts) {
      if (start === null) start = ts;
      var k      = Math.min((ts - start) / dur, 1);
      var eased  = 1 - Math.pow(1 - k, 3);
      placeSun(0.02 + (restT - 0.02) * eased);
      if (k < 1) requestAnimationFrame(step);
    });
  }
  window.addEventListener('resize', function () { placeSun(restT); });

  // ─── ROLLOUT TIMELINE: draw arc on scroll ────────────────────────────────────
  var progress = document.getElementById('tlProgress');
  if (progress) {
    if (reduce || !('IntersectionObserver' in window)) {
      progress.style.strokeDashoffset = 0;
    } else {
      progress.style.transition = 'stroke-dashoffset 2.2s ease-out';
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) {
          progress.style.strokeDashoffset = 0;
          obs.disconnect();
        }
      }, { threshold: 0.4 }).observe(progress);
    }
  }

  // ─── NAV: transparent over hero, white once scrolled ────────────────────────
  var header = document.querySelector('.top');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ─── HERO VIDEO: fade in when ready ─────────────────────────────────────────
  var vid = document.getElementById('heroVideo');
  if (vid) {
    function showVideo() { vid.classList.add('ready'); }
    vid.addEventListener('canplay', showVideo);
    vid.addEventListener('loadeddata', showVideo);
    if (vid.readyState >= 2) showVideo();
    // Ignore per-<source> errors so the next source can be tried; drop the
    // element only when every source has failed.
    vid.addEventListener('error', function (e) { if (e.target === vid) vid.remove(); }, true);
    if (reduce) { vid.removeAttribute('autoplay'); vid.pause(); }
  }

  // ─── HAMBURGER NAV TOGGLE ───────────────────────────────────────────────────
  var navToggle = document.getElementById('navToggle');
  var navLinks  = document.getElementById('navLinks');
  var navClose  = document.getElementById('navClose');

  function openNav() {
    navToggle.setAttribute('aria-expanded', 'true');
    navLinks.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.contains('open');
      if (isOpen) { closeNav(); } else { openNav(); }
    });

    // Close button inside the overlay
    if (navClose) {
      navClose.addEventListener('click', closeNav);
    }

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeNav();
        navToggle.focus();
      }
    });

    // Close when clicking a nav link inside the drawer
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    // Close when clicking outside the drawer (on the overlay backdrop)
    navLinks.addEventListener('click', function (e) {
      if (e.target === navLinks) { closeNav(); }
    });
  }

  // ─── SCROLL REVEAL ──────────────────────────────────────────────────────────
  if (!reduce && 'IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObs.observe(el);
    });
  } else {
    // If reduced motion or no IO support, make everything visible immediately
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ─── FAQ ACCORDION ──────────────────────────────────────────────────────────
  var faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    var question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // Close all siblings
      faqItems.forEach(function (sibling) {
        if (sibling !== item) {
          sibling.classList.remove('open');
          var sibQ = sibling.querySelector('.faq-question');
          if (sibQ) sibQ.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle clicked item
      item.classList.toggle('open', !isOpen);
      question.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  // ─── CONTACT FORM ───────────────────────────────────────────────────────────
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');

  if (form && note) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d       = new FormData(form);
      var name    = (d.get('name')    || '').trim();
      var message = (d.get('message') || '').trim();
      note.className = 'form-note';

      if (!name || !message) {
        note.textContent = 'Add your name and a message, then send again.';
        note.className   = 'form-note error';
        return;
      }

      var body = message +
        '\n\n' + name +
        '\n'   + (d.get('org') || '') +
        '\nInterested as: ' + d.get('role');

      window.location.href =
        'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent('Green Programme enquiry from ' + name) +
        '&body='    + encodeURIComponent(body);

      note.textContent = 'Your email app should open with the message ready to send.';
    });
  }

})();
