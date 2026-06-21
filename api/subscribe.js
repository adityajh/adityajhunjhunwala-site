// Vercel serverless function: capture a magnet lead into a Resend audience.
// Deploys to the site repo as  api/subscribe.js  (served at /api/subscribe).
// POST { email, magnet }  ->  adds the contact to the matching audience.
// The landing page reveals/links the deliverable regardless of this result, so a
// hiccup here never blocks the payoff.

const AUDIENCES = {
  cv:        "1aca0713-388d-4984-a705-600beb4bc093", // Magnet — CV (Comment CV / IG)
  open:      "5f3a3506-2bc7-4092-83dc-e365d1f72884", // Magnet — OPEN (Comment OPEN / IG)
  portfolio: "964241d7-e734-4287-b671-dfa8d7168e31", // Magnet — Portfolio (Build your proof of work)
};

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

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY missing");
    return res.status(200).json({ ok: true, captured: false });
  }

  try {
    const r = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
    if (!r.ok) {
      console.error("resend error", r.status, await r.text());
      return res.status(200).json({ ok: true, captured: false });
    }
    return res.status(200).json({ ok: true, captured: true });
  } catch (e) {
    console.error("resend exception", e);
    return res.status(200).json({ ok: true, captured: false });
  }
}
