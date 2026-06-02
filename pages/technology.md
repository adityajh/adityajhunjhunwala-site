---
layout: base.njk
title: "Technology"
description: "Apps, workflows, and systems built by Aditya Jhunjhunwala, for Let's Enterprise, clients, and the work itself."
permalink: /technology/
---
<div class="page-wrap page-wrap--wide" data-pagefind-body>
<span class="gold-rule"></span>

# Technology

I build the tools the work needs. Some are full apps with a live URL, some are workflows and automations that run quietly in the background, some are internal systems. Not every project is a deployed app you can click into, so each one is documented for what it does, not just whether it has a front door.

<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px,1fr)); gap:1.25rem; margin:2.5rem 0;">
{% for t in collections.technology %}
  <div style="display:flex; flex-direction:column; background:var(--cream-dark); border:1px solid var(--border); border-radius:6px; padding:1.4rem;">
    <div style="display:flex; justify-content:space-between; align-items:baseline; gap:0.5rem; margin-bottom:0.5rem;">
      <span style="font-size:0.68rem; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--gold);">{{ t.data.category }}</span>
      <span style="font-size:0.62rem; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-muted); border:1px solid var(--border); border-radius:999px; padding:0.12rem 0.5rem;">{{ t.data.type }}</span>
    </div>
    <div style="font-family:var(--font-serif); font-size:1.25rem; color:var(--navy); line-height:1.15;">{{ t.data.title }}</div>
    <p style="font-size:0.88rem; color:var(--text-muted); margin:0.6rem 0 0.9rem; line-height:1.55; flex:1;">{{ t.data.summary }}</p>
    {% if t.data.stack and t.data.stack.length %}<div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:0.8rem;">{% for s in t.data.stack %}<span style="background:var(--cream); border:1px solid var(--border); border-radius:4px; padding:0.1rem 0.4rem; margin-right:0.3rem;">{{ s }}</span>{% endfor %}</div>{% endif %}
    <div style="display:flex; gap:0.75rem; align-items:center; font-size:0.8rem; margin-top:auto;">
      {% if t.data.url %}<a href="{{ t.data.url }}" target="_blank" rel="noopener" style="font-weight:600; color:var(--teal);">Live &rarr;</a>{% endif %}
      {% if t.data.repo_public and t.data.repo %}<a href="{{ t.data.repo }}" target="_blank" rel="noopener" style="color:var(--text-muted);">Code</a>{% endif %}
      {% if t.data.status == "internal" %}<span style="color:var(--text-muted); font-style:italic;">Internal tool</span>{% endif %}
    </div>
  </div>
{% endfor %}
</div>

<p style="font-size:0.85rem; color:var(--text-muted);">This list is curated, not every experiment. It grows over time.</p>

</div>
