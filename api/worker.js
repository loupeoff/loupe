/**
 * LOUPE — Cloudflare Worker (mono edition)
 */

const CREAM = "#f4efe6";
const CREAM_DEEP = "#ebe4d6";
const INK = "#111111";
const INK_SOFT = "#2a2620";
const GOLD = "#a67c3e";
const MUTED = "#7a736a";
const LINE = "#d9d0bf";

// Stack mono pour les clients mail qui n'ont pas JetBrains Mono en local
const MONO = "'JetBrains Mono', 'Menlo', 'Consolas', 'Courier New', monospace";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    try {
      if (url.pathname === "/api/subscribe" && req.method === "POST")
        return await handleSubscribe(req, env, cors);
      if (url.pathname === "/api/send-newsletter" && req.method === "POST")
        return await handleSendNewsletter(req, env, cors);
      return new Response("Not found", { status: 404, headers: cors });
    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDailyNewsletter(env));
  },
};

async function handleSubscribe(req, env, cors) {
  const body = await req.json();
  const firstname = (body.firstname || "").toString().trim().slice(0, 40);
  const email = (body.email || "").toString().trim().toLowerCase().slice(0, 120);
  const interests = Array.isArray(body.interests)
    ? body.interests.slice(0, 10).map(String)
    : [];
  if (!firstname || !email || !emailValid(email))
    return json({ error: "Prénom et email requis." }, 400, cors);
  if (interests.length === 0)
    return json({ error: "Choisissez au moins un centre d'intérêt." }, 400, cors);

  const key = `sub:${email}`;
  const existing = await env.SUBSCRIBERS.get(key);
  const record = {
    firstname, email, interests,
    subscribed_at: existing ? JSON.parse(existing).subscribed_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await env.SUBSCRIBERS.put(key, JSON.stringify(record));

  await sendEmail(env, {
    to: email,
    subject: "Bienvenue chez loupe_",
    html: welcomeHTML(firstname, interests),
  });
  return json({ ok: true }, 200, cors);
}

async function handleSendNewsletter(req, env, cors) {
  const auth = req.headers.get("Authorization") || "";
  if (auth !== `Bearer ${env.CRON_SECRET}`)
    return json({ error: "Unauthorized" }, 401, cors);
  const count = await sendDailyNewsletter(env);
  return json({ ok: true, sent: count }, 200, cors);
}

async function sendDailyNewsletter(env) {
  const feedRes = await fetch(env.FEED_URL, { cf: { cacheTtl: 0 } });
  if (!feedRes.ok) throw new Error("Feed unreachable");
  const feed = await feedRes.json();
  const articles = feed.articles || [];

  const list = await env.SUBSCRIBERS.list({ prefix: "sub:" });
  let sent = 0;
  for (const k of list.keys) {
    const raw = await env.SUBSCRIBERS.get(k.name);
    if (!raw) continue;
    const sub = JSON.parse(raw);
    const matched = articles.filter(a => sub.interests.includes(a.category)).slice(0, 5);
    const selection = matched.length > 0 ? matched : articles.slice(0, 5);
    await sendEmail(env, {
      to: sub.email,
      subject: `loupe · ${dateISO()} · votre résumé du matin`,
      html: newsletterHTML(sub.firstname, selection),
    });
    sent++;
  }
  return sent;
}

async function sendEmail(env, { to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) console.error(`Resend failed for ${to}: ${await res.text()}`);
}

// ================================================================
function welcomeHTML(firstname, interests) {
  const interestList = interests.join(" · ");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&display=swap" rel="stylesheet"></head>
<body style="margin:0;background:${CREAM};font-family:${MONO};color:${INK};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
  <tr><td align="center" style="padding:40px 20px;">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;">

      <tr><td style="padding:12px 16px;background:${INK};color:${CREAM};font-size:11px;">
        <span style="color:${GOLD};">●</span> live &nbsp;/&nbsp; ${dateISO()} &nbsp;/&nbsp; <span style="color:${MUTED};">welcome@loupe</span>
      </td></tr>

      <tr><td style="text-align:center;padding:32px 0 28px;border-bottom:2px solid ${INK_SOFT};">
        <div style="font-family:${MONO};font-weight:800;font-size:56px;line-height:0.9;letter-spacing:-0.05em;color:${INK};">loupe<span style="color:${GOLD};">_</span></div>
        <div style="font-size:11px;color:${MUTED};margin-top:6px;">// voir l'info autrement</div>
      </td></tr>

      <tr><td style="padding:36px 0 16px;">
        <div style="font-family:${MONO};font-weight:800;font-size:32px;line-height:1.05;letter-spacing:-0.05em;color:${INK};">bienvenue,<br/>${escapeHTML(firstname)}.</div>
      </td></tr>

      <tr><td style="padding:0 0 22px;font-family:${MONO};font-size:14px;line-height:1.7;color:${INK_SOFT};">
        <p style="margin:0 0 14px;">on ira droit au but — c'est notre marque de fabrique.</p>
        <p style="margin:0 0 14px;">chaque matin à 7h, vous recevrez <strong>cinq informations qui comptent</strong>. pas vingt. pas cinquante. les cinq qu'on a retenues parmi des centaines, décryptées en quelques phrases, calibrées sur ce qui vous intéresse.</p>
        <p style="margin:0 0 14px;">on a noté vos centres d'intérêt :</p>
      </td></tr>

      <tr><td style="padding:14px 18px;background:${CREAM_DEEP};border-left:3px solid ${GOLD};font-family:${MONO};font-size:14px;color:${INK};">
        ${escapeHTML(interestList)}
      </td></tr>

      <tr><td style="padding:22px 0 0;font-family:${MONO};font-size:12px;line-height:1.7;color:${MUTED};">
        // vous pourrez les modifier à tout moment depuis le lien en bas de chaque email
      </td></tr>

      <tr><td style="padding:36px 0 0;font-family:${MONO};font-size:16px;color:${INK};">
        &gt; premier rendez-vous demain matin, 7h<span style="color:${GOLD};">_</span>
      </td></tr>

      <tr><td style="padding:28px 0 0;font-family:${MONO};font-size:13px;color:${INK_SOFT};">
        — la rédaction
      </td></tr>

      <tr><td style="padding:40px 0 0;border-top:1px dashed ${LINE};text-align:center;">
        <div style="padding-top:18px;font-family:${MONO};font-size:11px;color:${MUTED};">
          // pour vous désabonner, répondez avec le mot STOP
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

function newsletterHTML(firstname, articles) {
  const items = articles.map((a, idx) => {
    const num = String(idx + 1).padStart(2, "0");
    return `
    <tr><td style="padding:22px 0;border-bottom:1px dashed ${LINE};">
      <div style="font-family:${MONO};font-size:12px;color:${GOLD};margin-bottom:8px;font-weight:500;">
        [${num}] // ${escapeHTML((a.category || "").toLowerCase())}
      </div>
      <div style="font-family:${MONO};font-weight:700;font-size:20px;line-height:1.2;letter-spacing:-0.03em;color:${INK};margin:0 0 10px;">
        <a href="${escapeAttr(a.url)}" style="color:${INK};text-decoration:none;">${escapeHTML(a.title)}</a>
      </div>
      <div style="font-family:${MONO};font-size:13px;line-height:1.65;color:${INK_SOFT};margin:0 0 10px;">
        ${escapeHTML(a.summary || "")}
      </div>
      <a href="${escapeAttr(a.url)}" style="font-family:${MONO};font-size:12px;color:${GOLD};text-decoration:none;">
        → lire sur ${escapeHTML(a.source || "la source")}
      </a>
    </td></tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&display=swap" rel="stylesheet"></head>
<body style="margin:0;background:${CREAM};font-family:${MONO};color:${INK};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
  <tr><td align="center" style="padding:24px 20px;">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">

      <tr><td style="padding:10px 14px;background:${INK};color:${CREAM};font-size:11px;font-family:${MONO};">
        <span style="color:${GOLD};">●</span> live &nbsp;/&nbsp; ${dateISO()} &nbsp;/&nbsp; ed.${editionNumber()} &nbsp;/&nbsp; <span style="color:${MUTED};">newsletter@loupe</span>
      </td></tr>

      <tr><td style="padding:24px 0 16px;border-bottom:2px solid ${INK_SOFT};text-align:center;">
        <div style="font-family:${MONO};font-weight:800;font-size:44px;line-height:0.9;letter-spacing:-0.05em;color:${INK};">loupe<span style="color:${GOLD};">_</span></div>
        <div style="font-family:${MONO};font-size:11px;color:${MUTED};margin-top:4px;">// voir l'info autrement</div>
      </td></tr>

      <tr><td style="padding:24px 0 6px;font-family:${MONO};font-size:14px;color:${INK_SOFT};">
        &gt; bonjour ${escapeHTML(firstname)},
      </td></tr>

      <tr><td style="padding:0 0 6px;font-family:${MONO};font-size:16px;color:${INK};">
        cinq informations. trois minutes de lecture.
      </td></tr>

      ${items}

      <tr><td style="padding:28px 0 0;font-family:${MONO};font-size:15px;color:${INK};text-align:center;">
        &gt; à demain<span style="color:${GOLD};">_</span>
      </td></tr>

      <tr><td style="padding:6px 0 0;font-family:${MONO};font-size:13px;color:${INK_SOFT};text-align:center;">
        — la rédaction
      </td></tr>

      <tr><td style="padding:32px 0 0;border-top:1px dashed ${LINE};text-align:center;">
        <div style="padding-top:16px;font-family:${MONO};font-size:11px;color:${MUTED};line-height:1.7;">
          // vous recevez cet email car vous êtes abonné·e à loupe<br/>
          <a href="#" style="color:${GOLD};">modifier mes préférences</a> · <a href="#" style="color:${GOLD};">me désabonner</a>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
function emailValid(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function escapeHTML(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeAttr(s) { return escapeHTML(s); }
function dateISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function editionNumber() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = (d - start) / (1000 * 60 * 60 * 24);
  return String(Math.floor(diff)).padStart(3, "0");
}
