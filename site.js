/* The only JavaScript on the site. The Services menu, the enquiry form, and
   two small fixes to static links. Nothing here stores anything, sets a
   cookie, or talks to anyone but the portal's enquiry endpoint. */
(function () {
  var header = document.querySelector("[data-header]");
  var mega = document.getElementById("mega");
  var buttons = document.querySelectorAll('[aria-controls="mega"]');
  var hasForm = Boolean(document.getElementById("start"));

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

  /* On a page without the form, the Start building button goes to /start.
     The prefix comes from this script's own URL, so a sub-path host works. */
  if (!hasForm) {
    var src = (document.currentScript && document.currentScript.getAttribute("src")) || "/site.js";
    var prefix = src.replace(/\/site\.js.*$/, "");
    document.querySelectorAll('a[href="#start"]').forEach(function (a) { a.setAttribute("href", prefix + "/start"); });
  }

  var form = document.querySelector("form.enquiry");
  if (!form) return;
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
})();
