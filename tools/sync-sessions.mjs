// Keeps the two static copies that come from counsellors/sessions.js in step:
//   1. vercel.json: a /join/<id> redirect per session (placeholder until a real Zoom URL is pasted in;
//      existing destinations are never touched, and a catch-all keeps any new id working meanwhile).
//   2. counsellors/webinar/index.html: the static JSON-LD (one Event per session) for crawlers.
// Run after adding a date:  node tools/sync-sessions.mjs      Check only:  node tools/sync-sessions.mjs --check
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import SESSIONS from "../counsellors/sessions.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.adityajhunjhunwala.com";
const PLACEHOLDER = SITE + "/counsellors/webinar/#join-soon";
const check = process.argv.includes("--check");
let stale = [];

// ---- 1. vercel.json redirects ----------------------------------------------------------------
const vPath = path.join(ROOT, "vercel.json");
const vercel = JSON.parse(fs.readFileSync(vPath, "utf8"));
const redirects = vercel.redirects || [];
const isJoin = (r) => /^\/join\//.test(r.source);
const others = redirects.filter((r) => !isJoin(r));
const known = new Map(redirects.filter(isJoin).map((r) => [r.source, r]));
const join = SESSIONS.map((s) => known.get(s.joinPath) || { source: s.joinPath, destination: PLACEHOLDER, permanent: false });
// Keep redirects for dates that have been removed from the list (old emails still point at them).
for (const [src, r] of known) if (src !== "/join/:id" && !join.find((j) => j.source === src)) join.push(r);
join.push(known.get("/join/:id") || { source: "/join/:id", destination: PLACEHOLDER, permanent: false });
const next = { ...vercel, redirects: [...others, ...join] };
const vOut = JSON.stringify(next, null, 2) + "\n";
if (vOut !== fs.readFileSync(vPath, "utf8")) stale.push("vercel.json");
if (!check) fs.writeFileSync(vPath, vOut);

// ---- 2. JSON-LD in the webinar page ----------------------------------------------------------
const pPath = path.join(ROOT, "counsellors/webinar/index.html");
const html = fs.readFileSync(pPath, "utf8");
const page = SITE + "/counsellors/webinar/";
const events = SESSIONS.map((s) => ({
  "@context": "https://schema.org", "@type": "Event",
  name: "Change the question: three tools you can use the next day",
  description: "A free 90-minute working session for career counsellors and educators. Three tools run live on real student cases; registrants get the recording and printable templates for the three tools.",
  startDate: s.start, endDate: s.end,
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
  location: { "@type": "VirtualLocation", url: page },
  image: [page + "og.jpg"],
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR", availability: "https://schema.org/InStock", url: page,
    validFrom: new Date(Math.max(Date.parse("2026-11-24T00:00:00+05:30"), Date.parse(s.start) - 30 * 864e5) + 330 * 60e3).toISOString().slice(0, 19) + "+05:30" },
  organizer: { "@type": "Person", name: "Aditya Jhunjhunwala", url: SITE + "/" },
  performer: { "@type": "Person", name: "Aditya Jhunjhunwala", alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Indian Institute of Management Ahmedabad" },
    { "@type": "CollegeOrUniversity", name: "Maharashtra Institute of Technology, Pune" }] },
}));
const ld = "[\n" + events.map((e) => JSON.stringify(e)).join(",\n") + "\n]";
const re = /(<script type="application\/ld\+json" id="ld-sessions">\n)[\s\S]*?(\n<\/script>)/;
if (!re.test(html)) throw new Error("JSON-LD block with id=ld-sessions not found in " + pPath);
const hOut = html.replace(re, (m, a, b) => a + ld + b);
if (hOut !== html) stale.push("counsellors/webinar/index.html (JSON-LD)");
if (!check) fs.writeFileSync(pPath, hOut);

if (check) {
  if (stale.length) { console.error("Out of step with counsellors/sessions.js: " + stale.join(", ") + ". Run node tools/sync-sessions.mjs"); process.exit(1); }
  console.log("vercel.json and the webinar JSON-LD match counsellors/sessions.js (" + SESSIONS.length + " sessions).");
} else {
  console.log(stale.length ? "Updated: " + stale.join(", ") : "Already in step, nothing to change.");
}
