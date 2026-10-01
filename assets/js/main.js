/* AMPLIA Lab — interactions & rendering */
(function () {
  "use strict";

  const D = window.AMPLIA || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const personIcon = '<svg><use href="#i-person"/></svg>';

  /* ---------------- Members ---------------- */
  const photoBox = (src, alt) => (src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : `${personIcon}<span>Photo</span>`);
  const nameLine = (p) => `<h4 class="member__name">${esc(p.en)}${p.ko ? `<small>(${esc(p.ko)})</small>` : ""}</h4>`;

  function memberCard(m) {
    const topics = (m.topics || []).filter(Boolean);
    return `<article class="member reveal">
      <div class="photo">${photoBox(m.photo, m.en)}</div>
      <div class="member__body">
        ${nameLine(m)}
        <p class="member__role">${esc(m.course)}${m.since ? ` (${esc(m.since)} ~ )` : ""}</p>
        <a class="member__mail ext-link" href="mailto:${esc(m.email)}">${esc(m.email)}<svg class="ext-icon" aria-hidden="true"><use href="#i-mail"/></svg></a>
        ${topics.length ? `<ul class="member__topics">${topics.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      </div>
    </article>`;
  }
  function alumniCard(a) {
    return `<article class="member reveal">
      <div class="photo">${photoBox(a.photo, a.en)}</div>
      <div class="member__body">
        ${nameLine(a)}
        <p class="member__role">${esc(a.degree)}${a.period ? ` (${esc(a.period)})` : ""}</p>
        ${a.email ? `<a class="member__mail ext-link" href="mailto:${esc(a.email)}">${esc(a.email)}<svg class="ext-icon" aria-hidden="true"><use href="#i-mail"/></svg></a>` : ""}
        ${a.thesis || a.now ? `<dl class="member__facts">${a.thesis ? `<div><dt>Dissertation</dt><dd>${esc(a.thesis)}</dd></div>` : ""}${a.now ? `<div><dt>Affiliation</dt><dd>${esc(a.now)}</dd></div>` : ""}</dl>` : ""}
      </div>
    </article>`;
  }
  function renderMembers() {
    if (!$("#gradGrid")) return;
    const list = D.members || [];
    const grad = list.filter((m) => m.group === "grad");
    const ug = list.filter((m) => m.group === "ug");
    $("#gradGrid").innerHTML = grad.map(memberCard).join("");
    $("#ugGrid").innerHTML = ug.map(memberCard).join("");
    setCount("grad", grad.length, "members");
    setCount("ug", ug.length, "members");

    const alumni = D.alumni || [];
    $("#alumniGrid").innerHTML = alumni.map(alumniCard).join("");
    setCount("alumni", alumni.length, "alumni");
  }
  function setCount(key, n, word) {
    const el = $(`[data-count-of="${key}"]`);
    if (el) el.textContent = `${pad(n)} ${word}`;
  }

  /* ---------------- Latest News ---------------- */
  const NEWS_FIRST = 7; // shown at first
  const NEWS_STEP = 5;  // added per "View more" click
  const NEWS_TAG = { Funding: "tag--blue", Award: "tag--amber", Research: "tag--teal", Book: "tag--slate", Lab: "tag--line" };

  function newsLinks(links) {
    if (!links || !links.length) return "";
    const one = links.length === 1;
    return `<span class="news__links">${one ? "" : "News:"}${links.map((l) => {
      const label = `[${esc(l.label)}]`;
      return l.url
        ? `<a href="${esc(l.url)}" target="_blank" rel="noopener">${label}</a>`
        : `<a aria-disabled="true" title="링크 URL 입력 필요">${label}</a>`;
    }).join(" ")}</span>`;
  }

  function renderNews() {
    const box = $("#newsList");
    if (!box) return;
    const list = D.news || [];
    box.innerHTML = list.map((n, i) => `<li class="news__item reveal"${i >= NEWS_FIRST ? " hidden" : ""}>
      <span class="news__date">${esc(n.date)}</span>
      <p class="news__text"><span class="tag ${NEWS_TAG[n.type] || "tag--line"}">${esc(n.type)}</span>${n.who ? `${esc(n.text.replace(/\.$/, ""))} <span class="who">(${esc(n.who)})</span>.` : esc(n.text)}${newsLinks(n.links)}</p>
    </li>`).join("");

    const meta = $("#newsMeta");
    if (meta && list.length) meta.innerHTML = `<span class="news-meta__live"><span class="live-dot" aria-hidden="true"></span>Updated <b>${esc(list[0].date)}</b></span>`;

    const more = $("#newsMore");
    if (!more || list.length <= NEWS_FIRST) return;
    let shown = NEWS_FIRST;
    more.innerHTML = `<button type="button" class="btn btn--ghost" data-act="more" aria-controls="newsList"><span></span><svg><use href="#i-arrow"/></svg></button>
      <button type="button" class="btn btn--ghost news__less" data-act="less" aria-controls="newsList"><span>Show less</span><svg><use href="#i-arrow"/></svg></button>`;
    const moreBtn = $('[data-act="more"]', more);
    const lessBtn = $('[data-act="less"]', more);
    const sync = () => {
      $$(".news__item", box).forEach((li, i) => { li.hidden = i >= shown; if (!li.hidden) li.classList.add("is-in"); });
      moreBtn.hidden = shown >= list.length;
      lessBtn.hidden = shown <= NEWS_FIRST;
      $("span", moreBtn).textContent = `View more (+${Math.min(NEWS_STEP, list.length - shown)})`;
    };
    moreBtn.addEventListener("click", () => {
      shown = Math.min(shown + NEWS_STEP, list.length);
      sync();
      if (moreBtn.hidden) lessBtn.focus();
    });
    lessBtn.addEventListener("click", () => {
      shown = NEWS_FIRST;
      sync();
      moreBtn.focus({ preventScroll: true });
      $("#news").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
    sync();
  }

  /* ---------------- Publications ---------------- */
  const TYPE = {
    journal:    { label: "Journal",    short: "J", cls: "tag--blue" },
    conference: { label: "Conference", short: "C", cls: "tag--teal" },
    patent:     { label: "Patent",     short: "P", cls: "tag--slate" },
    talk:       { label: "Talk",       short: "T", cls: "tag--line" }
  };
  let pubFilter = "all";

  function boldProf(authors) {
    let html = esc(authors);
    [].concat(D.profName || []).forEach((name) => {
      html = html.split(esc(name)).join("<b>" + esc(name) + "</b>");
    });
    // {Name} marks another AMPLIA member
    return html.replace(/\{([^}]+)\}/g, "<b>$1</b>");
  }

  const TYPE_ORDER = ["journal", "conference", "patent", "talk"];
  const TYPE_TITLE = { journal: "Journals", conference: "Conferences", patent: "Patents", talk: "Talks" };
  const cats = (type) => (D.pubCategories && D.pubCategories[type]) || [];
  const catRank = (p) => (p.category ? cats(p.type).indexOf(p.category) + 1 : 0);
  // numbering series: books (B), domestic conferences (D), each patent category (P), else J / C / T
  const series = (p) => {
    if (p.kind === "book") return { key: "B", prefix: "B" };
    if (p.type === "conference" && p.category) return { key: "D", prefix: "D" };
    if (p.type === "patent") return { key: "P:" + (p.category || ""), prefix: "P" };
    return { key: TYPE[p.type].short, prefix: TYPE[p.type].short };
  };
  const pubGroup = (p) => p.category || (D.archiveYear && p.year <= D.archiveYear ? "~" + D.archiveYear : String(p.year));

  function sortPubs(list) {
    // patents keep the listed order inside each category; everything else newest first
    return list.sort((a, b) =>
      TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) ||
      catRank(a) - catRank(b) ||
      (a.type === "patent" ? 0 : b.year - a.year) ||
      a._i - b._i);
  }

  function renderPubs() {
    if (!$("#pubList")) return;
    const all = sortPubs((D.publications || []).map((p, i) => ({ ...p, _i: i })));

    // numbering per series; first listed = highest number
    const totals = {}, typeTotals = {}, seen = {};
    all.forEach((p) => { const k = series(p).key; totals[k] = (totals[k] || 0) + 1; typeTotals[p.type] = (typeTotals[p.type] || 0) + 1; });
    all.forEach((p) => { const s = series(p); seen[s.key] = (seen[s.key] || 0) + 1; p._no = s.prefix + (totals[s.key] - seen[s.key] + 1); });

    $$("#pubTabs .tab").forEach((t) => {
      const f = t.dataset.filter;
      $(".n", t).textContent = f === "all" ? all.length : (typeTotals[f] || 0);
    });

    renderProgress();

    const multi = pubFilter === "all";
    const types = multi ? TYPE_ORDER : [pubFilter];
    const html = types.map((type) => {
      const items = all.filter((p) => p.type === type);
      const groups = new Map();
      if (type === "patent") cats(type).forEach((c) => groups.set(c, []));   // show empty patent groups too
      items.forEach((p) => { const g = pubGroup(p); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(p); });
      if (!groups.size) return "";

      const body = [];
      groups.forEach((list, label) => {
        const isCat = !/^~?\d+$/.test(label);
        body.push(`<div class="pub-year">
          <div class="pub-year__label${isCat ? " is-cat" : ""}">${esc(label)}</div>
          <div>${list.length ? list.map((p, i) => pubItem(p, i)).join("") : `<p class="pub-empty">—</p>`}</div>
        </div>`);
      });
      const head = multi ? `<h3 class="pub-type">${TYPE_TITLE[type]}<span>${pad(items.length)}</span></h3>` : "";
      return `<section class="pub-section">${head}${body.join("")}</section>`;
    }).join("");
    $("#pubList").innerHTML = html || `<p class="pub-note" style="padding:32px 0">No items yet.</p>`;
  }

  function renderProgress() {
    const box = $("#pubProgress");
    if (!box) return;
    const list = D.pubInProgress || [];
    if (!list.length || !(pubFilter === "all" || pubFilter === "journal")) { box.innerHTML = ""; return; }
    box.innerHTML = `<div class="pub-progress">
      <h4 class="pub-progress__title"><span class="live-dot" aria-hidden="true"></span>In Progress</h4>
      <ul>${list.map((x) => `<li>
        <span class="tag ${x.status === "Submitted" ? "tag--blue" : "tag--amber"}">${esc(x.status)}</span>
        <span class="pub-progress__text">${esc(x.text)}${x.note ? ` <em>[${esc(x.note)}]</em>` : ""}</span>
      </li>`).join("")}</ul>
    </div>`;
  }

  function pubItem(p, i) {
    const t = TYPE[p.type];
    const title = p.link
      ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.title)}</a>`
      : `<span>${esc(p.title)}</span>`;
    const badges = p.kind === "book"
      ? `<span class="tag tag--amber">${esc(p.venue)}</span>`
      : [
          `<span class="tag ${t.cls}">${t.label}</span>`,
          `<span class="tag tag--line">${esc(p.venue)}</span>`,
          p.award ? `<span class="tag ${/best paper/i.test(p.award) ? "tag--best" : "tag--amber"}">★ ${esc(p.award)}</span>` : "",
          p.status ? `<span class="tag tag--line">${esc(p.status)}</span>` : ""
        ].join("");
    const best = /best paper/i.test(p.award || "");
    return `<article class="pub${best ? " pub--best" : ""}" style="animation-delay:${Math.min(i * 0.05, 0.4)}s">
      <span class="pub__no">[${p._no}]</span>
      <div>
        <div class="pub__badges">${badges}</div>
        <h4 class="pub__title">${title}</h4>
        ${p.authors ? `<p class="pub__authors">${boldProf(p.authors)}</p>` : ""}
        <p class="pub__venue">${esc(p.info)}</p>
        ${p.link ? `<div class="pub__meta"><a href="${esc(p.link)}" target="_blank" rel="noopener">DOI / Link ↗</a></div>` : ""}
      </div>
    </article>`;
  }

  function setPubFilter(f) {
    pubFilter = f;
    $$("#pubTabs .tab").forEach((t) => {
      const on = t.dataset.filter === f;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on);
    });
    renderPubs();
  }

  /* ---------------- Gallery ---------------- */
  // Deterministic placeholder die drawing, replaced by a real photo when provided.
  function dieSVG(seed) {
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const pads = [];
    for (let i = 0; i < 12; i++) {
      const p = 14 + i * 14.3;
      pads.push(`<rect x="${p}" y="4" width="8" height="8"/><rect x="${p}" y="188" width="8" height="8"/><rect x="4" y="${p}" width="8" height="8"/><rect x="188" y="${p}" width="8" height="8"/>`);
    }
    const fills = ["#34506d", "#3f6285", "#2b4058", "#4d6e8f", "#27394d", "#5a7d9e"];
    const blocks = [];
    let x = 22;
    while (x < 170) {
      const w = 26 + Math.floor(rnd() * 40);
      let y = 22;
      const cw = Math.min(w, 178 - x);
      while (y < 170) {
        const h = 22 + Math.floor(rnd() * 50);
        const ch = Math.min(h, 178 - y);
        blocks.push(`<rect x="${x}" y="${y}" width="${cw - 4}" height="${ch - 4}" fill="${fills[Math.floor(rnd() * fills.length)]}" opacity="${0.55 + rnd() * 0.45}"/>`);
        y += h;
      }
      x += w;
    }
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      <rect x="0.5" y="0.5" width="199" height="199" fill="#1f2d3d" stroke="#51677f"/>
      <g fill="#8aa0b6" opacity=".75">${pads.join("")}</g>
      <rect x="18" y="18" width="164" height="164" fill="none" stroke="#51677f" stroke-dasharray="2 3"/>
      <g>${blocks.join("")}</g>
    </svg>`;
  }

  const CHIP_SPECS = [["process", "Process"], ["pub", "Published"], ["year", "Year"], ["area", "Area"]];

  // home shows the newest CHIP_PREVIEW chips (top of D.chips)
  const CHIP_PREVIEW = 4;
  const chipCard = (c, i) => `<article class="chip reveal" style="--d:${(i % 4) * 0.06}s">
      <div class="chip__img${c.photo ? " has-photo" : ""}">${c.photo ? `<img src="${esc(c.photo)}" alt="${esc(c.name)} die photo" loading="lazy">` : `<span class="ph-label">Die photo · placeholder</span>${dieSVG(i + 3)}`}</div>
      <div class="chip__body">
        <h4>${esc(c.name)}</h4>
        <dl class="chip__specs">${CHIP_SPECS.filter(([k]) => c[k]).map(([k, label]) => `<div${k === "pub" ? " class=\"is-pub\"" : ""}><dt>${label}</dt><dd>${esc(c[k])}</dd></div>`).join("")}</dl>
      </div>
    </article>`;

  function renderGallery() {
    const chips = D.chips || [];
    if ($("#chipGrid")) $("#chipGrid").innerHTML = chips.map(chipCard).join("");
    if ($("#chipGridHome")) $("#chipGridHome").innerHTML = chips.slice(0, CHIP_PREVIEW).map(chipCard).join("");
    setCount("chips", chips.length, "chips");

    // total shots across all albums, placeholders ("") not counted
    setCount("photos", TEAM.reduce((sum, p) => sum + p.list.filter(Boolean).length, 0), "photos");
    if ($("#teamPhotos")) {
      $("#teamPhotos").innerHTML = TEAM.map((p, i) => {
        const n = p.list.length;
        return `<figure class="team-photo${p.size ? ` team-photo--${esc(p.size)}` : ""} reveal" style="--d:${(i % 4) * 0.06}s;margin:0">
        ${p.list[0] ? `<img src="${esc(p.list[0])}" alt="${esc(p.caption)}" loading="lazy">` : `<div class="ph"><svg><use href="#i-image"/></svg></div>`}
        ${n > 1 ? `<span class="team-photo__count" aria-hidden="true">${ICON.stack}${n}</span>` : ""}
        <figcaption>${esc(p.caption)}<span>${esc(p.date)}</span></figcaption>
        <button type="button" class="team-photo__open" data-album="${i}" aria-label="${esc(p.caption)}${n > 1 ? ` — 사진 ${n}장` : ""} 크게 보기"></button>
      </figure>`;
      }).join("");
      $("#teamPhotos").addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-album]");
        if (b) openAlbum(+b.dataset.album, b);
      });
    }
  }

  /* ---------------- Photo viewer ---------------- */
  const ICON = {
    stack: `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="10" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M11.5 14.5h-9a1 1 0 0 1-1-1v-9" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
    close: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.6"/></svg>`,
    prev: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
    next: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`
  };
  // every event is an album: `photos` for several shots, `photo` for one
  const TEAM = (D.teamPhotos || []).map((p) => ({ ...p, list: p.photos && p.photos.length ? p.photos : [p.photo || ""] }));
  let lb = null, lbAlbum = 0, lbIdx = 0, lbReturn = null;

  function buildViewer() {
    lb = document.createElement("div");
    lb.className = "viewer";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-labelledby", "viewerTitle");
    lb.innerHTML = `<div class="viewer__panel">
      <div class="viewer__head">
        <div><h3 id="viewerTitle"></h3><span class="viewer__date"></span></div>
        <span class="viewer__pos" aria-live="polite"></span>
        <button type="button" class="viewer__btn viewer__close" aria-label="닫기">${ICON.close}</button>
      </div>
      <div class="viewer__stage">
        <div class="viewer__img"></div>
        <button type="button" class="viewer__btn viewer__nav viewer__nav--prev" aria-label="이전 사진">${ICON.prev}</button>
        <button type="button" class="viewer__btn viewer__nav viewer__nav--next" aria-label="다음 사진">${ICON.next}</button>
      </div>
      <div class="viewer__thumbs" aria-label="사진 선택"></div>
    </div>`;
    document.body.appendChild(lb);
    lb.addEventListener("click", (ev) => {
      if (ev.target === lb || ev.target.closest(".viewer__close")) return closeAlbum();
      if (ev.target.closest(".viewer__nav--prev")) return showPhoto(lbIdx - 1);
      if (ev.target.closest(".viewer__nav--next")) return showPhoto(lbIdx + 1);
      const t = ev.target.closest("[data-idx]");
      if (t) showPhoto(+t.dataset.idx);
    });
    document.addEventListener("keydown", (ev) => {
      if (lb.hidden) return;
      if (ev.key === "Escape") closeAlbum();
      else if (ev.key === "ArrowLeft") showPhoto(lbIdx - 1);
      else if (ev.key === "ArrowRight") showPhoto(lbIdx + 1);
      else if (ev.key === "Tab") {
        // keep focus inside the dialog
        const f = $$("button", lb).filter((b) => b.offsetParent);
        const first = f[0], last = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      }
    });
  }

  function openAlbum(i, from) {
    if (!lb) buildViewer();
    lbAlbum = i; lbReturn = from;
    const p = TEAM[i], n = p.list.length;
    $("#viewerTitle", lb).textContent = p.caption;
    $(".viewer__date", lb).textContent = p.date;
    lb.classList.toggle("is-single", n < 2);
    $(".viewer__thumbs", lb).innerHTML = n < 2 ? "" : p.list.map((src, k) => `<button type="button" class="viewer__thumb" data-idx="${k}" aria-label="${k + 1}번째 사진">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : `<svg><use href="#i-image"/></svg>`}</button>`).join("");
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    showPhoto(0);
    $(".viewer__close", lb).focus();
  }

  function showPhoto(k) {
    const p = TEAM[lbAlbum], n = p.list.length;
    lbIdx = (k + n) % n;
    const src = p.list[lbIdx];
    $(".viewer__img", lb).innerHTML = src
      ? `<img src="${esc(src)}" alt="${esc(p.caption)} (${lbIdx + 1}/${n})">`
      : `<div class="ph"><svg><use href="#i-image"/></svg><span>Photo ${n > 1 ? `${lbIdx + 1} ` : ""}· placeholder</span></div>`;
    $(".viewer__pos", lb).textContent = n > 1 ? `${lbIdx + 1} / ${n}` : "";
    $$(".viewer__thumb", lb).forEach((t, x) => {
      t.classList.toggle("is-active", x === lbIdx);
      t.setAttribute("aria-current", x === lbIdx ? "true" : "false");
    });
  }

  function closeAlbum() {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lbReturn) lbReturn.focus();
  }

  /* ---------------- Lectures ---------------- */
  function renderLectures() {
    if (!$("#lectureGrid")) return;
    // group terms by year, keeping the data order (newest first)
    const years = [];
    (D.lectures || []).forEach((t) => {
      const [year, season] = t.term.split(" ");
      let y = years.find((x) => x.year === year);
      if (!y) years.push((y = { year, terms: [] }));
      y.terms.push({ season, courses: t.courses || [] });
    });
    const course = (c) => `<li class="lec__course">
        <div class="lec__title">${esc(c.title)}${c.code ? `<span class="lec__code">${esc(c.code)}</span>` : ""}</div>
        <div class="lec__tags">${c.grad ? `<span class="tag tag--blue">Graduate</span>` : ""}${c.coteach ? `<span class="tag tag--line">Co-teaching</span>` : ""}${c.host ? `<span class="tag tag--amber">${esc(c.host)}</span>` : ""}</div>
      </li>`;
    $("#lectureGrid").innerHTML = years.map((y) => `<section class="lec__year reveal">
      <h3 class="lec__yearnum">${esc(y.year)}</h3>
      <div>${y.terms.map((t) => `<div class="lec__term">
        <h4 class="lec__season">${esc(t.season)}</h4>
        <ul class="lec__list">${t.courses.map(course).join("")}</ul>
      </div>`).join("")}</div>
    </section>`).join("");
  }

  /* ---------------- Hero background ---------------- */
  // Soft diagonal light bands behind the hero.
  function initHeroBg() {
    const svg = $("#heroBg");
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, parent = svg) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      parent.appendChild(n);
      return n;
    };
    const defs = mk("defs", {});
    const lg = mk("linearGradient", { id: "hbBand", x1: "0", y1: "0", x2: "1", y2: "0" }, defs);
    mk("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": "0" }, lg);
    mk("stop", { offset: ".5", "stop-color": "#fff", "stop-opacity": ".15" }, lg);
    mk("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "0" }, lg);
    const g = mk("g", { class: "hb-bands", transform: "rotate(-24 1100 320)" });
    [[760, 140], [960, 60], [1080, 220], [1330, 90]].forEach(([x, w], i) => mk("rect", { x, y: -400, width: w, height: 1500, fill: "url(#hbBand)", opacity: [1, .7, .9, .6][i] }, g));
    // thin edge lines: hidden behind the nav, strongest mid-hero, fading out toward the bottom
    const fg = mk("linearGradient", { id: "hbFadeGrad", x1: "0", y1: "0", x2: "0", y2: "640", gradientUnits: "userSpaceOnUse" }, defs);
    mk("stop", { offset: "0", "stop-color": "#000" }, fg);
    mk("stop", { offset: ".12", "stop-color": "#000" }, fg);
    mk("stop", { offset: ".4", "stop-color": "#fff" }, fg);
    mk("stop", { offset: ".6", "stop-color": "#fff" }, fg);
    mk("stop", { offset: ".9", "stop-color": "#000" }, fg);
    const mask = mk("mask", { id: "hbFade", maskUnits: "userSpaceOnUse", x: "0", y: "0", width: "1440", height: "640" }, defs);
    mk("rect", { x: 0, y: 0, width: 1440, height: 640, fill: "url(#hbFadeGrad)" }, mask);
    const edges = mk("g", { transform: "rotate(-24 1100 320)" }, mk("g", { mask: "url(#hbFade)" }));
    mk("path", { d: "M1000 -400 L1000 1100", class: "hb-edge" }, edges);
    mk("path", { d: "M1300 -400 L1300 1100", class: "hb-edge" }, edges);
  }

  /* ---------------- Reveal on scroll ---------------- */
  let revealObs;
  function initReveal() {
    const targets = $$(".reveal:not(.is-in)");
    if (reduceMotion || !("IntersectionObserver" in window)) { targets.forEach((t) => t.classList.add("is-in")); return; }
    revealObs = revealObs || new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); revealObs.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    // stagger siblings in lists/grids automatically when no delay is set
    targets.forEach((t) => {
      if (!t.style.getPropertyValue("--d") && t.parentElement) {
        const sibs = Array.from(t.parentElement.children).filter((c) => c.classList.contains("reveal"));
        const i = sibs.indexOf(t);
        if (sibs.length > 2) t.style.setProperty("--d", `${Math.min(i % 8, 7) * 0.05}s`);
      }
      revealObs.observe(t);
    });
  }

  /* ---------------- Counters ---------------- */
  function initCounters() {
    const els = $$("[data-count]");
    const run = (el) => {
      const to = +el.dataset.count;
      if (reduceMotion) { el.textContent = pad(to); return; }
      const t0 = performance.now(), dur = 1200;
      (function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = pad(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    };
    const obs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } }), { threshold: 0.6 });
    els.forEach((e) => obs.observe(e));
  }

  /* ---------------- Nav ---------------- */
  function initNav() {
    const nav = $("#nav"), toggle = $("#navToggle"), fab = $("#fabTop");
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 8);
      fab.classList.toggle("is-visible", y > window.innerHeight * 0.9);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const close = () => { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; };
    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$("#menu a").forEach((a) => a.addEventListener("click", close));
    // tap on the dimmed backdrop (the nav::after overlay) or Esc closes the drawer
    nav.addEventListener("click", (ev) => { if (ev.target === nav && nav.classList.contains("is-open")) close(); });
    document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && nav.classList.contains("is-open")) { close(); toggle.focus(); } });
    window.addEventListener("resize", () => { if (window.innerWidth > 1080) close(); });

    // highlight the menu item of the current page
    const page = document.body.dataset.page;
    $$(".menu__link[data-page]").forEach((l) => l.classList.toggle("is-active", l.dataset.page.split(" ").includes(page)));
  }

  /* ---------------- Page indicator (home) ---------------- */
  // Fixed dot rail on the right: one dot per home section, the current one highlighted.
  const PAGE_SECTIONS = [
    ["home", "Home"],
    ["news", "Latest News"],
    ["research", "Research"],
    ["chips-home", "Chip Gallery"],
    ["join", "Join the Lab"]
  ];
  const DARK_SECTIONS = ["home"]; // dots switch to light colors over these

  function initPageIndicator() {
    if (document.body.dataset.page !== "home") return;
    const items = PAGE_SECTIONS.map(([id, label]) => ({ id, label, el: document.getElementById(id) })).filter((s) => s.el);
    if (items.length < 2) return;

    const nav = document.createElement("nav");
    nav.className = "page-indicator";
    nav.setAttribute("aria-label", "Page sections");
    nav.innerHTML = `<ol>${items.map((s) => `<li><a href="#${s.id}" data-target="${s.id}"><span class="page-indicator__label">${esc(s.label)}</span><span class="page-indicator__dot" aria-hidden="true"></span></a></li>`).join("")}</ol>`;
    document.body.appendChild(nav);
    const links = $$("a", nav);

    nav.addEventListener("click", (ev) => {
      const a = ev.target.closest("a[data-target]");
      if (!a) return;
      ev.preventDefault();
      document.getElementById(a.dataset.target).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });

    // the section crossing the middle of the viewport is the current one
    let current = "";
    const update = () => {
      const mid = window.innerHeight / 2;
      let id = items[0].id;
      for (const s of items) if (s.el.getBoundingClientRect().top <= mid) id = s.id;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) id = items[items.length - 1].id;
      if (id === current) return;
      current = id;
      links.forEach((a) => {
        const on = a.dataset.target === id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
      nav.classList.toggle("is-dark", DARK_SECTIONS.includes(id));
    };
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------------- Init ---------------- */
  renderNews();
  renderMembers();
  const initialFilter = new URLSearchParams(location.search).get("filter");
  if (initialFilter && TYPE[initialFilter]) setPubFilter(initialFilter); else renderPubs();
  renderGallery();
  renderLectures();
  $$("#pubTabs .tab").forEach((t) => t.addEventListener("click", () => setPubFilter(t.dataset.filter)));

  initNav();
  initHeroBg();
  initPageIndicator();
  initReveal();
  initCounters();
})();
