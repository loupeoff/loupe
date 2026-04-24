/* ============================================
   LOUPE — app.js
   Charge feed.json et affiche dans le nouveau layout magazine.
   ============================================ */

(function() {

  // ==========================================================
  // DATE et HORLOGE
  // ==========================================================
  function updateDateTime() {
    const d = new Date();
    const dateLong = d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const el = document.getElementById('date-long');
    if (el) el.textContent = dateLong.charAt(0).toUpperCase() + dateLong.slice(1);
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const c = document.getElementById('clock');
    if (c) c.textContent = hh + ':' + mi + ':' + ss;
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // ==========================================================
  // HELPERS
  // ==========================================================
  function esc(s) {
    if (s === undefined || s === null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function timeAgo(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return 'à l\'instant';
      if (diff < 3600) return 'il y a ' + Math.floor(diff / 60) + ' min';
      if (diff < 86400) return 'il y a ' + Math.floor(diff / 3600) + 'h';
      return 'il y a ' + Math.floor(diff / 86400) + 'j';
    } catch { return ''; }
  }

  function firstSentence(text, maxLen) {
    if (!text) return '';
    maxLen = maxLen || 180;
    // Coupe à la première phrase OU à la taille max
    const match = text.match(/^[^.!?]+[.!?]/);
    let out = match ? match[0] : text;
    if (out.length > maxLen) out = out.slice(0, maxLen).trim() + '...';
    return out.trim();
  }

  // ==========================================================
  // CHARGEMENT DU FEED
  // ==========================================================
  let FEED = null;
  let CURRENT_CAT = 'all';

  async function loadFeed() {
    try {
      const r = await fetch('feed.json', { cache: 'no-store' });
      if (!r.ok) throw new Error('fetch failed');
      FEED = await r.json();
      render();
    } catch (e) {
      const hero = document.getElementById('hero-article');
      const fil = document.getElementById('fil-list');
      if (hero) hero.innerHTML = '<div class="hero__loading">// erreur de chargement du flux</div>';
      if (fil) fil.innerHTML = '';
    }
  }

  // ==========================================================
  // RENDU
  // ==========================================================
  function matchesCat(article, cat) {
    if (cat === 'all') return true;
    const c = (article.category || '').toLowerCase();
    return c.indexOf(cat) !== -1;
  }

  function render() {
    if (!FEED || !FEED.articles) return;
    const all = FEED.articles.slice();
    const filtered = all.filter(a => matchesCat(a, CURRENT_CAT));

    // Hero : premier article
    const hero = document.getElementById('hero-article');
    const fil = document.getElementById('fil-list');
    const counter = document.getElementById('fil-counter');

    if (filtered.length === 0) {
      if (hero) hero.innerHTML = '<div class="hero__loading">// pas d\'article dans cette rubrique pour l\'instant</div>';
      if (fil) fil.innerHTML = '';
      if (counter) counter.textContent = '0 article';
      return;
    }

    const first = filtered[0];
    const rest = filtered.slice(1);

    // --- Hero ---
    const heroDate = first.published_at ? new Date(first.published_at) : null;
    const heroTime = heroDate ? heroDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

    let heroHtml = '';
    heroHtml += '<div class="hero__category">À la une · ' + esc(first.category || 'actu') + '</div>';
    heroHtml += '<h1 class="hero__title">' + esc(first.title) + '</h1>';
    if (first.image) {
      heroHtml += '<div class="hero__img-wrap"><img class="hero__img" src="' + esc(first.image) + '" alt=""/></div>';
    }
    heroHtml += '<p class="hero__chapo">' + esc(firstSentence(first.summary, 200)) + '</p>';
    heroHtml += '<div class="hero__meta">';
    heroHtml += '<span class="hero__source">' + esc(first.source || '') + '</span>';
    heroHtml += '<span class="hero__dot">·</span>';
    heroHtml += '<span>' + esc(timeAgo(first.published_at)) + '</span>';
    if (heroTime) {
      heroHtml += '<span class="hero__dot">·</span>';
      heroHtml += '<span>' + esc(heroTime) + '</span>';
    }
    heroHtml += '</div>';
    hero.innerHTML = heroHtml;
    hero.onclick = function() { window.location.href = 'article.html?id=' + encodeURIComponent(first.id); };

    // --- Fil ---
    let filHtml = '';
    for (let i = 0; i < rest.length; i++) {
      const a = rest[i];
      filHtml += '<article class="article" data-id="' + esc(a.id) + '">';
      filHtml += '<div class="article__body">';
      filHtml += '<div class="article__category">' + esc(a.category || 'actu') + '</div>';
      filHtml += '<h3 class="article__title">' + esc(a.title) + '</h3>';
      filHtml += '<p class="article__chapo">' + esc(firstSentence(a.summary, 140)) + '</p>';
      filHtml += '<div class="article__meta">';
      filHtml += '<span class="article__source">' + esc(a.source || '') + '</span>';
      filHtml += '<span>· ' + esc(timeAgo(a.published_at)) + '</span>';
      filHtml += '</div>';
      filHtml += '</div>';
      if (a.image) {
        filHtml += '<img class="article__img" src="' + esc(a.image) + '" alt=""/>';
      } else {
        filHtml += '<div class="article__img"></div>';
      }
      filHtml += '</article>';
    }
    fil.innerHTML = filHtml;

    // clicks sur les articles du fil
    const cards = fil.querySelectorAll('.article');
    cards.forEach(function(card) {
      card.onclick = function() {
        const id = card.getAttribute('data-id');
        window.location.href = 'article.html?id=' + encodeURIComponent(id);
      };
    });

    if (counter) counter.textContent = filtered.length + ' articles · mis à jour toutes les heures';
  }

  // ==========================================================
  // NAVIGATION RUBRIQUES
  // ==========================================================
  const navLinks = document.querySelectorAll('.nav__link[data-cat]');
  navLinks.forEach(function(link) {
    link.onclick = function(e) {
      e.preventDefault();
      navLinks.forEach(function(l) { l.classList.remove('active'); });
      link.classList.add('active');
      CURRENT_CAT = link.getAttribute('data-cat');
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });

  // ==========================================================
  // FORMULAIRE NEWSLETTER
  // ==========================================================
  const signupForm = document.getElementById('signup-form');
  const signupEmail = document.getElementById('signup-email');
  const signupBtn = document.getElementById('signup-btn');
  const signupStatus = document.getElementById('signup-status');

  if (signupForm && signupEmail && signupBtn && signupStatus) {
    signupBtn.onclick = async function() {
      const email = (signupEmail.value || '').trim();
      if (!email || email.indexOf('@') === -1) {
        signupStatus.textContent = 'Merci d\'entrer un email valide.';
        return;
      }
      if (!window.LOUPE_SIGNUP_ENDPOINT) {
        signupStatus.textContent = 'Inscription bientôt disponible — revenez lundi.';
        return;
      }
      signupBtn.disabled = true;
      signupBtn.textContent = 'En cours...';
      try {
        const r = await fetch(window.LOUPE_SIGNUP_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email })
        });
        if (r.ok) {
          signupStatus.textContent = 'Inscription confirmée ! À demain matin, 7h.';
          signupEmail.value = '';
        } else {
          signupStatus.textContent = 'Une erreur est survenue. Réessayez plus tard.';
        }
      } catch (e) {
        signupStatus.textContent = 'Erreur réseau. Réessayez plus tard.';
      }
      signupBtn.disabled = false;
      signupBtn.textContent = 'Je m\'inscris →';
    };
  }

  // ==========================================================
  // INIT
  // ==========================================================
  loadFeed();
  // Refresh discret toutes les 5 min
  setInterval(loadFeed, 5 * 60 * 1000);

})();
