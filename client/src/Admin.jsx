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
const galleryCategories = ["3D Printing", "Software", "Web Design", "Other"];
const originalGalleryFiles = [
  "20260606_092804.jpg",
  "dragon.jpeg",
  "IMG_20260606_105357.jpg",
  "IMG_20260606_105417.jpg",
  "IMG_20260606_105419.jpg",
  "SaturnVCube.jpg",
  "Scorpio_Charm.webp",
  "Toad_Totem_Backflow_Burne.webp",
];
async function resizeOriginal(blob) {
  if (blob.size <= 5 * 1024 * 1024) return blob;
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas
      .getContext("2d")
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      const converted = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (converted && converted.size <= 5 * 1024 * 1024) return converted;
    }
    throw Error("Image is too large after resizing.");
  } finally {
    bitmap.close();
  }
}

function GalleryManager() {
  const [items, setItems] = useState([]),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [category, setCategory] = useState("3D Printing"),
    [image, setImage] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    const data = await request("/api/admin/gallery");
    setItems(data.items);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function importOriginals() {
    setBusy(true);
    setError("");
    setNotice("");
    let imported = 0,
      skipped = 0;
    const failures = [];
    try {
      const existing = await request("/api/admin/gallery");
      const names = new Set(
        existing.items.map((x) => x.legacyName).filter(Boolean),
      );
      for (const filename of originalGalleryFiles) {
        if (names.has(filename)) {
          skipped++;
          continue;
        }
        try {
          const response = await fetch(
            "/gallery/" + encodeURIComponent(filename),
            { credentials: "same-origin" },
          );
          if (!response.ok)
            throw Error(
              "Original photo unavailable (HTTP " + response.status + ")",
            );
          const blob = await resizeOriginal(await response.blob());
          const name = filename.replace(/\.[^.]+$/, "").replaceAll("_", " ");
          const form = new FormData();
          form.append(
            "image",
            new File([blob], filename.replace(/\.[^.]+$/, ".webp"), {
              type: blob.type,
            }),
          );
          form.append("title", name);
          form.append("description", "");
          form.append("category", "3D Printing");
          form.append("legacyName", filename);
          const upload = await fetch("/api/admin/gallery", {
            method: "POST",
            body: form,
            credentials: "same-origin",
          });
          const result = await upload.json().catch(() => ({}));
          if (upload.status === 409) {
            skipped++;
            continue;
          }
          if (!upload.ok) throw Error(result.error || "Upload failed");
          imported++;
        } catch (e) {
          failures.push(filename + ": " + e.message);
        }
      }
      await load();
      setNotice(
        `${imported} original photo(s) imported. ${skipped} already imported.`,
      );
      if (failures.length)
        setError("Some photos could not be imported: " + failures.join("; "));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function create(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!image) {
      setError("Choose an image first.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("image", image);
      body.append("title", title);
      body.append("description", description);
      body.append("category", category);
      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        body,
        credentials: "same-origin",
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Upload failed");
      setTitle("");
      setDescription("");
      setImage(null);
      e.currentTarget.reset();
      await load();
      setNotice("Project added to your public gallery.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function edit(item, changes) {
    setError("");
    try {
      await request("/api/admin/gallery/" + item.id, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      await load();
      setNotice("Gallery updated.");
    } catch (e) {
      setError(e.message);
    }
  }
  async function remove(item) {
    if (
      !window.confirm('Permanently delete "' + item.title + '" and its photo?')
    )
      return;
    setError("");
    try {
      await request("/api/admin/gallery/" + item.id, { method: "DELETE" });
      await load();
      setNotice("Project deleted.");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section className="gallery-admin">
      <h2>Project gallery</h2>
      <p>
        Upload photos and manage the public gallery. Photos are stored in
        MongoDB, not inside a container.
      </p>
      <div className="gallery-import">
        <p>
          Original photos from the website can be imported into MongoDB once,
          making them editable and removable below.
        </p>
        <button
          type="button"
          className="admin-secondary"
          onClick={importOriginals}
          disabled={busy}
        >
          {busy ? "Importing…" : "Import original photos"}
        </button>
      </div>
      <form className="gallery-upload admin-form" onSubmit={create}>
        <label>
          Project title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength="100"
            required
            placeholder="Custom dragon sculpture"
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {galleryCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Description
          <textarea
            rows="3"
            maxLength="600"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Materials, inspiration or project details"
          />
        </label>
        <label>
          Photo (JPG, PNG, WebP or GIF, max 5 MB)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </label>
        <button className="btn" disabled={busy}>
          {busy ? "Uploading…" : "Add project"}
        </button>
      </form>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="admin-success" role="status">
          {notice}
        </p>
      )}
      <div className="gallery-admin-grid">
        {items.map((item) => (
          <GalleryEditor
            key={item.id}
            item={item}
            edit={edit}
            remove={remove}
          />
        ))}
      </div>
      {!items.length && (
        <p>
          No editable photos yet. Use Import original photos above to manage the
          original gallery.
        </p>
      )}
    </section>
  );
}
function GalleryEditor({ item, edit, remove }) {
  const [title, setTitle] = useState(item.title),
    [description, setDescription] = useState(item.description || ""),
    [category, setCategory] = useState(item.category);
  return (
    <article className="gallery-admin-card">
      <img src={item.url} alt={item.title} loading="lazy" />
      <div className="gallery-admin-fields">
        <label>
          Title
          <input
            value={title}
            maxLength="100"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            rows="2"
            value={description}
            maxLength="600"
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {galleryCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="gallery-checkbox">
          <input
            type="checkbox"
            checked={item.visible}
            onChange={(e) => edit(item, { visible: e.target.checked })}
          />{" "}
          Visible on site
        </label>
        <div className="gallery-actions">
          <button
            onClick={() => edit(item, { title, description, category })}
            className="admin-secondary"
          >
            Save
          </button>
          <button onClick={() => remove(item)} className="admin-danger">
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
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
  const [tab, setTab] = useState("inquiries");
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
            <h1>MTM Admin</h1>
            <p>
              {total} matching inquiries · Signed in as {user.username}
            </p>
          </div>
          <button className="admin-secondary" onClick={logout}>
            Sign out
          </button>
        </header>
        <div className="admin-tabs">
          <button
            className={tab === "inquiries" ? "active" : ""}
            onClick={() => setTab("inquiries")}
          >
            Inquiries
          </button>
          <button
            className={tab === "gallery" ? "active" : ""}
            onClick={() => setTab("gallery")}
          >
            Project gallery
          </button>
        </div>
        {tab === "gallery" ? (
          <GalleryManager />
        ) : (
          <>
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
                          className={
                            "status-pill status-" + (item.status || "new")
                          }
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
          </>
        )}
      </div>
    </main>
  );
}
