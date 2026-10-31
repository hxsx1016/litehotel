const header = document.getElementById("header");
const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");
const form = document.getElementById("bookingForm");
const status = document.getElementById("formStatus");
const isEra2012 = document.documentElement.classList.contains("era-2012");

if (isEra2012) {
  const eraDate = document.getElementById("eraDate");
  if (eraDate) {
    const now = new Date();
    const week = ["日", "一", "二", "三", "四", "五", "六"];
    eraDate.textContent =
      "2012年" + (now.getMonth() + 1) + "月" + now.getDate() + "日　星期" + week[now.getDay()];
  }
  const copy = document.querySelector(".footer-copy");
  if (copy) copy.textContent = "© 2012 利特酒店　欢迎您的光临";
}

const KEYS = ["story", "rooms", "dining", "wellness", "moments"];
const DOC_PAGE = "doc.html";

/* ---------- 顶部栏与移动端菜单 ---------- */
const onScroll = () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
};

if (!isEra2012) {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

toggle.addEventListener("click", () => {
  const open = header.classList.toggle("open");
  document.body.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
});

/* ---------- 解谜状态（仅内存，刷新即重置） ---------- */
let puzzle = {
  active: false,
  order: [],      // order[d-1] = 数字 d 对应的导航 key
  progress: 0,    // 已按对的个数
  solved: false,
};

const linkFor = (key) => nav.querySelector(`a[data-key="${key}"]`);

const buildBadges = () => {
  KEYS.forEach((key) => {
    const link = linkFor(key);
    if (!link || link.querySelector(".puzzle-badge")) return;
    const badge = document.createElement("span");
    badge.className = "puzzle-badge";
    link.appendChild(badge);
  });
};

const renderPuzzle = () => {
  buildBadges();

  if (!puzzle.active) {
    nav.classList.remove("puzzle-active");
    return;
  }

  nav.classList.add("puzzle-active");

  KEYS.forEach((key) => {
    const link = linkFor(key);
    const badge = link && link.querySelector(".puzzle-badge");
    if (badge) badge.textContent = String(puzzle.order.indexOf(key) + 1);
    if (link) link.classList.remove("done");
  });

  if (puzzle.progress > 0) {
    for (let d = 1; d <= puzzle.progress; d++) {
      const link = linkFor(puzzle.order[d - 1]);
      if (link) link.classList.add("done");
    }
  }
};

const activatePuzzle = () => {
  puzzle.order = [...KEYS];
  for (let i = puzzle.order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [puzzle.order[i], puzzle.order[j]] = [puzzle.order[j], puzzle.order[i]];
  }
  puzzle.active = true;
  puzzle.progress = 0;
  puzzle.solved = false;
  renderPuzzle();
};

const handleNavClick = (key) => {
  if (!puzzle.active || puzzle.solved) return true;

  const idx = puzzle.order.indexOf(key);
  if (idx === -1) return true; // 预订按钮等不参与解谜

  const want = puzzle.progress + 1;
  const clicked = idx + 1;

  if (clicked === want) {
    puzzle.progress += 1;
    if (puzzle.progress >= KEYS.length) {
      puzzle.solved = true;
      renderPuzzle();
      setTimeout(() => {
        window.location.href = DOC_PAGE;
      }, 500);
    } else {
      renderPuzzle();
    }
  } else {
    puzzle.progress = 0;
    renderPuzzle();
  }

  return false;
};

nav.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-key]");
  if (!link) return;

  const key = link.dataset.key;
  const allowNavigate = handleNavClick(key);

  if (!allowNavigate) {
    event.preventDefault();
  }

  header.classList.remove("open");
  document.body.classList.remove("menu-open");
  toggle.setAttribute("aria-expanded", "false");
});

/* ---------- 预订表单 ---------- */
const today = isEra2012
  ? "2012-10-12"
  : new Date().toISOString().split("T")[0];
form.checkin.min = today;
form.checkout.min = today;

form.checkin.addEventListener("change", () => {
  form.checkout.min = form.checkin.value || today;
  if (form.checkout.value && form.checkout.value <= form.checkin.value) {
    form.checkout.value = "";
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const guestName = form.elements["name"].value.trim();
  const guestPhone = form.elements["phone"].value.replace(/\D/g, "");

  if (isEra2012 && guestName === "张旭" && guestPhone === "10456") {
    window.location.href = "black.html";
    return;
  }

  if (!form.reportValidity()) {
    status.textContent = "请完整填写姓名、电话与入住日期。";
    return;
  }

  if (form.checkout.value <= form.checkin.value) {
    status.textContent = "离店日期需晚于入住日期。";
    return;
  }

  if (!isEra2012 && guestName === "张旭") {
    status.textContent = "身份已识别。正在进入内部系统……";
    setTimeout(() => {
      window.location.href = "docs.html";
    }, 600);
    return;
  }

  if (!isEra2012 && !puzzle.active) {
    activatePuzzle();
  }

  if (isEra2012) {
    const morse = document.getElementById("eraMorse");
    if (morse) {
      morse.hidden = false;
      morse.classList.add("is-on");
    }
  }

  status.textContent = "已收到您的意向。管家将在 12 小时内与您确认房态。";

  form.reset();
  form.checkin.min = today;
  form.checkout.min = today;
});

/* ---------- 内部登录与档案时钟 ---------- */
const FLAG_COPIED = "hotel-copied-archive";
const FLAG_AUTH = "hotel-clock-auth";
const gate = document.getElementById("internalGate");
const loginBox = document.getElementById("internalLogin");
const clockBox = document.getElementById("clockPanel");
const loginForm = document.getElementById("internalLoginForm");
const loginStatus = document.getElementById("internalStatus");

const storageGet = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const storageSet = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {}
};

const showInternalGate = () => {
  const copied = storageGet(FLAG_COPIED) === "1";
  const authed = storageGet(FLAG_AUTH) === "1";
  if (!copied && !authed) return;

  gate.hidden = false;
  if (authed) {
    loginBox.hidden = true;
    clockBox.hidden = false;
  } else {
    loginBox.hidden = false;
    clockBox.hidden = true;
  }
};

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const uid = loginForm.uid.value.trim();
    const pwd = loginForm.pwd.value.trim();
    if (uid === "zhangxu" && pwd === "0401") {
      storageSet(FLAG_AUTH, "1");
      loginStatus.textContent = "核验通过。档案时钟已解锁。";
      showInternalGate();
      return;
    }
    loginStatus.textContent = "核验失败。";
  });
}

if (clockBox) {
  clockBox.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-year]");
    if (!btn) return;
    const year = btn.getAttribute("data-year");
    window.location.href = year === "2012" ? "index.html?year=2012" : "index.html?year=2026";
  });
}

showInternalGate();

/* ---------- 初始化 ---------- */
renderPuzzle();
