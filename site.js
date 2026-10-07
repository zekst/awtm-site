/* The only JavaScript on the site. The Services menu, the enquiry form and
   its popup, the work card previews, the Mother Box loader, and a prefix on
   the static links for a sub-path host. Nothing here stores anything, sets a
   cookie, or talks to anyone but the portal's enquiry endpoint. */
(function () {
  var header = document.querySelector("[data-header]");
  var mega = document.getElementById("mega");
  var buttons = document.querySelectorAll('[aria-controls="mega"]');

  function set(open) {
    if (!mega) return;
    mega.hidden = !open;
    mega.classList.toggle("open", open);
    buttons.forEach(function (b) { b.setAttribute("aria-expanded", open ? "true" : "false"); });
  }
  function isOpen() { return mega && !mega.hidden; }

  buttons.forEach(function (b) {
    b.addEventListener("click", function (e) { e.stopPropagation(); set(!isOpen()); });
  });
  document.addEventListener("click", function (e) {
    if (isOpen() && header && !header.contains(e.target)) set(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) {
      set(false);
      var first = document.querySelector(".nav-services");
      if (first && getComputedStyle(first).display !== "none") first.focus();
      else { var t = document.querySelector(".menu-toggle"); if (t) t.focus(); }
    }
  });
  if (mega) {
    mega.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { set(false); });
      if (a.getAttribute("href") === location.pathname) a.setAttribute("aria-current", "page");
    });
  }

  /* The prefix comes from this script's own URL, so a sub-path host works. */
  var src = (document.currentScript && document.currentScript.getAttribute("src")) || "/site.js";
  var prefix = src.replace(/\/site\.js.*$/, "");

  /* Links to /start carry the prefix on a sub-path host. */
  document.querySelectorAll('a[href="/start"]').forEach(function (a) { a.setAttribute("href", prefix + "/start"); });

  /* What we do: the cards power on one after another as they come into
     view, and the 3D layer loads only when the section is near, never under
     data saver, never without WebGL. Everything the section says is in the
     HTML already; this adds the object. */
  var whatWeDo = document.querySelector("[data-what-we-do]");
  if (whatWeDo && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js");
    var cards = whatWeDo.querySelectorAll(".pillar");
    var enter = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); enter.unobserve(e.target); } });
    }, { threshold: 0.2 });
    cards.forEach(function (c) { enter.observe(c); });
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var conn = navigator.connection;
    var slow = conn && (conn.saveData || /2g/.test(conn.effectiveType || ""));
    var lowEnd = (navigator.deviceMemory || 8) < 3 || (navigator.hardwareConcurrency || 8) < 4;
    if (!slow && !lowEnd) {
      var near = new IntersectionObserver(function (entries) {
        if (!entries.some(function (e) { return e.isIntersecting; })) return;
        near.disconnect();
        /* Probe for WebGL only now, and give the probe context back. */
        var hasGL = false;
        try {
          var c = document.createElement("canvas");
          var gl = c.getContext("webgl2") || c.getContext("webgl");
          hasGL = !!gl;
          var lose = gl && gl.getExtension("WEBGL_lose_context");
          if (lose) lose.loseContext();
        } catch (e) { hasGL = false; }
        if (!hasGL) return;
        import(prefix + "/motherbox.e668894d.js").then(function (m) { return m.boot({ base: prefix, reducedMotion: reduced, section: whatWeDo }); }).catch(function () {});
      }, { rootMargin: "600px 0px" });
      /* Observe only once the reader has moved, so the measured page load never fetches the module. */
      window.addEventListener("scroll", function () { near.observe(whatWeDo); }, { once: true, passive: true });
    }
  }

  /* The enquiry popup: the header button opens the form in a dialog; without
     JavaScript, or in a browser without dialog, the link goes to the form. */
  var dialog = document.getElementById("enquiry-dialog");
  if (dialog && typeof dialog.showModal === "function") {
    var opener = null;
    document.querySelectorAll("[data-open-enquiry]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); opener = e.currentTarget; set(false); dialog.showModal(); });
    });
    dialog.querySelectorAll("[data-close-enquiry]").forEach(function (b) { b.addEventListener("click", function () { dialog.close(); }); });
    /* Step one shows the ways in; "Send us mail" reveals the form. Each opening starts at step one. */
    var ways = dialog.querySelector("[data-ways]");
    var formPanel = dialog.querySelector("[data-form-panel]");
    if (ways && formPanel) {
      var showForm = function () { ways.hidden = true; formPanel.hidden = false; var first = formPanel.querySelector("input, textarea, select"); if (first) first.focus(); };
      dialog.querySelectorAll("[data-show-form]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); showForm(); }); });
      document.querySelectorAll("[data-open-enquiry]").forEach(function (a) { a.addEventListener("click", function () { ways.hidden = false; formPanel.hidden = true; }); });
    }
    /* A press that starts on the backdrop closes; a drag that ends there does not. */
    var downOnBackdrop = false;
    dialog.addEventListener("pointerdown", function (e) { downOnBackdrop = e.target === dialog; });
    dialog.addEventListener("click", function (e) { if (downOnBackdrop && e.target === dialog) dialog.close(); });
    /* Focus goes back to the opener, or to the menu toggle when the opener was inside the closed menu. */
    dialog.addEventListener("close", function () {
      var target = opener && opener.offsetParent !== null ? opener : document.querySelector(".menu-toggle");
      if (target) target.focus();
    });
  }

  /* Work card previews: a muted clip plays while the card is hovered or
     focused, only on a pointer that can hover, never under reduced motion;
     the files are not even named until the first hover. */
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".card[data-preview]").forEach(function (card) {
      var v = card.querySelector("video.preview");
      if (!v) return;
      function start() {
        if (!v.src) { v.poster = prefix + v.dataset.poster; v.src = prefix + v.dataset.src; }
        v.play().catch(function () {});
      }
      function stop() { v.pause(); v.currentTime = 0; }
      card.addEventListener("pointerenter", start);
      card.addEventListener("focusin", start);
      card.addEventListener("pointerleave", stop);
      card.addEventListener("focusout", stop);
    });
  }

  document.querySelectorAll("form.enquiry").forEach(bindForm);
  function bindForm(form) {
  var status = form.querySelector(".sent");
  var button = form.querySelector('button[type="submit"]');
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var service = String(data.get("service") || "");
    var stuck = String(data.get("stuck") || "");
    var body = {
      name: data.get("name"),
      business: data.get("business"),
      problem: service ? form.dataset.serviceLabel + ": " + service + "\n\n" + stuck : stuck,
      contact: data.get("contact")
    };
    button.disabled = true;
    button.textContent = form.dataset.sending;
    status.textContent = "";
    fetch(form.dataset.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (res) {
        if (res.ok) { form.reset(); status.textContent = form.dataset.sent; return; }
        return res.json().then(function (j) { status.textContent = (j && j.error) || form.dataset.fallback; }, function () { status.textContent = form.dataset.fallback; });
      })
      .catch(function () { status.textContent = form.dataset.fallback; })
      .then(function () { button.disabled = false; button.textContent = form.dataset.submit; });
  });
  }
})();
