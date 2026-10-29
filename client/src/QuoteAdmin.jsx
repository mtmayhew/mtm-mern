import React, { useEffect, useState } from "react";
const statuses = [
  "new",
  "reviewing",
  "quoted",
  "approved",
  "declined",
  "completed",
];
async function req(url, options = {}) {
  const r = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(j.error || "Request failed");
  return j;
}
export default function QuoteAdmin() {
  const [items, setItems] = useState([]),
    [filter, setFilter] = useState(""),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [selected, setSelected] = useState(null),
    [notes, setNotes] = useState(""),
    [status, setStatus] = useState("new"),
    [price, setPrice] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function load() {
    try {
      const d = await req(
        "/api/admin/quotes?page=" + page + "&status=" + filter,
      );
      setItems(d.items);
      setPages(d.pages);
      if (selected) {
        const fresh = d.items.find((x) => x.id === selected.id);
        if (fresh) setSelected(fresh);
      }
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [page, filter]);
  function open(q) {
    setSelected(q);
    setNotes(q.adminNotes || "");
    setStatus(q.status);
    setPrice(q.quotedAmount == null ? "" : String(q.quotedAmount));
    setMessage("");
  }
  async function save(e) {
    e.preventDefault();
    try {
      const d = await req("/api/admin/quotes/" + selected.id, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          adminNotes: notes,
          quotedAmount: price === "" ? null : Number(price),
        }),
      });
      setSelected(d.item);
      setMessage(
        "Saved. Quote amounts are internal; no automatic customer email is sent.",
      );
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  async function download() {
    try {
      const r = await fetch("/api/admin/quotes/" + selected.id + "/file", {
        credentials: "same-origin",
      });
      if (!r.ok) throw Error("Download failed");
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = selected.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section className="quote-admin">
      <h2>3D printing quotes</h2>
      <p>
        Customer models are private and available only to signed-in
        administrators. Treat downloaded models as untrusted files.
      </p>
      <label>
        Filter by status{" "}
        <select
          value={filter}
          onChange={(e) => {
            setPage(1);
            setFilter(e.target.value);
          }}
        >
          <option value="">All</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <div className="admin-grid">
        <div className="admin-list">
          {items.map((q) => (
            <button
              className={
                "inquiry-row " + (selected?.id === q.id ? "active" : "")
              }
              key={q.id}
              onClick={() => open(q)}
            >
              <strong>{q.projectName}</strong>
              <span>
                {q.name} · {q.material} · {q.quantity} pcs
              </span>
              <span>{q.status}</span>
              <small>{new Date(q.createdAt).toLocaleDateString()}</small>
            </button>
          ))}
          {!items.length && <p className="admin-empty">No quotes yet.</p>}
        </div>
        <div className="admin-detail">
          {selected ? (
            <>
              <h3>{selected.projectName}</h3>
              <p>
                <a href={"mailto:" + selected.email}>{selected.email}</a> ·{" "}
                {selected.name}
              </p>
              <p>{selected.description}</p>
              <p>
                <strong>Material:</strong> {selected.material} ·{" "}
                <strong>Color:</strong> {selected.color} ·{" "}
                <strong>Quantity:</strong> {selected.quantity}
              </p>
              <p>
                <strong>Dimensions:</strong>{" "}
                {selected.dimensions || "Not specified"}
              </p>
              <button
                type="button"
                className="admin-secondary"
                onClick={download}
              >
                Download {selected.filename}
              </button>
              <form className="admin-form" onSubmit={save}>
                <label>
                  Status
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Estimated price (USD, internal)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </label>
                <label>
                  Private notes
                  <textarea
                    rows="5"
                    maxLength="4000"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
                <button className="btn">Save quote</button>
              </form>
              {message && (
                <p role="status" className="admin-success">
                  {message}
                </p>
              )}
            </>
          ) : (
            <p className="admin-empty">Select a request to review.</p>
          )}
        </div>
      </div>
      <div className="admin-pagination">
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
      </div>
    </section>
  );
}
