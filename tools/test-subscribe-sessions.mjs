// Offline test for api/subscribe.js with the session list. Mocks fetch (Resend + CRM) and the clock.
// Nothing leaves this machine.   Run:  node tools/test-subscribe-sessions.mjs
import assert from "node:assert/strict";
import SESSIONS from "../counsellors/sessions.js";

process.env.RESEND_API_KEY = "re_test_dummy";
process.env.CRM_BOT_TOKEN = "crm_test_dummy";

// ---- fake clock -----------------------------------------------------------------------------
const realNow = Date.now;
function setNow(iso) { const t = Date.parse(iso); Date.now = () => t; }

// ---- fake fetch -----------------------------------------------------------------------------
let calls = [], failWhen = null;
function resp(status, obj) {
  return { ok: status >= 200 && status < 300, status, headers: { get: () => null },
    json: async () => obj, text: async () => JSON.stringify(obj) };
}
globalThis.fetch = async (url, opts = {}) => {
  const body = opts.body ? JSON.parse(opts.body) : null;
  const call = { url: String(url), method: opts.method || "GET", headers: opts.headers || {}, body };
  calls.push(call);
  if (/^https:\/\/(www\.)?adityajhunjhunwala\.com/.test(call.url)) throw new Error("test must never call the live site");
  if (failWhen && failWhen(call)) return resp(500, { message: "mock failure" });
  if (call.url.startsWith("https://crm.letsenterprise.in/api/bot")) {
    if (call.url.endsWith("/contacts/with-org")) return resp(200, { ok: true, contact: { id: 101 }, org: { id: 202 } });
    return resp(200, { ok: true });
  }
  if (call.url.startsWith("https://api.resend.com/")) return resp(200, { id: "mock" });
  throw new Error("unexpected fetch " + call.url);
};

const { default: handler } = await import("../api/subscribe.js");

let ipN = 0;
async function post(body, ip) {
  calls = [];
  const res = { code: 0, json: null, headers: {},
    status(c) { this.code = c; return this; }, json(j) { this.jsonBody = j; return this; }, setHeader(k, v) { this.headers[k] = v; } };
  await handler({ method: "POST", headers: { "x-forwarded-for": ip || `10.0.0.${++ipN}` }, body }, res);
  return { code: res.code, body: res.jsonBody };
}
const base = { name: "Asha Rao", email: "asha@example.com", role: "School counsellor", city: "Pune", org: "Green Valley School",
  phone: "", website: "", t: 9000, page: "/counsellors/webinar/" };
const emails = () => calls.filter((c) => c.url === "https://api.resend.com/emails").map((c) => c.body);
const crmTags = () => calls.filter((c) => c.url.endsWith("/contacts/tags")).flatMap((c) => c.body.add);
const BANNED = /[\u2014\u2013\u00B7\u2192]/; // em dash, en dash, middle dot, arrow

let n = 0;
async function test(name, fn) { await fn(); n++; console.log("  ok  " + name); }

console.log("subscribe.js with sessions (" + SESSIONS.length + " sessions in counsellors/sessions.js)");

await test("new form: 2026-12-12 chosen on 25 Nov, three reminders at 3d / 1d / 1h before", async () => {
  setNow("2026-11-25T11:00:00+05:30");
  const r = await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-12", request_session: false });
  assert.equal(r.code, 200); assert.equal(r.body.ok, true);
  assert.deepEqual(crmTags(), ["Webinar-12Dec2026"]);
  const [conf, ...rest] = emails();
  assert.equal(conf.to[0], "asha@example.com");
  assert.match(conf.subject, /Sat 12 Dec/);
  assert.match(conf.html, /Saturday 12 December 2026, 10:00 to 11:30 am IST/);
  assert.match(conf.html, /https:\/\/www\.adityajhunjhunwala\.com\/join\/2026-12-12/);
  assert.match(conf.html, /eight-questions-before-which-college\.pdf/);
  assert.match(conf.html, /calendar\.google\.com.*dates=20261212T043000Z\/20261212T060000Z/);
  assert.doesNotMatch(JSON.stringify(emails()), /zoom/i);
  const ics = Buffer.from(conf.attachments[0].content, "base64").toString();
  assert.match(ics, /DTSTART:20261212T043000Z\r\nDTEND:20261212T060000Z/);
  assert.match(ics, /URL:https:\/\/www\.adityajhunjhunwala\.com\/join\/2026-12-12/);
  assert.ok(ics.split("\r\n").every((l) => l.length <= 75), "ics lines folded");
  const rem = rest.filter((e) => e.scheduled_at);
  assert.deepEqual(rem.map((e) => e.scheduled_at), ["2026-12-09T04:30:00.000Z", "2026-12-11T04:30:00.000Z", "2026-12-12T03:30:00.000Z"]);
  rem.forEach((e) => { assert.match(e.html, /\/join\/2026-12-12/); assert.equal(e.to[0], "asha@example.com"); });
  const remCalls = calls.filter((c) => c.body && c.body.scheduled_at);
  assert.ok(remCalls.every((c) => c.headers["Idempotency-Key"].startsWith("reminder-2026-12-12-")));
  const note = rest.find((e) => e.to[0] === "aditya@letsenterprise.in");
  assert.match(note.subject, /^Webinar Sat 12 Dec: Asha Rao/);
  assert.deepEqual(note.cc, ["akshay@letsenterprise.in"]);
  assert.match(note.html, /tagged Webinar-12Dec2026/);
  assert.doesNotMatch(note.html, /failed to schedule/);
  console.log("        scheduled_at:", rem.map((e) => e.scheduled_at).join(", "));
});

await test("new form: 'I'd also like a session' adds the Session requested tag and a call reminder", async () => {
  setNow("2026-12-13T09:00:00+05:30");
  const r = await post({ ...base, magnet: "counsellor-webinar", session: "2027-01-09", request_session: true });
  assert.equal(r.code, 200);
  assert.deepEqual(crmTags(), ["Webinar-09Jan2027", "Session requested"]);
  assert.ok(calls.some((c) => c.url.endsWith("/actions")));
  const note = emails().find((e) => e.to[0] === "aditya@letsenterprise.in");
  assert.match(note.subject, /^SESSION REQUESTED: Webinar Sat 9 Jan:/);
});

await test("legacy page: magnet counsellor-webinar-2026-12-12, no date, session:true is the old checkbox", async () => {
  setNow("2026-11-25T11:00:00+05:30");
  const r = await post({ ...base, magnet: "counsellor-webinar-2026-12-12", session: true });
  assert.equal(r.code, 200);
  assert.deepEqual(crmTags(), ["Webinar-12Dec2026", "Session requested"]);
  assert.ok(calls.some((c) => c.url.includes("/audiences/6c7c5d80-3b4e-4cb4-951e-618af23d4987/contacts")));
  assert.match(emails()[0].subject, /Sat 12 Dec/);
  assert.equal(emails().filter((e) => e.scheduled_at).length, 3);
});

await test("unknown session id: 400 bad_session, nothing written", async () => {
  setNow("2026-11-25T11:00:00+05:30");
  const r = await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-19" });
  assert.equal(r.code, 400); assert.equal(r.body.error, "bad_session"); assert.ok(r.body.message);
  assert.equal(calls.length, 0);
  const r2 = await post({ ...base, magnet: "counsellor-webinar" });
  assert.equal(r2.code, 400); assert.equal(r2.body.error, "bad_session");
  console.log("        message:", r.body.message);
});

await test("past session: 400 past_session (new form and legacy magnet), nothing written", async () => {
  setNow("2026-12-13T08:00:00+05:30");
  const r = await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-12" });
  assert.equal(r.code, 400); assert.equal(r.body.error, "past_session");
  const r2 = await post({ ...base, magnet: "counsellor-webinar-2026-12-12", session: false });
  assert.equal(r2.code, 400); assert.equal(r2.body.error, "past_session");
  setNow("2026-12-26T10:00:00+05:30"); // the moment it starts counts as past
  const r3 = await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-26" });
  assert.equal(r3.code, 400);
  assert.equal(calls.length, 0);
  console.log("        message:", r.body.message);
});

await test("2 hours before a session: only the 1-hour reminder is scheduled", async () => {
  setNow("2026-12-26T08:00:00+05:30");
  const r = await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-26" });
  assert.equal(r.code, 200);
  const rem = emails().filter((e) => e.scheduled_at);
  assert.deepEqual(rem.map((e) => e.scheduled_at), ["2026-12-26T03:30:00.000Z"]);
  const note = emails().find((e) => e.to[0] === "aditya@letsenterprise.in");
  assert.match(note.html, /3 days before: skipped/); assert.doesNotMatch(note.html, /failed to schedule/);
});

await test("69 minutes before: the 1-hour reminder (9 minutes away) is skipped too", async () => {
  setNow("2026-12-26T08:51:00+05:30");
  await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-26" });
  assert.equal(emails().filter((e) => e.scheduled_at).length, 0);
});

await test("a reminder that fails to schedule does not fail the registration; Aditya is told which", async () => {
  setNow("2026-11-25T11:00:00+05:30");
  failWhen = (c) => c.body && c.body.scheduled_at === "2026-12-11T04:30:00.000Z";
  const r = await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-12" });
  failWhen = null;
  assert.equal(r.code, 200); assert.equal(r.body.ok, true);
  const note = emails().find((e) => e.to[0] === "aditya@letsenterprise.in");
  assert.match(note.html, /Reminders that failed to schedule: 1 day before\./);
});

await test("CRM down: registration still succeeds, notification says NOT IN CRM", async () => {
  setNow("2026-11-25T11:00:00+05:30");
  failWhen = (c) => c.url.startsWith("https://crm.");
  const r = await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-12" });
  failWhen = null;
  assert.equal(r.code, 200);
  assert.match(emails().find((e) => e.to[0] === "aditya@letsenterprise.in").subject, /\[NOT IN CRM\]/);
});

await test("safety: honeypot and too-fast submits get a silent success; missing name 400; rate limit 429", async () => {
  setNow("2026-11-25T11:00:00+05:30");
  let r = await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-12", website: "spam.example" });
  assert.equal(r.code, 200); assert.equal(calls.length, 0);
  r = await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-12", t: 900 });
  assert.equal(r.code, 200); assert.equal(calls.length, 0);
  r = await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-12", name: "A" });
  assert.equal(r.code, 400); assert.equal(r.body.error, "bad_name");
  r = await post({ ...base, email: "not-an-email", magnet: "counsellor-webinar", session: "2026-12-12" });
  assert.equal(r.body.error, "bad_email");
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await post({ ...base, magnet: "counsellor-webinar", session: "2026-12-12" }, "10.9.9.9")).code);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
});

await test("other magnets are untouched (letters: one audience call, no emails)", async () => {
  const r = await post({ email: "x@example.com", magnet: "letters", session: "2026-12-12" });
  assert.equal(r.code, 200); assert.equal(calls.length, 1); assert.match(calls[0].url, /audiences\/c58a5996/);
});

await test("every session in the list: valid dates, tag, join path; emails free of banned characters", async () => {
  const ids = new Set();
  for (const s of SESSIONS) {
    assert.ok(!ids.has(s.id)); ids.add(s.id);
    assert.match(s.start, /^\d{4}-\d\d-\d\dT10:00:00\+05:30$/); assert.match(s.end, /T11:30:00\+05:30$/);
    assert.equal(s.joinPath, "/join/" + s.id); assert.match(s.crmTag, /^Webinar-\d\d[A-Z][a-z]{2}\d{4}$/);
    assert.equal(new Date(s.start).getUTCDay(), 6, s.id + " is a Saturday");
    setNow(new Date(Date.parse(s.start) - 20 * 864e5).toISOString());
    const r = await post({ ...base, magnet: "counsellor-webinar", session: s.id, request_session: true });
    assert.equal(r.code, 200);
    assert.deepEqual(crmTags(), [s.crmTag, "Session requested"]);
    for (const e of emails()) assert.doesNotMatch(e.subject + e.html, BANNED, "banned character in " + e.subject);
  }
});

await test("vercel.json redirects and the webinar JSON-LD match the session list", async () => {
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, [new URL("./sync-sessions.mjs", import.meta.url).pathname, "--check"], { stdio: "pipe" });
  const v = JSON.parse((await import("node:fs")).readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  for (const s of SESSIONS) assert.ok(v.redirects.find((r) => r.source === s.joinPath && r.permanent === false), s.joinPath);
  assert.equal(v.buildCommand, "npm run build"); assert.equal(v.outputDirectory, "_site");
});

Date.now = realNow;
console.log(`\n${n} tests passed`);
