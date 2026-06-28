---
layout: base.njk
title: "Subscribe"
description: "Get Aditya Jhunjhunwala's weekly letter: Eat. Play. Love. Every Sunday."
permalink: /subscribe/
---
<div class="page-wrap">
  <div style="padding:3rem 0; max-width:480px;">
    <span class="gold-rule"></span>
    <h1 style="font-family:var(--font-serif); font-size:2.5rem; margin-bottom:0.5rem;">A letter every Sunday.</h1>
    <p style="font-size:1.125rem; font-style:italic; color:var(--text-muted); margin-bottom:2rem;">Eat. Play. Love.</p>
    <p style="margin-bottom:1.5rem;">An honest letter about work, life, food, and the inner game, to your inbox every Sunday. 155 letters and counting, since 2020.</p>
    <p style="margin-bottom:2rem; color:var(--text-muted); font-size:0.9rem;">No pitch. No sponsor mentions. Just the work.</p>
    <form id="subform" class="sub-inline" novalidate>
      <input id="subemail" type="email" inputmode="email" autocomplete="email" placeholder="you@email.com" aria-label="Your email" required>
      <button type="submit" id="subbtn" class="btn btn-primary" style="font-size:1rem; padding:0.875rem 2rem;">Subscribe free</button>
    </form>
    <p class="sub-err" id="suberr" style="display:none; color:#b23b2e; font-size:0.85rem; margin-top:0.75rem;">Please enter a valid email.</p>
    <div class="sub-ok" id="subok"><span class="sub-ok-pill">You're in.</span><span class="sub-ok-line">A letter lands in your inbox each Sunday.</span></div>
    <p style="margin-top:1.5rem; font-size:0.8rem; color:var(--text-muted);">Unsubscribe any time. No spam, ever.</p>
  </div>
</div>

<style>
  .sub-inline{display:flex;gap:0.5rem;flex-wrap:wrap;max-width:440px;}
  .sub-inline input{flex:1 1 220px;padding:0.75rem 0.9rem;font-family:var(--font-sans);font-size:1rem;border:1.5px solid var(--navy);border-radius:2px;background:#fff;color:var(--navy);}
  .sub-inline input:focus{outline:none;box-shadow:0 0 0 3px rgba(212,168,67,0.45);}
  .sub-inline button{flex:0 0 auto;cursor:pointer;border:none;}
  .sub-inline button:disabled{opacity:0.6;cursor:default;}
  .sub-ok{display:none;margin-top:1rem;}
  .sub-ok.show{display:block;}
  .sub-ok-pill{display:inline-block;background:var(--gold);color:var(--navy);font-weight:700;font-size:0.8rem;letter-spacing:.04em;padding:0.4rem 0.85rem;border-radius:999px;}
  .sub-ok-line{display:block;font-family:var(--font-serif);font-size:1.25rem;margin-top:0.75rem;color:var(--navy);}
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
