import React, { useState } from "react";
const materials = ["PLA", "PETG", "ABS", "Not sure"];
export default function QuoteForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    projectName: "",
    description: "",
    material: "PLA",
    color: "",
    quantity: "1",
    dimensions: "",
  });
  const [model, setModel] = useState(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  function change(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      if (!model || model.size > 100 * 1024 * 1024)
        throw Error("Choose an STL or 3MF model no larger than 100 MB.");
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      data.append("model", model);
      const r = await fetch("/api/quotes", { method: "POST", body: data });
      const json = await r.json();
      if (!r.ok) throw Error(json.error || "Unable to submit request.");
      setNotice("Quote request received. Reference: " + json.reference);
      setForm({
        name: "",
        email: "",
        projectName: "",
        description: "",
        material: "PLA",
        color: "",
        quantity: "1",
        dimensions: "",
      });
      setModel(null);
      e.currentTarget.reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="quote" className="quote-section">
      <div className="container">
        <div className="quote-heading">
          <span className="gallery-eyebrow">YOUR IDEA, MADE REAL</span>
          <h2>Request a 3D Printing Quote</h2>
          <p>
            Upload your model and tell us how you would like it printed. We’ll
            review your request and contact you with a custom estimate.
            Submitting does not place an order.
          </p>
        </div>
        <form className="quote-form" onSubmit={submit}>
          <div className="quote-fields">
            <label>
              Your name
              <input
                required
                name="name"
                maxLength="100"
                value={form.name}
                onChange={change}
              />
            </label>
            <label>
              Email address
              <input
                required
                type="email"
                name="email"
                maxLength="254"
                value={form.email}
                onChange={change}
              />
            </label>
            <label>
              Project name
              <input
                required
                name="projectName"
                maxLength="120"
                value={form.projectName}
                onChange={change}
              />
            </label>
            <label>
              Material
              <select name="material" value={form.material} onChange={change}>
                {materials.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label>
              Preferred color
              <input
                name="color"
                required
                maxLength="70"
                placeholder="e.g. matte black, flexible"
                value={form.color}
                onChange={change}
              />
            </label>
            <label>
              Quantity
              <input
                name="quantity"
                type="number"
                min="1"
                max="500"
                required
                value={form.quantity}
                onChange={change}
              />
            </label>
            <label className="quote-full">
              Dimensions or scale (optional)
              <input
                name="dimensions"
                maxLength="200"
                placeholder="e.g. 150 mm tall; leave blank if model is final size"
                value={form.dimensions}
                onChange={change}
              />
            </label>
            <label className="quote-full">
              Project details
              <textarea
                name="description"
                required
                rows="4"
                maxLength="3000"
                value={form.description}
                onChange={change}
                placeholder="Purpose, finish, special requests, deadline…"
              />
            </label>
            <label className="quote-full quote-file">
              3D model (STL or 3MF, up to 100 MB)
              <input
                type="file"
                accept=".stl,.3mf"
                required
                onChange={(e) => setModel(e.target.files?.[0] || null)}
              />
              {model && (
                <small>
                  {model.name} · {(model.size / 1024 / 1024).toFixed(2)} MB
                </small>
              )}
            </label>
          </div>
          <button className="btn" disabled={busy}>
            {busy ? "Submitting…" : "Request a quote"}
          </button>
          <p className="quote-help">
            We'll only use your file to review and prepare the requested
            estimate.
          </p>
          {notice && (
            <p className="admin-success" role="status">
              {notice}
            </p>
          )}
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
