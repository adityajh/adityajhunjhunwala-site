---
layout: base.njk
title: "Sessions"
description: "Interactive recall maps and frameworks from Aditya Jhunjhunwala's talks and workshops. Built to be felt, not just read."
permalink: /sessions/
---
<div class="page-wrap" data-pagefind-body>
<span class="gold-rule"></span>

# Sessions

When I run a talk or a workshop, I leave the room with a recall map: a single page that holds the stories, reframes, and research so the work stays alive after the session ends. These are built to be felt, not just read.

<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px,1fr)); gap:1.5rem; margin:2.5rem 0;">
{% for s in collections.sessions %}
  <a href="{{ s.data.url }}" style="display:block; text-decoration:none; border-radius:4px; overflow:hidden; background:var(--cream-dark); border:1px solid var(--border); transition:border-color 0.15s; padding:1.5rem;"
     onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border)'">
    <div style="font-size:0.7rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold); margin-bottom:0.4rem;">Session{% if s.data.sessionDate %} &middot; {{ s.data.sessionDate }}{% endif %}</div>
    <div style="font-family:var(--font-serif); font-size:1.5rem; color:var(--navy); line-height:1.1;">{{ s.data.title }}</div>
    {% if s.data.subtitle %}<div style="font-size:0.95rem; color:var(--text-muted); margin-top:0.2rem;">{{ s.data.subtitle }}</div>{% endif %}
    <p style="font-size:0.9rem; color:var(--text-muted); margin:0.9rem 0 0; line-height:1.6;">{{ s.data.descriptor }}</p>
    <div style="font-size:0.8rem; color:var(--gold-deep, var(--gold)); margin-top:1rem; font-weight:600;">Open the recall map &rarr;</div>
  </a>
{% endfor %}
</div>

<p style="font-size:0.85rem; color:var(--text-muted);">More sessions will be added here over time.</p>

</div>
