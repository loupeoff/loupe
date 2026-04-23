/* ===================================================================
   LOUPE — app.js
   =================================================================== */

(async function() {

  // === Date format ISO ===
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dateEl.textContent = `${y}-${m}-${day}`;
  }

  // Numéro d'édition = jour de l'année
  const issueEl = document.getElementById("issue-num");
  if (issueEl) {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = (new Date() - start) / (1000 * 60 * 60 * 24);
    issueEl.textContent = String(Math.floor(diff)).padStart(3, "0");
  }

  // === Chargement du feed ===
  let feed;
  try {
    const r = await fetch("feed.json", { cache: "no-store" });
    if (!r.ok) throw new Error();
    feed = await r.json();
  } catch {
    feed = demoFeed();
  }

  // === Horodatage ===
  const upd = document.getElementById("last-update");
  upd.textContent = feed.generated_at
    ? new Date(feed.generated_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "demo";

  const articles = feed.articles || [];
  const countEl = document.getElementById("article-count");
  if (countEl) countEl.textContent = articles.length;

  // === TICKER ===
  const track = document.getElementById("ticker-track");
  const tickerItems = articles.slice(0, 10).map(a => `<span>${esc(a.title)}</span>`).join("");
  track.innerHTML = tickerItems + tickerItems;

  // === HERO ===
  const hero = document.getElementById("hero");
  const [h1, h2, h3] = articles;
  if (h1) {
    hero.innerHTML = `
      <article class="hero__main" onclick="window.open('${esc(h1.url)}','_blank')">
        <span class="hero__main-cat">${esc((h1.category || "actu").toLowerCase())}</span>
        <div class="hero__main-img-wrap">
          <img class="hero__main-img" src="${esc(h1.image)}" alt="" loading="eager"/>
        </div>
        <h1 class="hero__main-title">${esc(h1.title)}</h1>
        <p class="hero__main-sum">${esc(h1.summary || "")}</p>
        <div class="hero__main-meta">
          <span class="src">${esc(h1.source || "")}</span><span class="sep">·</span>${timeAgo(h1.published_at)}
        </div>
      </article>
      <aside class="hero__side">
        ${sideItem(h2)}
        ${sideItem(h3)}
      </aside>
    `;
  }

  function sideItem(a) {
    if (!a) return "";
    return `
      <article class="hero__side-item" onclick="window.open('${esc(a.url)}','_blank')">
        <div class="hero__side-cat">${esc((a.category || "actu").toLowerCase())}</div>
        <h2 class="hero__side-title">${esc(a.title)}</h2>
        <p class="hero__side-sum">${esc(trunc(a.summary, 120))}</p>
        <div class="hero__side-meta"><span class="src">${esc(a.source || "")}</span> · ${timeAgo(a.published_at)}</div>
      </article>
    `;
  }

  // === MAIN FEED ===
  const sizes = ["l","l", "m","m","m", "s","s","s","s", "l","l", "m","m","m", "s","s","s","s"];
  const main = document.getElementById("main-feed");
  main.innerHTML = articles.slice(3, 3 + sizes.length).map((a, i) => {
    const size = sizes[i] || "m";
    return `
      <article class="card card--${size}" onclick="window.open('${esc(a.url)}','_blank')">
        <div class="card__img-wrap">
          <img class="card__img" src="${esc(a.image)}" alt="" loading="lazy"/>
        </div>
        <span class="card__cat">${esc((a.category || "actu").toLowerCase())}</span>
        <h3 class="card__title">${esc(a.title)}</h3>
        <p class="card__sum">${esc(trunc(a.summary, size === "l" ? 180 : size === "s" ? 70 : 130))}</p>
        <div class="card__meta">
          <span class="src">${esc(a.source || "")}</span>
          <span>${timeAgo(a.published_at)}</span>
        </div>
      </article>
    `;
  }).join("");

  // === NEWSLETTER FORM ===
  const form = document.getElementById("signup-form");
  const feedback = document.getElementById("form-feedback");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    feedback.className = "form-feedback";
    feedback.textContent = "";

    const fd = new FormData(form);
    const interests = fd.getAll("interests");
    if (interests.length === 0) {
      feedback.className = "form-feedback error";
      feedback.textContent = "cochez au moins un centre d'intérêt";
      return;
    }

    const payload = {
      firstname: (fd.get("firstname") || "").toString().trim(),
      email:     (fd.get("email") || "").toString().trim().toLowerCase(),
      interests,
      submitted_at: new Date().toISOString(),
      ua: navigator.userAgent.slice(0, 200),
    };

    const btn = form.querySelector("button");
    btn.disabled = true;
    const origBtn = btn.textContent;
    btn.textContent = "running...";

    try {
      const endpoint = window.LOUPE_SIGNUP_ENDPOINT || "/api/subscribe";
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("api fail");

      feedback.className = "form-feedback success";
      feedback.textContent = `bienvenue ${payload.firstname}. premier email demain à 7h.`;
      form.reset();
    } catch {
      try {
        const key = "loupe_signups";
        const list = JSON.parse(localStorage.getItem(key) || "[]");
        list.push(payload);
        localStorage.setItem(key, JSON.stringify(list));
        feedback.className = "form-feedback success";
        feedback.textContent = `bienvenue ${payload.firstname}. (mode démo — email stocké localement)`;
        form.reset();
      } catch {
        feedback.className = "form-feedback error";
        feedback.textContent = "une erreur est survenue, réessayez";
      }
    } finally {
      btn.disabled = false;
      btn.textContent = origBtn;
    }
  });

  // === HELPERS ===
  function esc(s) {
    if (s === undefined || s === null) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function trunc(s, n) {
    if (!s) return "";
    return s.length > n ? s.slice(0, n).trim() + "…" : s;
  }
  function timeAgo(iso) {
    if (!iso) return "";
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return "à l'instant";
    if (diff < 3600)  return `il y a ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  // === DEMO DATA ===
  function demoFeed() {
    const base = "https://images.unsplash.com/";
    const pics = [
      base + "photo-1529107386315-e1a2ed48a620?w=1600",
      base + "photo-1495020689067-958852a7765e?w=1200",
      base + "photo-1587614382346-4ec70e388b28?w=1200",
      base + "photo-1518709268805-4e9042af2176?w=1200",
      base + "photo-1508921912186-1d1a45ebb3c1?w=1200",
      base + "photo-1507003211169-0a1dd7228f2d?w=1200",
      base + "photo-1516321318423-f06f85e504b3?w=1200",
      base + "photo-1485827404703-89b55fcc595e?w=1200",
      base + "photo-1504805572947-34fad45aed93?w=1200",
      base + "photo-1504711434969-e33886168f5c?w=1200",
      base + "photo-1483653364400-eedcfb9f1f88?w=1200",
      base + "photo-1486406146926-c627a92ad1ab?w=1200",
      base + "photo-1473177104440-ffee2f376098?w=1200",
      base + "photo-1526304640581-d334cdbbf45e?w=1200",
      base + "photo-1461896836934-ffe607ba8211?w=1200",
      base + "photo-1451187580459-43490279c0fa?w=1200",
      base + "photo-1567427017947-545c5f8d16ad?w=1200",
      base + "photo-1528747045269-390fe33c19f2?w=1200",
      base + "photo-1551836022-deb4988cc6c0?w=1200",
      base + "photo-1574169208507-84376144848b?w=1200",
    ];
    const stub = (i, cat, title, summary) => ({
      title, summary, category: cat, url: "#",
      image: pics[i % pics.length],
      source: ["Le Monde","France Info","AFP","Libération","Reuters","Mediapart"][i % 6],
      published_at: new Date(Date.now() - i * 23 * 60 * 1000).toISOString(),
    });

    return {
      generated_at: new Date().toISOString(),
      articles: [
        stub(0, "Politique",     "Retraites : l'exécutif rouvre le dossier malgré les tensions au Parlement", "Après plusieurs semaines de concertation à huis clos, le gouvernement envisage une nouvelle séquence législative qui divise déjà la majorité et les syndicats."),
        stub(1, "International", "Climat : accord surprise au sommet européen", "Les Vingt-Sept trouvent un compromis inattendu après une nuit de négociations tendues à Bruxelles."),
        stub(2, "Économie",      "Inflation : recul inattendu au mois d'avril", "Les chiffres publiés par l'Insee surprennent les économistes qui tablaient sur une stagnation."),
        stub(3, "Tech",          "Intelligence artificielle : Bruxelles durcit les règles", "Une nouvelle mouture du règlement pour encadrer les modèles génératifs les plus puissants."),
        stub(4, "Société",       "Logement étudiant : les loyers bondissent de 12 %", "Une enquête exclusive révèle l'aggravation de la crise dans les grandes métropoles."),
        stub(5, "Culture",       "Cannes : la sélection officielle dévoilée", "Une année très française avec sept réalisateurs hexagonaux en compétition pour la Palme d'or."),
        stub(6, "Sport",         "Ligue 1 : la course au titre plus ouverte que jamais", "À trois journées de la fin, rien n'est joué en haut du classement."),
        stub(7, "International", "Mer de Chine : Washington renforce son dispositif naval", "Les États-Unis répondent aux manœuvres militaires chinoises."),
        stub(8, "Politique",     "Municipales 2026 : les partis dévoilent leurs têtes de liste", "Recomposition politique inédite dans les plus grandes villes."),
        stub(9, "Tech",          "Cybersécurité : les hôpitaux européens sous attaque", "Plusieurs établissements ont dû revenir au papier."),
        stub(10, "Économie",     "Automobile : la production européenne recule", "Les constructeurs pointent la concurrence chinoise."),
        stub(11, "Société",      "Canicule précoce : 23 départements en vigilance orange", "Météo-France prévoit des pointes à 36°C dès ce week-end."),
        stub(12, "Culture",      "Musées : fréquentation record au printemps", "Les expositions phares battent les chiffres d'avant pandémie."),
        stub(13, "Sport",        "Roland-Garros : le tirage au sort dévoilé", "Tableau corsé pour les Français côté hommes et femmes."),
        stub(14, "Politique",    "Assemblée : le texte adopté en première lecture", "La proposition de loi divise la majorité présidentielle."),
        stub(15, "International","Tensions au Sahel : nouvelle attaque au nord du Mali", "Le gouvernement de transition réagit."),
        stub(16, "Tech",         "Puces : l'Europe mise sur la souveraineté industrielle", "Plan d'investissement de 15 milliards sur cinq ans."),
        stub(17, "Économie",     "Énergie : le prix du gaz reflue sur les marchés", "Soulagement attendu pour les ménages et l'industrie."),
        stub(18, "Culture",      "Littérature : le Goncourt annonce sa rentrée", "Sélection qui promet des débats cet automne."),
        stub(19, "Société",      "Éducation : les annonces de la rentrée se précisent", "Réorganisation du collège, revalorisation des enseignants."),
      ]
    };
  }
})();
