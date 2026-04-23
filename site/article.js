/* ============================================
   LOUPE — article.js
   Affiche un article à partir de son ID dans l'URL.
   ============================================ */

(async function() {

  // === Date et heure ===
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function updateClock() {
    const el = document.getElementById("current-time");
    if (!el) return;
    const d = new Date();
    el.textContent = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // === Récupérer l'ID de l'article dans l'URL ===
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const root = document.getElementById("article-root");

  if (!id) {
    root.innerHTML = `
      <div class="article-error">
        <h1>// article introuvable</h1>
        <p>pas d'identifiant dans l'url.</p>
        <a href="index.html" class="back-link">→ retour à l'accueil</a>
      </div>`;
    return;
  }

  // === Charger le feed et trouver l'article ===
  let feed;
  try {
    const r = await fetch("feed.json", { cache: "no-store" });
    if (!r.ok) throw new Error();
    feed = await r.json();
  } catch {
    root.innerHTML = `
      <div class="article-error">
        <h1>// erreur</h1>
        <p>impossible de charger le flux.</p>
        <a href="index.html" class="back-link">→ retour à l'accueil</a>
      </div>`;
    return;
  }

  const article = (feed.articles || []).find(a => a.id === id);

  if (!article) {
    root.innerHTML = `
      <div class="article-error">
        <h1>// article introuvable</h1>
        <p>cet article n'est plus disponible (il a pu être remplacé par une actualité plus récente).</p>
        <a href="index.html" class="back-link">→ retour à l'accueil</a>
      </div>`;
    return;
  }

  // === Titre de la page ===
  document.title = `${article.title} — loupe_`;

  // === Afficher l'article ===
  const date = new Date(article.published_at);
  const dateStr = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = date.toLocaleTime
