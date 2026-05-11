/* Shared Lightbox — data-lightbox="group-name" on any clickable element */
(function () {
  'use strict';

  // ── Build DOM once ──────────────────────────────────────────────────────────
  var overlay = document.createElement('div');
  overlay.id = 'lb-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Image viewer');
  var svgPrev = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  var svgNext = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  var svgClose = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  overlay.innerHTML =
    '<div id="lb-img-wrap"><img id="lb-img" alt=""></div>' +
    '<button class="lb-arrow" id="lb-prev" aria-label="Previous image">' + svgPrev + '</button>' +
    '<button class="lb-arrow" id="lb-next" aria-label="Next image">' + svgNext + '</button>' +
    '<button id="lb-close" aria-label="Close image viewer">' + svgClose + '</button>' +
    '<div id="lb-counter" aria-live="polite"></div>';
  document.body.appendChild(overlay);

  var lbImg     = document.getElementById('lb-img');
  var lbPrev    = document.getElementById('lb-prev');
  var lbNext    = document.getElementById('lb-next');
  var lbClose   = document.getElementById('lb-close');
  var lbCounter = document.getElementById('lb-counter');

  var currentSet = [];
  var currentIdx = 0;
  var isOpen     = false;

  // ── Core functions ──────────────────────────────────────────────────────────
  function openLb(images, startIdx) {
    currentSet = images;
    currentIdx = startIdx;
    isOpen     = true;
    document.body.style.overflow = 'hidden';
    overlay.classList.add('lb-open');
    updateArrows();
    loadImg(currentIdx, false);
  }

  function closeLb() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('lb-open');
    lbImg.classList.remove('lb-shown');
    document.body.style.overflow = '';
  }

  function loadImg(i, animate) {
    currentIdx = ((i % currentSet.length) + currentSet.length) % currentSet.length;
    updateCounter();
    updateArrows();

    if (animate) {
      lbImg.classList.remove('lb-shown');
      setTimeout(applyImgSrc, 180);
    } else {
      applyImgSrc();
    }
  }

  function applyImgSrc() {
    var entry = currentSet[currentIdx];
    lbImg.alt = entry.alt || '';
    lbImg.onload = function () { lbImg.classList.add('lb-shown'); };
    lbImg.onerror = function () { lbImg.classList.add('lb-shown'); }; // still fade in on broken img
    lbImg.src = entry.src;
    // If cached / same src, onload may not fire again
    if (lbImg.complete && lbImg.src === entry.src) {
      lbImg.classList.add('lb-shown');
    }
  }

  function updateCounter() {
    lbCounter.textContent = currentSet.length > 1
      ? (currentIdx + 1) + ' / ' + currentSet.length
      : '';
  }

  function updateArrows() {
    var single = currentSet.length <= 1;
    lbPrev.hidden = single;
    lbNext.hidden = single;
  }

  // ── Event listeners ─────────────────────────────────────────────────────────
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeLb();
  });

  lbClose.addEventListener('click', closeLb);

  lbPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    loadImg(currentIdx - 1, true);
  });

  lbNext.addEventListener('click', function (e) {
    e.stopPropagation();
    loadImg(currentIdx + 1, true);
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape')     closeLb();
    if (e.key === 'ArrowLeft')  loadImg(currentIdx - 1, true);
    if (e.key === 'ArrowRight') loadImg(currentIdx + 1, true);
  });

  // Swipe
  var touchStartX = 0;
  overlay.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  overlay.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) loadImg(dx < 0 ? currentIdx + 1 : currentIdx - 1, true);
  }, { passive: true });

  // ── Public API ──────────────────────────────────────────────────────────────
  // Add data-lightbox="group-name" to any element that should open the lightbox.
  // The element's <img> child (or data-lb-src attr) is used as the image source.
  // Call Lightbox.init() after DOM is ready.
  window.Lightbox = {
    init: function () {
      var all = document.querySelectorAll('[data-lightbox]');
      var groups = {};

      all.forEach(function (el) {
        var key = el.getAttribute('data-lightbox');
        if (!groups[key]) groups[key] = [];
        groups[key].push(el);
      });

      Object.keys(groups).forEach(function (key) {
        var items = groups[key];
        var images = items.map(function (el) {
          var imgEl = el.tagName === 'IMG' ? el : el.querySelector('img');
          return {
            src: el.getAttribute('data-lb-src') || (imgEl ? imgEl.src : ''),
            alt: el.getAttribute('data-lb-alt') || (imgEl ? imgEl.alt : '')
          };
        });

        items.forEach(function (el, i) {
          el.style.cursor = 'pointer';
          el.addEventListener('click', function (e) {
            e.preventDefault();
            openLb(images, i);
          });
        });
      });
    }
  };

})();
