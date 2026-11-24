// Vercel serverless function: capture a magnet lead into a Resend audience.
// Deploys to the site repo as  api/subscribe.js  (served at /api/subscribe).
// POST { email, magnet }  ->  adds the contact to the matching audience.
// The landing page reveals/links the deliverable regardless of this result, so a
// hiccup here never blocks the payoff.

const AUDIENCES = {
  cv:        "1aca0713-388d-4984-a705-600beb4bc093", // Magnet: CV (Comment CV / IG)
  open:      "5f3a3506-2bc7-4092-83dc-e365d1f72884", // Magnet: OPEN (Comment OPEN / IG)
  portfolio: "964241d7-e734-4287-b671-dfa8d7168e31", // Magnet: Portfolio (Build your proof of work)
  letters:   "c58a5996-3a4d-4b59-9535-dd046c8c4a4b", // AdiLetters (Eat. Play. Love. weekly letter)
  pyma:      "e7dfca31-3954-48ed-bfae-84e88f62115b", // Magnet: PYMA (career archetype session)
  "counsellor-webinar-2026-12-12": "6c7c5d80-3b4e-4cb4-951e-618af23d4987", // Webinar: Change the question (12 Dec 2026), /counsellors/webinar
};

// Webinar registrations: the full form (role, city, org, WhatsApp, session request) does not fit
// a Resend contact, so each registration is also emailed to Adi. Stopgap until the outreach CRM
// intake exists (crm.letsenterprise.in, Neon le-outreach). Registrants get a short confirmation.
const WEBINARS = {
  "counsellor-webinar-2026-12-12": {
    title: "Change the question: three tools you can use the next day",
    when: "Saturday 12 December 2026, 10:00 to 11:30 am IST, online",
  },
};
const FROM = "Aditya Jhunjhunwala <aditya@letters.letsenterprise.in>";
const NOTIFY_TO = "aditya@letsenterprise.in";

function clean(s, n) { return String(s || "").replace(/[\r\n<>]/g, " ").trim().slice(0, n || 200); }
function esc(s) { return clean(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }

async function sendEmail(key, payload) {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) console.error("resend email error", r.status, await r.text());
  } catch (e) { console.error("resend email exception", e); }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const email = (body && body.email || "").trim().toLowerCase();
  const magnet = (body && body.magnet || "").trim().toLowerCase();
  const audienceId = AUDIENCES[magnet];

  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: "bad_email" });
  if (!audienceId)          return res.status(400).json({ ok: false, error: "bad_magnet" });

  const fullName = clean(body && body.name, 120);
  const parts = fullName.split(/\s+/).filter(Boolean);
  const contact = { email, unsubscribed: false };
  if (parts.length) { contact.first_name = parts[0]; if (parts.length > 1) contact.last_name = parts.slice(1).join(" "); }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY missing");
    return res.status(200).json({ ok: true, captured: false });
  }

  let captured = false;
  try {
    const r = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    if (r.ok) captured = true;
    else console.error("resend error", r.status, await r.text());
  } catch (e) {
    console.error("resend exception", e);
  }

  // Webinar emails go out even if the audience write failed, so no registration is lost.
  try {
      const w = WEBINARS[magnet];
      if (w) {
        const f = {
          name: fullName, email, role: clean(body.role, 80), city: clean(body.city, 80),
          org: clean(body.org, 160), phone: clean(body.phone, 40), session: body.session === true ? "YES" : "no",
        };
        const rows = Object.entries(f).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0"><b>${k}</b></td><td>${esc(v)}</td></tr>`).join("");
        await sendEmail(key, {
          from: FROM, to: [NOTIFY_TO],
          subject: `${f.session === "YES" ? "SESSION REQUEST: " : ""}Webinar registration: ${f.name || email} (${f.role || "role?"}, ${f.city || "city?"})`,
          html: `<p>New registration for <b>${esc(w.title)}</b> (${esc(w.when)}).</p><table>${rows}</table><p>Add to the outreach CRM. Session requests need a reply within 48 hours.</p>`,
        });
        const first = contact.first_name || "there";
        await sendEmail(key, {
          from: FROM, to: [email], reply_to: NOTIFY_TO,
          subject: "You are registered: Change the question, Sat 12 Dec",
          html: `<p>Hi ${esc(first)},</p><p>You are registered for <b>${esc(w.title)}</b>.</p><p><b>When:</b> ${esc(w.when)}.</p><p>I will email you the joining link before the session, and a reminder the day before. After the session you get the full Counsellor and Educator Toolkit: nine tools, each with a short video and a printable template. If you cannot make it live, you still get the recording and the toolkit.</p><p>If you have a student case you would like us to think about together, just reply to this email.</p><p>Aditya</p><p style="color:#8C8577;font-size:13px">You are getting this because you registered at adityajhunjhunwala.com/counsellors/webinar. Reply "unsubscribe" and we will remove you.</p>`,
        });
      }
  } catch (e) {
    console.error("webinar email exception", e);
  }

  return res.status(200).json({ ok: true, captured });
}
