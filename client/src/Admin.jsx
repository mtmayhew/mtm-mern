import React, { useEffect, useState } from "react";

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
const statuses = [
  ["new", "New"],
  ["in_progress", "In progress"],
  ["completed", "Completed"],
];
const label = (s) => statuses.find(([key]) => key === s)?.[1] || s;
const fmt = (d) => new Date(d).toLocaleString();
export default function Admin() {
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState("");
  const [items, setItems] = useState([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(1);
  const [filter, setFilter] = useState(""),
    [search, setSearch] = useState(""),
    [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState(null),
    [notes, setNotes] = useState(""),
    [status, setStatus] = useState("new");
  const [working, setWorking] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    request("/api/admin/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    setError("");
    const query = new URLSearchParams({ page: String(page) });
    if (filter) query.set("status", filter);
    if (searchTerm) query.set("search", searchTerm);
    request(`/api/admin/inquiries?${query}`)
      .then((d) => {
        if (active) {
          setItems(d.items);
          setTotal(d.total);
          setPages(d.pages);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [user, page, filter, searchTerm, message]);
  async function login(e) {
    e.preventDefault();
    setError("");
    setWorking(true);
    try {
      const d = await request("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUser(d);
      setPassword("");
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }
  async function logout() {
    try {
      await request("/api/admin/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setSelected(null);
    setItems([]);
  }
  async function save(e) {
    e.preventDefault();
    if (!selected) return;
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const d = await request(`/api/admin/inquiries/${selected._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      setSelected(d.item);
      setMessage("Changes saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }
  function open(item) {
    setSelected(item);
    setStatus(item.status || "new");
    setNotes(item.adminNotes || "");
    setMessage("");
    setError("");
  }
  if (checking)
    return (
      <main className="admin-page">
        <p>Checking admin session…</p>
      </main>
    );
  if (!user)
    return (
      <main className="admin-page">
        <section className="admin-login">
          <a href="/">← Back to site</a>
          <h1>MTM Admin</h1>
          <p>Sign in to manage customer inquiries.</p>
          <form onSubmit={login} className="admin-form">
            <label>
              Username
              <input
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="btn" disabled={working}>
              {working ? "Signing in…" : "Sign in"}
            </button>
          </form>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
        </section>
      </main>
    );
  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <a href="/">← Public website</a>
            <h1>Inquiry dashboard</h1>
            <p>
              {total} matching inquiries · Signed in as {user.username}
            </p>
          </div>
          <button className="admin-secondary" onClick={logout}>
            Sign out
          </button>
        </header>
        <form
          className="admin-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearchTerm(search);
          }}
        >
          <label>
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, or message"
            />
          </label>
          <label>
            Status
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {statuses.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <button className="btn">Search</button>
        </form>
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        <div className="admin-grid">
          <div className="admin-list">
            {!items.length ? (
              <p className="admin-empty">No inquiries found.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item._id}
                  className={
                    "inquiry-row " +
                    (selected?._id === item._id ? "active" : "")
                  }
                  onClick={() => open(item)}
                >
                  <span className="inquiry-row-top">
                    <strong>{item.name}</strong>
                    <span
                      className={"status-pill status-" + (item.status || "new")}
                    >
                      {label(item.status || "new")}
                    </span>
                  </span>
                  <span>{item.email}</span>
                  <span className="inquiry-snippet">{item.message}</span>
                  <small>{fmt(item.createdAt)}</small>
                </button>
              ))
            )}
          </div>
          <div className="admin-detail">
            {selected ? (
              <>
                <h2>{selected.name}</h2>
                <p>
                  <a href={"mailto:" + selected.email}>{selected.email}</a>
                </p>
                <small>Received {fmt(selected.createdAt)}</small>
                <div className="inquiry-message">{selected.message}</div>
                <form className="admin-form" onSubmit={save}>
                  <label>
                    Status
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {statuses.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Private notes
                    <textarea
                      rows="6"
                      maxLength="4000"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Internal notes, next steps, quote details…"
                    />
                  </label>
                  <button className="btn" disabled={working}>
                    {working ? "Saving…" : "Save changes"}
                  </button>
                  {message && (
                    <p role="status" className="admin-success">
                      {message}
                    </p>
                  )}
                </form>
              </>
            ) : (
              <p className="admin-empty">
                Select an inquiry to read and manage it.
              </p>
            )}
          </div>
        </div>
        <nav className="admin-pagination">
          <button
            className="admin-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            className="admin-secondary"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      </div>
    </main>
  );
}
