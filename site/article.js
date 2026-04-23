(async function() {

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

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const root = document.getElementById("article-root");

  function esc(s) {
    if (s === undefined || s === null) return "";
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function formatBody(txt) {
    if (!txt) return "<p>resume non disponible.</p>";
    return txt.split(/\n\n+/).map(p => `<p>${esc(p.trim())}</p>`).join("");
  }

  if (!id) {
    root.innerHTML = '<div class="article-error"><h1>article introuvable</h1><p>pas d identifiant dans l url.</p><a href="index.html" class="back-link">retour</a></div>';
    return;
  }
let feed;
  try {
    const r = await fetch("feed.json", { cache: "no-store" });
    if (!r.ok) throw new Error();
    feed = await r.json();
  } catch {
    root.innerHTML = '<div class="article-error"><h1>erreur</h1><p>impossible de charger le flux.</p><a href="index.html" class="back-link">retour</a></div>';
    return;
  }

  const article = (feed.articles || []).find(a => a.id === id);
  if (!article) {
    root.innerHTML = '<div class="article-error"><h1>article introuvable</h1><p>cet article n est plus disponible.</p><a href="index.html" class="back-link">retour</a></div>';
    return;
  }

  document.title = article.title + " - loupe_";

  const date = new Date(article.published_at);
  const dateStr = date.toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
  const timeStr = date.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });

  root.innerHTML =
    '<article class="article">' +
    '<a href="index.html" class="back-link">retour</a>' +
    '<div class="article__cat">// ' + esc((article.category || "actu").toLowerCase()) + '</div>' +
    '<h1 class="article__title">' + esc(article.title) + '</h1>' +
    '<div class="article__meta"><span class="article__source">' + esc(article.source || "") + '</span><span class="article__sep">&middot;</span><span>' + esc(dateStr) + ' &middot; ' + esc(timeStr) + '</span></div>' +
    '<div class="article__img-wrap"><img class="article__img" src="' + esc(article.image) + '" alt=""/></div>' +
    '<div class="article__body">' + formatBody(article.summary) + '</div>' +
    '<div class="article__source-box">' +
    '<div class="article__source-label">// source originale</div>' +
    '<p>Ce resume est base sur un article publie par <strong>' + esc(article.source || "la source") + '</strong>.</p>' +
    '<a href="' + esc(article.url) + '" target="_blank" rel="noopener noreferrer" class="article__source-link">lire l article complet sur ' + esc(article.source || "le site d origine") + '</a>' +
    '</div>' +
    '<a href="index.html" class="back-link back-link--bottom">retour a l accueil</a>' +
    '</article>';

})();
