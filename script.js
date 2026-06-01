const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const backgroundCanvas = document.querySelector("[data-circuit-bg]");

document.querySelector("[data-year]").textContent = new Date().getFullYear();

if (backgroundCanvas) {
  const ctx = backgroundCanvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let animationFrame = 0;

  /* ── FaultyTerminal config ── */
  const CFG = {
    scale: 1.4,
    digitSize: 4.1,
    scanlineIntensity: 0.55,
    glitchAmount: 0.9,
    flickerAmount: 2.3,
    noiseAmp: 0.95,
    chromaticAberration: 0.04,
    dither: 0.15,
    curvature: 1,
    tint: [246, 241, 241],       // #f6f1f1
    mouseReact: true,
    mouseStrength: 0.6,
    brightness: 1.2,
  };

  /* ── Mouse tracking ── */
  const mouse = { x: -1, y: -1 };

  window.addEventListener("pointermove", (e) => {
    const rect = backgroundCanvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  window.addEventListener("pointerleave", () => { mouse.x = -1; mouse.y = -1; });

  /* ── Falling digit columns ── */
  let columns = [];
  const CHARS = "01234567890ABCDEFabcdef!@#$%&<>{}[]";

  const initColumns = () => {
    const fontSize = Math.round(CFG.digitSize * CFG.scale * 3);
    const colCount = Math.ceil(width / fontSize) + 1;
    columns = Array.from({ length: colCount }, (_, i) => ({
      x: i * fontSize,
      y: Math.random() * height * 2 - height,
      speed: 0.4 + Math.random() * 1.8,
      chars: Array.from({ length: Math.ceil(height / fontSize) + 6 }, () =>
        CHARS[Math.floor(Math.random() * CHARS.length)]
      ),
      switchTimer: 0,
    }));
  };

  /* ── Resize ── */
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    backgroundCanvas.width = Math.round(width * dpr);
    backgroundCanvas.height = Math.round(height * dpr);
    backgroundCanvas.style.width = `${width}px`;
    backgroundCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initColumns();
  };

  /* ── Draw helpers ── */

  const drawFill = () => {
    ctx.fillStyle = "#05090a";
    ctx.fillRect(0, 0, width, height);
  };

  const drawDigits = (time) => {
    const fontSize = Math.round(CFG.digitSize * CFG.scale * 3);
    ctx.font = `${fontSize}px "Courier New", monospace`;
    ctx.textBaseline = "top";

    columns.forEach((col) => {
      col.y += col.speed;
      if (col.y > height + fontSize * 4) {
        col.y = -fontSize * col.chars.length * 0.3;
      }

      // randomly swap a character
      col.switchTimer += col.speed;
      if (col.switchTimer > 8) {
        col.switchTimer = 0;
        const idx = Math.floor(Math.random() * col.chars.length);
        col.chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
      }

      col.chars.forEach((ch, ci) => {
        const cy = col.y + ci * fontSize;
        if (cy < -fontSize || cy > height + fontSize) return;

        // fade: brighter near the head
        const headDist = Math.abs(ci - col.chars.length + 1);
        const fade = Math.max(0.04, 1 - headDist / col.chars.length);
        const bright = fade * CFG.brightness;

        // mouse glow
        let glow = 0;
        if (CFG.mouseReact && mouse.x >= 0) {
          const dist = Math.hypot(col.x - mouse.x, cy - mouse.y);
          glow = Math.max(0, 1 - dist / 220) * CFG.mouseStrength;
        }

        const r = Math.min(255, Math.round(CFG.tint[0] * bright * 0.18 + glow * 80));
        const g = Math.min(255, Math.round(CFG.tint[1] * bright * 0.22 + glow * 120));
        const b = Math.min(255, Math.round(CFG.tint[2] * bright * 0.16 + glow * 60));
        const a = Math.min(1, fade * 0.7 + glow * 0.5);

        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.fillText(ch, col.x, cy);
      });
    });
  };

  const drawScanlines = () => {
    for (let y = 0; y < height; y += 3) {
      ctx.fillStyle = `rgba(0,0,0,${CFG.scanlineIntensity * 0.35})`;
      ctx.fillRect(0, y, width, 1);
    }
  };

  const drawNoise = () => {
    const imgData = ctx.getImageData(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    const data = imgData.data;
    const amp = CFG.noiseAmp * 25;
    const ditherAmp = CFG.dither * 18;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * amp;
      const dith = (Math.random() - 0.5) * ditherAmp;
      data[i] = Math.min(255, Math.max(0, data[i] + noise + dith));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + dith));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + dith));
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const drawGlitch = (time) => {
    if (Math.random() > CFG.glitchAmount * 0.12) return;

    const sliceCount = Math.floor(Math.random() * 6) + 1;
    for (let i = 0; i < sliceCount; i++) {
      const y = Math.random() * height;
      const h = Math.random() * 18 + 2;
      const offset = (Math.random() - 0.5) * 40 * CFG.glitchAmount;
      const sliceData = ctx.getImageData(0, Math.round(y), backgroundCanvas.width, Math.round(h));
      ctx.putImageData(sliceData, Math.round(offset), Math.round(y));
    }
  };

  const drawChromaticAberration = () => {
    const offset = Math.round(CFG.chromaticAberration * width * 0.5);
    if (offset < 1) return;

    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.06;
    ctx.drawImage(backgroundCanvas, offset, 0, width, height, 0, 0, width, height);
    ctx.drawImage(backgroundCanvas, -offset, 0, width, height, 0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };

  const drawFlicker = (time) => {
    const flick = Math.sin(time * 0.015) * Math.sin(time * 0.037) * CFG.flickerAmount * 0.015;
    if (Math.abs(flick) > 0.005) {
      ctx.fillStyle = `rgba(${flick > 0 ? "255,255,255" : "0,0,0"},${Math.abs(flick)})`;
      ctx.fillRect(0, 0, width, height);
    }
  };

  const drawCurvature = () => {
    if (CFG.curvature <= 0) return;
    const strength = CFG.curvature * 0.012;

    // Vignette simulates barrel distortion edges
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.25,
      width / 2, height / 2, Math.max(width, height) * 0.75
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${0.35 * CFG.curvature})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Edge darkening bars
    const barW = Math.round(width * strength);
    const barH = Math.round(height * strength);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, barW, height);
    ctx.fillRect(width - barW, 0, barW, height);
    ctx.fillRect(0, 0, width, barH);
    ctx.fillRect(0, height - barH, width, barH);
  };

  /* ── Main loop ── */
  const drawBackground = (time = 0) => {
    drawFill();
    drawDigits(time);
    drawScanlines();
    drawChromaticAberration();
    drawGlitch(time);
    drawFlicker(time);
    drawNoise();
    drawCurvature();

    if (!reducedMotion.matches) {
      animationFrame = requestAnimationFrame(drawBackground);
    }
  };

  resize();
  drawBackground();

  window.addEventListener("resize", () => {
    resize();
    if (reducedMotion.matches) drawBackground();
  });

  reducedMotion.addEventListener("change", () => {
    cancelAnimationFrame(animationFrame);
    drawBackground();
  });
}

navToggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -52% 0px", threshold: 0.01 },
);

sections.forEach((section) => observer.observe(section));

/* ── Timeline Show More / Less ── */
const timelineToggle = document.querySelector("[data-timeline-toggle]");
const timeline = document.querySelector(".timeline");

timelineToggle?.addEventListener("click", () => {
  const expanded = timeline.classList.toggle("is-expanded");
  timelineToggle.classList.toggle("is-active", expanded);
  timelineToggle.querySelector(".toggle-text").textContent = expanded ? "Show Less" : "Show More";
});

const filterButtons = [...document.querySelectorAll("[data-filter]")];
const projectCards = [...document.querySelectorAll(".project-card")];

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    projectCards.forEach((card) => {
      const tags = card.dataset.tags.split(" ");
      card.classList.toggle("is-hidden", filter !== "all" && !tags.includes(filter));
    });

    // Auto-expand grid when filtering so hidden cards can appear
    const projectGrid = document.querySelector(".project-grid");
    if (filter !== "all") {
      projectGrid.classList.add("is-expanded");
    }
  });
});

/* ── Projects Show More / Less ── */
const projectsToggle = document.querySelector("[data-projects-toggle]");
const projectGrid = document.querySelector(".project-grid");

projectsToggle?.addEventListener("click", () => {
  const expanded = projectGrid.classList.toggle("is-expanded");
  projectsToggle.classList.toggle("is-active", expanded);
  projectsToggle.querySelector(".toggle-text").textContent = expanded ? "Show Less" : "Show More";
});

const copyButton = document.querySelector("[data-copy]");

copyButton?.addEventListener("click", async () => {
  const value = copyButton.dataset.copy;

  try {
    await navigator.clipboard.writeText(value);
    copyButton.textContent = "Email Copied";
    copyButton.classList.add("is-copied");
  } catch {
    window.location.href = `mailto:${value}`;
  }

  window.setTimeout(() => {
    copyButton.textContent = "Copy Email";
    copyButton.classList.remove("is-copied");
  }, 1800);
});

/* ── Direct Mail Form ── */
const contactForm = document.querySelector("[data-contact-form]");

contactForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById("contact-submit");
  const originalHTML = submitBtn.innerHTML;

  // Set loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
    Sending...
  `;

  const formData = new FormData(contactForm);
  const object = Object.fromEntries(formData);
  const json = JSON.stringify(object);

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: json
    });

    const result = await response.json();

    if (response.status === 200) {
      // Success feedback animation
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Message Sent!
      `;
      submitBtn.style.background = "var(--green)";
      submitBtn.style.color = "#03100e";
      contactForm.reset();
    } else {
      throw new Error(result.message || "Something went wrong.");
    }
  } catch (error) {
    console.error(error);
    submitBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Failed to Send
    `;
    submitBtn.style.background = "#ff4a4a";
    submitBtn.style.color = "#fff";
  } finally {
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
      submitBtn.style.background = "";
      submitBtn.style.color = "";
    }, 3000);
  }
});
