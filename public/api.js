/* Same-origin requests with a server-issued CSRF token. */
window.EV = (() => {
  let session = { user: null, csrfToken: null, policy: null };
  async function request(path, { method = "GET", body } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (method !== "GET" && session.csrfToken)
      headers["X-CSRF-Token"] = session.csrfToken;
    let response;
    try {
      response = await fetch(`/api${path}`, {
        method,
        headers,
        credentials: "same-origin",
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new Error(
        "Cannot reach the server. Check your connection and try again.",
      );
    }
    const data = await response
      .json()
      .catch(() => ({ error: "The server returned an unexpected response." }));
    if (!response.ok) {
      const error = new Error(data.error || "The request failed.");
      error.status = response.status;
      throw error;
    }
    return data;
  }
  function setSession(data) {
    session = data;
    document.dispatchEvent(new CustomEvent("ev:session", { detail: session }));
    const link = document.getElementById("accountLink");
    if (link)
      link.textContent = session.user
        ? `${session.user.name} (${session.user.credits})`
        : "Sign in";
  }
  async function refresh() {
    const data = await request("/me");
    setSession(data);
    return data;
  }
  return {
    request,
    refresh,
    setSession,
    get session() {
      return session;
    },
  };
})();
