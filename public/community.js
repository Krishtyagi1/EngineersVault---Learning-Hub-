(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    api = window.EV;
  const esc = (value) =>
    String(value ?? "").replace(
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
  const date = (value) =>
    new Date(value).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  let registering = false,
    subjects = [],
    toastTimer;
  function notify(message) {
    clearTimeout(toastTimer);
    $("toast").textContent = message;
    $("toast").classList.add("visible");
    toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 3500);
  }
  function notice(message, error = false) {
    $("pageNotice").hidden = !message;
    $("pageNotice").textContent = message;
    $("pageNotice").classList.toggle("error", error);
  }
  async function formAction(form, work) {
    const button = form.querySelector("button[type=submit]"),
      error = form.querySelector(".form-error");
    error.hidden = true;
    button.disabled = true;
    try {
      await work(Object.fromEntries(new FormData(form)));
    } catch (cause) {
      error.textContent = cause.message;
      error.hidden = false;
    } finally {
      button.disabled = false;
    }
  }
  function setAuthMode(mode) {
    registering = mode;
    $("nameField").hidden = !mode;
    $("authForm").elements.name.required = mode;
    $("authForm").elements.password.autocomplete = mode
      ? "new-password"
      : "current-password";
    $("authSubmit").textContent = mode ? "Create account" : "Sign in";
    $("authTitle").textContent = mode
      ? "Create your account"
      : "Sign in to contribute";
    $("registerMode").setAttribute("aria-pressed", String(mode));
    $("loginMode").setAttribute("aria-pressed", String(!mode));
    $("authError").hidden = true;
  }
  function sessionUi() {
    const user = api.session.user;
    $("authPanel").hidden = !!user;
    $("memberPanel").hidden = !user;
    $("logoutButton").hidden = !user;
    $("reviewTab").hidden = !user?.canReview;
    $("adminTab").hidden = !user?.admin;
  }
  function status(item) {
    return item.status === "pending"
      ? item.published
        ? "Published; awaiting credit review"
        : "Awaiting review"
      : item.status === "approved"
        ? "Approved"
        : "Rejected or removed";
  }
  async function account() {
    const data = await api.request("/account");
    api.setSession({ ...api.session, user: data.user, policy: data.policy });
    sessionUi();
    const user = data.user,
      policy = data.policy;
    $("accountSummary").innerHTML =
      `<div><span class="credit-balance">${user.credits}</span><span>Credits earned</span></div><div class="permission-list"><strong>${esc(user.name)}</strong><p>${user.canPostDirectly ? "You can publish directly." : `Direct posting unlocks at ${policy.posting_threshold} credits.`}</p><p>${user.canReview ? "You can review other members’ resources." : `Reviewing unlocks at ${policy.reviewing_threshold} credits.`}</p><p>Approved resources earn ${policy.approval_award} credits each.</p></div>`;
    $("submissionsList").innerHTML = data.submissions.length
      ? data.submissions
          .map(
            (item) =>
              `<article class="submission-item"><h4>${esc(item.title)}</h4><span class="status-pill ${item.status}">${status(item)}</span><span class="field-help">${date(item.createdAt)}</span>${item.reviewNote ? `<p>Review: ${esc(item.reviewNote)}</p>` : ""}<p><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">View resource</a></p></article>`,
          )
          .join("")
      : '<p class="quiet-empty">You have not submitted a resource yet. Share a course or book that helped you understand a topic.</p>';
    $("creditHistory").innerHTML = data.ledger.length
      ? data.ledger
          .map(
            (entry) =>
              `<div class="ledger-item"><div>${esc(entry.reason)}<p>${date(entry.created_at)}</p></div><strong>${entry.delta > 0 ? "+" : ""}${entry.delta} credits</strong></div>`,
          )
          .join("")
      : '<p class="quiet-empty">Your first approved contribution will start your credit history.</p>';
  }
  async function reviews() {
    const data = await api.request("/reviews");
    $("reviewQueue").innerHTML = data.resources.length
      ? data.resources
          .map(
            (item) =>
              `<article class="review-item"><h3>${esc(item.title)}</h3><p class="review-source">${esc(item.submittedBy)} • ${esc(item.provider)} • ${esc(subjects.find((subject) => subject.id === item.subject)?.label)}</p><p>${esc(item.description)}</p><p><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Open resource in a new tab</a></p>${item.topics.length ? `<p>Topics: ${item.topics.map(esc).join(", ")}</p>` : ""}<span class="status-pill">${item.published ? "Already published by a trusted contributor" : "Waiting to be published"}</span><form class="review-form stacked-form" data-resource="${item.id}"><div class="form-columns"><label>Decision<select name="decision"><option value="approved">Approve</option><option value="rejected">Reject</option></select></label><label>Explanation<input name="reason" minlength="5" maxlength="1000" required placeholder="Explain your decision to the contributor"></label></div><p class="form-error" role="alert" hidden></p><button class="primary-button" type="submit">Record decision</button></form></article>`,
          )
          .join("")
      : '<p class="quiet-empty">The review queue is clear. New submissions from other members will appear here.</p>';
  }
  async function admin() {
    const [data, catalog] = await Promise.all([
      api.request("/admin"),
      api.request("/catalog"),
    ]);
    const form = $("policyForm");
    form.elements.approvalAward.value = data.policy.approval_award;
    form.elements.postingThreshold.value = data.policy.posting_threshold;
    form.elements.reviewingThreshold.value = data.policy.reviewing_threshold;
    $("adjustmentUser").innerHTML = data.users
      .map(
        (user) =>
          `<option value="${user.id}">${esc(user.name)} (${esc(user.email)}) — ${user.credits} credits</option>`,
      )
      .join("");
    $("withdrawResource").innerHTML = catalog.resources
      .map((item) => `<option value="${item.id}">${esc(item.title)}</option>`)
      .join("");
    $("withdrawForm").querySelector("button").disabled =
      !catalog.resources.length;
    $("membersList").innerHTML =
      `<table><thead><tr><th>Member</th><th>Credits</th><th>Permissions</th></tr></thead><tbody>${data.users.map((user) => `<tr><td>${esc(user.name)}<span class="field-help">${esc(user.email)}</span></td><td>${user.credits}</td><td>${user.admin ? "Admin" : [user.canPostDirectly ? "Direct posting" : "Submissions need approval", user.canReview ? "Can review" : "Cannot review"].join("; ")}</td></tr>`).join("")}</tbody></table>`;
    const labels = {
      "policy.updated": "Credit rules updated",
      "credits.adjusted": "Credits adjusted",
      "resource.approved": "Resource approved",
      "resource.rejected": "Resource rejected",
      "resource.submitted": "Resource submitted",
      "resource.withdrawn": "Resource removed",
      "admin.granted": "Admin access granted",
    };
    $("auditList").innerHTML = data.audit.length
      ? data.audit
          .map(
            (entry) =>
              `<div class="audit-item"><div>${esc(labels[entry.action] || entry.action)}<p>${esc(entry.actor || "Owner")} ${entry.details.reason ? `— ${esc(entry.details.reason)}` : ""}${entry.details.delta !== undefined ? ` (${entry.details.delta > 0 ? "+" : ""}${entry.details.delta} credits)` : ""}</p></div><span class="field-help">${date(entry.created_at)}</span></div>`,
          )
          .join("")
      : '<p class="quiet-empty">Community decisions and rule changes will be recorded here.</p>';
  }
  async function showPanel() {
    sessionUi();
    if (!api.session.user) return;
    let panel = location.hash.slice(1) || "account";
    if (!["account", "submit", "reviews", "admin"].includes(panel))
      panel = "account";
    if (panel === "reviews" && !api.session.user.canReview) panel = "account";
    if (panel === "admin" && !api.session.user.admin) panel = "account";
    document.querySelectorAll(".community-panel").forEach((section) => {
      section.hidden = section.id !== `${panel}Panel`;
    });
    document.querySelectorAll("[data-panel]").forEach((link) => {
      const active = link.dataset.panel === panel;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    notice("");
    try {
      await api.refresh();
      sessionUi();
      if (!api.session.user) {
        notice("Your session expired. Sign in again.");
        return;
      }
      if (
        (panel === "reviews" && !api.session.user?.canReview) ||
        (panel === "admin" && !api.session.user?.admin)
      ) {
        location.hash = "account";
        return;
      }
      if (panel === "account") await account();
      if (panel === "reviews") await reviews();
      if (panel === "admin") await admin();
      if (panel === "submit") {
        const direct = api.session.user.canPostDirectly;
        $("submissionHint").textContent = direct
          ? "Your credits let you publish immediately. An independent review is still needed to earn contribution credits."
          : "A reviewer will check your submission before it appears in the library. Credits are awarded only after approval.";
        $("submissionSubmit").textContent = direct
          ? "Publish resource"
          : "Submit for review";
      }
    } catch (error) {
      notice(error.message, true);
    }
  }
  $("loginMode").addEventListener("click", () => setAuthMode(false));
  $("registerMode").addEventListener("click", () => setAuthMode(true));
  $("authForm").addEventListener("submit", (event) => {
    event.preventDefault();
    formAction(event.currentTarget, async (body) => {
      const data = await api.request(
        registering ? "/auth/register" : "/auth/login",
        { method: "POST", body },
      );
      api.setSession(data);
      $("authForm").reset();
      notify(registering ? "Account created" : "Signed in");
      await showPanel();
    });
  });
  $("logoutButton").addEventListener("click", async () => {
    try {
      await api.request("/auth/logout", { method: "POST" });
      api.setSession({
        user: null,
        csrfToken: null,
        policy: api.session.policy,
      });
      sessionUi();
      notice("");
      notify("Signed out");
    } catch (error) {
      notice(error.message, true);
    }
  });
  $("resourceForm").addEventListener("submit", (event) => {
    event.preventDefault();
    formAction(event.currentTarget, async (body) => {
      for (const key of ["topics", "tags"])
        body[key] = body[key]
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
      const data = await api.request("/resources", { method: "POST", body });
      $("resourceForm").reset();
      notify(data.message);
      location.hash = "account";
      if (location.hash === "#account") await showPanel();
    });
  });
  $("reviewQueue").addEventListener("submit", (event) => {
    if (!event.target.matches(".review-form")) return;
    event.preventDefault();
    const form = event.target;
    formAction(form, async (body) => {
      await api.request(`/reviews/${form.dataset.resource}`, {
        method: "POST",
        body,
      });
      notify(
        body.decision === "approved"
          ? "Resource approved and credits awarded"
          : "Resource rejected",
      );
      await reviews();
    });
  });
  $("policyForm").addEventListener("submit", (event) => {
    event.preventDefault();
    formAction(event.currentTarget, async (body) => {
      for (const key of Object.keys(body)) body[key] = Number(body[key]);
      await api.request("/admin/policy", { method: "PUT", body });
      await api.refresh();
      await admin();
      notify("Credit rules saved. Permissions have updated.");
    });
  });
  $("adjustmentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    formAction(event.currentTarget, async (body) => {
      await api.request(`/admin/users/${body.userId}/credits`, {
        method: "POST",
        body: { delta: Number(body.delta), reason: body.reason },
      });
      $("adjustmentForm").reset();
      await api.refresh();
      await admin();
      notify("Credits adjusted. Permissions have updated.");
    });
  });
  $("withdrawForm").addEventListener("submit", (event) => {
    event.preventDefault();
    formAction(event.currentTarget, async (body) => {
      await api.request(`/admin/resources/${body.resourceId}/withdraw`, {
        method: "POST",
        body: { reason: body.reason },
      });
      $("withdrawForm").reset();
      await admin();
      notify("Resource removed from the library.");
    });
  });
  $("refreshAccount").addEventListener("click", () =>
    account().catch((error) => notice(error.message, true)),
  );
  $("refreshReviews").addEventListener("click", () => showPanel());
  window.addEventListener("hashchange", () => showPanel());
  async function init() {
    try {
      const [catalog] = await Promise.all([
        api.request("/catalog"),
        api.refresh(),
      ]);
      subjects = catalog.subjects;
      $("submissionDiscipline").innerHTML = subjects
        .map(
          (subject) =>
            `<option value="${subject.id}">${esc(subject.label)}</option>`,
        )
        .join("");
      notice("");
      sessionUi();
      await showPanel();
    } catch (error) {
      notice(error.message, true);
    }
  }
  init();
})();
