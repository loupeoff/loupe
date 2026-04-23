(async function() {

  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  }

  function updateClock() {
    const el = document.getElementById("current-time");
    if (!el) return;
    const d = new Date();
    el.textContent = String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0") + ":" + String(d.getSeconds()).padStart(2,"0");
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
    const parts = txt.split(/\n\n+/);
    let html = "";
    for (let i = 0; i < parts.length; i++) {
      html += "<p>" + esc(parts[i].trim()) + "</p>";
    }
    return html;
  }

  if (!id) {
    root.innerHTML = '<div class="article-error"><h1>article introuvable</h1><p>pas d identifiant dans l url.</p><a href="index.html" class="back-link">retour</a></div>';
    return;
  }

  let feed;
  try {
    const r = await fetch("feed.json", { cache: "no-store" });
    if (!r.ok) throw new Error("fetch failed");
    feed = await r.json();
  } catch (e) {
    root.innerHTML = '<div class="article-error"><h1>erreur</h1><p>impossible de charger le flux.</p><a href="index.html" class="back-link">retour</a></div>';
    return;
  }

  const articles = feed.articles || [];
  let article = null;
  for (let i = 0; i < articles.length; i++) {
    if (articles[i].id === id) { article = articles[i]; break; }
  }

  if (!article) {
    root.innerHTML = '<div class="article-error"><h1>article introuvable</h1><p>cet article n est plus disponible.</p><a href="index.html" class="back-link">retour</a></div>';
    return;
  }

  document.title = article.title + " - loupe_";

  const date = new Date(article.published_at);
  const dateStr = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  let html = '<article class="article">';
  html += '<a href="index.html" class="back-link">retour</a>';
  html += '<div class="article__cat">// ' + esc((article.category || "actu").toLowerCase()) + '</div>';
  html += '<h1 class="article__title">' + esc(article.title) + '</h1>';
  html += '<div class="article__meta">';
  html += '<span class="article__source">' + esc(article.source || "") + '</span>';
  html += '<span class="article__sep">&middot;</span>';
  html += '<span>' + esc(dateStr) + ' &middot; ' + esc(timeStr) + '</span>';
  html += '</div>';
  html += '<div class="article__img-wrap"><img class="article__img" src="' + esc(article.image) + '" alt=""/></div>';
  html += '<div class="article__body">' + formatBody(article.summary) + '</div>';
  html += '<div class="article__source-box">';
  html += '<div class="article__source-label">// source originale</div>';
  html += '<p>Ce resume est base sur un article publie par <strong>' + esc(article.source || "la source") + '</strong>.</p>';
  html += '<a href="' + esc(article.url) + '" target="_blank" rel="noopener noreferrer" class="article__source-link">lire l article complet sur ' + esc(article.source || "le site d origine") + '</a>';
  html += '</div>';
  html += '<a href="index.html" class="back-link back-link--bottom">retour a l accueil</a>';
  html += '</article>';

  root.innerHTML = html;

})();
