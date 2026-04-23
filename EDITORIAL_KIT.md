# LOUPE · Kit éditorial

Tout ce dont tu as besoin pour lancer et animer la newsletter, prêt à être
copié-collé dans Resend, Mailchimp, ou directement dans le Worker Cloudflare.

**Ligne éditoriale** : direct, chaleureux, un peu complice. Phrases courtes.
Jamais de jargon. Pas de points d'exclamation en rafale. Pas de "bonjour à
toutes et à tous chers lecteurs" : on s'adresse à une seule personne.

**Signature** : toujours "La rédaction" ou rien. Pas de faux nom, pas de
"Kevin, rédacteur en chef Loupe" — la marque passe avant l'individu.

---

## 1. Email de bienvenue

Envoyé automatiquement après l'inscription.

**Objet** : `Bienvenue chez Loupe.`
**Pré-header** : `Votre premier rendez-vous matinal est pour demain, 7h.`

---

> Bonjour {{prenom}},
>
> Bienvenue chez Loupe.
>
> On ira droit au but — c'est notre marque de fabrique. Chaque matin à 7h,
> vous recevrez cinq informations qui comptent. Pas vingt. Pas cinquante.
> Les cinq qu'on a retenues parmi des centaines, décryptées en quelques
> phrases, calibrées sur ce qui vous intéresse vraiment.
>
> On a noté vos centres d'intérêt : **{{interets}}**. Vous pouvez les
> modifier à tout moment, lien en bas de chaque email.
>
> Premier rendez-vous demain matin, 7h.
>
> — La rédaction

---

## 2. Email quotidien

Envoyé chaque matin à 7h via le cron du Worker.

**Objet** — à faire varier pour éviter le classement spam. Cinq variantes
à faire tourner, ~45 caractères max :

- `Loupe · {{date}} · L'essentiel du matin`
- `Loupe · Ce qu'il faut savoir ce matin`
- `Loupe · {{date}} · Cinq infos, trois minutes`
- `Loupe · Votre rendez-vous du matin`
- `Loupe · {{date}} · On a trié pour vous`

**Pré-header** (ce qui s'affiche dans l'inbox après l'objet) : on y met
toujours le titre de la première info du jour. Ça fait ouvrir.

---

**Template du corps :**

> Bonjour {{prenom}},
>
> {{intro_du_jour}}
>
> ━━━━━━━━━━━━━━━━━━━━━━━
>
> **I. {{categorie_1}}**
> **{{titre_1}}**
> {{resume_1}}
> → Lire sur {{source_1}}
>
> **II. {{categorie_2}}**
> **{{titre_2}}**
> {{resume_2}}
> → Lire sur {{source_2}}
>
> **III. {{categorie_3}}**
> **{{titre_3}}**
> {{resume_3}}
> → Lire sur {{source_3}}
>
> **IV. {{categorie_4}}**
> **{{titre_4}}**
> {{resume_4}}
> → Lire sur {{source_4}}
>
> **V. {{categorie_5}}**
> **{{titre_5}}**
> {{resume_5}}
> → Lire sur {{source_5}}
>
> ━━━━━━━━━━━━━━━━━━━━━━━
>
> C'est tout pour ce matin. À demain.
>
> — La rédaction
>
> *[Modifier mes préférences]* · *[Me désinscrire]*

---

### Bibliothèque d'intros du jour

Une dizaine d'intros à faire tourner, ton conversationnel. Tu peux en
faire générer d'autres par Claude avec le prompt en fin de document.

1. *"Soirée dense sur la scène politique. On commence par là."*
2. *"Rien de fracassant ce matin, mais plusieurs signaux faibles qu'il ne faut pas rater."*
3. *"Votre semaine démarre — voici de quoi tenir la conversation à la machine à café."*
4. *"L'actu ralentit un peu. On en profite pour prendre de la hauteur."*
5. *"Trois histoires dominent ce matin. On les prend dans l'ordre."*
6. *"Week-end chargé. On a trié pour vous l'essentiel."*
7. *"On a lu les vingt premières pages de cinq quotidiens. Voici ce qu'on retient."*
8. *"Le vendredi est souvent celui des annonces qu'on espère faire passer inaperçues. Pas chez nous."*
9. *"Un lundi où tout bouge à la fois. On vous guide."*
10. *"Pas de blabla ce matin — l'actu parle assez fort toute seule."*

### Lundis spéciaux (début de semaine)

- *"Nouvelle semaine. On repart."*
- *"Reprise. Voici l'état des lieux."*

### Vendredis (clôture de semaine)

Terminer l'email par une ligne bonus :
> *"Bon week-end, {{prenom}}. On se retrouve lundi."*

---

## 3. Email de relance — non-ouvertures

À envoyer 14 jours après inscription aux abonnés qui n'ont jamais ouvert
un seul email. Un seul essai, pas plus — sinon on devient agaçant.

**Objet** : `{{prenom}}, on vous a raté ?`
**Pré-header** : `Deux secondes pour nous dire si on reste ou si on s'en va.`

---

> Bonjour {{prenom}},
>
> On vous écrit chaque matin depuis deux semaines. Vous ne nous avez pas
> ouverts. Pas de souci — ça arrive.
>
> Avant de vous retirer doucement de la liste, on voulait vérifier une
> chose : est-ce que Loupe vous intéresse toujours ?
>
> [**Oui, je veux continuer**]  [**Non, retirez-moi**]
>
> Un clic, et on vous laisse tranquille.
>
> — La rédaction

---

## 4. Email "meilleur du week-end" — édition dimanche

Version plus longue, ton plus posé. À envoyer le dimanche matin à la
place du quotidien classique.

**Objet** : `Loupe · Dimanche · Le meilleur de votre semaine`
**Pré-header** : `Les cinq articles les plus lus, plus un essai à lire au café.`

---

> Bonjour {{prenom}},
>
> C'est dimanche, on prend le temps. Voici les cinq articles qui vous ont
> le plus marqué cette semaine, suivis d'un papier à lire en prenant
> votre café.
>
> ━━━━━━━━━━━━━━━━━━━━━━━
>
> **Les cinq plus lus**
>
> 1. {{titre_1}}
> 2. {{titre_2}}
> 3. {{titre_3}}
> 4. {{titre_4}}
> 5. {{titre_5}}
>
> ━━━━━━━━━━━━━━━━━━━━━━━
>
> **À lire au café**
>
> **{{titre_longform}}**
> {{resume_longform_en_deux_phrases}}
> → *Lire l'article complet*
>
> ━━━━━━━━━━━━━━━━━━━━━━━
>
> Bonne fin de week-end. Rendez-vous demain matin.
>
> — La rédaction

---

## 5. Email d'annonce — lancement, nouvelle rubrique, changement majeur

À utiliser avec parcimonie. Une fois par trimestre max.

**Objet** : `Une nouveauté chez Loupe.`
**Pré-header** : `{{sujet_de_l'annonce_en_quelques_mots}}`

---

> Bonjour {{prenom}},
>
> Une nouvelle chez Loupe : {{annonce_en_une_phrase}}.
>
> {{paragraphe_d'explication_court_3_phrases}}
>
> Rien ne change pour votre rendez-vous de 7h. Simplement, à partir de
> {{date}}, vous retrouverez aussi {{nouvelle_fonctionnalite}}.
>
> Si vous avez des retours, répondez directement à ce mail — on les lit.
>
> — La rédaction

---

## 6. Édition spéciale — breaking news

À utiliser uniquement pour une actualité majeure hors cycle quotidien.
Plafond : deux par an, sinon l'effet se perd.

**Objet** : `Loupe · Édition spéciale · {{sujet_court}}`
**Pré-header** : `Ce qu'il faut savoir, maintenant.`

---

> Bonjour {{prenom}},
>
> Édition spéciale. {{evenement_en_une_phrase}}.
>
> ━━━━━━━━━━━━━━━━━━━━━━━
>
> **Les faits**
> {{ce_qui_s'est_passe_en_3_4_phrases}}
>
> **Les enjeux**
> {{pourquoi_ca_compte_en_3_4_phrases}}
>
> **Ce qui va se passer**
> {{ce_qu'on_attend_dans_les_heures_prochaines}}
>
> ━━━━━━━━━━━━━━━━━━━━━━━
>
> On revient demain matin, 7h, comme d'habitude.
>
> — La rédaction

---

## 7. Prompts Claude pour générer le contenu

Les intros du jour, les résumés et les objets d'email peuvent être
générés automatiquement via l'API Claude. Voici les prompts prêts à
l'emploi.

### Prompt · Résumé d'article (déjà intégré dans aggregate.py)

```
Tu es rédacteur pour LOUPE, un média digital généraliste francophone au
ton éditorial posé mais direct. Pour chaque article ci-dessous, écris un
résumé d'une seule phrase (20 à 30 mots), en français, factuel et clair.

Règles :
- Reformule entièrement, ne reprends jamais de fragments de l'extrait.
- Pas de point d'exclamation.
- Pas de jugement éditorial, rien qui prenne parti.
- Phrase active, pas passive quand c'est possible.

Réponds UNIQUEMENT en JSON : [{"i": 0, "summary": "..."}]

Articles :
{articles}
```

### Prompt · Intro du jour

```
Tu es rédacteur pour LOUPE, newsletter française matinale. Rédige
l'intro de l'email du jour : UNE seule phrase, 15 à 25 mots, ton
complice et posé (pas marketing, pas surexcité).

Elle doit donner envie de lire la suite, éventuellement en faisant
référence au sujet dominant du jour, sans le spoiler.

Contexte du jour :
- Date : {date}
- Sujet dominant : {sujet_1}
- Autres sujets : {sujets_2_3}

Réponds UNIQUEMENT avec la phrase d'intro, sans guillemets, sans
préambule.
```

### Prompt · Objet de l'email quotidien

```
Rédige l'objet de l'email Loupe du jour. Contraintes :
- 35 à 50 caractères maximum (penser mobile)
- Commencer par "Loupe · "
- Jamais de emoji
- Ton sobre, éditorial, pas putaclic
- Donner envie d'ouvrir sans survendre

Contexte : {sujet_1} + {sujet_2}

Réponds uniquement avec l'objet.
```

---

## 8. Calendrier éditorial type

| Jour      | Email                          | Ton                          |
| --------- | ------------------------------ | ---------------------------- |
| Lundi     | Quotidien · 7h                 | Posé, pose le décor semaine  |
| Mardi     | Quotidien · 7h                 | Dense, l'actu est lancée     |
| Mercredi  | Quotidien · 7h                 | Mi-parcours, prise de recul  |
| Jeudi     | Quotidien · 7h                 | Normal                       |
| Vendredi  | Quotidien · 7h + mot de fin    | Clôture, signature "bon WE"  |
| Samedi    | *Pas d'envoi*                  | (économise l'attention)      |
| Dimanche  | Best-of semaine · 8h           | Plus long, plus posé         |

**Pourquoi pas le samedi ?** Les taux d'ouverture chutent, et garder un
jour off renforce la valeur perçue du rendez-vous.

---

## 9. Checklist avant d'appuyer sur "envoyer"

Avant chaque campagne (manuelle, pas quotidienne) :

- [ ] Objet < 50 caractères
- [ ] Pré-header rédigé (pas juste la première ligne par défaut)
- [ ] Lien de désinscription présent et fonctionnel
- [ ] Test envoyé à toi-même, lu sur mobile
- [ ] Images avec texte alternatif (accessibilité)
- [ ] Liens testés un par un (objectif : zéro 404)
- [ ] Pas de majuscules dans l'objet (spam trigger)
- [ ] Pas de ponctuation excessive (!!!, ???, …!)

---

*Kit à faire évoluer au fil des retours abonnés. Tout le contenu ici
peut être modifié librement.*
