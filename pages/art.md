---
layout: base.njk
title: "Art"
description: "Paintings, caricatures and alla prima oil work by Aditya Jhunjhunwala. 200+ pieces made over 20 years."
permalink: /art/
---
<div class="page-wrap page-wrap--wide" data-pagefind-body>
<span class="gold-rule"></span>

# Art

Caricatures, paintings and alla prima oil work. More than 200 pieces over twenty years, most of them made for no reason except that the hand wanted to. This room fills up a few at a time.

{% if art.length %}
<style>
.art-wall{columns:3 280px; column-gap:1.1rem; margin:2.5rem 0 1rem}
.art-piece{break-inside:avoid; margin:0 0 1.1rem; cursor:zoom-in; background:none; border:0; padding:0; display:block; width:100%; text-align:left}
.art-piece img{display:block; width:100%; height:auto; border-radius:3px; border:1px solid var(--border); transition:transform .2s, box-shadow .2s}
.art-piece:hover img,.art-piece:focus-visible img{transform:translateY(-2px); box-shadow:0 10px 24px rgba(26,26,46,.12)}
.art-cap{font-size:.8rem; color:var(--text-muted); margin-top:.45rem; line-height:1.4}
.art-cap b{font-family:var(--font-serif); font-weight:400; color:var(--navy); font-size:.98rem}
.art-lb{position:fixed; inset:0; background:rgba(14,14,26,.94); display:none; align-items:center; justify-content:center; z-index:1000; flex-direction:column; padding:3.5rem 1rem 1.5rem}
.art-lb.open{display:flex}
.art-lb img{max-width:min(92vw,1600px); max-height:78vh; object-fit:contain; border-radius:2px; box-shadow:0 20px 60px rgba(0,0,0,.5)}
.art-lb__cap{color:#F8F6F0; margin-top:1rem; text-align:center; font-size:.9rem; min-height:1.4em}
.art-lb__cap b{font-family:var(--font-serif); font-weight:400; font-size:1.15rem}
.art-lb button{position:absolute; background:none; border:0; color:#F8F6F0; font-size:2rem; cursor:pointer; width:56px; height:56px; opacity:.8}
.art-lb button:hover{opacity:1; color:#D4A843}
.art-lb__x{top:.5rem; right:.75rem}.art-lb__prev{left:.5rem; top:50%}.art-lb__next{right:.5rem; top:50%}
.art-lb__n{position:absolute; top:1.1rem; left:1.25rem; color:rgba(248,246,240,.6); font-size:.75rem; letter-spacing:.1em}
</style>
<div class="art-wall">
{%- for p in art %}
  <button class="art-piece" data-i="{{ loop.index0 }}" aria-label="Open {{ p.title or 'artwork' }}">
    <img src="{{ p.thumb }}" alt="{{ p.title or 'Artwork by Aditya Jhunjhunwala' }}{% if p.medium %}, {{ p.medium }}{% endif %}" width="{{ p.w }}" height="{{ p.h }}" loading="lazy">
    {% if p.title %}<div class="art-cap"><b>{{ p.title }}</b>{% if p.year or p.medium %}<br>{{ [p.year, p.medium] | select | join(" · ") }}{% endif %}</div>{% endif %}
  </button>
{%- endfor %}
</div>
<div class="art-lb" role="dialog" aria-modal="true" aria-label="Artwork viewer">
  <span class="art-lb__n"></span>
  <button class="art-lb__x" aria-label="Close">&times;</button>
  <button class="art-lb__prev" aria-label="Previous">&lsaquo;</button>
  <img alt="">
  <div class="art-lb__cap"></div>
  <button class="art-lb__next" aria-label="Next">&rsaquo;</button>
</div>
<script>
(function(){
  var A = {{ art | dump | safe }}, lb = document.querySelector('.art-lb'), img = lb.querySelector('img'),
      cap = lb.querySelector('.art-lb__cap'), n = lb.querySelector('.art-lb__n'), i = 0, x0 = null, last = null;
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function show(k){ i = (k + A.length) % A.length; var p = A[i];
    img.src = p.src; img.alt = p.title || 'Artwork';
    var meta = [p.year, p.medium].filter(Boolean).join(' · ');
    cap.innerHTML = (p.title ? '<b>' + esc(p.title) + '</b>' : '') + (meta ? '<br>' + esc(meta) : '');
    n.textContent = (i + 1) + ' / ' + A.length;
    var nx = new Image(); nx.src = A[(i + 1) % A.length].src; }
  function open(k){ last = document.activeElement; show(k); lb.classList.add('open'); document.body.style.overflow = 'hidden'; lb.querySelector('.art-lb__x').focus(); }
  function close(){ lb.classList.remove('open'); document.body.style.overflow = ''; if (last) last.focus(); }
  document.querySelectorAll('.art-piece').forEach(function(b){ b.addEventListener('click', function(){ open(+b.dataset.i); }); });
  lb.querySelector('.art-lb__x').onclick = close;
  lb.querySelector('.art-lb__prev').onclick = function(){ show(i - 1); };
  lb.querySelector('.art-lb__next').onclick = function(){ show(i + 1); };
  lb.addEventListener('click', function(e){ if (e.target === lb) close(); });
  document.addEventListener('keydown', function(e){ if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
  lb.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, {passive:true});
  lb.addEventListener('touchend', function(e){ if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1); x0 = null; });
})();
</script>
{% else %}
<p style="color:var(--text-muted); margin:2.5rem 0;">The first pieces are being photographed now.</p>
{% endif %}

</div>
