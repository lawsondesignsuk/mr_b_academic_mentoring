/* ===============================================================
   Mr B Academic Mentoring
   =============================================================== */
document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------------------------
     Header state once the hero has scrolled past
  ------------------------------------------------------------- */
  const header = document.querySelector('[data-header]');
  const hero = document.getElementById('hero');

  if (header && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting),
      { rootMargin: '-1px 0px 0px 0px', threshold: 0 }
    ).observe(hero);
  }

  /* -------------------------------------------------------------
     Mobile navigation
  ------------------------------------------------------------- */
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');

  if (navToggle && nav) {
    const closeMenu = () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
      nav.classList.remove('is-open');
      document.body.classList.remove('nav-open');
    };

    const openMenu = () => {
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Close menu');
      nav.classList.add('is-open');
      document.body.classList.add('nav-open');
    };

    navToggle.addEventListener('click', () => {
      navToggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
    });

    nav.querySelectorAll('a, button').forEach((el) => el.addEventListener('click', closeMenu));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  /* -------------------------------------------------------------
     Scroll reveal — one quiet rise per element
  ------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (revealEls.length && 'IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* -------------------------------------------------------------
     FAQ accordion
  ------------------------------------------------------------- */
  const faqQuestions = document.querySelectorAll('.faq-question');

  if (faqQuestions.length) {
    const answerFor = (question) => document.getElementById(question.getAttribute('aria-controls'));

    const closeFaq = (question) => {
      const answer = answerFor(question);
      question.setAttribute('aria-expanded', 'false');
      answer.style.maxHeight = '0px';
      answer.addEventListener('transitionend', function done() {
        if (question.getAttribute('aria-expanded') === 'false') answer.hidden = true;
        answer.removeEventListener('transitionend', done);
      });
    };

    const openFaq = (question) => {
      const answer = answerFor(question);
      answer.hidden = false;
      question.setAttribute('aria-expanded', 'true');
      // Read the height after the element is displayed again
      requestAnimationFrame(() => {
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      });
    };

    faqQuestions.forEach((question) => {
      question.addEventListener('click', () => {
        const isOpen = question.getAttribute('aria-expanded') === 'true';

        faqQuestions.forEach((other) => {
          if (other !== question && other.getAttribute('aria-expanded') === 'true') closeFaq(other);
        });

        isOpen ? closeFaq(question) : openFaq(question);
      });
    });

    // Keep an open answer the right height if the text reflows
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        faqQuestions.forEach((question) => {
          if (question.getAttribute('aria-expanded') === 'true') {
            const answer = answerFor(question);
            answer.style.maxHeight = `${answer.scrollHeight}px`;
          }
        });
      }, 150);
    });
  }

  /* -------------------------------------------------------------
     Enquiry form (contact page)

     Point FORM_ENDPOINT at a form backend (Formspree, Getform,
     Netlify Forms, etc.) to start receiving enquiries by email.
     Until then the form tells the visitor to email Matt instead,
     rather than silently doing nothing.
  ------------------------------------------------------------- */
  const FORM_ENDPOINT = ''; // e.g. 'https://formspree.io/f/yourFormId'
  const EMAIL = 'matthewboulton06@hotmail.com';

  const postForm = async (form) => {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Request failed');
  };

  const contactForm = document.getElementById('contact-form');
  const contactStatus = document.getElementById('contact-form-status');

  if (contactForm && contactStatus) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const button = contactForm.querySelector('button[type="submit"]');
      const show = (html) => { contactStatus.innerHTML = html; contactStatus.hidden = false; };

      if (!FORM_ENDPOINT) {
        show(`Thanks &mdash; the online form isn&rsquo;t connected yet. Please send this to <a href="mailto:${EMAIL}">${EMAIL}</a> and Matt will reply within 24 hours.`);
        return;
      }

      if (button) { button.disabled = true; button.textContent = 'Sending…'; }

      try {
        await postForm(contactForm);
        contactForm.reset();
        show('Thanks &mdash; your enquiry is on its way. Matt will reply within 24 hours.');
      } catch (err) {
        show(`That didn&rsquo;t send. Please try again, or email <a href="mailto:${EMAIL}">${EMAIL}</a>.`);
      } finally {
        if (button) { button.disabled = false; button.innerHTML = 'Send enquiry <span class="btn-arrow" aria-hidden="true">&rarr;</span>'; }
      }
    });
  }

  /* -------------------------------------------------------------
     Lead-capture popup

     Sized by CSS to always fit the viewport, so nothing inside it
     ever needs scrolling. This script only handles when it shows,
     keyboard focus, and submission.
  ------------------------------------------------------------- */
  const overlay = document.getElementById('lead-overlay');
  if (!overlay) return;

  const modal = overlay.querySelector('.lead-modal');
  const closeBtn = document.getElementById('lead-close');
  const reopenTab = document.getElementById('lead-tab');
  const leadForm = document.getElementById('lead-form');
  const leadPanel = document.getElementById('lead-panel');
  const leadSuccess = document.getElementById('lead-success');
  const openTriggers = document.querySelectorAll('[data-lead-open]');

  const SEEN_KEY = 'mrb_lead_last_seen';
  const DONE_KEY = 'mrb_lead_submitted';
  const QUIET_FOR = 1000 * 60 * 60 * 24 * 7; // don't prompt again for a week

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } },
  };

  const alreadySubmitted = () => store.get(DONE_KEY) === '1';
  const recentlyPrompted = () => Date.now() - Number(store.get(SEEN_KEY) || 0) < QUIET_FOR;

  let lastFocused = null;
  let promptFired = false;

  const focusable = () =>
    modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

  const openLead = () => {
    if (overlay.classList.contains('is-open')) return;
    lastFocused = document.activeElement;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (reopenTab) reopenTab.classList.remove('is-visible');
    store.set(SEEN_KEY, String(Date.now()));
    promptFired = true;

    // Focus the first field rather than the close button, so keyboard
    // and screen-reader users land where the action is.
    const firstField = modal.querySelector('input, select');
    (firstField || closeBtn)?.focus({ preventScroll: true });
  };

  const closeLead = () => {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (reopenTab && !alreadySubmitted()) reopenTab.classList.add('is-visible');
    lastFocused?.focus({ preventScroll: true });
  };

  openTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openLead();
    });
  });

  closeBtn?.addEventListener('click', closeLead);
  reopenTab?.addEventListener('click', openLead);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeLead();
  });

  document.addEventListener('keydown', (event) => {
    if (!overlay.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      closeLead();
      return;
    }

    // Keep focus inside the dialog while it is open
    if (event.key === 'Tab') {
      const items = Array.from(focusable()).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* --- When to prompt -----------------------------------------
     Quieter than an instant interruption: it waits for either a
     real sign of interest (scrolling most of the way down, or the
     pointer leaving toward the tab bar) or a generous delay.
  ------------------------------------------------------------- */
  const isHomePage = /(?:^|[\\/])index\.html$/.test(window.location.pathname) || window.location.pathname.endsWith('/');

  if ((!recentlyPrompted() || isHomePage) && !alreadySubmitted()) {
    const maybeOpen = () => { if (!promptFired) openLead(); };
    const timer = setTimeout(maybeOpen, isHomePage ? 6000 : 25000);

    const stopWatching = () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onExit);
    };

    const onScroll = () => {
      if (promptFired) return stopWatching();
      const progress = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      if (progress > 0.6) { stopWatching(); openLead(); }
    };

    const onExit = (event) => {
      if (promptFired) return stopWatching();
      if (event.clientY <= 0 && !event.relatedTarget) { stopWatching(); openLead(); }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseout', onExit);
  }

  /* --- Submission --------------------------------------------- */
  leadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!leadForm.checkValidity()) {
      leadForm.reportValidity();
      return;
    }

    const button = leadForm.querySelector('.lead-submit');

    const showSuccess = () => {
      store.set(DONE_KEY, '1');
      leadForm.classList.add('is-hidden');
      leadPanel?.classList.add('is-complete');
      leadSuccess?.classList.add('is-visible');
      if (reopenTab) reopenTab.classList.remove('is-visible');
      closeBtn?.focus({ preventScroll: true });
    };

    if (!FORM_ENDPOINT) {
      showSuccess();
      return;
    }

    if (button) { button.disabled = true; button.textContent = 'Sending…'; }

    try {
      await postForm(leadForm);
      showSuccess();
    } catch (err) {
      if (button) { button.disabled = false; button.textContent = 'Claim my free session'; }
      const note = leadForm.querySelector('.lead-microcopy');
      if (note) note.innerHTML = `That didn&rsquo;t send. Please email <a href="mailto:${EMAIL}">${EMAIL}</a>.`;
    }
  });
});