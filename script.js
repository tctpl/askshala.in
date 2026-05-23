(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var navToggle = document.getElementById('nav-toggle');
  var navMenu = document.getElementById('nav-menu');
  var navLinks = document.querySelectorAll('.nav__link[data-section]');
  var contactForm = document.getElementById('contact-form');
  var formSuccess = document.getElementById('form-success');
  var formSubmitBtn = document.getElementById('form-submit-btn');
  var formSubmitError = document.getElementById('form-submit-error');
  var formLoadedAt = Date.now();
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

  function getFormPayload() {
    return {
      token: (window.ASKSHALA_CONFIG && window.ASKSHALA_CONFIG.FORM_SECRET) || '',
      form_loaded_at: formLoadedAt,
      company_website: document.getElementById('company_website').value.trim(),
      name: document.getElementById('name').value.trim(),
      school: document.getElementById('school').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      students: document.getElementById('students').value,
      referral_source: document.getElementById('referral_source').value,
      message: document.getElementById('message').value.trim()
    };
  }

  function isHoneypotFilled() {
    var honeypot = document.getElementById('company_website');
    return honeypot && honeypot.value.trim().length > 0;
  }

  function showSubmitError(message) {
    if (!formSubmitError) return;
    if (message) {
      formSubmitError.hidden = false;
      formSubmitError.textContent = message;
    } else {
      formSubmitError.hidden = true;
      formSubmitError.textContent = '';
    }
  }

  function setFormSubmitting(isSubmitting) {
    if (!formSubmitBtn) return;
    formSubmitBtn.disabled = isSubmitting;
    formSubmitBtn.textContent = isSubmitting ? 'Sending...' : 'Request a Demo';
  }

  function showFormSuccess() {
    contactForm.hidden = true;
    formSuccess.hidden = false;
    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function submitToGoogleSheet(payload) {
    var config = window.ASKSHALA_CONFIG || {};
    var endpoint = config.GOOGLE_SHEET_URL;

    if (!endpoint || !config.FORM_SECRET) {
      return Promise.resolve({ skipped: true });
    }

    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Unable to submit your request right now.');
        }
        return data;
      });
    });
  }

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      showSubmitError('');

      if (!validateForm()) return;

      if (isHoneypotFilled()) {
        showFormSuccess();
        return;
      }

      var config = window.ASKSHALA_CONFIG || {};
      var googleConfigured = Boolean(config.GOOGLE_SHEET_URL && config.FORM_SECRET);

      if (googleConfigured && Date.now() - formLoadedAt < 3000) {
        showSubmitError('Please take a moment to review the form, then try again.');
        return;
      }

      if (!googleConfigured) {
        showFormSuccess();
        return;
      }

      setFormSubmitting(true);

      submitToGoogleSheet(getFormPayload())
        .then(function () {
          showFormSuccess();
        })
        .catch(function (error) {
          showSubmitError(
            error.message ||
              'Something went wrong. Please email us at askshala@trilokcloud.in or WhatsApp us instead.'
          );
        })
        .finally(function () {
          setFormSubmitting(false);
        });
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
