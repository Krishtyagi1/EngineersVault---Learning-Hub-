/* Library state, accessible rendering, and device-local bookmarks. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const icons = {
    bookmark: '<path d="M6 4h12v17l-6-4-6 4z"/>',
    open: '<path d="M14 3h7v7M21 3l-9 9M10 3H4v17h17v-6"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    book: '<path d="M3 4h6c3 0 3 3 3 3s0-3 3-3h6v15h-6c-3 0-3 2-3 2s0-2-3-2H3zM12 7v14"/>',
  };
  const icon = (name) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  let subjects = new Map();
  let catalogSubjects = [];
  let resources = [];
  const validIds = new Set();
  let catalogFailed = false;
  const storageKey = "engineersvault.saved.v1";
  let saved = new Set();
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(stored))
      saved = new Set(stored.filter((id) => typeof id === "string"));
  } catch {
    /* Storage is optional. */
  }
  const state = {
    query: "",
    subject: "all",
    type: "all",
    savedOnly: false,
    sort: "curated",
  };
  let toastTimer;
  function toast(message) {
    clearTimeout(toastTimer);
    $("toast").textContent = message;
    $("toast").classList.add("visible");
    toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 2600);
  }
  function saveButton(item) {
    const isSaved = saved.has(item.id);
    return `<button type="button" class="save-button" data-save="${escapeHtml(item.id)}" aria-pressed="${isSaved}" aria-label="${isSaved ? "Remove" : "Save"} ${escapeHtml(item.title)}${isSaved ? " from saved resources" : ""}">${icon("bookmark")}</button>`;
  }
  function renderCard(item) {
    const title = escapeHtml(item.title),
      subject = escapeHtml(subjects.get(item.subject).label);
    const media =
      item.type === "video"
        ? `<div class="resource-media"><img src="${escapeHtml(item.thumb)}" alt="" loading="lazy" decoding="async"><span class="media-fallback" aria-hidden="true">${icon("play")}</span><span class="resource-badge">${icon("play")}${escapeHtml(item.videos)}</span>${saveButton(item)}</div>`
        : `<div class="resource-media book-media"><div class="book-cover" aria-hidden="true">${icon("book")}<span>${title}</span></div><span class="resource-badge">${icon("book")}Open textbook</span>${saveButton(item)}</div>`;
    return `<article class="resource-card ${item.type === "book" ? "book-card" : ""}" data-subject="${item.subject}" data-resource-id="${escapeHtml(item.id)}">${media}<div class="card-content"><p class="card-subject">${subject}</p><h3>${title}</h3><p class="card-provider">${escapeHtml(item.provider)}</p>${item.description ? `<p class="resource-description">${escapeHtml(item.description)}</p>` : ""}${item.status === "pending" ? `<p class="pending-note">Published; awaiting independent review</p>` : ""}${item.tags.length ? `<div class="card-tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}<div class="card-actions"><a class="resource-open" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="${item.type === "book" ? "Read" : "Open"} ${title} (opens in a new tab)">${item.type === "book" ? "Read book" : "Open course"}${icon("open")}</a>${item.notes ? `<a class="notes-link" href="${escapeHtml(item.notes.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(item.notes.label)} for ${title} (opens in a new tab)">Course notes</a>` : ""}</div>${item.topics.length ? `<details class="course-details"><summary>Topics covered</summary><ul>${item.topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")}</ul></details>` : ""}</div></article>`;
  }
  function matchingResources(ignoreSubject = false) {
    const terms = state.query
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    return resources.filter(
      (item) =>
        (ignoreSubject ||
          state.subject === "all" ||
          state.subject === item.subject) &&
        (state.type === "all" || state.type === item.type) &&
        (!state.savedOnly || saved.has(item.id)) &&
        terms.every((term) => item.search.includes(term)),
    );
  }
  function renderDisciplines() {
    const matching = matchingResources(true);
    $("disciplineFilters").innerHTML = [
      { id: "all", label: "All disciplines" },
      ...catalogSubjects,
    ]
      .map(
        (subject) =>
          `<button type="button" class="discipline-button ${state.subject === subject.id ? "active" : ""}" data-subject="${subject.id}" aria-pressed="${state.subject === subject.id}"><span>${escapeHtml(subject.label)}</span><span class="count">${matching.filter((item) => subject.id === "all" || item.subject === subject.id).length}</span></button>`,
      )
      .join("");
    $("disciplineSelect").value = state.subject;
  }
  function render() {
    const focusedSubject = document.activeElement?.dataset.subject;
    const openTopics = new Set(
      [...$("resourceGrid").querySelectorAll(".course-details[open]")].map(
        (details) => details.closest("[data-resource-id]").dataset.resourceId,
      ),
    );
    const matching = matchingResources();
    if (state.sort === "title")
      matching.sort((a, b) => a.title.localeCompare(b.title));
    if (state.sort === "subject")
      matching.sort(
        (a, b) =>
          subjects
            .get(a.subject)
            .label.localeCompare(subjects.get(b.subject).label) ||
          a.title.localeCompare(b.title),
      );
    $("resourceGrid").innerHTML = matching.map(renderCard).join("");
    $("resourceGrid")
      .querySelectorAll(".course-details")
      .forEach((details) => {
        details.open = openTopics.has(
          details.closest("[data-resource-id]").dataset.resourceId,
        );
      });
    $("resourceGrid")
      .querySelectorAll("img")
      .forEach((img) =>
        img.addEventListener(
          "error",
          () => {
            img.hidden = true;
          },
          { once: true },
        ),
      );
    $("resultsCount").textContent =
      `${matching.length} resource${matching.length === 1 ? "" : "s"}${state.subject === "all" ? "" : ` in ${subjects.get(state.subject).label}`}`;
    $("savedCount").textContent = saved.size;
    $("savedFilter").setAttribute("aria-pressed", String(state.savedOnly));
    $("clearSearch").hidden = !state.query;
    $("emptyState").hidden = matching.length > 0;
    $("resultsEnd").hidden = !matching.length;
    $("emptyTitle").textContent =
      state.savedOnly && !saved.size
        ? "Your saved list starts here"
        : "No resources found";
    $("emptyDescription").textContent =
      state.savedOnly && !saved.size
        ? "Use the bookmark on a course or book to save it for later. Your list stays on this device."
        : "Try a broader search or clear your filters to explore the library.";
    $("emptyReset").textContent =
      state.savedOnly && !saved.size ? "Explore resources" : "Clear filters";
    const filterText = [
      state.query.trim() ? `Search: “${state.query.trim()}”` : "",
      state.subject !== "all" ? subjects.get(state.subject).label : "",
      state.type !== "all"
        ? state.type === "video"
          ? "Courses"
          : "Books"
        : "",
      state.savedOnly ? "Saved resources" : "",
    ].filter(Boolean);
    $("activeFilters").hidden = !filterText.length;
    $("filterSummary").textContent = filterText.join(" / ");
    document.querySelectorAll("[data-type]").forEach((button) => {
      const active = button.dataset.type === state.type;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderDisciplines();
    if (focusedSubject)
      $("disciplineFilters")
        .querySelector(`[data-subject="${focusedSubject}"]`)
        ?.focus({ preventScroll: true });
  }
  function resetFilters() {
    Object.assign(state, {
      query: "",
      subject: "all",
      type: "all",
      savedOnly: false,
    });
    $("searchInput").value = "";
    render();
  }
  $("searchForm").addEventListener("submit", (event) => event.preventDefault());
  $("searchInput").addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });
  $("clearSearch").addEventListener("click", () => {
    state.query = "";
    $("searchInput").value = "";
    render();
    $("searchInput").focus();
  });
  $("disciplineFilters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-subject]");
    if (button) {
      state.subject = button.dataset.subject;
      render();
    }
  });
  $("disciplineSelect").addEventListener("change", (event) => {
    state.subject = event.target.value;
    render();
  });
  document.querySelectorAll("[data-type]").forEach((button) =>
    button.addEventListener("click", () => {
      state.type = button.dataset.type;
      render();
    }),
  );
  $("savedFilter").addEventListener("click", () => {
    state.savedOnly = !state.savedOnly;
    render();
  });
  $("savedNav").addEventListener("click", () => {
    resetFilters();
    state.savedOnly = true;
    render();
    $("library").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    $("savedFilter").focus({ preventScroll: true });
  });
  $("sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });
  ["resetFilters", "emptyReset"].forEach((id) =>
    $(id).addEventListener("click", () => {
      if (catalogFailed) {
        loadCatalog();
        return;
      }
      resetFilters();
      $("searchInput").focus({ preventScroll: true });
    }),
  );
  $("resourceGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-save]");
    if (!button) return;
    const id = button.dataset.save,
      adding = !saved.has(id);
    if (adding) saved.add(id);
    else saved.delete(id);
    let persisted = true;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...saved]));
    } catch {
      persisted = false;
    }
    const index = [
      ...$("resourceGrid").querySelectorAll("[data-save]"),
    ].indexOf(button);
    render();
    const nextButtons = [...$("resourceGrid").querySelectorAll("[data-save]")];
    (
      nextButtons.find((next) => next.dataset.save === id) ||
      nextButtons[Math.min(index, nextButtons.length - 1)] ||
      $("emptyReset")
    ).focus({ preventScroll: true });
    toast(
      persisted
        ? adding
          ? "Added to your saved resources"
          : "Removed from saved resources"
        : "Saved list updated for this visit. Browser storage is unavailable.",
    );
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !event.target.closest("input,textarea,select,[contenteditable]")
    ) {
      event.preventDefault();
      $("searchInput").focus();
    }
    if (
      event.key === "Escape" &&
      document.activeElement === $("searchInput") &&
      state.query
    ) {
      state.query = "";
      $("searchInput").value = "";
      render();
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey) return;
    try {
      const incoming = JSON.parse(event.newValue || "[]");
      saved = new Set(
        Array.isArray(incoming)
          ? incoming.filter((id) => validIds.has(id))
          : [],
      );
      render();
    } catch {
      /* Ignore malformed storage. */
    }
  });
  async function loadCatalog() {
    catalogFailed = false;
    $("resourceGrid").setAttribute("aria-busy", "true");
    $("resultsCount").textContent = "Loading the library…";
    $("searchInput").disabled = true;
    document
      .querySelectorAll("[data-type]")
      .forEach((button) => (button.disabled = true));
    try {
      const data = await window.EV.request("/catalog");
      catalogSubjects = data.subjects;
      subjects = new Map(
        catalogSubjects.map((subject) => [subject.id, subject]),
      );
      resources = data.resources.map((item) => ({
        ...item,
        search: [
          item.title,
          item.provider,
          item.description,
          subjects.get(item.subject).label,
          subjects.get(item.subject).desc,
          ...item.tags,
          ...item.topics,
        ]
          .join(" ")
          .toLocaleLowerCase(),
      }));
      validIds.clear();
      resources.forEach((item) => validIds.add(item.id));
      // Preserve bookmarks made before resources received permanent database IDs.
      saved = new Set(
        resources
          .filter(
            (item) =>
              saved.has(item.id) ||
              [...saved].some(
                (id) =>
                  id.startsWith(`${item.type}:${item.subject}:`) &&
                  id.endsWith(`:${item.title}`),
              ),
          )
          .map((item) => item.id),
      );
      try {
        localStorage.setItem(storageKey, JSON.stringify([...saved]));
      } catch {
        /* Optional local storage. */
      }
      $("catalogSummary").textContent =
        `${resources.filter((item) => item.type === "video").length} courses, ${resources.filter((item) => item.type === "book").length} books, ${catalogSubjects.length} disciplines`;
      $("disciplineSelect").innerHTML = [
        { id: "all", label: "All disciplines" },
        ...catalogSubjects,
      ]
        .map(
          (subject) =>
            `<option value="${subject.id}">${escapeHtml(subject.label)}</option>`,
        )
        .join("");
      render();
    } catch (error) {
      catalogFailed = true;
      $("resourceGrid").innerHTML = "";
      $("emptyState").hidden = false;
      $("emptyTitle").textContent = "The library is unavailable";
      $("emptyDescription").textContent = error.message;
      $("emptyReset").textContent = "Retry connection";
      $("resultsCount").textContent = "Could not load resources";
      $("resultsEnd").hidden = true;
    } finally {
      $("resourceGrid").setAttribute("aria-busy", "false");
      $("searchInput").disabled = catalogFailed;
      document
        .querySelectorAll("[data-type]")
        .forEach((button) => (button.disabled = catalogFailed));
    }
  }
  window.EV.refresh().catch(() => {});
  loadCatalog();
})();
