const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const boxesContainer = document.getElementById("boxes-container");

document.querySelector("[data-year]").textContent = new Date().getFullYear();

if (boxesContainer) {
  const COLORS = [
    "rgb(125, 211, 252)", // sky-300
    "rgb(249, 168, 212)", // pink-300
    "rgb(134, 239, 172)", // green-300
    "rgb(253, 224, 71)",  // yellow-300
    "rgb(252, 165, 165)", // red-300
    "rgb(216, 180, 254)", // purple-300
    "rgb(147, 197, 253)", // blue-300
    "rgb(165, 180, 252)", // indigo-300
    "rgb(196, 181, 253)", // violet-300
  ];

  const generateGrid = () => {
    // Cell dimensions matching CSS
    const cellW = 64;
    const cellH = 32;

    // Viewport max dimension with skew/scale factor to fully cover the screen
    const baseDimension = Math.max(window.innerWidth, window.innerHeight);
    const gridW = baseDimension * 2.8;
    const gridH = baseDimension * 1.8;

    const colsCount = Math.ceil(gridW / cellW);
    const rowsCount = Math.ceil(gridH / cellH);

    let html = "";
    for (let i = 0; i < rowsCount; i++) {
      html += '<div class="box-row">';
      for (let j = 0; j < colsCount; j++) {
        let svg = "";
        // Intersection crosshairs at even coordinates
        if (i % 2 === 0 && j % 2 === 0) {
          svg = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="box-cell-svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
            </svg>
          `;
        }
        html += `<div class="box-cell">${svg}</div>`;
      }
      html += "</div>";
    }

    boxesContainer.innerHTML = html;
  };

  // Generate grid initially
  generateGrid();

  // Hover color fade animations (Event delegation)
  boxesContainer.addEventListener("mouseover", (e) => {
    const cell = e.target.closest(".box-cell");
    if (!cell) return;

    // Set hover color
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    cell.style.backgroundColor = color;

    // Clear timeout if cursor hovers cell again
    if (cell._timeout) clearTimeout(cell._timeout);

    // Fade color out slowly
    cell._timeout = setTimeout(() => {
      cell.style.backgroundColor = "";
    }, 50);
  });

  // Debounced resize to recreate grid
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      generateGrid();
    }, 250);
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
