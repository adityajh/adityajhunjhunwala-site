// Vercel serverless function: capture a magnet lead into a Resend audience.
// Deploys to the site repo as  api/subscribe.js  (served at /api/subscribe).
// POST { email, magnet }  ->  adds the contact to the matching audience.
// The landing page reveals/links the deliverable regardless of this result, so a
// hiccup here never blocks the payoff.

// The live-session dates live in one list, shared with the counsellor pages.
import SESSIONS from "../counsellors/sessions.js";

const AUDIENCES = {
  cv:        "1aca0713-388d-4984-a705-600beb4bc093", // Magnet: CV (Comment CV / IG)
  open:      "5f3a3506-2bc7-4092-83dc-e365d1f72884", // Magnet: OPEN (Comment OPEN / IG)
  portfolio: "964241d7-e734-4287-b671-dfa8d7168e31", // Magnet: Portfolio (Build your proof of work)
  letters:   "c58a5996-3a4d-4b59-9535-dd046c8c4a4b", // AdiLetters (Eat. Play. Love. weekly letter)
  pyma:      "e7dfca31-3954-48ed-bfae-84e88f62115b", // Magnet: PYMA (career archetype session)
  "counsellor-webinar-2026-12-12": "6c7c5d80-3b4e-4cb4-951e-618af23d4987", // Webinar: Change the question (12 Dec 2026), /counsellors/webinar
  "counsellor-webinar":            "6c7c5d80-3b4e-4cb4-951e-618af23d4987", // same audience, all dates of the series (the date is in the CRM tag)
};

// Webinar registrations: Resend audience, the outreach CRM (contact + org, the session's date tag,
// a call reminder when they ask for a session), a confirmation with the joining link and a calendar
// invite, three scheduled reminders, and a notification to Adi that says what worked.
// The session (date) comes from the "session" field, one of the ids in counsellors/sessions.js.
// The old one-date magnet still works without it, so the page that is live during a deploy keeps working.
const WEBINAR_MAGNETS = {
  "counsellor-webinar": null,                       // the series: "session" is required
  "counsellor-webinar-2026-12-12": "2026-12-12",    // legacy single-date page
};
const WEBINAR = {
  crmSessionTag: "Session requested", // must exist in the CRM tag registry (Tags page); added in its own call
  notifyCc: ["akshay@letsenterprise.in"], // Akshay Jain, counsellor funnel owner (confirmed by Adi 24 Nov 2026)
  title: "Change the question: three tools you can use the next day",
};
const SITE = "https://www.adityajhunjhunwala.com";
const SHEET = SITE + "/counsellors/webinar/eight-questions-before-which-college.pdf";
const MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;
// Resend's scheduled_at accepts up to 30 days ahead; anything closer than 10 minutes is not worth scheduling.
const REMINDERS = [
  { key: "3d", before: 3 * DAY, name: "3 days before" },
  { key: "1d", before: DAY, name: "1 day before" },
  { key: "1h", before: HOUR, name: "1 hour before" },
];
const SCHEDULE_MIN_LEAD = 10 * MIN, SCHEDULE_MAX_AHEAD = 30 * DAY;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Dates for people, always in IST whatever the server clock's zone is.
function ist(iso) {
  const d = new Date(Date.parse(iso) + 330 * MIN);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() };
}
function sessionInfo(s) {
  const a = ist(s.start), b = ist(s.end);
  const t = (x) => `${x.h > 12 ? x.h - 12 : x.h}:${String(x.mi).padStart(2, "0")}`;
  const long = `${s.label} ${a.y}`;                               // Saturday 12 December 2026
  const short = `${s.label.slice(0, 3)} ${a.d} ${MONTHS[a.m].slice(0, 3)}`; // Sat 12 Dec
  return {
    ...s, long, short,
    startMs: Date.parse(s.start), endMs: Date.parse(s.end),
    when: `${long}, ${t(a)} to ${t(b)} ${b.h >= 12 ? "pm" : "am"} IST, online`,
    joinUrl: SITE + s.joinPath,
    joinText: SITE.replace("https://www.", "") + s.joinPath,
  };
}
// Returns { s } for a valid upcoming session, or { error, message } for a 400.
function pickSession(id, now) {
  const raw = SESSIONS.find((x) => x.id === id);
  if (!raw) return { error: "bad_session", message: "That date is not one of the session dates. Please pick a date on the page." };
  const s = sessionInfo(raw);
  if (s.startMs <= now) return { error: "past_session", message: `The ${s.short} session has already started. Please pick a later date.` };
  return { s };
}

function icsStamp(ms) { return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
function icsText(v) { return String(v).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
function icsFold(line) { // 75-octet lines (our text is ASCII)
  const out = []; let l = line;
  while (l.length > 75) { out.push(l.slice(0, 75)); l = " " + l.slice(75); }
  out.push(l); return out.join("\r\n");
}
function calendar(s, now) {
  const title = "Change the question: live session for counsellors (Aditya Jhunjhunwala)";
  const details = `Free 90-minute working session. Three tools run live on real student cases. Join here: ${s.joinUrl}`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//adityajhunjhunwala.com//webinar//EN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:counsellor-webinar-${s.id.replace(/-/g, "")}@adityajhunjhunwala.com`, `DTSTAMP:${icsStamp(now)}`,
    `DTSTART:${icsStamp(s.startMs)}`, `DTEND:${icsStamp(s.endMs)}`,
    `SUMMARY:${icsText(title)}`, `DESCRIPTION:${icsText(details)}`, `LOCATION:${icsText(s.joinUrl)}`, `URL:${s.joinUrl}`,
    "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Starts in 30 minutes", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].map(icsFold).join("\r\n") + "\r\n";
  const gcal = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(title) +
    `&dates=${icsStamp(s.startMs)}/${icsStamp(s.endMs)}&details=` + encodeURIComponent(details) + "&location=" + encodeURIComponent(s.joinUrl);
  return { ics, gcal, filename: `change-the-question-${s.id}.ics` };
}

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

async function toCrm(f, s) {
  const token = process.env.CRM_BOT_TOKEN;
  if (!token) return "skipped (CRM_BOT_TOKEN not set on Vercel)";
  const day = new Date(Date.now()).toISOString().slice(0, 10);
  const notes = `Webinar registration ${day} (${s.when}). Role: ${f.role || "?"}.` +
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
  const tagged = await crmCall(token, "/contacts/tags", { ids: [contactId], add: [s.crmTag] });
  if (tagged.status !== 200) how += `; TAG FAILED: ${s.crmTag} (${tagged.status} ${(tagged.j && tagged.j.message) || ""})`;
  if (f.session === "YES" && WEBINAR.crmSessionTag) {
    const st = await crmCall(token, "/contacts/tags", { ids: [contactId], add: [WEBINAR.crmSessionTag] });
    if (st.status !== 200) how += `; TAG FAILED: ${WEBINAR.crmSessionTag} (${st.status} ${(st.j && st.j.message) || ""})`;
  }
  if (f.session === "YES" && orgId) {
    const due = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
    const a = await crmCall(token, "/actions", { org_id: orgId, contact_id: contactId, kind: "call", due_on: due,
      note: `Webinar registrant asked for a free session for their students or parents (${f.city || "city?"}). In person in Pune or Mumbai, online elsewhere.` });
    how += a.status === 200 ? "; call reminder filed" : `; reminder failed (${a.status})`;
  }
  return `${how} (contact ${contactId}, org ${orgId})`;
}

// Returns { ok, status, detail }. Never throws. Retries a 429 (Resend allows about 2 requests a
// second per team, and one registration now makes up to six calls).
async function sendEmail(key, payload, idempotencyKey) {
  for (let attempt = 0; ; attempt++) {
    try {
      const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
      if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
      const r = await fetch("https://api.resend.com/emails", { method: "POST", headers, body: JSON.stringify(payload) });
      if (r.ok) return { ok: true, status: r.status };
      const detail = (await r.text().catch(() => "")).slice(0, 200);
      if (r.status === 429 && attempt < 2) {
        const wait = Math.min(2000, (Number(r.headers && r.headers.get && r.headers.get("retry-after")) || 1) * 1000);
        await new Promise((ok) => setTimeout(ok, wait));
        continue;
      }
      console.error("resend email error", r.status, detail);
      return { ok: false, status: r.status, detail };
    } catch (e) {
      console.error("resend email exception", e);
      return { ok: false, status: 0, detail: String(e && e.message || e) };
    }
  }
}

const FOOT = `<p style="color:#8C8577;font-size:13px">You are getting this because you registered at adityajhunjhunwala.com/counsellors/webinar. Reply "unsubscribe" and we will remove you.</p>`;
const joinLine = (s) => `<p><b>Your joining link:</b> <a href="${s.joinUrl}">${s.joinText}</a></p>`;

function reminderEmail(kind, s, first) {
  const hi = `<p>Hi ${esc(first)},</p>`;
  if (kind === "3d") return {
    subject: `In 3 days: Change the question, ${s.short}, 10:00 am IST`,
    html: `${hi}<p>A short reminder: <b>${esc(WEBINAR.title)}</b> is on ${esc(s.when)}.</p>${joinLine(s)}<p>The link goes live a day before the session. If you have a student case you would like us to think about together, just reply to this email.</p><p>Aditya</p>${FOOT}`,
  };
  if (kind === "1d") return {
    subject: `Tomorrow, 10:00 am IST: Change the question`,
    html: `${hi}<p>See you tomorrow, ${esc(s.long)}, 10:00 am IST. Ninety minutes, three tools, run live on real student cases.</p>${joinLine(s)}<p>Keep the <a href="${SHEET}">Eight questions sheet</a> handy if you have printed it.</p><p>Aditya</p>${FOOT}`,
  };
  return {
    subject: `Starting in an hour: Change the question`,
    html: `${hi}<p>We start in an hour, at 10:00 am IST.</p>${joinLine(s)}<p>See you there.</p><p>Aditya</p>${FOOT}`,
  };
}

// Schedules the three reminders. Returns one line per reminder for the notification email.
async function scheduleReminders(key, s, email, first, now) {
  const out = [];
  for (const r of REMINDERS) {
    const at = s.startMs - r.before;
    if (at - now < SCHEDULE_MIN_LEAD) { out.push({ name: r.name, state: "skipped", note: "too close to the session" }); continue; }
    if (at - now > SCHEDULE_MAX_AHEAD) { out.push({ name: r.name, state: "failed", note: "more than 30 days ahead, Resend cannot schedule it" }); continue; }
    const m = reminderEmail(r.key, s, first);
    const res = await sendEmail(key, { from: FROM, to: [email], reply_to: NOTIFY_TO, subject: m.subject, html: m.html,
      scheduled_at: new Date(at).toISOString() }, `reminder-${s.id}-${r.key}-${email}`.slice(0, 256));
    if (res.ok) out.push({ name: r.name, state: "scheduled", at });
    else if (res.status === 409) out.push({ name: r.name, state: "scheduled", at, note: "already scheduled by an earlier registration today" });
    else out.push({ name: r.name, state: "failed", note: `Resend ${res.status} ${res.detail || ""}`.trim() });
  }
  return out;
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

  // Spam gate for the webinar form: honeypot, too-fast submit, name required, a real upcoming
  // session date, per-IP burst limit. Bots get a normal-looking success so they do not retry;
  // nothing is written anywhere.
  const isWebinar = Object.prototype.hasOwnProperty.call(WEBINAR_MAGNETS, magnet);
  const now = Date.now();
  let sess = null;
  if (isWebinar) {
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    const tookMs = Number(body && body.t) || 0;
    const name = clean(body && body.name, 120);
    if ((body && body.website) || (tookMs && tookMs < 2500)) return res.status(200).json({ ok: true, captured: true });
    if (name.length < 2) return res.status(400).json({ ok: false, error: "bad_name" });
    // "session" is the date id. The old page sent session: true/false for "I'd also like a session
    // for my students or parents", so only a string counts as a date.
    const sid = typeof body.session === "string" ? body.session.trim() : WEBINAR_MAGNETS[magnet];
    const picked = pickSession(sid || "", now);
    if (picked.error) return res.status(400).json({ ok: false, error: picked.error, message: picked.message });
    sess = picked.s;
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
  // Order: confirmation first (the registrant matters most), then the reminders, then the
  // notification, which reports on both the CRM write and the reminders.
  if (sess) {
    try {
      const s = sess;
      const asked = body.request_session === true || body.session === true; // new field; old page used session: true
      const f = {
        name: fullName, email, date: s.short, role: clean(body.role, 80), city: clean(body.city, 80),
        org: clean(body.org, 160), phone: clean(body.phone, 40), session: asked ? "YES" : "no",
      };
      let crm;
      try { crm = await toCrm(f, s); } catch (e) { crm = "failed: " + (e && e.message); console.error("crm", e); }

      const first = contact.first_name || "there";
      const cal = calendar(s, now);
      const conf = await sendEmail(key, {
        from: FROM, to: [email], reply_to: NOTIFY_TO,
        subject: `You are registered: Change the question, ${s.short}`,
        html: `<p>Hi ${esc(first)},</p><p>You are registered for <b>${esc(WEBINAR.title)}</b>.</p><p><b>When:</b> ${esc(s.when)}.</p>${joinLine(s)}<p>The link goes live a day before the session, and I will send it again in a reminder before we start. <a href="${cal.gcal}">Add it to Google Calendar</a>, or open the invite attached to this email for Apple or Outlook.</p><p><b>Something to use tomorrow:</b> <a href="${SHEET}">Eight questions to ask before &ldquo;which college?&rdquo;</a> (one-page PDF). Print it, ask the student and the parent separately, and start with the rows where their answers differ.</p><p>After the session you get the recording and printable templates for the three tools we run live. If you cannot make it live, you still get both.</p><p>If you have a student case you would like us to think about together, just reply to this email.</p><p>Aditya</p>${FOOT}`,
        attachments: [{ filename: cal.filename, content: Buffer.from(cal.ics, "utf8").toString("base64"), content_type: "text/calendar; charset=utf-8; method=PUBLISH" }],
      });

      let reminders;
      try { reminders = await scheduleReminders(key, s, email, first, now); }
      catch (e) { reminders = REMINDERS.map((r) => ({ name: r.name, state: "failed", note: String(e && e.message || e) })); }
      const failed = reminders.filter((r) => r.state === "failed");
      const fmt = (at) => { const x = ist(new Date(at).toISOString()); return `${x.d} ${MONTHS[x.m].slice(0, 3)}, ${String(x.h).padStart(2, "0")}:${String(x.mi).padStart(2, "0")} IST`; };
      const remLine = reminders.map((r) => `${r.name}: ${r.state}${r.at ? " for " + fmt(r.at) : ""}${r.note ? " (" + r.note + ")" : ""}`).join("; ");

      const rows = Object.entries({ ...f, crm, reminders: remLine }).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;vertical-align:top"><b>${k}</b></td><td>${esc(v)}</td></tr>`).join("");
      await sendEmail(key, {
        from: FROM, to: [NOTIFY_TO], ...(WEBINAR.notifyCc.length ? { cc: WEBINAR.notifyCc } : {}),
        subject: `${f.session === "YES" ? "SESSION REQUESTED: " : ""}${crm.startsWith("failed") || crm.startsWith("skipped") ? "[NOT IN CRM] " : ""}Webinar ${s.short}: ${f.name || email} (${f.role || "role?"}, ${f.city || "city?"})`,
        html: `<p>New registration for <b>${esc(WEBINAR.title)}</b> (${esc(s.when)}).</p><table>${rows}</table><p>${crm.startsWith("added") || crm.startsWith("already") ? "In the outreach CRM, tagged " + esc(s.crmTag) + "." : "<b>Not in the CRM yet. Add by hand.</b>"} Session requests need a reply within 48 hours.</p>` +
          (failed.length ? `<p><b>Reminders that failed to schedule: ${esc(failed.map((r) => r.name).join(", "))}.</b> They will not go out on their own; send them by hand if you want them.</p>` : "") +
          (conf.ok ? "" : `<p><b>The confirmation email to ${esc(email)} failed (Resend ${conf.status}).</b> Please write to them by hand.</p>`),
      });
    } catch (e) {
      console.error("webinar email exception", e);
    }
  }

  return res.status(200).json({ ok: true, captured });
}
