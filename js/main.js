/* =========================================================
   Hunger Warriors — renders the site from content/site.json
   Used by index.html and gallery.html. You shouldn't need to
   edit this file to change any text.
   ========================================================= */

document.documentElement.classList.add("js");

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// "*word*" in headings becomes an orange italic accent
const rich = (s) => esc(s).replace(/\*(.+?)\*/g, "<em>$1</em>");
const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

const parseDate = (d) => new Date(`${d}T00:00:00`);
const fmt = (d, opts) => parseDate(d).toLocaleDateString("en-IN", opts);
const rupees = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const byNewest = (a, b) => parseDate(b.date) - parseDate(a.date);

let waNumber = "";
const waLink = (text) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

init();

async function init() {
  let data;
  try {
    const res = await fetch("content/site.json", { cache: "no-cache" });
    data = await res.json();
  } catch (err) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<div class="load-error">Couldn't load <code>content/site.json</code>. If you opened this file directly, run a local server instead (see README). If you just edited the JSON, check for a missing comma or quote.<br><small>${esc(err.message)}</small></div>`
    );
    return;
  }

  waNumber = String(data.contact.whatsappNumber || "").replace(/\D/g, "");

  bindText(data);
  renderContact(data.contact);
  // Each renderer only runs if its section exists on the current page
  if ($("#impact")) renderImpact(data.impact);
  if ($("#about-story")) renderAbout(data.about);
  if ($("#work-items")) renderWork(data.work);
  if ($("#schedule")) renderUpcoming(data.upcoming);
  if ($("#past-list")) renderPast(data.pastDrives);
  if ($("#gallery-grid")) renderGallery(data.gallery);
  if ($("#albums")) renderAlbums(data.pastDrives);
  if ($("#join-form")) renderInvolved(data.involved);
  if ($("#calc")) renderDonate(data.donate, data);
  if ($("#map")) renderReach(data.reach);
  if ($("#legal")) renderLegal(data.legal);
  renderFooter(data.footer);

  $("#year").textContent = new Date().getFullYear();
  setupReveal();
  setupDock();
  if ($("#reminder")) setupReminder(data.upcoming);

  // Links like index.html#donate arrive before the content exists, so jump again now it's built
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) target.scrollIntoView({ behavior: "instant" });
}

/* ---------- Simple bindings: data-bind="path.to.value" ---------- */
function bindText(data) {
  $$("[data-bind]").forEach((el) => {
    const v = get(data, el.dataset.bind);
    if (v == null || v === "") el.hidden = true;
    else el.textContent = v;
  });
  $$("[data-bind-rich]").forEach((el) => (el.innerHTML = rich(get(data, el.dataset.bindRich))));
  $$("[data-bind-img]").forEach((el) => {
    el.src = get(data, el.dataset.bindImg);
    if (el.dataset.bindAlt) el.alt = get(data, el.dataset.bindAlt) || "";
  });
}

/* ---------- Impact numbers ---------- */
function renderImpact(items) {
  $("#impact").innerHTML = items
    .map(
      (s) => `
      <div class="stat reveal">
        <span class="stat-num" data-count="${Number(s.number) || 0}" data-suffix="${esc(s.suffix)}">0</span>
        <span class="stat-label">${esc(s.label)}</span>
      </div>`
    )
    .join("");
}

function countUp(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || "";
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / 1400, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString("en-IN") + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- Our story ---------- */
function renderAbout(about) {
  $("#about-story").innerHTML = about.story.map((p) => `<p>${esc(p)}</p>`).join("");
  const photos = about.images || [];
  const box = $("#about-photos");
  if (!photos.length) return;
  box.innerHTML = `
    <div class="ap-track" id="ap-track">
      ${photos
        .map(
          (p, i) => `
        <figure class="ap-slide" aria-label="Photo ${i + 1} of ${photos.length}">
          <img src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy">
          ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}
        </figure>`
        )
        .join("")}
    </div>
    ${
      photos.length > 1
        ? `<div class="ap-controls">
        <button class="ap-btn" type="button" data-step="-1" aria-label="Previous photo">‹</button>
        <div class="ap-dots">${photos.map((_, i) => `<button class="ap-dot" type="button" data-i="${i}" aria-label="Show photo ${i + 1}"></button>`).join("")}</div>
        <button class="ap-btn" type="button" data-step="1" aria-label="Next photo">›</button>
      </div>`
        : ""
    }`;

  // A scroll-snap strip: swipe on phones, arrows and dots everywhere
  const track = $("#ap-track");
  const current = () => Math.round(track.scrollLeft / track.clientWidth);
  const go = (i) => track.scrollTo({ left: ((i + photos.length) % photos.length) * track.clientWidth, behavior: "smooth" });
  const mark = () => $$(".ap-dot", box).forEach((d, i) => d.setAttribute("aria-current", String(i === current())));
  $$(".ap-btn", box).forEach((b) => b.addEventListener("click", () => go(current() + Number(b.dataset.step))));
  $$(".ap-dot", box).forEach((b) => b.addEventListener("click", () => go(Number(b.dataset.i))));
  track.addEventListener("scroll", () => requestAnimationFrame(mark), { passive: true });
  mark();
}

/* ---------- What we do ---------- */
function renderWork(work) {
  $("#work-items").innerHTML = work.items
    .map(
      (w, i) => `
      <article class="work-card reveal">
        <img src="${esc(w.image)}" alt="${esc(w.imageAlt)}" loading="lazy">
        <div class="work-body">
          <span class="tag ${i === 1 ? "tag-relief" : ""}">${esc(w.label)}</span>
          <h3>${esc(w.title)}</h3>
          <p>${esc(w.text)}</p>
        </div>
      </article>`
    )
    .join("");
}

/* ---------- Upcoming drives (past dates hide automatically) ---------- */
const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

function upcomingList(up) {
  const today = startOfToday();
  return [
    ...(up.sundayDrives || []).map((d) => ({ ...d, type: "sunday" })),
    ...(up.reliefDrives || []).map((d) => ({ ...d, type: "relief" })),
  ]
    .filter((d) => parseDate(d.date) >= today)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
}

const joinMessage = (d) =>
  `Hi Hunger Warriors! I'd like to join the ${d.title} on ${fmt(d.date, { weekday: "long", day: "numeric", month: "long" })} (${d.location}).`;

function renderUpcoming(up) {
  const drives = upcomingList(up);
  const first = up.showFirst || 5;

  if (!drives.length) {
    $("#schedule").innerHTML = `<li class="schedule-empty">No special drives announced right now. Join us any Sunday!</li>`;
    return;
  }

  $("#schedule").innerHTML = drives
    .map((d, i) => {
      return `
      <li class="drive drive-${esc(d.type)} reveal" ${i >= first ? "data-extra-up hidden" : ""}>
        <div class="drive-date">
          <span class="dd-day">${fmt(d.date, { day: "numeric" })}</span>
          <span class="dd-month">${fmt(d.date, { month: "short" })}</span>
        </div>
        <div class="drive-info">
          <span class="tag ${d.type === "relief" ? "tag-relief" : ""}">${d.type === "relief" ? "Relief drive" : "Sunday drive"}</span>
          <h3>${esc(d.title)}</h3>
          <p class="drive-meta">${esc(fmt(d.date, { weekday: "long" }))} · ${esc(d.time)} · ${esc(d.location)}</p>
          ${d.note ? `<p class="drive-note">${esc(d.note)}</p>` : ""}
        </div>
        <a class="drive-join" href="${waLink(joinMessage(d))}" target="_blank" rel="noopener">Join</a>
      </li>`;
    })
    .join("");

  if (drives.length > first) {
    $("#schedule").insertAdjacentHTML(
      "beforeend",
      `<li class="schedule-more"><button class="btn btn-outline" type="button">${esc(up.showAllButton || "See all upcoming drives")} (${drives.length})</button></li>`
    );
    $(".schedule-more button").addEventListener("click", (e) => {
      $$("[data-extra-up]").forEach((el) => {
        el.hidden = false;
        el.classList.add("in");
      });
      e.currentTarget.parentElement.remove();
    });
  }
}

/* ---------- Drive reminder pop-up ----------
   Shows the next drive once it's within reminder.daysBefore days.
   Closing it is remembered in this browser, per drive. */
function setupReminder(up) {
  const box = $("#reminder");
  const days = up.reminder?.daysBefore ?? 7;
  const today = startOfToday();
  const soon = upcomingList(up).filter((d) => (parseDate(d.date) - today) / 864e5 <= days);
  if (!soon.length) return;

  const d = soon[0];
  const key = `hw-reminder-${d.date}-${d.title}`;
  try {
    if (localStorage.getItem(key)) return;
  } catch {}

  const n = Math.round((parseDate(d.date) - today) / 864e5);
  const when = n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`;
  const more = soon.length - 1;
  box.className = `reminder reminder-${d.type}`;
  box.innerHTML = `
    <button class="rem-close" type="button" aria-label="Close reminder">×</button>
    <p class="rem-when"><span class="rem-dot"></span>${when} · ${d.type === "relief" ? "Relief drive" : "Sunday drive"}</p>
    <h3>${esc(d.title)}</h3>
    <p class="rem-meta">${esc(fmt(d.date, { weekday: "short", day: "numeric", month: "short" }))} · ${esc(d.time)} · ${esc(d.location)}</p>
    <div class="rem-actions">
      <a class="btn btn-sm btn-orange" href="${waLink(joinMessage(d))}" target="_blank" rel="noopener">${esc(up.reminder?.joinButton || "Count me in")}</a>
      <a class="btn btn-sm btn-outline rem-details" href="#upcoming">${esc(up.reminder?.detailsButton || "See details")}</a>
    </div>
    ${more > 0 ? `<p class="rem-more">+${more} more drive${more > 1 ? "s" : ""} this week</p>` : ""}`;

  const close = () => {
    box.classList.remove("show");
    setTimeout(() => (box.hidden = true), 400);
    try {
      localStorage.setItem(key, "1");
    } catch {}
  };
  $(".rem-close", box).addEventListener("click", close);
  $(".rem-details", box).addEventListener("click", close);

  setTimeout(() => {
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add("show"));
  }, 1800);
}

/* ---------- Legacy (past drives) ---------- */
const typeTag = (type, long) =>
  `<span class="tag ${type === "relief" ? "tag-relief" : ""}">${type === "relief" ? (long ? "Relief drive" : "Relief") : long ? "Sunday drive" : "Sunday"}</span>`;

// Sunday + relief lists → one list, newest first, with full photo paths
function pastList(past) {
  const withType = (list, type) =>
    (list || []).map((d) => ({
      ...d,
      type,
      photos: (d.photos || []).map((p) => ({ ...p, src: p.src || `${d.photoFolder || ""}${p.file}` })),
    }));
  return [...withType(past.sundayDrives, "sunday"), ...withType(past.reliefDrives, "relief")].sort(byNewest);
}

function renderPast(past) {
  const drives = pastList(past);
  const first = past.showFirst || 4;

  $("#past-list").innerHTML = drives
    .map((d, i) => {
      const cover = d.photos?.[0];
      const more = (d.photos?.length || 0) - 1;
      return `
      <article class="past-card reveal" ${i >= first ? "data-extra hidden" : ""}>
        ${
          cover
            ? `<button class="past-photo" type="button" data-drive="${i}" aria-label="View ${d.photos.length} photos from ${esc(d.title)}">
                 <img src="${esc(cover.src)}" alt="${esc(cover.alt)}" loading="lazy">
                 ${more > 0 ? `<span class="photo-count">+${more} photos</span>` : ""}
               </button>`
            : ""
        }
        <div class="past-body">
          <p class="past-meta">${typeTag(d.type)} ${esc(fmt(d.date, { day: "numeric", month: "long", year: "numeric" }))}</p>
          <h3>${esc(d.title)}</h3>
          <p class="past-loc">${esc(d.location)}</p>
          <p>${esc(d.summary)}</p>
          ${
            d.stats?.length
              ? `<ul class="past-stats">${d.stats.map((s) => `<li><strong>${esc(s.value)}</strong> ${esc(s.label)}</li>`).join("")}</ul>`
              : ""
          }
        </div>
      </article>`;
    })
    .join("");

  $$(".past-photo").forEach((btn) =>
    btn.addEventListener("click", () => openAlbum(drives[btn.dataset.drive], 0))
  );

  const moreBtn = $("#past-more");
  if (drives.length > first) {
    moreBtn.hidden = false;
    moreBtn.addEventListener("click", () => {
      $$("[data-extra]").forEach((el) => {
        el.hidden = false;
        el.classList.add("in");
      });
      moreBtn.hidden = true;
    });
  }
}

const openAlbum = (d, i) => openLightbox(d.photos.map((p) => ({ ...p, caption: `${d.title} · ${p.alt}` })), i);

/* ---------- Gallery page ---------- */
function renderGallery(gallery) {
  const grid = $("#gallery-grid");
  grid.innerHTML = gallery.photos
    .map((p, i) => `<button class="g-item" type="button" data-i="${i}"><img src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy"></button>`)
    .join("");
  // Portrait photos span two rows automatically
  $$(".g-item img", grid).forEach((img) => {
    const shape = () => img.naturalHeight > img.naturalWidth * 1.1 && img.parentElement.classList.add("tall");
    img.complete ? shape() : img.addEventListener("load", shape);
  });
  $$(".g-item", grid).forEach((btn) =>
    btn.addEventListener("click", () =>
      openLightbox(gallery.photos.map((p) => ({ ...p, caption: p.alt })), Number(btn.dataset.i))
    )
  );
}

function renderAlbums(past) {
  const drives = pastList(past).filter((d) => d.photos.length);
  $("#albums").innerHTML = drives
    .map(
      (d, di) => `
      <section class="album" id="${esc((d.photoFolder || "").split("/").filter(Boolean).pop() || "")}">
        <div class="album-head">
          ${typeTag(d.type, true)}
          <h3>${esc(d.title)}</h3>
          <p>${esc(fmt(d.date, { day: "numeric", month: "long", year: "numeric" }))} · ${esc(d.location)}</p>
        </div>
        <div class="album-grid">
          ${d.photos
            .map((p, pi) => `<button class="album-item" type="button" data-d="${di}" data-p="${pi}"><img src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy"></button>`)
            .join("")}
        </div>
      </section>`
    )
    .join("");
  $$(".album-item").forEach((btn) =>
    btn.addEventListener("click", () => openAlbum(drives[btn.dataset.d], Number(btn.dataset.p)))
  );
}

/* ---------- Get involved ---------- */
// [ISO code, name, dialling code, min digits, max digits] — India first and the default
const COUNTRIES = [
  ["IN", "India", "91", 10, 10], ["AE", "United Arab Emirates", "971", 9, 9], ["SA", "Saudi Arabia", "966", 9, 9],
  ["QA", "Qatar", "974", 8, 8], ["OM", "Oman", "968", 8, 8], ["KW", "Kuwait", "965", 8, 8], ["BH", "Bahrain", "973", 8, 8],
  ["BD", "Bangladesh", "880", 10, 10], ["NP", "Nepal", "977", 10, 10], ["LK", "Sri Lanka", "94", 9, 9],
  ["PK", "Pakistan", "92", 10, 10], ["SG", "Singapore", "65", 8, 8], ["MY", "Malaysia", "60", 9, 10],
  ["GB", "United Kingdom", "44", 10, 10], ["US", "United States / Canada", "1", 10, 10], ["AU", "Australia", "61", 9, 9],
  ["NZ", "New Zealand", "64", 8, 10], ["DE", "Germany", "49", 10, 11], ["FR", "France", "33", 9, 9],
  ["KE", "Kenya", "254", 9, 9], ["TZ", "Tanzania", "255", 9, 9], ["ZA", "South Africa", "27", 9, 9],
];
const flagImg = (iso) => `<img class="cc-flag" src="assets/flags/${iso.toLowerCase()}.svg" alt="" width="22" height="15">`;

function setupPhoneField() {
  const sel = $("#f-cc");
  const input = $("#f-phone");
  const face = $("#cc-face");
  sel.innerHTML =
    COUNTRIES.map(([iso, name, dial]) => `<option value="${iso}">${esc(name)} (+${dial})</option>`).join("") +
    `<option value="other">Other (type +code in the number)</option>`;
  sel.value = "IN";
  const country = () => COUNTRIES.find((c) => c[0] === sel.value);
  const paint = () => {
    const c = country();
    face.innerHTML = c ? `${flagImg(c[0])}+${c[2]}` : `<span class="cc-globe">+</span>`;
    input.placeholder = c && c[0] === "IN" ? "98311 08057" : c ? "Phone number" : "+code and number";
  };
  sel.addEventListener("change", () => {
    paint();
    input.focus();
  });

  // Typing or pasting "+44…" / "0044…" switches the country automatically
  input.addEventListener("input", () => {
    const raw = input.value.trim();
    if (!/^(\+|00)/.test(raw)) return;
    const digits = raw.replace(/^00/, "").replace(/\D/g, "");
    const match = [...COUNTRIES].sort((a, b) => b[2].length - a[2].length).find((c) => digits.startsWith(c[2]));
    if (match && digits.length > match[2].length) {
      sel.value = match[0];
      input.value = digits.slice(match[2].length);
      paint();
    }
  });
  paint();

  // Returns "+91 9831108057", or null if the number doesn't look right for the chosen country
  return () => {
    const c = country();
    let digits = input.value.replace(/\D/g, "");
    if (!c) return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : null;
    if (digits.startsWith(c[2]) && digits.length > c[4]) digits = digits.slice(c[2].length); // typed the code too
    digits = digits.replace(/^0+/, ""); // local trunk zero
    const ok = digits.length >= c[3] && digits.length <= c[4] && (c[0] !== "IN" || /^[6-9]/.test(digits));
    return ok ? `+${c[2]} ${digits}` : null;
  };
}

function renderInvolved(inv) {
  $("#ways").innerHTML = inv.ways.map((w) => `<li><strong>${esc(w.title)}</strong>${esc(w.text)}</li>`).join("");
  $("#f-how").innerHTML = inv.formOptions.map((o) => `<option>${esc(o)}</option>`).join("");

  const form = $("#join-form");
  const phoneValue = setupPhoneField();
  const err = $("#form-error");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    const phone = phoneValue();
    const missing = [!f.name.trim() && "name", !phone && "phone"].filter(Boolean);
    $$("input", form).forEach((el) => el.classList.toggle("invalid", missing.includes(el.name)));
    err.textContent = !f.name.trim()
      ? "Please add your name."
      : f.phone.trim()
      ? "That phone number doesn't look right for the country selected. Please check it."
      : "Please add your phone number.";
    err.hidden = !missing.length;
    if (missing.length) return;

    const lines = [
      `Name: ${f.name.trim()}`,
      `Phone: ${phone}`,
      f.area.trim() && `Area: ${f.area.trim()}`,
      `I'd like to: ${f.how}`,
      f.message.trim() && `Message: ${f.message.trim()}`,
    ].filter(Boolean);
    window.open(waLink(`Hi Hunger Warriors! I'd like to get involved.\n\n${lines.join("\n")}`), "_blank", "noopener");
  });
}

/* ---------- Donate + impact calculator ---------- */
function renderDonate(don, data) {
  const c = don.calculator;
  const impacts = [...c.impacts].sort((a, b) => a.costPer - b.costPer);
  const input = $("#calc-input");
  const range = $("#calc-range");
  const results = $("#calc-results");
  const next = $("#calc-next");
  const upiBase = `upi://pay?pa=${encodeURIComponent(don.upiId)}&pn=${encodeURIComponent(don.upiName)}&cu=INR&tn=${encodeURIComponent("Donation to Hunger Warriors")}`;

  // The slider is logarithmic so small and large amounts are both easy to pick
  const span = Math.log(c.max / c.min);
  const toAmount = (t) => Math.max(c.min, Math.round((c.min * Math.exp((t / 1000) * span)) / c.step) * c.step);
  const toSlider = (a) => Math.round((1000 * Math.log(Math.min(Math.max(a, c.min), c.max) / c.min)) / span);

  $("#calc-presets").innerHTML = c.presets
    .map((p) => `<button type="button" class="chip" data-amount="${p}">${rupees(p)}</button>`)
    .join("");

  results.innerHTML = impacts
    .map((it) => `<li class="calc-row"><span class="odo" aria-hidden="true"></span><span class="calc-label"></span><span class="sr-only"></span></li>`)
    .join("");
  const rows = $$(".calc-row", results);

  function update(amount, source) {
    const capped = (Math.round(amount) || 0) > c.max;
    amount = Math.max(0, Math.min(Math.round(amount) || 0, c.max));
    if (source !== "input" || capped) input.value = amount ? amount.toLocaleString("en-IN") : "";
    if (source !== "range") range.value = toSlider(amount);
    range.style.setProperty("--fill", `${(range.value / 10).toFixed(1)}%`);
    $$(".chip").forEach((b) => b.classList.toggle("active", Number(b.dataset.amount) === amount));

    // Only show an impact once the gift covers at least one of it
    impacts.forEach((it, i) => {
      const n = Math.floor(amount / it.costPer);
      const row = rows[i];
      row.classList.toggle("on", n >= 1);
      if (n >= 1) {
        odometer($(".odo", row), n);
        const label = n === 1 ? it.labelOne || it.label : it.label;
        $(".calc-label", row).textContent = label;
        $(".sr-only", row).textContent = `${n.toLocaleString("en-IN")} ${label}`;
      }
    });

    const locked = impacts.find((it) => amount < it.costPer);
    if (amount < c.min) {
      next.textContent = `Every ${rupees(impacts[0].costPer)} puts a hot meal in someone's hands. Enter at least ${rupees(c.min)}.`;
    } else if (locked) {
      next.innerHTML = `Just <strong>${rupees(locked.costPer - amount)}</strong> more and you'll also give <strong>1 ${esc(locked.labelOne || locked.label)}</strong>.`;
    } else {
      next.textContent = "You're sponsoring entire Sundays. Thank you, Warrior.";
    }

    const payable = amount >= c.min;
    $("#upi-link").href = payable ? `${upiBase}&am=${amount}` : upiBase;
    $("#upi-link").textContent = payable ? `Give ${rupees(amount)} with a UPI app` : "Give with a UPI app";
    $("#scan-hint").textContent = payable ? `Scan with your UPI app and enter ${rupees(amount)}` : "";
    $("#bank-amount").textContent = payable && don.bank?.accountNumber ? `Transfer ${rupees(amount)}, then send us a WhatsApp so we can thank you.` : "";
  }

  input.addEventListener("input", () => update(Number(input.value.replace(/\D/g, "")), "input"));
  input.addEventListener("blur", () => update(Math.max(Number(input.value.replace(/\D/g, "")), c.min)));
  range.addEventListener("input", () => update(toAmount(Number(range.value)), "range"));
  $$(".chip").forEach((b) => b.addEventListener("click", () => update(Number(b.dataset.amount))));
  update(c.default);

  /* Give once / Become a member tabs */
  const m = don.membership;
  const calcIntro = $(".calc-intro");
  let onceAmount = c.default;
  const showTab = (member) => {
    $("#tab-once").setAttribute("aria-selected", String(!member));
    $("#tab-member").setAttribute("aria-selected", String(member));
    $("#pane-once").hidden = member;
    $("#pane-member").hidden = !member;
    // The calculator follows along: a membership shows what ₹500 does every month
    if (member) {
      onceAmount = Number(input.value.replace(/\D/g, "")) || c.default;
      update(m.amount);
      calcIntro.textContent = `Every month, your ${rupees(m.amount)} could mean…`;
    } else {
      update(onceAmount);
      calcIntro.textContent = "Your gift could mean…";
    }
  };
  $("#tab-once").addEventListener("click", () => showTab(false));
  $("#tab-member").addEventListener("click", () => showTab(true));

  $("#member-amount").textContent = rupees(m.amount);
  $("#member-perks").innerHTML = m.perks.map((t) => `<li>${esc(t)}</li>`).join("");
  $("#member-btn").href = m.autopayLink || waLink(m.fallbackMessage);

  /* UPI / Bank transfer switch */
  $$(".method-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      $$(".method-btn").forEach((b) => b.setAttribute("aria-checked", String(b === btn)));
      $$(".method-pane").forEach((p) => (p.hidden = p.dataset.pane !== btn.dataset.method));
    })
  );

  const b = don.bank || {};
  if (b.accountNumber) {
    const labels = { accountName: "Account name", accountNumber: "Account number", ifsc: "IFSC code", bank: "Bank", branch: "Branch", accountType: "Account type" };
    const copyable = ["accountName", "accountNumber", "ifsc"];
    $("#bank-details").innerHTML = Object.entries(labels)
      .filter(([k]) => b[k])
      .map(
        ([k, label]) => `
        <div class="bank-row">
          <dt>${label}</dt>
          <dd><span>${esc(b[k])}</span>${copyable.includes(k) ? `<button class="mini-copy copy-btn" type="button" data-copy-path="donate.bank.${k}" aria-label="Copy ${label}">Copy</button>` : ""}</dd>
        </div>`
      )
      .join("");
  } else {
    $("#bank-details").hidden = true;
    $("#bank-missing").hidden = false;
  }

  // Copy buttons (UPI ID and bank details)
  $$(".copy-btn").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(get(data, btn.dataset.copyPath));
        btn.textContent = "Copied!";
      } catch {
        btn.textContent = "Copy failed";
      }
      setTimeout(() => (btn.textContent = "Copy"), 1800);
    })
  );
}

// Rolling "odometer" number: each digit is a strip of 0–9 that slides into place
function odometer(el, value) {
  const str = value.toLocaleString("en-IN");
  const pattern = str.replace(/\d/g, "0");
  if (el.dataset.pattern !== pattern) {
    el.innerHTML = [...str]
      .map((ch) =>
        /\d/.test(ch)
          ? `<span class="odo-d"><span class="odo-s">${"0123456789".split("").map((n) => `<span>${n}</span>`).join("")}</span></span>`
          : `<span class="odo-sep">${ch}</span>`
      )
      .join("");
    el.dataset.pattern = pattern;
    void el.offsetWidth; // let the new strips start at 0 so they roll up
  }
  const strips = $$(".odo-s", el);
  [...str.replace(/\D/g, "")].forEach((d, i) => (strips[i].style.transform = `translateY(-${Number(d) * 10}%)`));
}

/* ---------- Our reach: West Bengal map ---------- */
function renderReach(reach) {
  const places = reach.places || [];
  if (!window.L) {
    $(".map-views").hidden = true;
    return;
  }
  const map = L.map("map", {
    scrollWheelZoom: false,
    dragging: !L.Browser.mobile, // one finger scrolls the page on phones; zoom buttons still work
    zoomSnap: 0.25,
  });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 16,
  }).addTo(map);

  const size = { base: 22, sunday: 14, relief: 18 };
  places.forEach((p) => {
    const px = size[p.type] || 16;
    L.marker([p.lat, p.lng], {
      icon: L.divIcon({ className: "", html: `<span class="pin pin-${esc(p.type)} pin-map"></span>`, iconSize: [px, px], iconAnchor: [px / 2, px / 2] }),
      zIndexOffset: p.type === "base" ? 1000 : p.type === "relief" ? 500 : 0,
      keyboard: !!p.gallery,
    })
      .bindTooltip(`${esc(p.name)}${p.gallery ? ' <span class="tip-go">→ photos</span>' : ""}`, { direction: "top", offset: [0, -(px / 2) - 2] })
      .on("click", () => p.gallery && (location.href = `gallery.html#${encodeURIComponent(p.gallery)}`))
      .addTo(map);
  });

  // "Kolkata" view frames the Sunday drive dots; "West Bengal" frames the whole state
  const city = places.filter((p) => p.type !== "relief").map((p) => [p.lat, p.lng]);
  let stateBounds = null;
  let view = "state";
  const show = (v) => {
    view = v;
    $$(".map-view").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
    if (v === "city" && city.length) map.fitBounds(L.latLngBounds(city).pad(0.35), { maxZoom: 14 });
    else if (stateBounds) map.fitBounds(stateBounds, { padding: [16, 16] });
    else map.setView([23.6, 87.9], 6.5);
  };
  $$(".map-view").forEach((b) => b.addEventListener("click", () => show(b.dataset.view)));

  fetch("assets/west-bengal.geojson")
    .then((r) => r.json())
    .then((gj) => {
      const state = L.geoJSON(gj, {
        style: { color: "#EE7F2D", weight: 2, fillColor: "#EE7F2D", fillOpacity: 0.12, dashArray: "6 4" },
        interactive: false,
      }).addTo(map);
      stateBounds = state.getBounds();
    })
    .catch(() => {})
    .finally(() => show("state"));
  window.addEventListener("resize", () => show(view));
}

/* ---------- Contact ---------- */
const ICONS = {
  instagram:
    '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM16 2H8a6 6 0 0 0-6 6v8a6 6 0 0 0 6 6h8a6 6 0 0 0 6-6V8a6 6 0 0 0-6-6zm4 14a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4z"/>',
  facebook: '<path d="M14 8.5V6.6c0-.9.6-1.1 1-1.1h2.6V1.5H14c-4 0-4.9 3-4.9 4.9v2.1H6.8v4.1h2.3v9.9H14v-9.9h3.3l.4-4.1H14z"/>',
  youtube:
    '<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3-5.8 3z"/>',
};

function renderContact(c) {
  $$("[data-wa]").forEach((a) => {
    a.href = waLink(c.whatsappGreeting);
    a.target = "_blank";
    a.rel = "noopener";
  });
  const phones = $("#phones");
  if (phones)
    phones.innerHTML = (c.phones || [])
      .map((p) => `<a href="tel:${esc(p.replace(/[^\d+]/g, ""))}">${esc(p)}</a>`)
      .join(" / ");
  const email = $("#email-link");
  if (email) email.href = `mailto:${c.email}`;
  const socials = $("#socials");
  if (socials)
    socials.innerHTML = Object.keys(ICONS)
      .filter((k) => c[k])
      .map((k) => `<a class="social" href="${esc(c[k])}" target="_blank" rel="noopener" aria-label="${k}"><svg viewBox="0 0 24 24">${ICONS[k]}</svg></a>`)
      .join("");
}

/* ---------- Footer policy links ---------- */
function renderFooter(footer) {
  const nav = $("#footer-links");
  if (nav) nav.innerHTML = (footer.links || []).map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join("");
}

/* ---------- Policies page ---------- */
function renderLegal(legal) {
  $("#legal-updated").textContent = `Last updated ${fmt(legal.updated, { day: "numeric", month: "long", year: "numeric" })}`;
  $("#legal-toc").innerHTML = legal.sections.map((s) => `<a href="#${esc(s.id)}">${esc(s.title)}</a>`).join("");
  const block = (b) =>
    typeof b === "string"
      ? `<p>${esc(b)}</p>`
      : b.h
      ? `<h3>${esc(b.h)}</h3>`
      : b.list
      ? `<ul>${b.list.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>`
      : "";
  $("#legal").innerHTML = legal.sections
    .map((s) => `<section class="legal-section" id="${esc(s.id)}"><h2>${esc(s.title)}</h2>${s.blocks.map(block).join("")}</section>`)
    .join("");
}

/* ---------- Floating dock: Join + Donate slide in after the hero ---------- */
function setupDock() {
  const dock = $("#dock");
  const hero = $(".hero");
  const donate = $("#donate");
  if (!dock || !hero) return; // gallery page: always active
  let queued = false;
  const check = () => {
    queued = false;
    const vh = window.innerHeight;
    dock.classList.toggle("is-active", hero.getBoundingClientRect().bottom < vh * 0.35);
    // No need for a floating Donate button while the donate section is on screen
    if (donate) {
      const r = donate.getBoundingClientRect();
      dock.classList.toggle("at-donate", r.top < vh * 0.75 && r.bottom > vh * 0.25);
    }
  };
  const onScroll = () => {
    if (!queued) (queued = true), requestAnimationFrame(check);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  check();
}

/* ---------- Header + mobile menu ---------- */
const header = $(".site-header");
if (!document.body.classList.contains("page-sub")) {
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

const toggle = $(".nav-toggle");
const setMenu = (open) => {
  document.body.classList.toggle("nav-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  document.body.style.overflow = open ? "hidden" : "";
};
toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("nav-open")));
$$("#nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

/* ---------- Scroll reveal ---------- */
function setupReveal() {
  const els = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        $$("[data-count]", entry.target).forEach(countUp);
        io.unobserve(entry.target);
      }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- Lightbox ---------- */
const lb = $("#lightbox");
const lbImg = $("img", lb);
const lbCap = $("figcaption", lb);
let lbItems = [];
let lbIndex = 0;

function showPhoto(i) {
  lbIndex = (i + lbItems.length) % lbItems.length;
  lbImg.src = lbItems[lbIndex].src;
  lbImg.alt = lbItems[lbIndex].alt || "";
  lbCap.textContent = `${lbItems[lbIndex].caption || ""}  (${lbIndex + 1}/${lbItems.length})`;
}
function openLightbox(items, i) {
  lbItems = items;
  showPhoto(i);
  $$(".lb-nav", lb).forEach((b) => (b.hidden = items.length < 2));
  if (typeof lb.showModal === "function") lb.showModal();
  else window.open(items[i].src, "_blank");
}
$(".lb-close", lb).addEventListener("click", () => lb.close());
$(".lb-prev", lb).addEventListener("click", () => showPhoto(lbIndex - 1));
$(".lb-next", lb).addEventListener("click", () => showPhoto(lbIndex + 1));
lb.addEventListener("click", (e) => e.target === lb && lb.close());
lb.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") showPhoto(lbIndex - 1);
  if (e.key === "ArrowRight") showPhoto(lbIndex + 1);
});
let touchX = null;
lb.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
lb.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) showPhoto(lbIndex + (dx < 0 ? 1 : -1));
  touchX = null;
});
