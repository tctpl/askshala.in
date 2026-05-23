(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var navToggle = document.getElementById('nav-toggle');
  var navMenu = document.getElementById('nav-menu');
  var navLinks = document.querySelectorAll('.nav__link[data-section]');
  var contactForm = document.getElementById('contact-form');
  var formSuccess = document.getElementById('form-success');
  var fadeSections = document.querySelectorAll('.fade-in');

  var sectionIds = ['how-it-works', 'for-schools', 'pricing', 'faq', 'about', 'contact'];

  /* --- 1. Sticky nav: transparent to dark navy on scroll --- */
  function updateHeader() {
    if (window.scrollY > 60) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  /* --- 2. Smooth scroll for anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileMenu();
    });
  });

  /* --- 3. Active nav link highlight on scroll --- */
  function setActiveNav() {
    var scrollPos = window.scrollY + 120;
    var current = '';

    sectionIds.forEach(function (id) {
      var section = document.getElementById(id);
      if (section && section.offsetTop <= scrollPos) {
        current = id;
      }
    });

    navLinks.forEach(function (link) {
      var section = link.getAttribute('data-section');
      if (section === current) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  }

  window.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();

  /* --- 4. Section fade-in on scroll --- */
  if ('IntersectionObserver' in window) {
    var fadeObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            fadeObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    fadeSections.forEach(function (section) {
      fadeObserver.observe(section);
    });
  } else {
    fadeSections.forEach(function (section) {
      section.classList.add('is-visible');
    });
  }

  /* --- 5. Hamburger menu for mobile --- */
  function closeMobileMenu() {
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
  }

  navToggle.addEventListener('click', function () {
    var isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  /* --- 6. Pricing card hover handled in CSS --- */

  /* --- 7 & 8. Contact form validation and success state --- */
  var validators = {
    name: function (value) {
      if (!value.trim()) return 'Please enter your name.';
      return '';
    },
    school: function (value) {
      if (!value.trim()) return 'Please enter your school name.';
      return '';
    },
    phone: function (value) {
      if (!value.trim()) return 'Please enter your phone number.';
      var digits = value.replace(/\D/g, '');
      if (digits.length < 10) return 'Please enter a valid phone number.';
      return '';
    },
    email: function (value) {
      if (!value.trim()) return 'Please enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        return 'Please enter a valid email address.';
      }
      return '';
    },
    students: function (value) {
      if (!value) return 'Please select the number of students.';
      return '';
    }
  };

  function showFieldError(fieldId, message) {
    var input = document.getElementById(fieldId);
    var errorEl = document.getElementById('error-' + fieldId);
    if (message) {
      input.classList.add('is-invalid');
      errorEl.textContent = message;
    } else {
      input.classList.remove('is-invalid');
      errorEl.textContent = '';
    }
  }

  function validateForm() {
    var valid = true;
    Object.keys(validators).forEach(function (fieldId) {
      var input = document.getElementById(fieldId);
      var error = validators[fieldId](input.value);
      showFieldError(fieldId, error);
      if (error) valid = false;
    });
    return valid;
  }

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateForm()) return;

      contactForm.hidden = true;
      formSuccess.hidden = false;
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    Object.keys(validators).forEach(function (fieldId) {
      var input = document.getElementById(fieldId);
      input.addEventListener('blur', function () {
        showFieldError(fieldId, validators[fieldId](input.value));
      });
      input.addEventListener('input', function () {
        if (input.classList.contains('is-invalid')) {
          showFieldError(fieldId, validators[fieldId](input.value));
        }
      });
    });
  }

  /* --- 9. Hero stat chips staggered fade-in handled in CSS --- */

  /* --- 10. FAQ accordion --- */
  var faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    var button = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    var indicator = item.querySelector('.faq-indicator');

    button.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');

      faqItems.forEach(function (other) {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          other.querySelector('.faq-indicator').textContent = '+';
          other.querySelector('.faq-answer').style.maxHeight = '0';
        }
      });

      if (isOpen) {
        item.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
        indicator.textContent = '+';
        answer.style.maxHeight = '0';
      } else {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        indicator.textContent = '\u2212';
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
})();
