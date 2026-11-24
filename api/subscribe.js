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

// Webinar registrations: Resend audience (for the reminder and toolkit mails), the outreach CRM
// (contact + org, tag, a call reminder when they ask for a session), and a notification to Adi that
// says whether the CRM write worked. Registrants get a short confirmation.
const WEBINARS = {
  "counsellor-webinar-2026-12-12": {
    crmTag: "Webinar-12Dec2026",
    crmSessionTag: "Session requested", // must exist in the CRM tag registry (Tags page); added in its own call
    notifyCc: ["akshay@letsenterprise.in"], // Akshay Jain, counsellor funnel owner (confirmed by Adi 24 Nov 2026)
    title: "Change the question: three tools you can use the next day",
    when: "Saturday 12 December 2026, 10:00 to 11:30 am IST, online",
  },
};
const FROM = "Aditya Jhunjhunwala <aditya@letters.letsenterprise.in>";
const NOTIFY_TO = "aditya@letsenterprise.in";

function clean(s, n) { return String(s || "").replace(/[\r\n<>]/g, " ").trim().slice(0, n || 200); }
function esc(s) { return clean(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }

// Registrations go into the LE outreach CRM through its agent door (/api/bot, see BOT-API.md in
// adityajh/le-outreach-crm). CRM_BOT_TOKEN is a per-agent token issued on the CRM's Users page;
// without it the CRM step is skipped and the notification email says so.
const CRM = "https://crm.letsenterprise.in/api/bot";

function crmOrgFor(f) {
  const org = f.org;
  switch (f.role) {
    case "School counsellor":
    case "Teacher or principal":
      return org ? { kind: "school", name: org, city: f.city } : { kind: "counsellor", self_employed: true };
    case "College or university educator":
      return org ? { kind: "community", name: org, city: f.city } : { kind: "counsellor", self_employed: true };
    case "Independent career counsellor":
      return org ? { kind: "counsellor", name: org, city: f.city } : { kind: "counsellor", self_employed: true };
    default:
      return org ? { kind: "company", name: org, city: f.city } : { kind: "counsellor", self_employed: true };
  }
}

// Best-effort per-IP rate limit. Serverless instances do not share memory, so this only slows a
// burst hitting one warm instance; the honeypot and timing check below do most of the work.
const HITS = new Map();
function rateLimited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = 5;
  const list = (HITS.get(ip) || []).filter((t) => now - t < win);
  list.push(now); HITS.set(ip, list);
  if (HITS.size > 5000) HITS.clear();
  return list.length > max;
}

async function crmCall(token, path, body, method) {
  const r = await fetch(CRM + path, {
    method: method || "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = {};
  try { j = await r.json(); } catch (e) {}
  return { status: r.status, j };
}

async function toCrm(f, w) {
  const token = process.env.CRM_BOT_TOKEN;
  if (!token) return "skipped (CRM_BOT_TOKEN not set on Vercel)";
  const day = new Date().toISOString().slice(0, 10);
  const notes = `Webinar registration ${day} (${w.when}). Role: ${f.role || "?"}.` +
    (f.session === "YES" ? " Asked for a free session for their students or parents." : "");
  const contact = { name: f.name || f.email, email: f.email, phone: f.phone || undefined, city: f.city || undefined,
    designation: f.role || undefined, notes };
  let made = await crmCall(token, "/contacts/with-org", { contact, org: crmOrgFor(f) });
  let contactId, orgId, how = "added";
  if (made.status === 200 && made.j.ok) {
    contactId = made.j.contact && made.j.contact.id; orgId = made.j.org && made.j.org.id;
  } else if (made.status === 409) {
    const found = await crmCall(token, `/contacts?q=${encodeURIComponent(f.email)}`, null, "GET");
    const c = (found.j.contacts || []).find((x) => (x.email || "").toLowerCase() === f.email);
    if (!c) return `failed: duplicate email but contact not found (${found.status})`;
    contactId = c.id; orgId = c.org && c.org.id; how = "already in CRM, tagged";
    if (c.do_not_contact || c.unsubscribed) how += "; NOTE: this person is marked " + [c.do_not_contact ? "do-not-contact" : "", c.unsubscribed ? "unsubscribed" : ""].filter(Boolean).join(" and ") + " in the CRM. They registered themselves; a person should decide whether to change that";
  } else {
    return `failed: ${made.status} ${(made.j && made.j.message) || ""}`.trim();
  }
  const tagged = await crmCall(token, "/contacts/tags", { ids: [contactId], add: [w.crmTag] });
  if (tagged.status !== 200) how += `; TAG FAILED: ${w.crmTag} (${tagged.status} ${(tagged.j && tagged.j.message) || ""})`;
  if (f.session === "YES" && w.crmSessionTag) {
    const st = await crmCall(token, "/contacts/tags", { ids: [contactId], add: [w.crmSessionTag] });
    if (st.status !== 200) how += `; TAG FAILED: ${w.crmSessionTag} (${st.status} ${(st.j && st.j.message) || ""})`;
  }
  if (f.session === "YES" && orgId) {
    const due = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
    const a = await crmCall(token, "/actions", { org_id: orgId, contact_id: contactId, kind: "call", due_on: due,
      note: `Webinar registrant asked for a free session for their students or parents (${f.city || "city?"}). In person in Pune or Mumbai, online elsewhere.` });
    how += a.status === 200 ? "; call reminder filed" : `; reminder failed (${a.status})`;
  }
  return `${how} (contact ${contactId}, org ${orgId})`;
}

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

  // Spam gate for the webinar form: honeypot, too-fast submit, name required, per-IP burst limit.
  // Bots get a normal-looking success so they do not retry; nothing is written anywhere.
  if (WEBINARS[magnet]) {
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    const tookMs = Number(body && body.t) || 0;
    const name = clean(body && body.name, 120);
    if ((body && body.website) || (tookMs && tookMs < 2500)) return res.status(200).json({ ok: true, captured: true });
    if (name.length < 2) return res.status(400).json({ ok: false, error: "bad_name" });
    if (rateLimited(ip)) return res.status(429).json({ ok: false, error: "rate_limited" });
  }

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
        let crm;
      try { crm = await toCrm(f, w); } catch (e) { crm = "failed: " + (e && e.message); console.error("crm", e); }
      const rows = Object.entries({ ...f, crm }).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0"><b>${k}</b></td><td>${esc(v)}</td></tr>`).join("");
        await sendEmail(key, {
          from: FROM, to: [NOTIFY_TO], ...(w.notifyCc && w.notifyCc.length ? { cc: w.notifyCc } : {}),
          subject: `${f.session === "YES" ? "SESSION REQUESTED: " : ""}${crm.startsWith("failed") || crm.startsWith("skipped") ? "[NOT IN CRM] " : ""}Webinar registration: ${f.name || email} (${f.role || "role?"}, ${f.city || "city?"})`,
          html: `<p>New registration for <b>${esc(w.title)}</b> (${esc(w.when)}).</p><table>${rows}</table><p>${crm.startsWith("added") || crm.startsWith("already") ? "In the outreach CRM, tagged " + esc(w.crmTag) + "." : "<b>Not in the CRM yet. Add by hand.</b>"} Session requests need a reply within 48 hours.</p>`,
        });
        const first = contact.first_name || "there";
        await sendEmail(key, {
          from: FROM, to: [email], reply_to: NOTIFY_TO,
          subject: "You are registered: Change the question, Sat 12 Dec",
          html: `<p>Hi ${esc(first)},</p><p>You are registered for <b>${esc(w.title)}</b>.</p><p><b>When:</b> ${esc(w.when)}.</p><p><b>Something to use tomorrow:</b> <a href="https://www.adityajhunjhunwala.com/counsellors/webinar/eight-questions-before-which-college.pdf">Eight questions to ask before &ldquo;which college?&rdquo;</a> (one-page PDF). Print it, ask the student and the parent separately, and start with the rows where their answers differ.</p><p>I will email you the joining link before the session, and a reminder the day before. After the session you get the full Counsellor and Educator Toolkit: nine tools, each with a short video and a printable template. If you cannot make it live, you still get the recording and the toolkit.</p><p>If you have a student case you would like us to think about together, just reply to this email.</p><p>Aditya</p><p style="color:#8C8577;font-size:13px">You are getting this because you registered at adityajhunjhunwala.com/counsellors/webinar. Reply "unsubscribe" and we will remove you.</p>`,
        });
      }
  } catch (e) {
    console.error("webinar email exception", e);
  }

  return res.status(200).json({ ok: true, captured });
}
