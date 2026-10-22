// Don Bosco KIITEC — small progressive enhancements. Every page works without this file.
(function () {
  "use strict";

  var ADMISSIONS_EMAIL = "info@kiitec.ac.tz";

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("open");
        toggle.focus();
      }
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Pre-select a programme from ?programme=... (links on the Programmes page)
  var params = new URLSearchParams(window.location.search);
  var wanted = params.get("programme");
  if (wanted) {
    document.querySelectorAll("select[name='programme']").forEach(function (select) {
      Array.prototype.forEach.call(select.options, function (opt) {
        if (opt.value === wanted || opt.text === wanted) select.value = opt.value;
      });
    });
  }

  // Form validation: check on blur, clear as soon as the value is fixed
  function fieldOf(input) { return input.closest(".field"); }
  function validate(input) {
    var field = fieldOf(input);
    if (!field) return true;
    var ok = input.checkValidity();
    field.classList.toggle("invalid", !ok);
    input.setAttribute("aria-invalid", String(!ok));
    return ok;
  }

  document.querySelectorAll("form[data-mailto]").forEach(function (form) {
    var inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach(function (input) {
      input.addEventListener("blur", function () { if (input.value) validate(input); });
      input.addEventListener("input", function () {
        if (fieldOf(input) && fieldOf(input).classList.contains("invalid")) validate(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      inputs.forEach(function (input) {
        if (!validate(input) && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }

      var data = new FormData(form);
      var lines = [];
      form.querySelectorAll("[data-label]").forEach(function (input) {
        var value = (data.get(input.name) || "").toString().trim();
        if (value) lines.push(input.getAttribute("data-label") + ": " + value);
      });

      var subject = form.getAttribute("data-subject") || "Website enquiry";
      var subjectField = data.get("subject");
      var name = (data.get("name") || "").toString().trim();
      var programme = (data.get("programme") || "").toString().trim();
      if (subjectField) subject = subjectField.toString();
      else if (programme) subject += " — " + programme;
      if (name) subject += " (" + name + ")";

      var href = "mailto:" + ADMISSIONS_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n") + "\n\nSent from the KIITEC website.");
      window.location.href = href;

      var status = form.querySelector(".form-status");
      if (status) {
        status.classList.add("show");
        status.focus();
      }
    });
  });

  // Gallery filter + lightbox
  var gallery = document.querySelector(".gallery");
  var filters = document.querySelectorAll(".gallery-filter button");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tag = btn.getAttribute("data-filter");
      filters.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      gallery.querySelectorAll("button[data-tag]").forEach(function (item) {
        item.hidden = tag !== "all" && item.getAttribute("data-tag") !== tag;
      });
    });
  });

  var box = document.querySelector(".lightbox");
  if (gallery && box && typeof box.showModal === "function") {
    var boxImg = box.querySelector("img");
    var boxCap = box.querySelector("figcaption");
    var opener = null;
    gallery.addEventListener("click", function (e) {
      var item = e.target.closest("button[data-tag]");
      if (!item) return;
      var img = item.querySelector("img");
      opener = item;
      boxImg.src = img.getAttribute("data-full") || img.src;
      boxImg.alt = img.alt;
      boxCap.textContent = img.alt;
      box.showModal();
    });
    box.querySelector(".lightbox-close").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("close", function () { if (opener) opener.focus(); });
  }
})();
