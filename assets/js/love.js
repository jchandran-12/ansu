(() => {
  window.__lvReady = true;
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const after = (ms, fn) => setTimeout(fn, reduceMotion ? 0 : ms);

  const pressable = (el, fn) => {
    el.addEventListener("click", fn);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(e); }
    });
  };

  // ── Effects: confetti, floating hearts, falling petals ──
  const fire = (opts = {}) => {
    if (reduceMotion || typeof window.confetti !== "function") return;
    window.confetti({ colors: ["#c76b7e", "#ebc9a8", "#fffaf8", "#e7a9b6"], zIndex: 2700, ...opts });
  };
  const heartBurst = (x, y, n = 22, spread = 320) => {
    if (reduceMotion) return;
    const colours = ["#c76b7e", "#ebc9a8", "#fffaf8", "#e39aa8"];
    for (let i = 0; i < n; i++) {
      const h = document.createElement("span");
      h.className = "lv-float-heart";
      h.textContent = "♥";
      h.style.left = `${x}px`;
      h.style.top = `${y}px`;
      h.style.setProperty("--c", colours[i % colours.length]);
      h.style.setProperty("--fs", `${rand(12, 34)}px`);
      h.style.setProperty("--x", `${rand(-0.5, 0.5) * spread}px`);
      h.style.setProperty("--r", `${rand(-30, 30)}deg`);
      h.style.setProperty("--dur", `${rand(2.2, 4)}s`);
      h.style.animationDelay = `${rand(0, 0.4)}s`;
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 4800);
    }
  };
  const centreOf = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };
  const makePetal = (free) => {
    const p = document.createElement("span");
    p.className = free ? "lv-petal lv-petal-free" : "lv-petal";
    p.style.setProperty("--x", `${rand(0, 100)}${free ? "vw" : "%"}`);
    p.style.setProperty("--s", `${rand(10, 20)}px`);
    p.style.setProperty("--dx", `${rand(-120, 120)}px`);
    p.style.setProperty("--r", `${rand(180, 720)}deg`);
    p.style.setProperty("--d", `${rand(free ? 4 : 9, free ? 7 : 16)}s`);
    p.style.setProperty("--dl", free ? `${rand(0, 1.5)}s` : `${-rand(0, 16)}s`);
    return p;
  };
  const petalStorm = (n = 40) => {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const p = makePetal(true);
      p.style.animationIterationCount = "1";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 9000);
    }
  };

  // ── Music (only if assets/music/song.mp3 exists) ──
  const audio = new Audio("assets/music/song.mp3");
  audio.loop = true;
  let musicBtn = null;
  const setPlaying = (on) => {
    if (!musicBtn) return;
    musicBtn.classList.toggle("on", on);
    musicBtn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  };
  audio.addEventListener("canplaythrough", () => {
    if (musicBtn) return;
    musicBtn = document.createElement("button");
    musicBtn.className = "lv-music";
    musicBtn.type = "button";
    musicBtn.textContent = "♪";
    musicBtn.addEventListener("click", () => {
      if (audio.paused) audio.play().then(() => setPlaying(true)).catch(() => {});
      else { audio.pause(); setPlaying(false); }
    });
    document.body.appendChild(musicBtn);
    setPlaying(!audio.paused);
  }, { once: true });
  audio.load();

  // ── 0. The heart she holds: fills while held (or with a few taps), then opens the page ──
  const gate = $(".lv-gate");
  const heartBtn = gate && $(".lv-heartbtn", gate);
  if (heartBtn) {
    const svg = $(".lv-heart-svg", heartBtn);
    let target = 0, shown = 0, holding = false, downAt = 0, last = 0, done = false;
    const open = () => {
      done = true;
      heartBtn.classList.remove("lv-holding");
      heartBtn.classList.add("lv-burst");
      const [x, y] = centreOf(heartBtn);
      heartBurst(x, y, 36, 420);
      petalStorm(34);
      after(250, () => fire({ particleCount: 110, spread: 100, startVelocity: 30, origin: { y: 0.5 }, scalar: 0.8 }));
      audio.play().then(() => setPlaying(true)).catch(() => {});
      window.scrollTo(0, 0);
      after(900, () => root.classList.add("lv-open"));
      after(2600, () => gate.remove());
    };
    last = performance.now();
    const loop = setInterval(() => { // a timer, not rAF, so it never stalls in a throttled or background view
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (holding) target = Math.min(1, target + dt / 1.5);
      shown += (target - shown) * Math.min(1, dt * 10);
      svg.style.setProperty("--p", shown.toFixed(3));
      if (!done && shown > 0.985) { clearInterval(loop); open(); }
    }, 16);
    heartBtn.addEventListener("pointerdown", (e) => {
      holding = true; downAt = performance.now();
      heartBtn.classList.add("lv-holding");
      try { heartBtn.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });
    const release = () => {
      if (!holding) return;
      holding = false;
      heartBtn.classList.remove("lv-holding");
      if (performance.now() - downAt < 250) target = Math.min(1, target + 0.26); // a quick tap still counts
    };
    heartBtn.addEventListener("pointerup", release);
    heartBtn.addEventListener("pointercancel", release);
    heartBtn.addEventListener("click", (e) => { if (e.detail === 0) target = Math.min(1, target + 0.34); }); // keyboard
    heartBtn.addEventListener("contextmenu", (e) => e.preventDefault());
  } else {
    root.classList.add("lv-open");
  }

  // ── Hero petals ──
  const petals = $(".lv-petals");
  if (petals && !reduceMotion) for (let i = 0; i < 18; i++) petals.appendChild(makePetal(false));

  // ── Days since (removed unless a date is set) ──
  const since = $("#since");
  const sinceDate = since && new Date(since.dataset.since);
  if (since && (!since.dataset.since || isNaN(sinceDate))) since.remove();

  // ── Progress bar + dot navigation ──
  const bar = document.createElement("div");
  bar.className = "lv-progress";
  document.body.appendChild(bar);
  const navTargets = $$("[data-nav]");
  if (navTargets.length) {
    const nav = document.createElement("nav");
    nav.className = "lv-dots";
    nav.setAttribute("aria-label", "Sections");
    navTargets.forEach((s) => {
      const a = document.createElement("a");
      a.href = `#${s.id}`;
      a.setAttribute("aria-label", s.dataset.nav);
      a.innerHTML = `<span>${s.dataset.nav}</span>`;
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) $$("a", nav).forEach((a) => a.classList.toggle("on", a.hash === `#${e.target.id}`));
    }), { rootMargin: "-45% 0px -45% 0px" });
    navTargets.forEach((s) => io.observe(s));
  }

  // ── Quotes: split into words before they reveal ──
  $$(".lv-words").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", words.join(" "));
    el.innerHTML = words.map((w, i) => `<span class="lv-word" aria-hidden="true" style="--d:${(0.3 + i * 0.12).toFixed(2)}s">${w}</span>`).join(" ");
  });

  // ── Reveal on scroll ──
  const revealer = new IntersectionObserver((entries, obs) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("lv-in");
    e.target.dispatchEvent(new CustomEvent("lv-revealed"));
    obs.unobserve(e.target);
  }), { threshold: 0.15 });
  $$(".lv-reveal").forEach((el) => {
    const sibs = $$(":scope > .lv-reveal", el.parentElement);
    el.style.setProperty("--delay", `${Math.min(sibs.indexOf(el), 5) * 0.1}s`);
    revealer.observe(el);
  });
  const onReveal = (el, fn) => el && el.addEventListener("lv-revealed", fn, { once: true });

  // ── Scroll: progress bar + gentle hero fade ──
  const heroContent = $(".lv-hero-content");
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (heroContent && !reduceMotion && y < vh) {
      heroContent.style.transform = `translateY(${y * 0.3}px)`;
      heroContent.style.opacity = String(Math.max(0, 1 - y / (vh * 0.85)));
    }
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ── 2. Messages I never sent: typed out one by one ──
  const phone = $(".lv-phone");
  onReveal(phone, () => {
    const msgs = $$(".lv-msg", phone);
    const typing = $(".lv-typing", phone);
    const receipt = $(".lv-receipt", phone);
    let i = 0;
    const next = () => {
      if (i >= msgs.length) {
        typing.classList.remove("on");
        receipt.textContent = "Delivered";
        receipt.classList.add("on");
        after(1400, () => { receipt.textContent = "Seen ♥"; });
        return;
      }
      typing.classList.add("on");
      const wait = reduceMotion ? 0 : 700 + Math.min(msgs[i].textContent.length * 18, 900);
      setTimeout(() => {
        typing.classList.remove("on");
        msgs[i].classList.add("lv-sent");
        i++;
        setTimeout(next, reduceMotion ? 0 : 500);
      }, wait);
    };
    after(500, next);
  });

  // ── Photo zoom (for anything marked data-zoom, and developed polaroids) ──
  const zoom = document.createElement("div");
  zoom.className = "lv-zoom";
  zoom.setAttribute("role", "dialog");
  zoom.setAttribute("aria-modal", "true");
  zoom.innerHTML = "<figure><img alt=''><figcaption></figcaption></figure>";
  document.body.appendChild(zoom);
  const openZoom = (img, caption) => {
    $("img", zoom).src = img.currentSrc || img.src;
    $("img", zoom).alt = img.alt || "";
    $("figcaption", zoom).textContent = caption || "";
    zoom.classList.add("on");
  };
  const closeZoom = () => zoom.classList.remove("on");
  zoom.addEventListener("click", closeZoom);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeZoom(); });
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-zoom]");
    if (!t) return;
    const img = t.tagName === "IMG" ? t : $("img", t);
    const cap = t.tagName === "IMG" ? "" : ($("figcaption", t) || {}).textContent;
    if (img) openZoom(img, cap);
  });

  // ── 3. Developing polaroids ──
  const reel = $(".lv-reel");
  if (reel) {
    const pols = $$(".lv-pol", reel);
    const develop = (p) => p.classList.add("lv-dev");
    let dragged = false;
    pols.forEach((p) => p.addEventListener("click", () => {
      if (dragged) return;
      if (p.classList.contains("lv-dev")) openZoom($("img", p), $("figcaption", p).textContent);
      else develop(p);
    }));
    // only the photo resting in the centre develops on its own, and only after a while untouched
    const timers = new Map();
    const centreIO = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) timers.set(e.target, setTimeout(() => develop(e.target), 4000));
      else clearTimeout(timers.get(e.target));
    }), { root: reel, rootMargin: "0px -45% 0px -45%", threshold: 0 });
    pols.forEach((p) => centreIO.observe(p));
    const step = () => pols[0].getBoundingClientRect().width + 36;
    $(".lv-prev").addEventListener("click", () => reel.scrollBy({ left: -step(), behavior: "smooth" }));
    $(".lv-next").addEventListener("click", () => reel.scrollBy({ left: step(), behavior: "smooth" }));
    // drag to scroll with a mouse
    let down = false, startX = 0, startLeft = 0;
    reel.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; dragged = false; startX = e.clientX; startLeft = reel.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) { dragged = true; reel.classList.add("lv-dragging"); }
      if (dragged) reel.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      reel.classList.remove("lv-dragging");
      setTimeout(() => { dragged = false; }, 50);
    });
  }

  // ── 4. Photo booth: prints the strip, tap the booth to print again ──
  const booth = $(".lv-booth");
  if (booth) {
    const strip = $(".lv-strip", booth);
    const print = () => booth.classList.add("lv-printed");
    onReveal(booth, () => after(700, print));
    $(".lv-booth-head", booth).addEventListener("click", () => {
      strip.classList.add("lv-reset");
      booth.classList.remove("lv-printed");
      void strip.offsetHeight;
      strip.classList.remove("lv-reset");
      setTimeout(print, 30);
    });
  }

  // ── 5. Mirror ──
  $$(".lv-mirror").forEach((mirror) => {
    const line = $(".lv-mirror-line", mirror.parentElement);
    const texts = line ? [line.textContent, line.dataset.alt] : [];
    pressable(mirror, () => {
      const flipped = mirror.classList.toggle("lv-flipped");
      if (!line) return;
      line.classList.add("lv-fading");
      setTimeout(() => { line.textContent = texts[flipped ? 1 : 0]; line.classList.remove("lv-fading"); }, 500);
    });
  });

  // ── 7. Love meter ──
  const meter = $(".lv-meter");
  if (meter) {
    const range = $(".lv-range", meter);
    const value = $(".lv-meter-value", meter);
    const text = $(".lv-meter-text", meter);
    const steps = text.dataset.steps.split("|");
    let shownStep = -1, maxed = false;
    meter.classList.add("lv-untouched");
    const setText = (t) => {
      text.classList.add("lv-fading");
      setTimeout(() => { text.textContent = t; text.classList.remove("lv-fading"); }, 180);
    };
    const update = () => {
      const v = Number(range.value);
      meter.classList.remove("lv-untouched");
      meter.style.setProperty("--v", v);
      if (v >= 100) {
        value.textContent = "∞";
        if (!maxed) {
          maxed = true; shownStep = -1;
          meter.classList.add("lv-max");
          setText(text.dataset.max);
          const [x, y] = centreOf($(".lv-meter-heart", meter));
          heartBurst(x, y, 26);
          fire({ particleCount: 60, spread: 70, scalar: 0.7, origin: { x: x / innerWidth, y: y / innerHeight } });
        }
        return;
      }
      value.textContent = `${v}%`;
      if (maxed) { maxed = false; meter.classList.remove("lv-max"); }
      const s = v === 0 ? -1 : Math.min(steps.length - 1, Math.floor((v / 100) * steps.length));
      if (s !== shownStep) { shownStep = s; setText(s < 0 ? " " : steps[s]); }
    };
    range.addEventListener("input", update);
  }

  // ── 8. Jar of reasons ──
  const jar = $(".lv-jar");
  if (jar) {
    const stage = jar.closest(".lv-jar-stage");
    const body = $(".lv-jar-body", jar);
    const card = $(".lv-note-card", stage);
    const count = $(".lv-note-count", stage);
    const items = $$(".lv-reasons li", stage);
    const finalItem = items.find((li) => li.classList.contains("lv-reasons-final"));
    const reasons = items.filter((li) => li !== finalItem).map((li) => li.textContent.trim());
    const hearts = [];
    const colours = ["#c76b7e", "#e7a9b6", "#ebc9a8", "#d98a9a", "#f3d2c4"];
    for (let i = 0; i < 34; i++) {
      const h = document.createElement("i");
      h.textContent = "♥";
      const y = (i / 34) * 62 + rand(0, 4);
      h.style.setProperty("--x", `${rand(6, 78)}%`);
      h.style.setProperty("--y", `${y}%`);
      h.style.setProperty("--s", `${rand(16, 26)}px`);
      h.style.setProperty("--r", `${rand(-40, 40)}deg`);
      h.style.setProperty("--c", colours[i % colours.length]);
      body.appendChild(h);
      hearts.push(h);
    }
    let i = 0;
    const show = (t) => {
      card.innerHTML = "";
      const s = document.createElement("span");
      s.textContent = t;
      card.appendChild(s);
    };
    jar.addEventListener("click", () => {
      jar.classList.remove("lv-shake");
      void jar.offsetWidth;
      jar.classList.add("lv-shake");
      const top = [...hearts].reverse().find((h) => !h.classList.contains("lv-taken"));
      if (top) top.classList.add("lv-taken");
      if (i < reasons.length) {
        show(reasons[i]);
        i++;
        count.textContent = `${i} of ${reasons.length}`;
      } else if (i === reasons.length && finalItem) {
        show(finalItem.textContent.trim());
        count.textContent = "";
        i++;
        const [x, y] = centreOf(jar);
        heartBurst(x, y - 60, 24);
      } else {
        show(reasons[Math.floor(Math.random() * reasons.length)]);
      }
    });
  }

  // ── 9. Foggy window: wipe the fog away ──
  $$(".lv-window").forEach((win) => {
    const canvas = document.createElement("canvas");
    canvas.className = "lv-fog";
    canvas.setAttribute("aria-hidden", "true");
    win.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, cleared = false;

    const heartPath = (cx, cy, s) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.35);
      ctx.bezierCurveTo(cx - s * 0.05, cy + s * 0.2, cx - s * 0.55, cy, cx - s * 0.5, cy - s * 0.3);
      ctx.bezierCurveTo(cx - s * 0.45, cy - s * 0.6, cx - s * 0.05, cy - s * 0.6, cx, cy - s * 0.3);
      ctx.bezierCurveTo(cx + s * 0.05, cy - s * 0.6, cx + s * 0.45, cy - s * 0.6, cx + s * 0.5, cy - s * 0.3);
      ctx.bezierCurveTo(cx + s * 0.55, cy, cx + s * 0.05, cy + s * 0.2, cx, cy + s * 0.35);
    };
    const paint = () => {
      if (!win.clientWidth || !win.clientHeight) return; // not laid out yet; ensure()/repaint() will try again
      w = canvas.width = Math.round(win.clientWidth * dpr);
      h = canvas.height = Math.round(win.clientHeight * dpr);
      ctx.globalCompositeOperation = "source-over";
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(240,232,230,.95)");
      g.addColorStop(1, "rgba(226,214,212,.97)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { // mist texture
        ctx.fillStyle = `rgba(255,255,255,${rand(0, 0.25)})`;
        ctx.beginPath(); ctx.arc(rand(0, w), rand(0, h), rand(0.5, 2.2) * dpr, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 60; i++) { // condensation drops
        const x = rand(0, w), y = rand(0, h), r = rand(1.5, 4.5) * dpr;
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,.55)";
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "rgba(255,255,255,.7)";
        ctx.lineWidth = dpr;
        ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.2, r, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
      }
      // a heart someone already drew on the glass
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 9 * dpr; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(0,0,0,.9)";
      heartPath(w * 0.5, h * 0.3, Math.min(w, h) * 0.34);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,.9)";
      ctx.font = `${Math.round(Math.min(w, h) * 0.075)}px "Pinyon Script", cursive`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("A + J", w * 0.5, h * 0.27);
    };
    const ensure = () => { if (!cleared && (!w || canvas.width !== Math.round(win.clientWidth * dpr))) paint(); };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(ensure);
    onReveal(win, ensure);
    let rt; // repaint once the window's size settles (until she has started wiping)
    const repaint = () => { clearTimeout(rt); rt = setTimeout(() => { if (!cleared && moves === 0 && win.clientWidth) paint(); }, 150); };
    if (window.ResizeObserver) new ResizeObserver(repaint).observe(win);
    else window.addEventListener("resize", repaint);

    let down = false, last = null, moves = 0;
    const pt = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (w / r.width), y: (e.clientY - r.top) * (h / r.height) };
    };
    const wipe = (p) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(0,0,0,.85)";
      ctx.lineWidth = 54 * dpr;
      ctx.beginPath();
      ctx.moveTo((last || p).x, (last || p).y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      if (++moves % 14 === 0) check();
    };
    const check = () => {
      if (cleared || !w) return;
      const data = ctx.getImageData(0, 0, w, h).data;
      let clear = 0, total = 0;
      for (let i = 3; i < data.length; i += 4 * 40) { total++; if (data[i] < 60) clear++; }
      if (clear / total > 0.42) {
        cleared = true;
        win.classList.add("lv-clear");
        const [x, y] = centreOf(win);
        setTimeout(() => heartBurst(x, y, 28), 600);
      }
    };
    canvas.addEventListener("pointerdown", (e) => { ensure(); down = true; last = null; try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } wipe(pt(e)); });
    canvas.addEventListener("pointermove", (e) => {
      if (!w) return;
      if (down || e.pointerType === "mouse") wipe(pt(e)); // a mouse wipes just by moving across the glass
    });
    canvas.addEventListener("pointerleave", () => { if (!down) last = null; });
    const stop = () => { down = false; last = null; check(); };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
  });

  // ── 10. Folded letter: unfolds in thirds ──
  const folded = $(".lv-folded");
  const letterSrc = $(".lv-letter-src");
  if (folded && letterSrc) {
    const html = `<div class="lv-letter-body">${letterSrc.innerHTML}</div>`;
    const panels = [1, 2, 3].map((n) => {
      const p = document.createElement("div");
      p.className = `lv-panel lv-p${n}`;
      p.innerHTML = `<div class="lv-face"><div class="lv-fold-content">${html}</div></div>${n !== 2 ? '<div class="lv-back"></div>' : ""}`;
      folded.appendChild(p);
      return p;
    });
    const measure = () => {
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;left:0;right:0;top:0";
      probe.innerHTML = html;
      folded.appendChild(probe);
      const total = probe.firstElementChild.offsetHeight;
      probe.remove();
      const ph = Math.ceil(total / 3 / 36) * 36; // keep the ruled lines continuous across folds
      folded.style.setProperty("--ph", `${ph}px`);
      panels.forEach((p, i) => $(".lv-fold-content", p).style.setProperty("--off", `${-i * ph}px`));
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(measure);
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(measure, 150); });
    let opened = false;
    pressable(folded, () => {
      if (opened) return;
      opened = true;
      folded.classList.add("lv-open1");
      after(750, () => folded.classList.add("lv-open3"));
      after(1900, () => { const [x, y] = centreOf(folded); heartBurst(x, y, 18); });
      folded.setAttribute("aria-label", "Letter");
    });
  }

  // ── 11. Love locks ──
  const locks = $$(".lv-lock");
  if (locks.length) {
    const section = locks[0].closest(".lv-sec");
    const promise = $(".lv-promise", section);
    const key = $(".lv-key", section);
    const finalLine = $(".lv-promise-final", section);
    locks.forEach((l) => l.style.setProperty("--sd", `${-rand(0, 3).toFixed(2)}s`));
    const say = (t) => {
      promise.classList.add("lv-fading");
      setTimeout(() => { promise.textContent = t; promise.classList.remove("lv-fading"); }, 300);
    };
    locks.forEach((lock) => lock.addEventListener("click", () => {
      say(lock.dataset.promise);
      if (lock.classList.contains("lv-locked")) return;
      lock.classList.add("lv-locked");
      const [x, y] = centreOf(lock);
      heartBurst(x, y, 8, 120);
      if (locks.every((l) => l.classList.contains("lv-locked"))) {
        after(2200, () => {
          key.classList.add("lv-throw");
          finalLine.classList.add("on");
          fire({ particleCount: 70, spread: 90, scalar: 0.7, origin: { y: 0.6 } });
        });
      }
    }));
  }

  // ── 12. Days since ──
  if (since && since.isConnected) {
    const out = Object.fromEntries($$(".lv-since-n", since).map((el) => [el.dataset.unit, el]));
    const pad = (n) => String(n).padStart(2, "0");
    const tickSince = () => {
      let s = Math.max(0, Math.floor((Date.now() - sinceDate) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400;
      const hh = Math.floor(s / 3600); s -= hh * 3600;
      const mm = Math.floor(s / 60); s -= mm * 60;
      out.days.textContent = d.toLocaleString();
      out.hours.textContent = pad(hh);
      out.minutes.textContent = pad(mm);
      out.seconds.textContent = pad(s);
    };
    tickSince();
    setInterval(tickSince, 1000);
  }

  // ── 13. Lanterns → message → final heart ──
  const sky = $(".lv-sky");
  if (sky) for (let i = 0; i < 70; i++) {
    const s = document.createElement("span");
    s.className = "lv-star";
    s.style.left = `${rand(0, 100)}%`;
    s.style.top = `${rand(0, 100)}%`;
    s.style.setProperty("--tw", `${rand(2, 5)}s`);
    s.style.setProperty("--td", `${-rand(0, 4)}s`);
    sky.appendChild(s);
  }
  $$(".lv-lantern-row").forEach((row) => {
    const stage = row.closest(".lv-lantern-stage");
    const msg = $(".lv-lantern-msg", stage);
    const btn = $(".lv-release", stage);
    const heart = $(".lv-final-heart", stage);
    const finalMsg = $(".lv-final-msg", stage);
    const n = parseInt(row.dataset.lanterns, 10) || 5;
    for (let i = 0; i < n; i++) {
      const l = document.createElement("div");
      l.className = "lv-lantern";
      l.style.setProperty("--sd", `${-rand(0, 3).toFixed(2)}s`);
      l.style.setProperty("--dx", `${Math.round(rand(-80, 80))}px`);
      l.style.setProperty("--rot", `${Math.round(rand(-8, 8))}deg`);
      l.style.setProperty("--fly", `${rand(6, 8.5).toFixed(1)}s`);
      l.setAttribute("role", "button");
      l.setAttribute("aria-label", "Release lantern");
      row.appendChild(l);
    }
    const celebrate = () => {
      btn.classList.add("lv-gone");
      msg.classList.add("on");
      fire({ particleCount: 90, spread: 110, startVelocity: 28, origin: { y: 0.55 }, scalar: 0.7 });
      after(2600, () => heart.classList.add("on"));
    };
    const release = (l) => {
      if (l.classList.contains("lv-fly")) return;
      l.classList.add("lv-fly");
      if ($$(".lv-lantern:not(.lv-fly)", row).length === 0) after(1800, celebrate);
    };
    row.addEventListener("click", (e) => { const l = e.target.closest(".lv-lantern"); if (l) release(l); });
    btn.addEventListener("click", () => $$(".lv-lantern", row).forEach((l, i) => setTimeout(() => release(l), i * 350)));
    heart.addEventListener("click", () => {
      const [x, y] = centreOf(heart);
      heartBurst(x, y, 40, 520);
      petalStorm(50);
      finalMsg.classList.add("on");
    });
  });

  // ── Tiny hearts trailing the cursor (desktop only) ──
  if (finePointer && !reduceMotion) {
    let lastT = 0;
    window.addEventListener("mousemove", (e) => {
      const now = performance.now();
      if (now - lastT < 70 || !root.classList.contains("lv-open")) return;
      lastT = now;
      const t = document.createElement("span");
      t.className = "lv-trail";
      t.textContent = "♥";
      t.style.left = `${e.clientX}px`;
      t.style.top = `${e.clientY}px`;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 1000);
    }, { passive: true });
  }
})();
