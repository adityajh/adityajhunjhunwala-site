---
layout: base.njk
title: "Build Your Proof of Work"
description: "A free kit for anyone 17 to 26: how to build a portfolio with no experience, the cold email that gets a yes, and real openings in India that pay you to build. From Aditya Jhunjhunwala."
permalink: /portfolio/
image: /images/adi-headshot.jpg
---
<div class="page-wrap" data-pagefind-body>
<span class="gold-rule"></span>

# Build your proof of work

**A starter kit for anyone who is done waiting for permission.**

---

A degree gets you the interview. It does not get you the job. What a selector actually looks for is evidence of what you have done. Not a line on a resume. A thing you actually built.

This page is the kit I would hand a 19-year-old with no experience and no connections. Three parts. Open it, pick one project, and start today.

<!-- Magnet capture card — inject into pages/portfolio.md right after the intro
     ("Three parts. Open it, pick one project, and start today.") and before the first ---.
     Non-gating: the kit stays fully visible; this just captures the email into Resend. -->
<div id="pf-capture" style="margin:30px 0;padding:24px 24px 20px;border:2px solid #1A1A2E;border-radius:14px;background:#FFFDF8;">
  <div style="font-weight:700;font-size:18px;color:#1A1A2E;margin-bottom:4px;">Want this kit sent to you, plus the weekly letter?</div>
  <div style="font-size:15px;color:#6F6A5C;margin-bottom:14px;">Drop your email. I will send the kit and the one letter a week where the rest of this lives.</div>
  <form id="pf-form" style="display:flex;gap:10px;flex-wrap:wrap;" novalidate>
    <input id="pf-email" type="email" placeholder="you@email.com" autocomplete="email"
      style="flex:1 1 240px;min-width:0;padding:13px 15px;font-size:16px;border:2px solid #1A1A2E;border-radius:10px;background:#fff;color:#1A1A2E;">
    <button id="pf-submit" type="submit"
      style="padding:13px 22px;font-size:16px;font-weight:700;cursor:pointer;background:#D4A843;color:#1A1A2E;border:2px solid #1A1A2E;border-radius:10px;">Send it to me</button>
  </form>
  <div id="pf-msg" style="font-size:14px;color:#0F9B8E;font-weight:600;margin-top:12px;display:none;">Done. Check your inbox. The kit is right here on this page too, so keep scrolling.</div>
  <div id="pf-err" style="font-size:14px;color:#b23b2e;margin-top:12px;display:none;">That email does not look right. Try again.</div>
</div>
<script>
(function(){
  var f=document.getElementById('pf-form'),e=document.getElementById('pf-email'),
      b=document.getElementById('pf-submit'),m=document.getElementById('pf-msg'),er=document.getElementById('pf-err'),
      RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var v=(e.value||'').trim();
    if(!RE.test(v)){er.style.display='block';return;}
    er.style.display='none';b.disabled=true;b.textContent='Sending...';
    fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:v,magnet:'portfolio'})}).catch(function(){}).finally(function(){
      f.style.display='none';m.style.display='block';
    });
  });
})();
</script>


---

## 1. The one-page portfolio

A portfolio is not a CV. It is proof. Keep it to a single page.

1. **One line at the top.** "I help [who] with [what]." Example: "I help small D2C brands with landing pages that convert."
2. **Three proof blocks.** For each one: the problem, what you did, the result. A screenshot beats a paragraph.
3. **No client yet? Use spec work.** Pick a brand you love, fix something of theirs, a page, a post, a flow, and show the before and after. Spec work counts. It is how almost everyone starts.
4. **One way to contact you.** A single button. Email or DM.
5. **That is it.** No objective, no marks, no list of courses. Proof only.

Build it free on Notion or Canva in an afternoon.

---

## 2. The cold email that gets a yes

The rule is simple. Do the work first, then send it. Five lines, no begging.

> **Subject:** fixed your [thing] (no need to reply if it is not useful)
>
> Hi [name],
>
> 1. I redesigned your [pricing page / first post / signup flow]. Here it is: [link]
> 2. Your current one [buries the price / loses people at step 2], so people drop off. I fixed that.
> 3. If it is useful, I will do the next two this week, free, so you can see how I work.
> 4. Worth a 10 minute call Thursday?
> 5. A few more things I have built: [portfolio link]
>
> [your name]

Send ten of these to real people who need it. Founders, local businesses, creators. One yes is all you need to begin.

---

## 3. Build something this weekend

You do not need a year. You need one weekend and one shippable thing. Pick your lane.

- **Write.** Rewrite a famous brand's worst webpage. Post the before and after.
- **Design.** Redesign one app screen you hate. Show the old, show yours, explain the why.
- **Code.** Build a tiny tool that fixes your own annoyance. A tracker, a converter, a bot. Put it live, and on GitHub, which is public proof.
- **Sell.** Sell ten of anything by Sunday. A service, a snack, a sticker. Screenshot the orders.
- **Shoot.** Make one 30 second video for a local shop, free. Hand them the file. Keep a copy.

Then document it. One link, one screenshot, one sentence. That link is now your answer to "what have you done?"

---

## Real openings that pay you to build

When you have one thing to show, point it at a real opening. These are open on a rolling basis as of mid 2026. Confirm each link before you apply, windows move.

- **Emergent Ventures.** A grant and fellowship for people building something new. Open to anyone 13 and up, with a dedicated India track. [mercatus.org/emergent-ventures](https://www.mercatus.org/emergent-ventures)
- **Z Fellows.** A 10,000 dollar cheque and a week inside Silicon Valley. No degree, no company, no age limit. [zfellows.com](https://www.zfellows.com/)
- **PM Internship Scheme.** Get paid to work inside a top 500 Indian company. Around 9,000 a month. Ages 21 to 24. [pminternship.mca.gov.in](https://pminternship.mca.gov.in/)
- **Live hackathons.** Build a real thing in a weekend. Browse hundreds, free, on [Devfolio](https://devfolio.co/discover) and [Unstop](https://unstop.com/hackathons).
- **AICTE National Internship Portal.** A lakh plus real internships, 200 plus fields. [internship.aicte-india.org](https://internship.aicte-india.org/)

---

The real work is not out there. It is in here. Start with yourself, then build your body of work.

If this helped, the weekly letter is where the rest of it lives. [Read it here.](/subscribe/)

</div>
