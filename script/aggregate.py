"""
LOUPE — agrégateur d'actualités
Lit des flux RSS, reformule via l'API Claude, écrit site/feed.json.

Usage :
  export ANTHROPIC_API_KEY=sk-ant-...
  python3 script/aggregate.py
"""

import os, re, json, html, hashlib
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from xml.etree import ElementTree as ET

# ============================================================
# CONFIG
# ============================================================

FEEDS = [
    {"name": "Le Monde",        "url": "https://www.lemonde.fr/rss/une.xml",                  "category": "À la une"},
    {"name": "Le Monde Inter",  "url": "https://www.lemonde.fr/international/rss_full.xml",   "category": "International"},
    {"name": "Le Monde Politique", "url": "https://www.lemonde.fr/politique/rss_full.xml",    "category": "Politique"},
    {"name": "France Info",     "url": "https://www.francetvinfo.fr/titres.rss",              "category": "À la une"},
    {"name": "Libération",      "url": "https://www.liberation.fr/arc/outboundfeeds/rss/?outputType=xml", "category": "À la une"},
    {"name": "Les Échos",       "url": "https://services.lesechos.fr/rss/les-echos-economie.xml", "category": "Économie"},
    {"name": "Numerama",        "url": "https://www.numerama.com/feed/",                      "category": "Tech"},
    {"name": "Next INpact",     "url": "https://www.nextinpact.com/rss/news.xml",             "category": "Tech"},
    {"name": "L'Équipe",        "url": "https://www.lequipe.fr/rss/actu_rss.xml",             "category": "Sport"},
]

MAX_ARTICLES = 32
SITE_URL = os.environ.get("SITE_URL", "https://TONPSEUDO.github.io/loupe")
SITE_NAME = "Loupe"
SITE_TAGLINE = "Voir l'info autrement."
SITE_DESCRIPTION = "Média en ligne généraliste. L'essentiel de l'actualité mis à jour chaque heure, et un résumé quotidien par email à 7h."

OUT = Path(__file__).resolve().parent.parent / "site" / "feed.json"
OUT_RSS = Path(__file__).resolve().parent.parent / "site" / "feed.xml"

CATEGORIES = ["Politique", "International", "Société", "Économie", "Culture", "Tech", "Sport"]

CATEGORY_KEYWORDS = {
    "Politique":     ["gouvernement", "assemblée", "sénat", "parlement", "ministre", "président", "élection",
                      "parti", "lfi", "rn", "ps ", "les républicains", "renaissance", "macron",
                      "premier ministre", "élysée", "matignon"],
    "International": ["ukraine", "russie", "gaza", "israël", "chine", "washington", "bruxelles", "otan",
                      "onu", "poutine", "biden", "trump", "union européenne", "moscou", "kiev", "pékin"],
    "Économie":      ["inflation", "bce", "taux", "bourse", "cac 40", "pib", "chômage", "emploi",
                      "entreprise", "industrie", "euro", "dollar", "marché", "insee", "croissance"],
    "Tech":          ["ia ", " ia,", "intelligence artificielle", "openai", "chatgpt", "google", "apple",
                      "microsoft", "meta", "cybersécurité", "cyberattaque", "startup", "numérique",
                      "internet", "logiciel", "anthropic", "semi-conducteur"],
    "Culture":       ["film", "cinéma", "musique", "album", "livre", "roman", "festival", "théâtre",
                      "exposition", "musée", "cannes", "césar", "concert", "série", "netflix"],
    "Sport":         ["football", "ligue 1", "psg", "om", "rugby", "tennis", "roland-garros", "tour de france",
                      "jeux olympiques", "jo ", "nba", "match", "coupe", "champion"],
    "Société":       ["école", "université", "santé", "hôpital", "logement", "famille", "justice", "police",
                      "manifestation", "grève", "violence", "féminicide", "étudiant", "enseignant"],
}

# ============================================================
# FETCH + PARSE
# ============================================================

def fetch_url(url, timeout=20):
    req = Request(url, headers={"User-Agent": "LoupeBot/1.0 (+rss-aggregator)"})
    with urlopen(req, timeout=timeout) as r:
        return r.read()

def strip_html(s):
    if not s: return ""
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()

def parse_date(s):
    if not s: return None
    try:
        dt = parsedate_to_datetime(s)
        if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception: pass
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S"):
        try:
            dt = datetime.strptime(s, fmt)
            if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception: continue
    return None

def extract_image(item):
    for enc in item.findall("enclosure"):
        if enc.attrib.get("type", "").startswith("image"):
            return enc.attrib.get("url")
    for tag in ("{http://search.yahoo.com/mrss/}content",
                "{http://search.yahoo.com/mrss/}thumbnail"):
        el = item.find(tag)
        if el is not None and el.attrib.get("url"):
            return el.attrib["url"]
    img = item.find("image")
    if img is not None and img.text: return img.text.strip()
    desc = item.findtext("description") or ""
    m = re.search(r'<img[^>]+src=["\']([^"\']+)', desc)
    return m.group(1) if m else None

def parse_feed(xml_bytes, cfg):
    try: root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        print(f"  ⚠ parse error: {e}")
        return []
    results = []
    for it in root.findall(".//item"):
        title = strip_html(it.findtext("title") or "")
        link  = (it.findtext("link") or "").strip()
        desc  = strip_html(it.findtext("description") or "")
        pub   = parse_date(it.findtext("pubDate"))
        img   = extract_image(it)
        if not title or not link: continue
        results.append({
            "title": title, "url": link,
            "summary": desc[:400],
            "image": img,
            "published_at": pub.isoformat() if pub else None,
            "source": cfg["name"],
            "category": cfg["category"],
            "id": hashlib.sha1(link.encode()).hexdigest()[:12],
        })
    return results

# ============================================================
# CLASSIFY
# ============================================================

def classify(a):
    txt = (a["title"] + " " + a["summary"]).lower()
    scores = {c: sum(1 for kw in kws if kw in txt) for c, kws in CATEGORY_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    if scores[best] >= 1: return best
    return a["category"] if a["category"] in CATEGORIES else "Société"

# ============================================================
# SUMMARIZE via Claude API
# ============================================================
def summarize_batch(articles, api_key):
    if not api_key:
        print("  ℹ Pas d'ANTHROPIC_API_KEY — résumés RSS conservés.")
        return
    if not articles:
        return
    print(f"  → résumé de {len(articles)} articles via Claude Haiku…")

    items_text = "\n\n".join(
        f"[{i}] Titre : {a['title']}\nExtrait : {a['summary']}"
        for i, a in enumerate(articles)
    )

    prompt = (
        "Tu es rédacteur pour LOUPE, un média généraliste francophone.\n"
        "Pour CHAQUE article ci-dessous, écris un résumé développé de 300 à 400 mots "
        "(environ 5-6 paragraphes courts), en français, ton posé et factuel.\n\n"
        "Structure attendue :\n"
        "- 1er paragraphe : les faits principaux, qui, quoi, quand, où\n"
        "- 2e paragraphe : le contexte (pourquoi ça compte, arrière-plan)\n"
        "- 3e paragraphe : les enjeux, les implications, les réactions\n"
        "- 4e paragraphe : ce qui peut se passer ensuite, perspectives\n"
        "- Paragraphe de clôture court si pertinent\n\n"
        "Règles strictes :\n"
        "- Reformule ENTIEREMENT, ne reprends jamais plus de 3 mots consecutifs de l'extrait\n"
        "- Pas de jugement editorial, neutre et factuel\n"
        "- Pas de points d'exclamation\n"
        "- Phrases actives, claires, pas de jargon\n"
        "- Separe les paragraphes par deux retours a la ligne dans le JSON\n"
        "- Si l'extrait est trop court, developpe en t'appuyant sur tes connaissances generales, "
        "en restant factuel\n\n"
        "Reponds UNIQUEMENT en JSON valide de cette forme exacte :\n"
        '[{"i": 0, "summary": "..."}, {"i": 1, "summary": "..."}]\n'
        "Pas de markdown, pas de texte avant ou apres.\n\n"
        "Articles :\n" + items_text
    )

    body = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 12000,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")
    req = Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=120) as r:
            data = json.loads(r.read())
    except (URLError, HTTPError) as e:
        print(f"  ⚠ API error: {e}")
        return
    text = "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text").strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE).strip()
    try:
        summaries = json.loads(text)
    except json.JSONDecodeError:
        print("  ⚠ JSON invalide renvoyé par Claude.")
        return
    for item in summaries:
        i = item.get("i")
        s = (item.get("summary") or "").strip()
        if isinstance(i, int) and 0 <= i < len(articles) and s:
            articles[i]["summary"] = s
# ============================================================
# RSS GENERATION
# ============================================================

def rss_escape(s):
    """Échappe un champ pour XML (hors CDATA)."""
    if s is None: return ""
    return (str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;"))

def cdata_safe(s):
    """Protège une chaîne destinée à être placée à l'intérieur d'un CDATA.
    La seule séquence illégale dans CDATA est ]]>. On la casse en deux
    en fermant le CDATA, en échappant >, puis en rouvrant."""
    if s is None: return ""
    return str(s).replace("]]>", "]]]]><![CDATA[>")

def rss_date(iso):
    """Convertit ISO 8601 en RFC-822 (format exigé par RSS 2.0)."""
    if not iso:
        return datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")
    except Exception:
        return datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")

def build_rss(articles):
    """Génère un flux RSS 2.0 valide."""
    now_rfc = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    items = []
    for a in articles:
        img_tag = ""
        if a.get("image"):
            img_tag = f'    <enclosure url="{rss_escape(a["image"])}" type="image/jpeg" length="0" />\n'
        items.append(f"""  <item>
    <title>{rss_escape(a["title"])}</title>
    <link>{rss_escape(a["url"])}</link>
    <guid isPermaLink="true">{rss_escape(a["url"])}</guid>
    <pubDate>{rss_date(a.get("published_at"))}</pubDate>
    <category>{rss_escape(a.get("category", "Actualité"))}</category>
    <source url="{rss_escape(SITE_URL)}">{rss_escape(a.get("source", ""))}</source>
    <description><![CDATA[{cdata_safe(a.get("summary", ""))}]]></description>
{img_tag}  </item>""")
    body = "\n".join(items)

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>{rss_escape(SITE_NAME)} — {rss_escape(SITE_TAGLINE)}</title>
  <link>{rss_escape(SITE_URL)}</link>
  <atom:link href="{rss_escape(SITE_URL)}/feed.xml" rel="self" type="application/rss+xml" />
  <description>{rss_escape(SITE_DESCRIPTION)}</description>
  <language>fr-FR</language>
  <copyright>© {datetime.now().year} {rss_escape(SITE_NAME)}</copyright>
  <lastBuildDate>{now_rfc}</lastBuildDate>
  <generator>Loupe Aggregator</generator>
  <ttl>60</ttl>
{body}
</channel>
</rss>
"""

# ============================================================
# MAIN
# ============================================================

def main():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Agrégation LOUPE…")
    all_articles = []
    for f in FEEDS:
        print(f"• {f['name']}")
        try:
            xml = fetch_url(f["url"])
        except Exception as e:
            print(f"  ⚠ {e}"); continue
        parsed = parse_feed(xml, f)
        print(f"  → {len(parsed)} articles")
        all_articles.extend(parsed)

    seen, deduped = set(), []
    for a in all_articles:
        if a["url"] in seen: continue
        seen.add(a["url"]); deduped.append(a)

    for a in deduped: a["category"] = classify(a)

    deduped.sort(
        key=lambda a: parse_date(a.get("published_at")) or datetime(1970,1,1,tzinfo=timezone.utc),
        reverse=True,
    )
    top = deduped[:MAX_ARTICLES]

    fallbacks = {
        "Politique":     "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200",
        "International": "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200",
        "Société":       "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200",
        "Économie":      "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=1200",
        "Culture":       "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?w=1200",
        "Tech":          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200",
        "Sport":         "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200",
    }
    for a in top:
        if not a.get("image"):
            a["image"] = fallbacks.get(a["category"], fallbacks["Société"])

    summarize_batch(top, os.environ.get("ANTHROPIC_API_KEY"))

    out = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "article_count": len(top),
        "articles": top,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ {len(top)} articles → {OUT}")

    # RSS
    rss_xml = build_rss(top)
    OUT_RSS.write_text(rss_xml, encoding="utf-8")
    print(f"✓ RSS feed → {OUT_RSS}")

if __name__ == "__main__":
    main()
