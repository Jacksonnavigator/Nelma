(function () {
  "use strict";

  var pubs = window.PUBLICATIONS || [];

  // Header border once the page scrolls
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
    };
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); toggle.focus(); }
    });
  }

  // Project filter
  var list = document.getElementById("project-list");
  var chips = document.querySelectorAll(".chip[data-filter]");
  if (list && chips.length) {
    var items = list.querySelectorAll("li[data-status]");
    var count = function (f) {
      return Array.prototype.filter.call(items, function (li) { return f === "all" || li.dataset.status === f; }).length;
    };
    chips.forEach(function (chip) {
      chip.querySelector(".count").textContent = count(chip.dataset.filter);
      chip.addEventListener("click", function () {
        var f = chip.dataset.filter;
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        items.forEach(function (li) { li.hidden = !(f === "all" || li.dataset.status === f); });
      });
    });
  }

  // Publications
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function renderPub(p) {
    // The DOI becomes the link, so drop it from the citation text
    var raw = p.doi ? p.text.replace(/\s*(https?:\/\/(dx\.)?doi\.org\/|doi\.org\/|doi:\s*|DOI:\s*)\S+\.?/gi, "").replace(/[,\s]+$/, ".") : p.text;
    var text = escapeHtml(raw).replace(/KIVEVELE,?\s*T\.?(\s*T\.)?/g, function (m) { return "<mark>" + m + "</mark>"; });
    var link = p.doi
      ? '<a href="https://doi.org/' + encodeURI(p.doi) + '" target="_blank" rel="noopener">Read the paper</a>'
      : "";
    return '<li class="pub"><span class="pub-year">' + (p.year || "") + '</span><div><p class="pub-text">' + text +
      '</p><div class="pub-meta"><span class="pub-type">' + p.type + "</span>" + link + "</div></div></li>";
  }
  var byNewest = function (a, b) { return (b.year || 0) - (a.year || 0); };

  var recent = document.getElementById("recent-pubs");
  if (recent && pubs.length) {
    var limit = parseInt(recent.dataset.limit, 10) || 6;
    recent.innerHTML = pubs.filter(function (p) { return p.type === "Journal article"; })
      .sort(byNewest).slice(0, limit).map(renderPub).join("");
  }

  var all = document.getElementById("all-pubs");
  if (all && pubs.length) {
    var q = document.getElementById("pub-q");
    var yearSel = document.getElementById("pub-year");
    var typeSel = document.getElementById("pub-type");
    var status = document.getElementById("pub-status");
    var empty = document.getElementById("pub-empty");

    var years = Array.from(new Set(pubs.map(function (p) { return p.year; }))).filter(Boolean).sort(function (a, b) { return b - a; });
    years.forEach(function (y) { yearSel.insertAdjacentHTML("beforeend", "<option>" + y + "</option>"); });
    Array.from(new Set(pubs.map(function (p) { return p.type; }))).forEach(function (t) {
      typeSel.insertAdjacentHTML("beforeend", "<option>" + t + "</option>");
    });

    var update = function () {
      var term = q.value.trim().toLowerCase();
      var y = yearSel.value, t = typeSel.value;
      var shown = pubs.filter(function (p) {
        return (!term || p.text.toLowerCase().indexOf(term) !== -1) &&
          (!y || String(p.year) === y) && (!t || p.type === t);
      }).sort(byNewest);
      all.innerHTML = shown.map(renderPub).join("");
      empty.hidden = shown.length > 0;
      status.textContent = "Showing " + shown.length + " of " + pubs.length + " publications";
    };
    [q, yearSel, typeSel].forEach(function (el) { el.addEventListener("input", update); });
    document.getElementById("pub-clear").addEventListener("click", function () {
      q.value = ""; yearSel.value = ""; typeSel.value = ""; update(); q.focus();
    });
    update();
  }

  // Contact form: validate on blur, then open a pre-filled email
  var form = document.getElementById("contact-form");
  if (form) {
    var fields = [
      { el: form.elements.name, err: document.getElementById("cf-name-err") },
      { el: form.elements.message, err: document.getElementById("cf-msg-err") }
    ];
    var check = function (f) {
      var ok = f.el.value.trim().length > 0;
      f.err.hidden = ok;
      f.el.setAttribute("aria-invalid", String(!ok));
      if (!ok) f.el.setAttribute("aria-describedby", f.err.id); else f.el.removeAttribute("aria-describedby");
      return ok;
    };
    fields.forEach(function (f) {
      f.el.addEventListener("blur", function () { if (f.el.value) check(f); });
      f.el.addEventListener("input", function () { if (f.el.getAttribute("aria-invalid") === "true") check(f); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = fields.filter(function (f) { return !check(f); });
      if (bad.length) { bad[0].el.focus(); return; }
      var d = form.elements;
      var subject = d.topic.value + " from " + d.name.value.trim() + (d.org.value.trim() ? " (" + d.org.value.trim() + ")" : "");
      var body = d.message.value.trim() + "\n\n" + d.name.value.trim() + (d.org.value.trim() ? "\n" + d.org.value.trim() : "");
      window.location.href = "mailto:thomas.kivevele@nm-aist.ac.tz?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
