const root = document.documentElement;
const body = document.body;
const loader = document.querySelector(".site-loader");
const header = document.querySelector(".site-header");
const menuButton = document.querySelector(".menu-button");
const commandTrigger = document.querySelector(".command-trigger");
const dockCommand = document.querySelector("#dock-command");
const commandPalette = document.querySelector("#command-palette");
const closeCommand = document.querySelector("#close-command");
const commandButtons = [...document.querySelectorAll("[data-command]")];
const navLinks = [...document.querySelectorAll(".site-nav a")];
const revealItems = [...document.querySelectorAll(".reveal")];
const tiltCards = [...document.querySelectorAll(".tilt-card")];
const stackButtons = [...document.querySelectorAll(".stack-button")];
const stackOutput = document.querySelector("#stack-output");
const copyEmail = document.querySelector("#copy-email");
const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");
const canvas = document.querySelector("#constellation");
const ctx = canvas.getContext("2d");

body.classList.remove("no-js");

const emailAddress = "fahadwaseem756@gmail.com";
const cvPath = "./CV%20-%20Fahad%20Waseem.pdf";
const fypRepo = "https://github.com/fahad756/StudentAttendance-DeepEntityNaming";

window.addEventListener("load", () => {
  window.setTimeout(() => loader?.classList.add("is-hidden"), 550);
});

menuButton?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("nav-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("nav-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

function openCommandPalette() {
  commandPalette.hidden = false;
  document.body.style.overflow = "hidden";
  commandButtons[0]?.focus();
}

function closeCommandPalette() {
  commandPalette.hidden = true;
  document.body.style.overflow = "";
  commandTrigger?.focus();
}

commandTrigger?.addEventListener("click", openCommandPalette);
dockCommand?.addEventListener("click", openCommandPalette);
closeCommand?.addEventListener("click", closeCommandPalette);

commandPalette?.addEventListener("click", (event) => {
  if (event.target === commandPalette) closeCommandPalette();
});

document.addEventListener(
  "keydown",
  (event) => {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && key === "k") {
      event.preventDefault();
      if (commandPalette.hidden) openCommandPalette();
      else closeCommandPalette();
    }

    if (event.key === "Escape" && !commandPalette.hidden) {
      closeCommandPalette();
    }
  },
  true
);

async function copyEmailAddress(trigger) {
  try {
    await navigator.clipboard.writeText(emailAddress);
    if (trigger) {
      const original = trigger.textContent;
      trigger.textContent = "Copied";
      window.setTimeout(() => {
        trigger.textContent = original;
      }, 1400);
    }
  } catch {
    window.location.href = `mailto:${emailAddress}`;
  }
}

commandButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const command = button.dataset.command;
    closeCommandPalette();

    if (command === "cv") {
      window.open(cvPath, "_blank", "noopener,noreferrer");
      return;
    }

    if (command === "email") {
      copyEmailAddress();
      return;
    }

    if (command === "fyp") {
      window.open(fypRepo, "_blank", "noopener,noreferrer");
      return;
    }

    document.querySelector(command)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 35, 280)}ms`;
  revealObserver.observe(item);
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const active = document.querySelector(`.site-nav a[href="#${entry.target.id}"]`);
      if (entry.isIntersecting && active) {
        navLinks.forEach((link) => link.classList.remove("is-active"));
        active.classList.add("is-active");
      }
    });
  },
  { threshold: 0.38 }
);

document.querySelectorAll("main section[id]").forEach((section) => {
  sectionObserver.observe(section);
});

tiltCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 10;
    const rotateX = ((y / rect.height) - 0.5) * -10;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

document.querySelectorAll(".magnetic").forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    const rect = item.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    item.style.transform = `translate(${x * 0.16}px, ${y * 0.16}px)`;
  });

  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});

const stackText = {
  backend: [
    "$ fahad.run --mode backend",
    "loading: Python, Flask, Django, REST APIs, webhooks",
    "focus: clean endpoints, auth, validation, async handlers",
    "output: backend services that survive real business workflows",
  ],
  automation: [
    "$ fahad.run --mode automation",
    "loading: HubSpot, ServiceM8, n8n, Power Automate, Zapier",
    "focus: remove repetitive manual handoffs",
    "output: CRM events converted into operational actions",
  ],
  data: [
    "$ fahad.run --mode data",
    "loading: PostgreSQL, MySQL, transformation logic",
    "focus: sync, clean, validate, report",
    "output: reliable data movement across business platforms",
  ],
  vision: [
    "$ fahad.run --mode vision-ai",
    "loading: OpenCV, face_recognition, NumPy, MySQL, PHP dashboard",
    "focus: detect faces, encode identities, mark attendance",
    "output: academic AI system with automated student attendance records",
  ],
  cloud: [
    "$ fahad.run --mode cloud",
    "loading: AWS Lambda, deployment checks, Linux, Git",
    "focus: serverless jobs, debugging, operational support",
    "output: lightweight automations that run without noise",
  ],
};

let typingTimer;

function typeStack(mode) {
  window.clearInterval(typingTimer);
  const text = stackText[mode].join("\n");
  let index = 0;
  stackOutput.textContent = "";
  typingTimer = window.setInterval(() => {
    stackOutput.textContent = text.slice(0, index);
    index += 2;
    if (index > text.length) {
      window.clearInterval(typingTimer);
      stackOutput.textContent = text;
    }
  }, 14);
}

stackButtons.forEach((button) => {
  button.addEventListener("click", () => {
    stackButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    typeStack(button.dataset.stack);
  });
});

typeStack("backend");

copyEmail?.addEventListener("click", () => {
  copyEmailAddress(copyEmail);
});

const counters = [...document.querySelectorAll("[data-count]")];
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = entry.target;
      const end = Number(target.dataset.count);
      let current = 0;
      const tick = window.setInterval(() => {
        current += 1;
        target.textContent = `${current}+`;
        if (current >= end) {
          window.clearInterval(tick);
          target.textContent = `${end}+`;
        }
      }, 160);
      counterObserver.unobserve(target);
    });
  },
  { threshold: 0.8 }
);

counters.forEach((counter) => counterObserver.observe(counter));

const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  ringX: window.innerWidth / 2,
  ringY: window.innerHeight / 2,
};

function moveCursor() {
  pointer.ringX += (pointer.x - pointer.ringX) * 0.16;
  pointer.ringY += (pointer.y - pointer.ringY) * 0.16;
  if (cursorDot) cursorDot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
  if (cursorRing) cursorRing.style.transform = `translate3d(${pointer.ringX}px, ${pointer.ringY}px, 0)`;
  requestAnimationFrame(moveCursor);
}

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
});

document.querySelectorAll("a, button, .tilt-card").forEach((item) => {
  item.addEventListener("pointerenter", () => cursorRing?.classList.add("is-active"));
  item.addEventListener("pointerleave", () => cursorRing?.classList.remove("is-active"));
});

moveCursor();

let width = 0;
let height = 0;
let particles = [];

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(90, Math.floor((width * height) / 14500));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    size: Math.random() * 1.8 + 0.8,
  }));
}

function drawConstellation() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(237, 247, 255, 0.58)";
  ctx.strokeStyle = "rgba(24, 245, 255, 0.12)";

  particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;

    const dx = pointer.x - particle.x;
    const dy = pointer.y - particle.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 140) {
      particle.x -= dx * 0.002;
      particle.y -= dy * 0.002;
    }

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 122) {
        ctx.globalAlpha = 1 - dist / 122;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(drawConstellation);
}

resizeCanvas();
drawConstellation();
window.addEventListener("resize", resizeCanvas);

window.addEventListener("scroll", () => {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min((window.scrollY / maxScroll) * 100, 100);
  root.style.setProperty("--progress", `${progress}%`);
});
