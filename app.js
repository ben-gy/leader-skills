// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import { renderAvatar } from "./lib/avatar.js";
import { loadBuilder, saveBuilder, clearBuilder, emptyBuilder } from "./lib/store.js";
import { parseRoute, go, onRouteChange } from "./lib/router.js";

const state = {
  leadersData: null,
  templatesData: null,
  filters: { search: "", category: "all", origin: "all" },
  builder: null,
  modal: null
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function categoryById(id) {
  return state.leadersData.categories.find(c => c.id === id);
}

function leaderById(id) {
  return state.leadersData.leaders.find(l => l.id === id);
}

function templateById(id) {
  return state.templatesData.templates.find(t => t.id === id);
}

// ─── DATA LOADING ──────────────────────────────────────────────────────────

async function loadData() {
  const [leaders, templates] = await Promise.all([
    fetch("data/leaders.json").then(r => r.json()),
    fetch("data/templates.json").then(r => r.json())
  ]);
  state.leadersData = leaders;
  state.templatesData = templates;
}

// ─── HEADER & ROUTING ─────────────────────────────────────────────────────

function renderHeader() {
  const route = parseRoute(location.hash);
  return `
    <header class="site-header">
      <a class="brand" href="#/" aria-label="Leader Skills home">
        <span class="brand-mark" aria-hidden="true">⚡</span>
        <span class="brand-text">Leader Skills</span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="#/" class="${route.name === 'home' ? 'is-active' : ''}">Explore</a>
        <a href="#/builder" class="${route.name === 'builder' || route.name === 'builder-print' ? 'is-active' : ''}">Build Your Style</a>
        <a href="#/about" class="${route.name === 'about' ? 'is-active' : ''}">About</a>
      </nav>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <p>Leader Skills — explore well-documented leaders, then build your own operating system.</p>
      <p class="small">All practices cited from public sources. SVG monogram avatars are copyright-free.</p>
      <p><span class="credit">Made by <a class="chicago-font" href="https://ben.gy" target="_blank" rel="noopener noreferrer">ben.gy</a> · <a href="https://hub.benrichardson.dev" target="_blank" rel="noopener">more tools &amp; sites</a></span></p>
    </footer>
  `;
}

function setMain(html) {
  $("#main").innerHTML = html;
  window.scrollTo(0, 0);
}

// ─── HOME ─────────────────────────────────────────────────────────────────

function filteredLeaders() {
  const q = state.filters.search.trim().toLowerCase();
  const cat = state.filters.category;
  const origin = state.filters.origin;
  return state.leadersData.leaders.filter(l => {
    if (origin !== "all" && !l.origin.toLowerCase().includes(origin.toLowerCase())) return false;
    if (cat !== "all" && !l.practices.some(p => p.category === cat)) return false;
    if (!q) return true;
    const hay = [
      l.name, l.role, l.company, l.archetype, l.tagline, l.bio, ...(l.tags || []),
      ...l.practices.flatMap(p => [p.title, p.what, p.why])
    ].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

function uniqueOrigins() {
  const set = new Set(state.leadersData.leaders.map(l => l.origin.split("/")[0].trim()));
  return Array.from(set).sort();
}

function renderHome() {
  const cats = state.leadersData.categories;
  const origins = uniqueOrigins();
  const leaders = filteredLeaders();

  setMain(`
    <section class="hero">
      <h1>Explore how leaders actually operate.</h1>
      <p class="lede">Twenty well-documented leaders, ${state.leadersData.leaders.reduce((a, l) => a + l.practices.length, 0)} concrete practices, grouped into seven life and operating domains. Focus on the <em>why</em>, not just the what — then build your own style.</p>
      <div class="hero-cta">
        <a href="#/builder" class="btn primary">Build your own style →</a>
      </div>
    </section>

    <section class="filters" aria-label="Filter leaders">
      <div class="filter-row">
        <label class="search">
          <input type="search" placeholder="Search leaders, practices, ideas…" value="${escapeHtml(state.filters.search)}" id="search-input" autocomplete="off" />
        </label>
        <select id="origin-select" aria-label="Filter by origin">
          <option value="all">All origins</option>
          ${origins.map(o => `<option value="${escapeHtml(o)}" ${state.filters.origin === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join("")}
        </select>
      </div>
      <div class="chips" role="tablist" aria-label="Filter by category">
        <button class="chip ${state.filters.category === 'all' ? 'is-active' : ''}" data-cat="all">All categories</button>
        ${cats.map(c => `<button class="chip ${state.filters.category === c.id ? 'is-active' : ''}" data-cat="${c.id}" title="${escapeHtml(c.blurb)}">${escapeHtml(c.label)}</button>`).join("")}
      </div>
    </section>

    <section class="grid" aria-label="Leaders">
      ${leaders.length === 0
        ? `<p class="empty">No leaders match those filters. Try clearing them.</p>`
        : leaders.map(renderLeaderCard).join("")}
    </section>
  `);

  // wire interactivity
  $("#search-input").addEventListener("input", e => {
    state.filters.search = e.target.value;
    rerenderHomeBody();
  });
  $("#origin-select").addEventListener("change", e => {
    state.filters.origin = e.target.value;
    rerenderHomeBody();
  });
  $$(".chips .chip").forEach(btn => {
    btn.addEventListener("click", () => {
      state.filters.category = btn.dataset.cat;
      rerenderHomeBody();
    });
  });
}

function rerenderHomeBody() {
  // re-render just the grid + chips without losing input focus
  const cats = state.leadersData.categories;
  $(".chips").innerHTML = `
    <button class="chip ${state.filters.category === 'all' ? 'is-active' : ''}" data-cat="all">All categories</button>
    ${cats.map(c => `<button class="chip ${state.filters.category === c.id ? 'is-active' : ''}" data-cat="${c.id}" title="${escapeHtml(c.blurb)}">${escapeHtml(c.label)}</button>`).join("")}
  `;
  $$(".chips .chip").forEach(btn => {
    btn.addEventListener("click", () => {
      state.filters.category = btn.dataset.cat;
      rerenderHomeBody();
    });
  });
  const leaders = filteredLeaders();
  $(".grid").innerHTML = leaders.length === 0
    ? `<p class="empty">No leaders match those filters. Try clearing them.</p>`
    : leaders.map(renderLeaderCard).join("");
}

function renderLeaderCard(l) {
  const practiceCount = l.practices.length;
  const categoryCount = new Set(l.practices.map(p => p.category)).size;
  return `
    <a class="card" href="#/leader/${encodeURIComponent(l.id)}">
      <div class="card-head">
        ${renderAvatar({ monogram: l.avatar.monogram, color: l.avatar.color, size: 56 })}
        <div>
          <h3>${escapeHtml(l.name)}</h3>
          <p class="role">${escapeHtml(l.role)} · ${escapeHtml(l.company)}</p>
        </div>
      </div>
      <p class="archetype">${escapeHtml(l.archetype)}</p>
      <p class="tagline">${escapeHtml(l.tagline)}</p>
      <div class="card-meta">
        <span>${practiceCount} practices</span>
        <span>${categoryCount} of 7 domains</span>
        <span>${escapeHtml(l.origin)}</span>
      </div>
    </a>
  `;
}

// ─── LEADER DETAIL ────────────────────────────────────────────────────────

function renderLeader(id) {
  const l = leaderById(id);
  if (!l) {
    setMain(`<section class="empty"><h2>Leader not found</h2><p><a href="#/">← Back to all leaders</a></p></section>`);
    return;
  }

  const cats = state.leadersData.categories;
  const practicesByCategory = cats.map(c => ({
    cat: c,
    items: l.practices.filter(p => p.category === c.id)
  })).filter(g => g.items.length > 0);

  setMain(`
    <section class="leader-detail">
      <a class="back" href="#/">← All leaders</a>
      <header class="leader-head">
        ${renderAvatar({ monogram: l.avatar.monogram, color: l.avatar.color, size: 96 })}
        <div>
          <h1>${escapeHtml(l.name)}</h1>
          <p class="role">${escapeHtml(l.role)} · ${escapeHtml(l.company)}</p>
          <p class="meta">${escapeHtml(l.era)} · ${escapeHtml(l.origin)}</p>
          <p class="archetype">${escapeHtml(l.archetype)}</p>
          <p class="tagline">${escapeHtml(l.tagline)}</p>
        </div>
      </header>
      <p class="bio">${escapeHtml(l.bio)}</p>
      ${(l.tags || []).length > 0 ? `
        <ul class="tags">
          ${l.tags.map(t => `<li>${escapeHtml(t)}</li>`).join("")}
        </ul>` : ""}

      <div class="practices">
        ${practicesByCategory.map(group => `
          <section class="practice-group" id="cat-${group.cat.id}">
            <header>
              <h2>${escapeHtml(group.cat.label)}</h2>
              <p class="cat-blurb">${escapeHtml(group.cat.blurb)}</p>
            </header>
            ${group.items.map(p => renderPracticeCard(p)).join("")}
          </section>
        `).join("")}
      </div>

      ${(l.sources || []).length > 0 ? `
        <section class="sources">
          <h3>Sources</h3>
          <ul>
            ${l.sources.map(s => `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a></li>`).join("")}
          </ul>
        </section>
      ` : ""}
    </section>
  `);
}

function renderPracticeCard(p) {
  return `
    <article class="practice">
      <h3>${escapeHtml(p.title)}</h3>
      <p class="what"><span class="label">What</span> ${escapeHtml(p.what)}</p>
      <p class="why"><span class="label">Why</span> ${escapeHtml(p.why)}</p>
      ${p.source ? `<p class="source">${p.sourceUrl ? `<a href="${escapeHtml(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.source)}</a>` : escapeHtml(p.source)}</p>` : ""}
    </article>
  `;
}

// ─── BUILDER ──────────────────────────────────────────────────────────────

function renderBuilder() {
  state.builder = loadBuilder();
  if (!state.builder) {
    renderBuilderTemplatePicker();
  } else {
    renderBuilderEditor();
  }
}

function renderBuilderTemplatePicker() {
  setMain(`
    <section class="builder-intro">
      <a class="back" href="#/">← Back to leaders</a>
      <h1>Build your own leadership style.</h1>
      <p class="lede">Pick a starting template — or start blank — then add, borrow, and edit practices. Your work is saved locally as you type. Export as a printable 1-pager (PDF) or JSON when you're done.</p>
    </section>

    <section class="templates">
      ${state.templatesData.templates.map(t => `
        <article class="template-card">
          <h2>${escapeHtml(t.name)}</h2>
          <p class="tagline">${escapeHtml(t.tagline)}</p>
          ${t.inspiredBy.length > 0 ? `<p class="inspired">Inspired by: ${t.inspiredBy.map(id => {
            const l = leaderById(id);
            return l ? `<a href="#/leader/${encodeURIComponent(id)}">${escapeHtml(l.name)}</a>` : escapeHtml(id);
          }).join(", ")}</p>` : ""}
          <button class="btn primary" data-template="${escapeHtml(t.id)}">Start with this template</button>
        </article>
      `).join("")}
    </section>

    <section class="import-box">
      <h2>Or import a saved style</h2>
      <p>Already have a JSON file? Drop it here or pick one to restore.</p>
      <label class="btn">
        Choose JSON file
        <input type="file" accept="application/json,.json" id="import-file" hidden />
      </label>
    </section>
  `);

  $$("[data-template]").forEach(btn => {
    btn.addEventListener("click", () => {
      const t = templateById(btn.dataset.template);
      const builder = emptyBuilder();
      builder.archetype = t.seed.archetype || "";
      builder.tagline = t.seed.tagline || "";
      for (const cat of Object.keys(builder.practices)) {
        builder.practices[cat] = (t.seed.practices[cat] || []).map(p => ({ ...p }));
      }
      state.builder = builder;
      saveBuilder(state.builder);
      renderBuilderEditor();
    });
  });

  $("#import-file").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.practices) throw new Error("Missing practices");
        state.builder = parsed;
        saveBuilder(state.builder);
        renderBuilderEditor();
      } catch (err) {
        alert("That file doesn't look like a Leader Skills export.");
      }
    };
    reader.readAsText(file);
  });
}

function renderBuilderEditor() {
  const cats = state.leadersData.categories;
  const b = state.builder;

  setMain(`
    <section class="builder">
      <header class="builder-head">
        <a class="back" href="#/">← Back to leaders</a>
        <div class="builder-actions">
          <button class="btn" id="builder-import">Import JSON</button>
          <button class="btn" id="builder-export">Export JSON</button>
          <a class="btn" href="#/builder/print">View print page →</a>
          <button class="btn danger" id="builder-reset">Reset</button>
        </div>
      </header>

      <section class="builder-identity">
        <label>
          <span>Your name (optional)</span>
          <input type="text" id="b-name" value="${escapeHtml(b.name)}" placeholder="e.g. Sam Pragma" />
        </label>
        <label>
          <span>Your archetype</span>
          <input type="text" id="b-archetype" value="${escapeHtml(b.archetype)}" placeholder="e.g. The Pragmatic Builder" />
        </label>
        <label>
          <span>Your tagline</span>
          <input type="text" id="b-tagline" value="${escapeHtml(b.tagline)}" placeholder="One sentence that captures how you lead." />
        </label>
      </section>

      <p class="autosave">Auto-saves as you type. <span id="autosave-indicator" aria-live="polite"></span></p>

      <div class="builder-sections">
        ${cats.map(c => renderBuilderSection(c, b.practices[c.id] || [])).join("")}
      </div>
    </section>

    <input type="file" id="builder-import-file" accept="application/json,.json" hidden />
  `);

  // identity fields
  ["name", "archetype", "tagline"].forEach(field => {
    $(`#b-${field}`).addEventListener("input", e => {
      state.builder[field] = e.target.value;
      saveBuilder(state.builder);
      indicateSaved();
    });
  });

  // section actions
  $$(".builder-section").forEach(section => wireSectionEvents(section));

  // top-level actions
  $("#builder-export").addEventListener("click", exportJSON);
  $("#builder-import").addEventListener("click", () => $("#builder-import-file").click());
  $("#builder-import-file").addEventListener("change", importJSON);
  $("#builder-reset").addEventListener("click", () => {
    if (confirm("Clear everything and start over? This can't be undone.")) {
      clearBuilder();
      state.builder = null;
      renderBuilderTemplatePicker();
    }
  });
}

function indicateSaved() {
  const el = $("#autosave-indicator");
  if (!el) return;
  el.textContent = "Saved";
  clearTimeout(indicateSaved._t);
  indicateSaved._t = setTimeout(() => { el.textContent = ""; }, 1200);
}

function renderBuilderSection(cat, items) {
  return `
    <section class="builder-section" data-cat="${escapeHtml(cat.id)}">
      <header>
        <h2>${escapeHtml(cat.label)}</h2>
        <p class="cat-blurb">${escapeHtml(cat.blurb)}</p>
      </header>
      <ol class="builder-items">
        ${items.map((p, i) => renderBuilderItem(cat.id, p, i)).join("")}
      </ol>
      <div class="section-actions">
        <button class="btn add" data-action="add">+ Add custom practice</button>
        <button class="btn" data-action="borrow">↓ Borrow from a leader</button>
      </div>
    </section>
  `;
}

function renderBuilderItem(catId, p, i) {
  const borrowed = p.borrowedFrom ? leaderById(p.borrowedFrom) : null;
  return `
    <li class="builder-item" data-cat="${escapeHtml(catId)}" data-index="${i}">
      <div class="item-controls">
        <button class="icon-btn" data-act="up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="icon-btn" data-act="down" aria-label="Move down">↓</button>
        <button class="icon-btn danger" data-act="del" aria-label="Delete">×</button>
      </div>
      <label>
        <span>Title</span>
        <input type="text" data-field="title" value="${escapeHtml(p.title || "")}" placeholder="Short name for this practice" />
      </label>
      <label>
        <span>What</span>
        <textarea data-field="what" rows="2" placeholder="The concrete behavior">${escapeHtml(p.what || "")}</textarea>
      </label>
      <label>
        <span>Why</span>
        <textarea data-field="why" rows="3" placeholder="The reasoning — this is the important part">${escapeHtml(p.why || "")}</textarea>
      </label>
      ${borrowed ? `<p class="borrowed">Borrowed from <a href="#/leader/${encodeURIComponent(borrowed.id)}">${escapeHtml(borrowed.name)}</a></p>` : ""}
    </li>
  `;
}

function wireSectionEvents(section) {
  const catId = section.dataset.cat;
  section.addEventListener("click", e => {
    const action = e.target.closest("[data-action]");
    if (!action) return;
    if (action.dataset.action === "add") {
      state.builder.practices[catId].push({ title: "", what: "", why: "" });
      saveBuilder(state.builder);
      renderBuilderEditor();
    } else if (action.dataset.action === "borrow") {
      openBorrowModal(catId);
    }
  });

  section.addEventListener("click", e => {
    const ctl = e.target.closest("[data-act]");
    if (!ctl) return;
    const item = ctl.closest(".builder-item");
    if (!item) return;
    const index = parseInt(item.dataset.index, 10);
    const arr = state.builder.practices[catId];
    if (ctl.dataset.act === "del") {
      arr.splice(index, 1);
    } else if (ctl.dataset.act === "up" && index > 0) {
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    } else if (ctl.dataset.act === "down" && index < arr.length - 1) {
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    } else {
      return;
    }
    saveBuilder(state.builder);
    renderBuilderEditor();
  });

  section.addEventListener("input", e => {
    const item = e.target.closest(".builder-item");
    if (!item) return;
    const field = e.target.dataset.field;
    if (!field) return;
    const index = parseInt(item.dataset.index, 10);
    state.builder.practices[catId][index][field] = e.target.value;
    saveBuilder(state.builder);
    indicateSaved();
  });
}

// ─── BORROW MODAL ─────────────────────────────────────────────────────────

function openBorrowModal(targetCatId) {
  closeModal();
  const cat = categoryById(targetCatId);
  const items = state.leadersData.leaders.flatMap(l =>
    l.practices
      .filter(p => p.category === targetCatId)
      .map(p => ({ leader: l, practice: p }))
  );

  const modal = document.createElement("div");
  modal.className = "modal-root";
  modal.innerHTML = `
    <div class="modal-backdrop" data-act="close"></div>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-head">
        <h2 id="modal-title">Borrow a ${escapeHtml(cat.label)} practice</h2>
        <button class="icon-btn" data-act="close" aria-label="Close">×</button>
      </header>
      <div class="modal-search">
        <input type="search" id="borrow-search" placeholder="Search practices…" autocomplete="off" />
      </div>
      <div class="modal-list" id="borrow-list">
        ${items.map(({ leader, practice }) => renderBorrowItem(leader, practice)).join("")}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  state.modal = modal;
  setTimeout(() => $("#borrow-search").focus(), 0);

  modal.addEventListener("click", e => {
    if (e.target.dataset.act === "close") closeModal();
  });
  document.addEventListener("keydown", escClose);

  $("#borrow-search").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = items.filter(({ leader, practice }) => {
      if (!q) return true;
      const hay = [leader.name, practice.title, practice.what, practice.why].join(" ").toLowerCase();
      return hay.includes(q);
    });
    $("#borrow-list").innerHTML = filtered.length === 0
      ? `<p class="empty">No matches.</p>`
      : filtered.map(({ leader, practice }) => renderBorrowItem(leader, practice)).join("");
  });

  $("#borrow-list").addEventListener("click", e => {
    const card = e.target.closest("[data-leader][data-practice-index]");
    if (!card) return;
    const leader = leaderById(card.dataset.leader);
    const practice = leader.practices[parseInt(card.dataset.practiceIndex, 10)];
    state.builder.practices[targetCatId].push({
      title: practice.title,
      what: practice.what,
      why: practice.why,
      borrowedFrom: leader.id
    });
    saveBuilder(state.builder);
    closeModal();
    renderBuilderEditor();
  });
}

function renderBorrowItem(leader, practice) {
  const index = leader.practices.indexOf(practice);
  return `
    <button class="borrow-item" data-leader="${escapeHtml(leader.id)}" data-practice-index="${index}">
      <div class="borrow-head">
        ${renderAvatar({ monogram: leader.avatar.monogram, color: leader.avatar.color, size: 32 })}
        <div>
          <strong>${escapeHtml(practice.title)}</strong>
          <span class="who">${escapeHtml(leader.name)}</span>
        </div>
      </div>
      <p class="what">${escapeHtml(practice.what)}</p>
      <p class="why">${escapeHtml(practice.why)}</p>
    </button>
  `;
}

function closeModal() {
  if (state.modal) {
    state.modal.remove();
    state.modal = null;
  }
  document.removeEventListener("keydown", escClose);
}

function escClose(e) {
  if (e.key === "Escape") closeModal();
}

// ─── EXPORT / IMPORT ──────────────────────────────────────────────────────

function exportJSON() {
  if (!state.builder) return;
  const blob = new Blob([JSON.stringify(state.builder, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (state.builder.archetype || "leader-skills").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "leader-skills";
  a.download = `${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!parsed.practices) throw new Error("Missing practices");
      state.builder = parsed;
      saveBuilder(state.builder);
      renderBuilderEditor();
    } catch (err) {
      alert("That file doesn't look like a Leader Skills export.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

// ─── BUILDER PRINT VIEW ───────────────────────────────────────────────────

function renderBuilderPrint() {
  state.builder = loadBuilder();
  const b = state.builder;
  if (!b) {
    setMain(`
      <section class="empty">
        <h2>Nothing to print yet.</h2>
        <p><a href="#/builder">← Start your style first</a></p>
      </section>
    `);
    return;
  }
  const cats = state.leadersData.categories;

  setMain(`
    <section class="print-actions no-print">
      <a class="back" href="#/builder">← Back to editor</a>
      <button class="btn primary" id="do-print">Print / Save as PDF</button>
    </section>

    <article class="print-sheet">
      <header class="print-head">
        <h1>${escapeHtml(b.archetype || "My Leadership Operating System")}</h1>
        ${b.name ? `<p class="byline">${escapeHtml(b.name)}</p>` : ""}
        ${b.tagline ? `<p class="tagline">${escapeHtml(b.tagline)}</p>` : ""}
      </header>

      <div class="print-grid">
        ${cats.map(c => {
          const items = b.practices[c.id] || [];
          if (items.length === 0) return "";
          return `
            <section class="print-cat">
              <h2>${escapeHtml(c.label)}</h2>
              <ul>
                ${items.map(p => `
                  <li>
                    <strong>${escapeHtml(p.title || "(untitled)")}</strong>
                    ${p.what ? `<p class="what">${escapeHtml(p.what)}</p>` : ""}
                    ${p.why ? `<p class="why">${escapeHtml(p.why)}</p>` : ""}
                  </li>
                `).join("")}
              </ul>
            </section>
          `;
        }).join("")}
      </div>

      <footer class="print-foot">
        <p>Built on leader-skills.benrichardson.dev — explore well-documented leaders, then build your own.</p>
      </footer>
    </article>
  `);

  $("#do-print").addEventListener("click", () => window.print());
}

// ─── ABOUT ────────────────────────────────────────────────────────────────

function renderAbout() {
  setMain(`
    <section class="about">
      <a class="back" href="#/">← Back to leaders</a>
      <h1>About Leader Skills</h1>
      <p>This site is about <strong>specific, well-documented leaders</strong> and the concrete patterns, rituals, and mental models they actually use — not abstract leadership frameworks.</p>

      <h2>The seven domains</h2>
      <p>Every practice is tagged with one of seven life and operating domains, so you can compare apples to apples across leaders.</p>
      <dl>
        ${state.leadersData.categories.map(c => `
          <dt>${escapeHtml(c.label)}</dt>
          <dd>${escapeHtml(c.blurb)}</dd>
        `).join("")}
      </dl>

      <h2>What's the "Build" feature?</h2>
      <p>Pick a starting template — or start blank — and build your own leadership operating system. Borrow practices from any leader, write your own, then print it as a one-pager or download it as JSON to keep iterating on later. Everything saves to your browser; there is no server and no account.</p>

      <h2>Sources</h2>
      <p>Every practice on this site cites a public source. Practices that are widely reported but harder to attribute to a single article are tagged with the leader's name and a year — and you should verify them yourself before quoting.</p>

      <h2>What's not here</h2>
      <ul>
        <li>No photos of leaders (copyright concerns). Avatars are SVG monograms.</li>
        <li>No accounts, no cookies — the only analytics is Cloudflare Web Analytics (anonymous, cookie-less page-view counts; no personal data, no cross-site tracking).</li>
        <li>No abstract leadership frameworks (Goleman, Lewin, etc.) — those are easy to find elsewhere.</li>
      </ul>

      <h2>Open issues / additions</h2>
      <p>The leader set is opinionated and not exhaustive. Suggestions welcome at <a href="https://github.com/ben-gy/leader-skills" target="_blank" rel="noopener noreferrer">github.com/ben-gy/leader-skills</a>.</p>
    </section>
  `);
}

// ─── ROUTING ──────────────────────────────────────────────────────────────

function render() {
  $("#header").innerHTML = renderHeader();
  $("#footer").innerHTML = renderFooter();
  const route = parseRoute(location.hash);
  closeModal();
  document.body.dataset.route = route.name;
  switch (route.name) {
    case "home": renderHome(); break;
    case "leader": renderLeader(route.id); break;
    case "builder": renderBuilder(); break;
    case "builder-print": renderBuilderPrint(); break;
    case "about": renderAbout(); break;
    default: renderHome();
  }
}

async function main() {
  await loadData();
  window.addEventListener("hashchange", render);
  render();
}

main().catch(err => {
  document.querySelector("#main").innerHTML = `
    <section class="empty">
      <h2>Something went wrong loading the site.</h2>
      <pre>${escapeHtml(String(err && err.message || err))}</pre>
    </section>
  `;
});
