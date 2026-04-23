# LOUPE

**Voir l'info autrement.**
Média en ligne généraliste, style papier journal premium. Mis à jour chaque heure. Newsletter gratuite chaque matin à 7h.

```
loupe/
├── site/                  Site statique (GitHub Pages)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── feed.json          (généré auto toutes les heures)
├── script/
│   └── aggregate.py       Agrégateur RSS + résumé Claude
├── api/                   Worker Cloudflare (inscriptions + envoi)
│   ├── worker.js
│   └── wrangler.toml
├── .github/workflows/
│   └── update.yml         Cron horaire + déploiement Pages
├── EDITORIAL_KIT.md       Kit éditorial complet (emails, ton, prompts)
└── README.md              (vous êtes ici)
```

---

## 🚀 Démarrage (30 min)

### Étape 1 · Le site + mise à jour horaire (15 min)

1. **Push ton repo**
   ```bash
   cd loupe
   git init && git add . && git commit -m "init loupe"
   git remote add origin git@github.com:TONPSEUDO/loupe.git
   git push -u origin main
   ```
2. **Active GitHub Pages** : Settings → Pages → Source : **GitHub Actions**
3. **Ajoute ta clé Claude** (optionnel) : Settings → Secrets → Actions → `ANTHROPIC_API_KEY`
4. **Lance le premier run** : onglet Actions → *Update feed and deploy* → Run workflow

Ton site est en ligne sur `https://TONPSEUDO.github.io/loupe/`, il se met à jour toutes les heures.

### Étape 2 · La newsletter quotidienne (15 min)

Trois services gratuits à connecter :
1. **Cloudflare Workers** (100k req/jour) → héberge l'API
2. **Resend** (3000 emails/mois) → envoie les emails
3. **(optionnel)** un nom de domaine pour l'adresse d'envoi

#### 2.1 Compte Resend
- Inscription sur https://resend.com
- Récupère ton API key (`re_...`)
- Vérifie un domaine d'envoi, ou utilise `onboarding@resend.dev` pour tester

#### 2.2 Déployer le Worker
```bash
cd api
npm install -g wrangler
wrangler login

# KV namespace qui stocke les abonnés
wrangler kv namespace create SUBSCRIBERS
# → copie l'ID dans wrangler.toml (champ `id`)

# Secrets
wrangler secret put RESEND_API_KEY     # → colle ta clé Resend
wrangler secret put CRON_SECRET         # → un mot de passe long et aléatoire

# Deploy
wrangler deploy
```
Tu récupères une URL du type `https://loupe-api.tonpseudo.workers.dev`.

#### 2.3 Brancher le site sur le Worker
Dans `site/index.html`, juste avant `<script src="app.js"></script>` :
```html
<script>
  window.LOUPE_SIGNUP_ENDPOINT = "https://loupe-api.tonpseudo.workers.dev/api/subscribe";
</script>
```
Commit + push. Les nouvelles inscriptions partent maintenant vers ton Worker.

#### 2.4 C'est automatique
Le cron déclenche l'envoi quotidien à 7h (heure Paris). Chaque abonné reçoit un email personnalisé.

Pour tester manuellement :
```bash
curl -X POST https://loupe-api.tonpseudo.workers.dev/api/send-newsletter \
  -H "Authorization: Bearer TON_CRON_SECRET"
```

---

## 📝 Contenu éditorial

Tout le ton, les templates d'emails, les intros du jour, les prompts Claude pour générer le contenu — c'est dans `EDITORIAL_KIT.md`. Lis-le avant de changer quoi que ce soit dans les emails.

---

## 🔗 Flux RSS

Loupe expose automatiquement un flux RSS 2.0 à l'URL :
```
https://TONDOMAINE/feed.xml
```

Il est auto-découvrable depuis n'importe quel lecteur RSS (Feedly, Inoreader, NetNewsWire…) grâce à la balise `<link rel="alternate">` présente dans le `<head>` de la home.

Le flux est régénéré à chaque passage du cron horaire, en même temps que `feed.json`.

---

## 🌐 Brancher un nom de domaine perso (ex: loupe-media.fr)

Une fois ton repo en ligne avec GitHub Pages actif :

1. **Achète le domaine** chez OVH, Gandi ou Cloudflare Registrar (~7-15 € / an)
2. **Dans GitHub** → Settings → Pages → *Custom domain* : tape `loupe-media.fr` → Save. Un fichier `CNAME` est créé automatiquement dans ton repo.
3. **Chez ton registrar (OVH par exemple)**, dans la zone DNS de ton domaine, ajoute :
   - 4 enregistrements `A` sur l'apex (`@`) pointant vers :
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - 1 enregistrement `CNAME` : `www` → `TONPSEUDO.github.io`
4. **Attends 10 min à 2h** (propagation DNS)
5. **Sur GitHub Pages** → coche *Enforce HTTPS* quand le certificat est prêt
6. **Mets à jour `SITE_URL`** : GitHub → Settings → Secrets and variables → Actions → onglet *Variables* → New → `SITE_URL` = `https://loupe-media.fr`

Le RSS et le JSON pointent maintenant vers ton domaine perso.

---



```bash
# Générer le feed
export ANTHROPIC_API_KEY=sk-ant-...   # optionnel
python3 script/aggregate.py

# Servir le site
cd site && python3 -m http.server 8000
# → http://localhost:8000
```
Sans lancer le script, le site affiche 20 articles de démo.

---

## 🎨 Personnalisation

| Quoi | Où |
|---|---|
| Palette (crème / encre / or) | `site/style.css` → `--cream`, `--ink`, `--gold` |
| Typo | `site/index.html` (Google Fonts) + `site/style.css` |
| Flux RSS suivis | `script/aggregate.py` → `FEEDS` |
| Fréquence de maj | `.github/workflows/update.yml` → `cron` |
| Ton / longueur des résumés | `script/aggregate.py` → prompt `summarize_batch()` |
| Heure d'envoi newsletter | `api/wrangler.toml` → `crons` |
| Design des emails | `api/worker.js` → `newsletterHTML()`, `welcomeHTML()` |
| Textes des emails | `EDITORIAL_KIT.md` |

---

## 💰 Coûts

| Service | Gratuit ? | Utilisation |
|---|---|---|
| GitHub Pages + Actions | ✅ | 2000 min/mois (on en utilise ~30) |
| Claude API (Haiku) | 💰 | ~1-3 € / mois pour 32 articles/heure |
| Cloudflare Workers | ✅ | 100k req/jour |
| Cloudflare KV | ✅ | 1000 writes/jour |
| Resend | ✅ | 100 emails/jour, 3000/mois |

Au-delà de 3000 abonnés actifs, Resend passe à ~20 $/mois pour 50k envois.

---

## ⚖️ Droit et déontologie

Loupe **ne republie pas** les articles originaux. Pour chaque info :
- Titre
- Résumé reformulé par l'IA (1 phrase)
- Source créditée
- Lien vers l'article original

Principe d'agrégateur (Google News, Feedly). **Mais** :
- Respecte les CGU des flux RSS utilisés.
- Pour un usage commercial à grande échelle : licences à négocier (AFP, Reuters).
- Cite toujours la source.

---

## 🔧 Dépannage

**Le workflow GitHub échoue au push**
→ Settings → Actions → Workflow permissions : **Read and write**.

**Le formulaire reste en mode démo**
→ `window.LOUPE_SIGNUP_ENDPOINT` absent ou URL Worker incorrecte.

**Les emails ne partent pas**
→ Vérifier `RESEND_API_KEY` dans les secrets Wrangler + domaine d'envoi validé sur Resend.

**Résumés bruts non reformulés**
→ `ANTHROPIC_API_KEY` absent dans les secrets GitHub.

---

**Loupe** — Voir l'info autrement.
