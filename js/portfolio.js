(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---------------- Theme ---------------- */
  function initTheme() {
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    var icon = btn.querySelector("i");
    var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;

    function savedPref() {
      try {
        var value = localStorage.getItem("theme");
        return value === "light" || value === "dark" ? value : null;
      } catch (err) {
        return null;
      }
    }

    function apply(light) {
      if (light) root.setAttribute("data-theme", "light");
      else root.removeAttribute("data-theme");
      render();
    }

    function render() {
      var isLight = root.getAttribute("data-theme") === "light";
      if (icon) icon.className = isLight ? "fa-solid fa-moon" : "fa-solid fa-sun";
      btn.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    }

    btn.addEventListener("click", function () {
      var isLight = root.getAttribute("data-theme") === "light";
      try {
        localStorage.setItem("theme", isLight ? "dark" : "light");
      } catch (err) { }
      apply(!isLight);
    });

    // Follow the OS preference live until the visitor makes an explicit choice.
    if (media && media.addEventListener) {
      media.addEventListener("change", function (e) {
        if (!savedPref()) apply(e.matches);
      });
    }

    if (!savedPref() && media) apply(media.matches);
    else render();
  }

  /* ---------------- Glitching code canvas ---------------- */
  function initCanvas() {
    var canvas = document.getElementById("glitchCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var hero = canvas.parentElement;
    var fontSize = 15;
    var columns = 0;
    var drops = [];
    var chars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0;
    var h = 0;
    var lastGlitch = 0;

    var glyphs = "01{}[]()<>/\\|=+-*&^%$#@!;:.,abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    function colors() {
      var light = root.getAttribute("data-theme") === "light";
      return light
        ? { head: "rgba(8,145,178,", body: "rgba(8,145,178,", spike: "rgba(225,29,59,", fade: 0.5 }
        : { head: "rgba(53,224,255,", body: "rgba(53,224,255,", spike: "rgba(255,46,77,", fade: 0.55 };
    }

    function resize() {
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.floor(w / fontSize);
      drops = [];
      chars = [];
      for (var i = 0; i < columns; i++) {
        drops[i] = Math.random() * -40;
        chars[i] = -1;
      }
    }

    function randomChar() {
      return glyphs[(Math.random() * glyphs.length) | 0];
    }

    function draw(now) {
      var c = colors();
      ctx.clearRect(0, 0, w, h);
      ctx.font = fontSize + "px 'JetBrains Mono', monospace";
      ctx.textBaseline = "top";

      for (var i = 0; i < columns; i++) {
        var x = i * fontSize;
        var head = Math.floor(drops[i]);

        for (var t = 0; t < 20; t++) {
          var y = head - t;
          if (y < 0) continue;
          var py = y * fontSize;
          if (py > h) continue;
          var alpha = Math.max(0, (1 - t / 20)) * c.fade;
          var ch = t === 0 ? randomChar() : (chars[i] === -1 ? randomChar() : null);
          if (ch === null) ch = glyphs[(Math.abs((i * 7 + y * 13)) % glyphs.length)];
          if (t === 0) {
            ctx.fillStyle = c.head + Math.min(1, alpha + 0.35) + ")";
          } else {
            ctx.fillStyle = (Math.random() < 0.03 ? c.spike : c.body) + alpha + ")";
          }
          ctx.fillText(ch, x, py);
        }

        drops[i] += 0.55 + (i % 5) * 0.08;
        if (drops[i] * fontSize > h + 120 && Math.random() > 0.975) {
          drops[i] = Math.random() * -20;
        }
        if (chars[i] === -1 && Math.random() < 0.08) chars[i] = 0;
      }

      // occasional RGB-split glitch bands
      if (now - lastGlitch > 3200 && Math.random() < 0.02) {
        lastGlitch = now;
        var bands = 2 + ((Math.random() * 3) | 0);
        for (var b = 0; b < bands; b++) {
          var by = Math.random() * h;
          var bh = 1 + Math.random() * 3;
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = c.spike + "0.35)";
          ctx.fillRect(Math.random() * 20, by, w, bh);
          ctx.fillStyle = c.head + "0.25)";
          ctx.fillRect(-Math.random() * 20, by + 1, w, bh);
          ctx.globalAlpha = 1;
        }
      }

      raf = requestAnimationFrame(draw);
    }

    var raf = null;

    function start() {
      if (reduceMotion) {
        // single static frame
        var c = colors();
        ctx.clearRect(0, 0, w, h);
        ctx.font = fontSize + "px 'JetBrains Mono', monospace";
        for (var i = 0; i < columns; i++) {
          ctx.fillStyle = c.body + "0.18)";
          for (var j = 0; j < h / fontSize; j += 1) {
            ctx.fillText(randomChar(), i * fontSize, j * fontSize);
          }
        }
        return;
      }
      if (!raf) raf = requestAnimationFrame(draw);
    }

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        resize();
        if (reduceMotion) start();
      }, 150);
    });

    if (window.MutationObserver) {
      new MutationObserver(function () {
        if (reduceMotion) start();
      }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    }

    resize();
    start();
  }

  /* ---------------- Typewriter ---------------- */
  function initTypewriter() {
    var el = document.getElementById("typewriter");
    if (!el) return;
    var roles = ["Front-End Developer", "React Native Engineer", "Mobile App Developer", "Travel Vlogger"];
    if (reduceMotion) {
      el.textContent = roles[0];
      return;
    }
    var role = 0;
    var char = 0;
    var deleting = false;

    function tick() {
      var current = roles[role];
      if (!deleting) {
        el.textContent = current.slice(0, ++char);
        if (char === current.length) {
          deleting = true;
          return setTimeout(tick, 1700);
        }
        return setTimeout(tick, 80);
      }
      el.textContent = current.slice(0, --char);
      if (char === 0) {
        deleting = false;
        role = (role + 1) % roles.length;
        return setTimeout(tick, 350);
      }
      setTimeout(tick, 40);
    }
    tick();
  }

  /* ---------------- Reveals ---------------- */
  function initReveals() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = entry.target.getAttribute("data-reveal-delay");
        if (delay) entry.target.style.transitionDelay = delay + "ms";
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Experience years ---------------- */
  function initExperienceYears() {
    var start = new Date(2017, 9, 1); // first joined: October 2017
    var now = new Date();
    var years = now.getFullYear() - start.getFullYear();
    var months = now.getMonth() - start.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < start.getDate())) years--;
    if (years < 0) years = 0;

    var label = years + "+";

    var spans = document.querySelectorAll(".years-exp");
    for (var i = 0; i < spans.length; i++) spans[i].textContent = label;

    var stat = document.getElementById("yearsExp");
    if (stat) {
      stat.setAttribute("data-count", String(years));
      stat.textContent = label;
    }

    var metas = document.querySelectorAll("meta[name='description'], meta[property='og:description']");
    for (var m = 0; m < metas.length; m++) {
      var content = metas[m].getAttribute("content");
      if (content) metas[m].setAttribute("content", content.replace(/\b\d+\+?\s+years\b/g, label + " years"));
    }
  }

  /* ---------------- Stat counters ---------------- */
  function initCounters() {
    var stats = document.querySelector(".about-stats");
    if (!stats) return;
    var nums = stats.querySelectorAll(".stat-num");

    function run() {
      nums.forEach(function (el) {
        var target = parseInt(el.getAttribute("data-count"), 10) || 0;
        var suffix = el.getAttribute("data-suffix") || "";
        if (reduceMotion) {
          el.textContent = target + suffix;
          return;
        }
        var start = performance.now();
        function step(now) {
          var p = Math.min((now - start) / 1200, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }

    if (!("IntersectionObserver" in window)) {
      run();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          run();
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(stats);
  }

  /* ---------------- Bottom nav + scroll spy ---------------- */
  function initNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".bottom-nav a"));
    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);

    links.forEach(function (a) {
      a.addEventListener("click", function (e) {
        var target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        try {
          history.replaceState(null, "", a.getAttribute("href"));
        } catch (err) { }
      });
    });

    function spy() {
      var pos = window.scrollY + window.innerHeight * 0.35;
      var current = sections[0];
      sections.forEach(function (sec) {
        if (sec.offsetTop <= pos) current = sec;
      });
      links.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + current.id);
      });
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        spy();
        ticking = false;
      });
    });
    spy();
  }

  /* ---------------- Back to top ---------------- */
  function initToTop() {
    var btn = document.getElementById("toTop");
    if (!btn) return;
    window.addEventListener("scroll", function () {
      btn.classList.toggle("show", window.scrollY > 400);
    });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------- Contact form ---------------- */
  function initForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var success = document.getElementById("success");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var body = new URLSearchParams(new FormData(form)).toString();
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body,
      })
        .then(function (res) {
          if (!res.ok) throw new Error("submit failed");
          if (success) {
            success.textContent = "Thanks! Your message has been sent.";
            success.classList.add("show");
          }
          form.reset();
        })
        .catch(function () {
          if (success) {
            success.textContent = "Something went wrong — please email me at roitpak@gmail.com.";
            success.classList.add("show");
          }
        });
    });
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
    [initTheme, initCanvas, initTypewriter, initReveals, initExperienceYears, initCounters, initNav, initToTop, initForm]
      .forEach(function (fn) {
        try {
          fn();
        } catch (err) {
          console.error(err);
        }
      });
  });
})();
