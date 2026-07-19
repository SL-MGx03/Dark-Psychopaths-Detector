/* main.js — shared across all pages */

// Mobile nav toggle
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    if (expanded) {
      mobileNav.hidden = true;
    } else {
      mobileNav.hidden = false;
    }
  });
})();
