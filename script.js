// Utilities for DOM selection
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

// Navigation: active link highlighting and smooth scroll hooks
const initNavigation = () => {
  const navLinks = $$('.nav-link');
  const navPill = $('.nav-pill');
  const sections = navLinks
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  const movePillTo = (link) => {
    if (!navPill || !link || window.innerWidth <= 720) return;
    const rect = link.getBoundingClientRect();
    const parentRect = link.parentElement.getBoundingClientRect();
    navPill.style.width = `${rect.width}px`;
    navPill.style.transform = `translateX(${rect.left - parentRect.left}px)`;
  };

  const setActiveLink = (id) => {
    const target = navLinks.find((link) => link.dataset.target === id);
    if (!target) return;
    navLinks.forEach((link) => link.classList.remove('active'));
    target.classList.add('active');
    movePillTo(target);
  };

  window.addEventListener('resize', () => {
    const current = $('.nav-link.active');
    if (current) movePillTo(current);
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const id = href.slice(1);
        const section = document.getElementById(id);
        if (!section) return;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveLink(id);
      }
    });
  });

  const hero = $('#home');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((section) => section && observer.observe(section));

  if (hero) setActiveLink(hero.id);

  const navToggle = $('.nav-toggle');
  const navLinksContainer = $('.nav-links');
  if (navToggle && navLinksContainer) {
    navToggle.addEventListener('click', () => {
      navLinksContainer.classList.toggle('open');
    });
    navLinks.forEach((link) =>
      link.addEventListener('click', () => {
        navLinksContainer.classList.remove('open');
      })
    );
  }

  $$('[data-scroll]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-scroll');
      if (!target) return;
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};

// Results counters with IntersectionObserver
const initCounters = () => {
  const counterSection = document.querySelector('[data-counter-section]');
  if (!counterSection) return;
  const counters = $$('[data-counter]', counterSection);
  if (!counters.length) return;

  const animateCounters = () => {
    counters.forEach((el) => {
      const target = parseInt(el.dataset.target || '0', 10);
      const isCurrency = el.textContent.trim().startsWith('$');
      const hasPercent = el.textContent.trim().endsWith('%');
      const hasPlus = el.textContent.trim().includes('+');

      let start = 0;
      const duration = 1400;
      const startTime = performance.now();

      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.floor(start + (target - start) * progress);
        let prefix = '';
        let suffix = '';

        if (isCurrency) prefix = '$';
        if (hasPercent) suffix = '%';
        if (hasPlus && !hasPercent && !isCurrency) suffix = '+';

        if (hasPlus && isCurrency) suffix = 'K+';

        el.textContent = `${prefix}${value}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    });
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounters();
          obs.disconnect();
        }
      });
    },
    { threshold: 0.4 }
  );

  observer.observe(counterSection);
};

// Emotion analysis demo
const initEmotionDemo = () => {
  const textarea = $('#emotion-input');
  const btn = $('#analyze-btn');
  const label = $('#emotion-label');
  const fill = $('#confidence-fill');
  const value = $('#confidence-value');

  if (!textarea || !btn || !label || !fill || !value) return;

  const computeEmotion = (text) => {
    const tokens = text.toLowerCase();
    const scores = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
    };

    const addScore = (keywords, bucket, weight = 1) => {
      keywords.forEach((word) => {
        if (tokens.includes(word)) scores[bucket] += weight;
      });
    };

    addScore(['happy', 'excited', 'joy', 'great', 'amazing', 'thrilled'], 'happy', 1.2);
    addScore(['sad', 'upset', 'down', 'unhappy', 'depressed'], 'sad', 1.1);
    addScore(['angry', 'mad', 'furious', 'frustrated'], 'angry', 1.1);
    addScore(['worried', 'anxious', 'nervous', 'scared', 'stress', 'stressed'], 'anxious', 1.2);

    const entries = Object.entries(scores);
    entries.sort((a, b) => b[1] - a[1]);
    const [topEmotion, topScore] = entries[0];
    const total = entries.reduce((sum, [, s]) => sum + s, 0);

    if (!total || !topScore) {
      return { label: 'Neutral', confidence: 0.18 };
    }
    const confidence = Math.max(0.3, Math.min(0.95, topScore / total + 0.2));
    const pretty = {
      happy: 'Happy / Positive',
      sad: 'Sad / Low energy',
      angry: 'Angry / Frustrated',
      anxious: 'Anxious / Worried',
    }[topEmotion];

    return { label: pretty, confidence };
  };

  btn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text) {
      label.textContent = 'Type a sentence to analyze the emotion.';
      fill.style.width = '0%';
      value.textContent = '0%';
      return;
    }
    const result = computeEmotion(text);
    const pct = Math.round(result.confidence * 100);
    label.textContent = result.label;
    fill.style.width = `${pct}%`;
    value.textContent = `${pct}%`;
  });
};

// Research fade-in on scroll
const initResearchReveal = () => {
  const cards = $$('.research-card');
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  cards.forEach((card) => observer.observe(card));
};

// localStorage helpers
const STORAGE_KEYS = {
  leads: 'portfolio_leads',
  inquiries: 'portfolio_inquiries',
  chatDismissed: 'chatDismissed',
};

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

// Lead magnet
const initLeadMagnet = () => {
  const form = $('#lead-form');
  const emailInput = $('#lead-email');
  const message = $('#lead-message');
  const downloadAgainBtn = $('#lead-download-again');

  if (!form || !emailInput || !message || !downloadAgainBtn) return;

  const createChecklistText = () =>
    [
      'AI Integration Checklist',
      '------------------------',
      '',
      '1. Define one clear business KPI to move (revenue, cost, retention).',
      '2. Map your existing data sources and ownership.',
      '3. Identify low-risk, high-ROI workflows that can be automated.',
      '4. Decide where AI lives: backend service, internal tool, or UI surface.',
      '5. Choose a model strategy: API, hosted open-source, or custom training.',
      '6. Design feedback loops and human-in-the-loop review.',
      '7. Plan observability: logging, monitoring, and experiment tracking.',
      '8. Handle privacy, compliance, and access control early.',
      '9. Start with a small pilot, then scale what works.',
      '10. Communicate the impact with clear before/after metrics.',
      '',
      'Built with Md. Zunaed Islam • AI Engineer.',
    ].join('\n');

  const triggerDownload = () => {
    const blob = new Blob([createChecklistText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AI-Integration-Checklist.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const updateLeadUIFromStorage = () => {
    const leads = readJSON(STORAGE_KEYS.leads, []);
    if (leads.length > 0) {
      downloadAgainBtn.style.display = 'inline-flex';
    } else {
      downloadAgainBtn.style.display = 'none';
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) return;
    const leads = readJSON(STORAGE_KEYS.leads, []);
    if (!leads.includes(email)) leads.push(email);
    writeJSON(STORAGE_KEYS.leads, leads);
    triggerDownload();
    message.textContent = 'Checklist sent. You can also download it again anytime.';
    message.classList.remove('error');
    updateLeadUIFromStorage();
    updateCounts();
    emailInput.value = '';
  });

  downloadAgainBtn.addEventListener('click', () => {
    triggerDownload();
  });

  updateLeadUIFromStorage();
};

// Contact form and inquiries
const createInquiry = ({ name, email, message, source }) => {
  const inquiries = readJSON(STORAGE_KEYS.inquiries, []);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const record = {
    id,
    name,
    email,
    message,
    source,
    createdAt: new Date().toISOString(),
    status: 'new',
    reply: '',
  };
  inquiries.push(record);
  writeJSON(STORAGE_KEYS.inquiries, inquiries);
  updateCounts();
  return record;
};

const updateInquiry = (id, updates) => {
  const inquiries = readJSON(STORAGE_KEYS.inquiries, []);
  const idx = inquiries.findIndex((q) => q.id === id);
  if (idx === -1) return null;
  inquiries[idx] = { ...inquiries[idx], ...updates };
  writeJSON(STORAGE_KEYS.inquiries, inquiries);
  updateCounts();
  return inquiries[idx];
};

const updateCounts = () => {
  const inquiries = readJSON(STORAGE_KEYS.inquiries, []);
  const leads = readJSON(STORAGE_KEYS.leads, []);
  const totalInquiries = inquiries.length;
  const totalLeads = leads.length;

  const totalInquiryEls = ['#total-inquiries'];
  const totalLeadEls = ['#total-leads'];

  totalInquiryEls.forEach((selector) => {
    const el = $(selector);
    if (el) el.textContent = String(totalInquiries);
  });

  totalLeadEls.forEach((selector) => {
    const el = $(selector);
    if (el) el.textContent = String(totalLeads);
  });
};

const initContactForm = () => {
  const form = $('#contact-form');
  const nameInput = $('#contact-name');
  const emailInput = $('#contact-email');
  const messageInput = $('#contact-message');
  const status = $('#contact-message-status');

  if (!form || !nameInput || !emailInput || !messageInput || !status) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const msg = messageInput.value.trim();
    if (!name || !email || !msg) return;

    const to = 'zunaed.islam.r@gmail.com';
    const subject = `Website inquiry from ${name}`;
    const body = [`Name: ${name}`, `Email: ${email}`, '', msg].join('\n');
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;

    status.textContent = 'Opening your email app…';
    status.classList.remove('error');
    form.reset();
  });
};

// Chat widget
const initChatWidget = () => {
  const toggle = $('#chat-toggle');
  const panel = $('#chat-panel');
  const closeBtn = $('#chat-close');
  const form = $('#chat-form');
  const emailInput = $('#chat-email');
  const msgInput = $('#chat-message');
  const status = $('#chat-status');

  if (!toggle || !panel || !closeBtn || !form || !emailInput || !msgInput || !status) return;

  const openPanel = () => {
    panel.classList.add('open');
  };

  const closePanel = () => {
    panel.classList.remove('open');
    localStorage.setItem(STORAGE_KEYS.chatDismissed, '1');
  };

  toggle.addEventListener('click', () => {
    if (panel.classList.contains('open')) {
      closePanel();
    } else {
      openPanel();
    }
  });

  closeBtn.addEventListener('click', () => {
    closePanel();
  });

  if (localStorage.getItem(STORAGE_KEYS.chatDismissed) !== '1') {
    setTimeout(() => {
      openPanel();
    }, 9000);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const message = msgInput.value.trim();
    if (!email || !message) return;
    createInquiry({
      name: 'Website Chat',
      email,
      message,
      source: 'Website Chat',
    });
    status.textContent = 'Thanks — saved. I’ll reply soon.';
    status.classList.remove('error');
    form.reset();
  });
};

// Footer
const initFooterYear = () => {
  const yearEl = $('#footer-year');
  if (!yearEl) return;
  yearEl.textContent = String(new Date().getFullYear());
};

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCounters();
  initEmotionDemo();
  initResearchReveal();
  initLeadMagnet();
  initContactForm();
  initChatWidget();
  initFooterYear();
  updateCounts();
});
