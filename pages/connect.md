---
layout: base.njk
title: "Connect"
description: "Get in touch with Aditya Jhunjhunwala: book a chat, send an email, or message on WhatsApp."
permalink: /connect/
---
<div class="page-wrap" data-pagefind-body>
<span class="gold-rule"></span>

# Connect

The best way to reach me depends on what you need.

<div style="display:grid; gap:1.25rem; margin:2rem 0; max-width:560px;">

  <div style="padding:1.5rem; background:var(--cream-dark); border:1px solid var(--border); border-radius:4px;">
    <div style="font-family:var(--font-serif); font-size:1.25rem; color:var(--navy); margin-bottom:0.4rem;">Set up a quick chat</div>
    <p style="margin:0 0 1rem; color:var(--text-muted); font-size:0.95rem;">For founders, young people, and anyone who wants to think something through. A short check-in call.</p>
    <a href="https://calendly.com/playfulceo/checkin-chat-with-adi" class="btn btn-primary" target="_blank" rel="noopener" style="font-size:0.875rem;">Book a time</a>
  </div>

  <div style="padding:1.5rem; background:var(--cream-dark); border:1px solid var(--border); border-radius:4px;">
    <div style="font-family:var(--font-serif); font-size:1.25rem; color:var(--navy); margin-bottom:0.4rem;">Write to me</div>
    <p style="margin:0 0 1rem; color:var(--text-muted); font-size:0.95rem;">For speaking enquiries, advisory work, or anything that needs more than a chat.</p>
    <a href="mailto:aditya@letsenterprise.in" class="btn btn-ghost" style="font-size:0.875rem;">aditya@letsenterprise.in</a>
  </div>

  <div style="padding:1.5rem; background:var(--cream-dark); border:1px solid var(--border); border-radius:4px;">
    <div style="font-family:var(--font-serif); font-size:1.25rem; color:var(--navy); margin-bottom:0.4rem;">Message on WhatsApp</div>
    <p style="margin:0 0 1rem; color:var(--text-muted); font-size:0.95rem;">For a quick message.</p>
    <a href="https://wa.me/919890969261" class="btn btn-ghost" style="font-size:0.875rem;">Open WhatsApp</a>
  </div>

</div>

<div class="subscribe-cta" id="subscribe" style="max-width:560px; margin:2.5rem 0 0;">
  <h2>A letter every Sunday.</h2>
  <p>An honest letter about work, life, food, and the inner game, to your inbox every Sunday. 155 letters and counting.</p>
  <form id="subform" class="sub-inline" novalidate>
    <input id="subemail" type="email" inputmode="email" autocomplete="email" placeholder="you@email.com" aria-label="Your email" required>
    <button type="submit" id="subbtn" class="btn btn-primary">Subscribe free</button>
  </form>
  <p class="sub-err" id="suberr">Please enter a valid email.</p>
  <div class="sub-ok" id="subok"><span class="sub-ok-pill">You're in.</span><span class="sub-ok-line">A letter lands in your inbox each Sunday.</span></div>
</div>

<style>
  .sub-inline{display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;max-width:440px;margin:1rem auto 0;}
  .sub-inline input{flex:1 1 220px;padding:0.625rem 0.9rem;font-family:var(--font-sans);font-size:1rem;border:1.5px solid var(--navy);border-radius:2px;background:#fff;color:var(--navy);}
  .sub-inline input:focus{outline:none;box-shadow:0 0 0 3px rgba(212,168,67,0.45);}
  .sub-inline button{flex:0 0 auto;cursor:pointer;border:none;}
  .sub-inline button:disabled{opacity:0.6;cursor:default;}
  .sub-err{display:none;color:#F6B8AE;font-size:0.85rem;margin-top:0.75rem;}
  .sub-ok{display:none;margin-top:0.5rem;}
  .sub-ok.show{display:block;}
  .sub-ok-pill{display:inline-block;background:var(--gold);color:var(--navy);font-weight:700;font-size:0.8rem;letter-spacing:.04em;padding:0.4rem 0.85rem;border-radius:999px;}
  .sub-ok-line{display:block;color:var(--cream);font-family:var(--font-serif);font-size:1.25rem;margin-top:0.75rem;}
</style>
<script>
  (function(){
    var f=document.getElementById('subform');if(!f)return;
    var e=document.getElementById('subemail'),b=document.getElementById('subbtn'),
        err=document.getElementById('suberr'),ok=document.getElementById('subok');
    var RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    f.addEventListener('submit',function(ev){
      ev.preventDefault();var email=(e.value||'').trim();
      if(!RE.test(email)){err.style.display='block';return;}
      err.style.display='none';b.disabled=true;b.textContent='Adding...';
      fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:email,magnet:'letters'})})
        .catch(function(){}).finally(function(){f.style.display='none';ok.classList.add('show');});
    });
  })();
</script>

</div>
